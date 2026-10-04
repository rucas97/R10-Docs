import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini';

export const runtime = 'nodejs';

// Friendly, non-developer Farsi error messages mapped to failure types
function friendlyError(status: number, message: string): string {
  const msg = (message || '').toLowerCase();

  if (status === 404 || msg.includes('not found') || msg.includes('not supported')) {
    return 'در حال حاضر امکان پاسخ‌دهی به این سند وجود ندارد. لطفاً بعداً دوباره تلاش کنید.';
  }
  if (status === 403 || msg.includes('forbidden') || msg.includes('permission')) {
    return 'دسترسی به سرویس هوش مصنوعی در این لحظه ممکن نیست. کمی بعد دوباره امتحان کنید.';
  }
  if (status === 429 || msg.includes('quota') || msg.includes('rate')) {
    return 'تعداد درخواست‌ها زیاد شده است. لطفاً چند لحظه صبر کنید و دوباره بپرسید.';
  }
  if (status === 400 || msg.includes('invalid')) {
    return 'سند شما قابل پردازش نبود. ممکن است فایل آسیب دیده یا خالی باشد. لطفاً یک PDF دیگر امتحان کنید.';
  }
  if (msg.includes('fetch failed') || msg.includes('network') || msg.includes('timeout')) {
    return 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.';
  }
  return 'خطایی از سمت ما رخ داد. از بابت این مشکل عذرخواهی می‌کنیم. لطفاً دوباره تلاش کنید.';
}

export async function POST(req: NextRequest) {
  try {
    const { messages, documentText } = await req.json();

    if (!documentText) {
      return NextResponse.json(
        { error: 'محتوای سند خالی است. لطفاً یک PDF معتبر بارگذاری کنید.' },
        { status: 400 }
      );
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

    // Correct current model ID. gemini-1.5-flash was retired.
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
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
        } catch (error: any) {
          // Stream-level failure — send a friendly Farsi message instead of dying silently
          const friendly = friendlyError(error?.status ?? 500, error?.message ?? '');
          controller.enqueue(encoder.encode(friendly));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    const friendly = friendlyError(error?.status ?? 500, error?.message ?? '');
    return NextResponse.json({ error: friendly }, { status: 200 });
  }
}
