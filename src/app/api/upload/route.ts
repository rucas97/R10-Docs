import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF allowed' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const uint8 = new Uint8Array(bytes);

    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(uint8);

    let pageTexts: string[] = [];
    let totalPages = 0;
    try {
      const { text } = await extractText(pdf, { mergePages: false });
      pageTexts = Array.isArray(text) ? (text as string[]) : [String(text)];
      totalPages = pageTexts.length;
    } catch {
      const { text, totalPages: tp } = await extractText(pdf, { mergePages: true });
      pageTexts = [String(text)];
      totalPages = tp;
    }

    const documentText = pageTexts.join('\n\n---\n\n').slice(0, 200_000);

    // Create chat WITHOUT summary — /api/summarize will fill it in
    const { data: chat, error: insertErr } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title: file.name.replace(/\.pdf$/i, ''),
        file_name: file.name,
        page_count: totalPages,
        document_text: documentText,
        page_texts: pageTexts,
        summary: null,
      })
      .select('id')
      .single();

    if (insertErr || !chat) throw new Error(insertErr?.message || 'Insert failed');
    const chatId = chat.id;

    const filePath = `${user.id}/${chatId}.pdf`;
    const { error: upErr } = await supabase.storage
      .from('pdfs')
      .upload(filePath, uint8, { contentType: 'application/pdf', upsert: true });

    if (upErr) {
      console.error('[upload] storage error:', upErr.message);
    } else {
      await supabase.from('chats').update({ file_path: filePath }).eq('id', chatId);
    }

    // Welcome message — will be followed by summary on success
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'assistant',
      content: `سند «${file.name}» (${totalPages} صفحه) بررسی شد. هر سؤالی دارید بپرسید.`,
    });

    return NextResponse.json({ chatId, pageCount: totalPages });
  } catch (error: any) {
    console.error('[upload] error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
