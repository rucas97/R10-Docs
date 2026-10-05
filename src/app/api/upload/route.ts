import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { genAI } from '@/lib/gemini';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const uint8 = new Uint8Array(bytes);

    // Extract text per page
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(uint8);

    let pageTexts: string[] = [];
    let totalPages = 0;

    try {
      const { text } = await extractText(pdf, { mergePages: false });
      pageTexts = Array.isArray(text) ? (text as string[]) : [String(text)];
      totalPages = pageTexts.length;
    } catch {
      // Fallback: merged text only
      const { text, totalPages: tp } = await extractText(pdf, { mergePages: true });
      pageTexts = [String(text)];
      totalPages = tp;
    }

    const documentText = pageTexts.join('\n\n---\n\n').slice(0, 200_000);

    // Create chat row
    const { data: chat, error: insertErr } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title: file.name.replace(/\.pdf$/i, ''),
        file_name: file.name,
        page_count: totalPages,
        document_text: documentText,
        page_texts: pageTexts,
      })
      .select('id')
      .single();

    if (insertErr || !chat) throw new Error(insertErr?.message || 'Insert failed');
    const chatId = chat.id;

    // Upload PDF to storage
    const filePath = `${user.id}/${chatId}.pdf`;
    const { error: upErr } = await supabase.storage
      .from('pdfs')
      .upload(filePath, uint8, { contentType: 'application/pdf', upsert: true });

    if (!upErr) {
      await supabase.from('chats').update({ file_path: filePath }).eq('id', chatId);
    } else {
      console.error('[upload] storage error:', upErr.message);
    }

    // Generate Persian summary
    let summary = '';
    try {
      const excerpt = documentText.slice(0, 15_000);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const result = await model.generateContent(
        'این سند را در یک پاراگراف کوتاه (حداکثر ۳ جمله) به فارسی خلاصه کن. ' +
        'فقط خود خلاصه را بنویس، بدون مقدمه یا عنوان:\n\n' + excerpt
      );
      summary = result.response.text().trim();
    } catch (e: any) {
      console.warn('[upload] summary failed:', e.message);
      summary = 'خلاصه‌ای در دسترس نیست. می‌توانید سوالات خود را بپرسید.';
    }

    await supabase.from('chats').update({ summary }).eq('id', chatId);

    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'assistant',
      content: `سند «${file.name}» (${totalPages} صفحه) بررسی شد. هر سؤالی دارید بپرسید.`,
    });

    return NextResponse.json({ chatId, pageCount: totalPages, summary });
  } catch (error: any) {
    console.error('[upload] error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
