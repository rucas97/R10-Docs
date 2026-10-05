import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { genAI } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

function friendlyError(status: number, message: string): string {
  const msg = (message || '').toLowerCase();
  if (status === 404 || msg.includes('not found')) {
    return 'در حال حاضر امکان پاسخ‌دهی نیست. کمی بعد تلاش کنید.';
  }
  if (status === 429 || msg.includes('quota') || msg.includes('rate')) {
    return 'تعداد درخواست‌ها زیاد شده است. چند لحظه صبر کنید و دوباره بپرسید.';
  }
  if (msg.includes('fetch failed') || msg.includes('network')) {
    return 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.';
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

    // Load chat + verify ownership (RLS also enforces this)
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .select('id, document_text, summary')
      .eq('id', chatId)
      .single();

    if (chatErr || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const systemPrompt =
      'شما یک دستیار مفید هستید که به سؤالات کاربر درباره محتوای یک سند PDF پاسخ می‌دهید.\n\n' +
      'خلاصه سند:\n' + (chat.summary || '') + '\n\n' +
      'محتوای کامل سند:\n' + (chat.document_text || '') + '\n\n' +
      'دستورالعمل‌ها:\n' +
      '- همیشه به زبان فارسی پاسخ دهید\n' +
      '- فقط بر اساس محتوای سند پاسخ دهید\n' +
      '- اگر پاسخ در سند نیست، بگویید: «این اطلاعات در سند یافت نشد»\n' +
      '- مختصر و دقیق باشید';

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: systemPrompt,
    });

    // Save user's last message first
    const lastMessage = messages[messages.length - 1];
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'user',
      content: lastMessage.content,
    });

    // Build clean history (must start with user, no empty turns)
    const prior = messages.slice(0, -1);
    const cleanHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const msg of prior) {
      const text = (msg.content || '').trim();
      if (!text) continue;
      const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
      if (cleanHistory.length === 0 && role === 'model') continue;
      const prev = cleanHistory[cleanHistory.length - 1];
      if (prev && prev.role === role) {
        prev.parts[0].text += '\n\n' + text;
        continue;
      }
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

          // Persist assistant reply + bump updated_at
          await supabase.from('messages').insert({
            chat_id: chatId,
            role: 'assistant',
            content: assistantFull || '(بدون پاسخ)',
          });
          await supabase
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', chatId);
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
