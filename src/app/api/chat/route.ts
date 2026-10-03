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
      'You are a helpful assistant that answers questions about a PDF document.\n\n' +
      'Document content:\n' +
      documentText +
      '\n\nInstructions:\n' +
      '- Answer questions based ONLY on the document content above\n' +
      '- If the answer is not in the document, say "I couldn\'t find that information in the document"\n' +
      '- Be concise and accurate\n' +
      '- Quote relevant sections when helpful';

    // Using the model you requested. It will fail with 403 if the proxy is not working.
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
