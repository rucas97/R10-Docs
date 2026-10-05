import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamChat } from '@/lib/llm';

export const runtime = 'nodejs';
export const maxDuration = 60;

function friendlyError(message: string): string {
  const msg = (message || '').toLowerCase();
  if (msg.includes('all providers failed')) {
    return 'در حال حاضر امکان پاسخ‌دهی نیست. لطفاً بعداً دوباره تلاش کنید.';
  }
  if (msg.includes('429') || msg.includes('rate')) {
    return 'سقف درخواست‌ها پر شده. چند لحظه صبر کنید.';
  }
  return 'خطایی از سمت ما رخ داد. لطفاً دوباره تلاش کنید.';
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId, messages } = await req.json();
    if (!chatId) return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });

    const { data: chat } = await supabase
      .from('chats')
      .select('id, document_text, summary, page_texts')
      .eq('id', chatId)
      .single();
    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    const pageTexts: string[] = Array.isArray(chat.page_texts) ? (chat.page_texts as string[]) : [];
    const taggedContext = pageTexts.length > 1
      ? pageTexts.map((t, i) => `===[صفحه ${i + 1}]===\n${t}`).join('\n\n').slice(0, 80_000)
      : (chat.document_text || '').slice(0, 80_000);

    const systemPrompt =
      'شما یک دستیار مفید هستید که به سؤالات کاربر درباره محتوای یک سند PDF پاسخ می‌دهید.\n\n' +
      'خلاصه سند:\n' + (chat.summary || '') + '\n\n' +
      'محتوای سند (صفحه‌به‌صفحه):\n' + taggedContext + '\n\n' +
      'دستورالعمل‌های پاسخ:\n' +
      '- همیشه به زبان فارسی پاسخ دهید\n' +
      '- فقط بر اساس محتوای سند پاسخ دهید\n' +
      '- اگر پاسخ در سند نیست، بگویید: «این اطلاعات در سند یافت نشد»\n' +
      '- مختصر و دقیق باشید\n' +
      '- در انتهای هر پاسخ، شماره صفحات را با یک نقل قول کوتاه بنویسید:\n' +
      '  [منابع: ص۳ «متن دقیق»، ص۷ «متن دیگر»]\n' +
      '  - شماره‌ها با ارقام فارسی، نقل قول کلمه‌به‌کلمه از سند.';

    const lastMessage = messages[messages.length - 1];
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'user',
      content: lastMessage.content,
    });

    const prior = messages.slice(0, -1);
    const history: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const msg of prior) {
      const text = (msg.content || '').trim();
      if (!text) continue;
      const role: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';
      if (history.length === 0 && role === 'assistant') continue;
      const prev = history[history.length - 1];
      if (prev && prev.role === role) { prev.content += '\n\n' + text; continue; }
      history.push({ role, content: text });
    }

    let stream: AsyncIterable<string>;
    let usedProvider = 'unknown';
    try {
      const r = await streamChat({ systemPrompt, history, message: lastMessage.content });
      stream = r.stream;
      usedProvider = r.provider;
    } catch (e: any) {
      console.error('[chat] all providers failed:', e?.message);
      return NextResponse.json({ error: friendlyError(e?.message ?? '') }, { status: 200 });
    }

    const encoder = new TextEncoder();
    let assistantFull = '';

    const webStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            assistantFull += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();

          await supabase.from('messages').insert({
            chat_id: chatId,
            role: 'assistant',
            content: assistantFull || '(بدون پاسخ)',
          });
          await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
        } catch (error: any) {
          controller.enqueue(encoder.encode('\n\n' + friendlyError(error?.message ?? '')));
          controller.close();
        }
      },
    });

    console.log('[chat] streaming via', usedProvider);
    return new NextResponse(webStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (error: any) {
    console.error('[chat] error:', error);
    return NextResponse.json({ error: friendlyError(error?.message ?? '') }, { status: 500 });
  }
}
