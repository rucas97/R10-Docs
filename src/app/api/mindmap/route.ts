import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTextWithRetry } from '@/lib/llm';
import { extractJson, normalizeMindMap, countNodes } from '@/lib/mindmap';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM = 'شما یک تحلیلگر ساختار اسناد هستید که نقشه ذهنی سلسله‌مراتبی می‌سازید.';

function buildPrompt(doc: string): string {
  return (
    'بر اساس سند زیر، یک نقشه ذهنی فارسی تولید کن.\n\n' +
    'قوانین سختگیرانه:\n' +
    '- فقط و فقط یک شیء JSON معتبر برگردان. هیچ متن، توضیح، یا ```json قبل و بعد نباشد.\n' +
    '- ساختار دقیقاً:\n' +
    '  {"label": "عنوان ریشه", "children": [{"label": "...", "children": []}]}\n' +
    '- حداکثر ۳ سطح عمق و حداکثر ۱۸ گره کل.\n' +
    '- برچسب‌ها کوتاه (حداکثر ۶ کلمه)، فارسی، و مستقیماً از محتوای سند.\n' +
    '- شاخه‌ها باید بخش‌های اصلی واقعی سند باشند (نه «مقدمه» و «نتیجه» کلی).\n\n' +
    'متن سند:\n' +
    doc.slice(0, 14_000)
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId, regenerate, saveTree } = await req.json();

    // If user saved an edited tree, just persist it
    if (saveTree && typeof saveTree === 'object' && saveTree.label) {
      await supabase.from('chats').update({ mindmap: saveTree }).eq('id', chatId);
      return NextResponse.json({ ok: true });
    }
    if (!chatId) return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });

    const { data: chat } = await supabase
      .from('chats')
      .select('id, document_text, mindmap')
      .eq('id', chatId)
      .single();
    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    if (!regenerate && chat.mindmap && typeof chat.mindmap === 'object' && (chat.mindmap as any).label) {
      return NextResponse.json({ mindmap: chat.mindmap, cached: true });
    }

    const doc = chat.document_text || '';
    if (doc.trim().length < 200) {
      return NextResponse.json({ error: 'متن سند کوتاه است.' }, { status: 400 });
    }

    let parsed: any = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      const { text } = await generateTextWithRetry(
        { systemPrompt: SYSTEM, prompt: buildPrompt(doc), maxTokens: 1500 },
        2
      );
      const json = extractJson(text);
      const tree = normalizeMindMap(json);
      if (tree && countNodes(tree) >= 3) parsed = tree;
      else console.warn('[mindmap] attempt', attempt + 1, 'invalid, retrying');
    }

    if (!parsed) {
      return NextResponse.json({ error: 'تولید نقشه ذهنی ناموفق بود.' }, { status: 502 });
    }

    await supabase.from('chats').update({ mindmap: parsed }).eq('id', chatId);
    console.log('[mindmap] ✅ saved nodes:', countNodes(parsed));

    return NextResponse.json({ mindmap: parsed });
  } catch (e: any) {
    console.error('[mindmap] error:', e?.message);
    return NextResponse.json({ error: e?.message ?? 'خطا' }, { status: 500 });
  }
}
