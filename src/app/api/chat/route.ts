import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { genAI } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

function friendlyError(status: number, message: string): string {
  const msg = (message || '').toLowerCase();
  if (status === 404 || msg.includes('not found')) return 'در حال حاضر امکان پاسخ‌دهی نیست. کمی بعد تلاش کنید.';
  if (status === 429 || msg.includes('quota') || msg.includes('rate')) return 'تعداد درخواست‌ها زیاد شده است. چند لحظه صبر کنید.';
  if (msg.includes('fetch failed') || msg.includes('network')) return 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.';
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
      ? pageTexts.map((t, i) => `===[صفحه ${i + 1}]===\n${t}`).join('\n\n').slice(0, 100_000)
      : (chat.document_text || '').slice(0, 100_000);

    const systemPrompt =
      'شما یک دستیار مفید هستید که به سؤالات کاربر درباره محتوای یک سند PDF پاسخ می‌دهید.\n\n' +
      'خلاصه سند:\n' + (chat.summary || '') + '\n\n' +
      'محتوای سند (صفحه‌به‌صفحه):\n' + taggedContext + '\n\n' +
      'دستورالعمل‌های پاسخ:\n' +
      '- همیشه به زبان فارسی پاسخ دهید\n' +
      '- فقط بر اساس محتوای سند پاسخ دهید\n' +
      '- اگر پاسخ در سند نیست، بگویید: «این اطلاعات در سند یافت نشد»\n' +
      '- مختصر و دقیق باشید\n' +
      '- **مهم**: در انتهای هر پاسخ، شماره صفحاتی که استفاده کرده‌اید را همراه با یک نقل قول کوتاه (۵ تا ۱۰ کلمه دقیقاً از متن سند) در این قالب بنویسید:\n' +
      '  [منابع: ص۳ «متن دقیق از صفحه»، ص۷ «متن دیگر»]\n' +
      '  - شماره‌ها را با ارقام فارسی بنویسید\n' +
      '  - نقل قول حتماً باید کلمه‌به‌کلمه از متن همان صفحه باشد\n' +
      '  - اگر پاسخی در سند نبود، این خط را ننویسید.';

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: systemPrompt,
    });

    const lastMessage = messages[messages.length - 1];
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'user',
      content: lastMessage.content,
    });

    const prior = messages.slice(0, -1);
    const cleanHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const msg of prior) {
      const text = (msg.content || '').trim();
      if (!text) continue;
      const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
      if (cleanHistory.length === 0 && role === 'model') continue;
      const prev = cleanHistory[cleanHistory.length - 1];
      if (prev && prev.role === role) { prev.parts[0].text += '\n\n' + text; continue; }
      cleanHistory.push({ role, parts: [{ text }] });
    }

    const geminiChat = model.startChat({ history: cleanHistory });
    const result = await geminiChat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();
    let assistantFull = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const t = chunk.text();
            assistantFull += t;
            controller.enqueue(encoder.encode(t));
          }
          controller.close();

          await supabase.from('messages').insert({
            chat_id: chatId,
            role: 'assistant',
            content: assistantFull || '(بدون پاسخ)',
          });
          await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
        } catch (error: any) {
          const friendly = friendlyError(error?.status ?? 500, error?.message ?? '');
          controller.enqueue(encoder.encode('\n\n' + friendly));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (error: any) {
    console.error('[chat] error:', error);
    return NextResponse.json({ error: friendlyError(500, error?.message ?? '') }, { status: 500 });
  }
}
