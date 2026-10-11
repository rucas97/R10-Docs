import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTextWithRetry } from '@/lib/llm';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId } = await req.json();
    if (!chatId) return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });

    const { data: chat } = await supabase
      .from('chats')
      .select('id, document_text, summary')
      .eq('id', chatId)
      .single();

    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    // Already has a real summary — no-op
    if (chat.summary && chat.summary.length >= 20) {
      return NextResponse.json({ summary: chat.summary, cached: true });
    }

    const documentText = (chat.document_text || '').slice(0, 15_000);
    if (!documentText.trim()) {
      return NextResponse.json({ error: 'Document text is empty' }, { status: 400 });
    }

    // Blocking call with up to 4 rounds across all providers
    const { text, provider } = await generateTextWithRetry({
      systemPrompt:
        'شما یک خلاصه‌ساز حرفه‌ای هستید که اسناد را برای کاربران فارسی‌زبان خلاصه می‌کنید.',
      prompt:
        'این سند را در یک پاراگراف کوتاه (حداکثر ۳ جمله) به زبان فارسی خلاصه کن. ' +
        'فقط خود خلاصه را بنویس، بدون مقدمه، عنوان، یا کلمه «خلاصه:». ' +
        'اگر متن سند فارسی نیست، خلاصه را به فارسی بنویس:\n\n' + documentText,
      maxTokens: 1200,
    }, 4);

    // Generate EXACTLY 3 complete questions
    let questions: string[] = [];
    try {
      const { text: qtext } = await generateTextWithRetry({
        systemPrompt:
          'شما یک سوال‌ساز حرفه‌ای هستید. فقط سوال می‌نویسید. هیچ توضیحی اضافه نمی‌کنید.',
        prompt:
          'بر اساس سند زیر، دقیقاً ۳ سوال فارسی کامل و مشخص بساز.\n\n' +
          'قوانین مطلق:\n' +
          '۱) هر سوال باید یک جمله کامل باشد (با «؟» تمام شود)\n' +
          '۲) بین ۶ تا ۱۵ کلمه\n' +
          '۳) هر سه سوال به بخش‌های مختلف سند مربوط باشند\n' +
          '۴) از اسم‌ها، اعداد یا اصطلاحات مشخص سند استفاده کنند\n' +
          '۵) از سوالات کلی مثل «سند درباره چیست؟» خودداری کن\n\n' +
          'قالب خروجی (دقیقاً همین‌طور بنویس، هیچ چیز دیگری اضافه نکن):\n' +
          '۱. [سوال اول کامل؟]\n' +
          '۲. [سوال دوم کامل؟]\n' +
          '۳. [سوال سوم کامل؟]\n\n' +
          'متن سند:\n' + documentText.slice(0, 12_000),
        maxTokens: 500,
      }, 3);

      // Parse: split by newlines, extract numbered items
      const lines = qtext.split('\n').map((l) => l.trim()).filter(Boolean);
      const parsed: string[] = [];
      for (const line of lines) {
        // Strip Persian/Arabic/Latin numbering and bullets
        const cleaned = line
          .replace(/^[\d\u06F0-\u06F9]+[.\-)\s]+/, '')
          .replace(/^[•*\-]+\s*/, '')
          .trim();
        // Must look like a complete question (ends with ؟ or ?)
        if (cleaned.length >= 10 && cleaned.length <= 250 && /[؟?]$/.test(cleaned)) {
          parsed.push(cleaned);
        }
      }

      // If fewer than 3 got through, try a lenient pass (no ؟ requirement)
      if (parsed.length < 3) {
        for (const line of lines) {
          if (parsed.length >= 3) break;
          const cleaned = line
            .replace(/^[\d\u06F0-\u06F9]+[.\-)\s]+/, '')
            .replace(/^[•*\-]+\s*/, '')
            .trim();
          if (cleaned.length >= 15 && cleaned.length <= 250 && !parsed.includes(cleaned)) {
            // Ensure it ends with ؟ for consistency
            parsed.push(/[؟?]$/.test(cleaned) ? cleaned : cleaned + '؟');
          }
        }
      }

      questions = parsed.slice(0, 3);
      console.log('[summarize] parsed questions:', questions.length, questions);

      // If still not 3, fill from generic fallback
      const genericFallbacks = [
        'مهم‌ترین یافته‌های این سند چیست؟',
        'نویسنده به چه نتیجه‌گیری اصلی رسیده است؟',
        'چه محدودیت‌ها یا چالش‌هایی در سند مطرح شده است؟',
      ];
      while (questions.length < 3) {
        questions.push(genericFallbacks[questions.length]);
      }
    } catch (qe: any) {
      console.warn('[summarize] questions failed:', qe?.message);
      questions = [
        'مهم‌ترین یافته‌های این سند چیست؟',
        'نویسنده به چه نتیجه‌گیری اصلی رسیده است؟',
        'چه محدودیت‌ها یا چالش‌هایی در سند مطرح شده است؟',
      ];
    }

    // Save
    const { error: updateErr } = await supabase
      .from('chats')
      .update({ summary: text, suggested_questions: questions })
      .eq('id', chatId);

    if (updateErr) throw new Error(updateErr.message);

    console.log(`[summarize] ✅ chat=${chatId} provider=${provider} chars=${text.length} q=${questions.length}`);

    return NextResponse.json({
      summary: text,
      questions,
      provider,
      chars: text.length,
    });
  } catch (error: any) {
    console.error('[summarize] all attempts failed:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Summary generation failed' },
      { status: 502 }
    );
  }
}
