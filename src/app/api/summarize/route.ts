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
      maxTokens: 500,
    }, 4);

    // Save
    const { error: updateErr } = await supabase
      .from('chats')
      .update({ summary: text })
      .eq('id', chatId);

    if (updateErr) throw new Error(updateErr.message);

    console.log(`[summarize] ✅ chat=${chatId} provider=${provider} chars=${text.length}`);

    return NextResponse.json({
      summary: text,
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
