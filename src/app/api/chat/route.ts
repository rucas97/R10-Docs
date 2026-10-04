import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { messages, documentText } = await req.json();
    if (!documentText) {
      return NextResponse.json({ error: 'No document text provided' }, { status: 400 });
    }

    const systemPrompt =
      'شما یک دستیار مفید هستید که به سؤالات کاربر درباره محتوای یک سند PDF پاسخ می‌دهید.\n\n' +
      'محتوای سند:\n' +
      documentText +
      '\n\nدستورالعمل‌ها:\n' +
      '- همیشه به زبان فارسی پاسخ دهید\n' +
      '- فقط بر اساس محتوای سند بالا پاسخ دهید\n' +
      '- اگر پاسخ در سند نیست، بگویید: «این اطلاعات در سند یافت نشد»\n' +
      '- مختصر و دقیق باشید\n' +
      '- در صورت لزوم بخش‌های مرتبط را نقل کنید';

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    const priorMessages = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];
    const cleanHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    for (const msg of priorMessages) {
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

    const chat = model.startChat({ history: cleanHistory });
    const result = await chat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
