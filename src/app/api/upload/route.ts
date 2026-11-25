import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { parseOfficeAsync } from 'officeparser';

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

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'jpeg', 'png'];
    if (!ext || !allowedExts.includes(ext)) {
      return NextResponse.json({ error: 'فرمت فایل پشتیبانی نمی‌شود' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const uint8 = new Uint8Array(bytes);
    
    let pageTexts: string[] = [];
    let totalPages = 1;
    let documentText = '';

    // Extract Text based on file type
    if (ext === 'pdf') {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(uint8);
      try {
        const { text } = await extractText(pdf, { mergePages: false });
        pageTexts = Array.isArray(text) ? (text as string[]) : [String(text)];
        totalPages = pageTexts.length;
      } catch {
        const { text, totalPages: tp } = await extractText(pdf, { mergePages: true });
        pageTexts = [String(text)];
        totalPages = tp;
      }
      documentText = pageTexts.join('\n\n---\n\n').slice(0, 200_000);
    } 
    else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      documentText = result.value.slice(0, 200_000);
      pageTexts = [documentText];
      totalPages = Math.ceil(documentText.length / 2000) || 1; // Estimate pages
    } 
    else if (ext === 'xlsx') {
      const workbook = xlsx.read(bytes, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        text += `=== Sheet: ${sheetName} ===\n`;
        text += xlsx.utils.sheet_to_txt(workbook.Sheets[sheetName]);
        text += '\n\n';
      });
      documentText = text.slice(0, 200_000);
      pageTexts = [documentText];
      totalPages = workbook.SheetNames.length;
    } 
    else if (ext === 'pptx') {
      const text = await parseOfficeAsync(Buffer.from(bytes));
      documentText = text.slice(0, 200_000);
      pageTexts = [documentText];
      totalPages = 1; // Estimate
    }
    else if (['jpg', 'jpeg', 'png'].includes(ext)) {
      // For images, we just pass a placeholder text. 
      // Gemini Vision will be used in the chat API to actually read the image.
      documentText = "این یک تصویر است. لطفاً برای تحلیل آن سوال بپرسید.";
      pageTexts = [documentText];
      totalPages = 1;
    }

    const { data: chat, error: insertErr } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
        file_name: file.name,
        page_count: totalPages,
        document_text: documentText,
        page_texts: pageTexts,
        file_size: file.size,
      })
      .select('id')
      .single();

    if (insertErr || !chat) throw new Error(insertErr?.message || 'Insert failed');
    const chatId = chat.id;

    // Upload File to Storage
    const filePath = `${user.id}/${chatId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('pdfs') // We reuse the pdfs bucket for all files
      .upload(filePath, uint8, { contentType: file.type, upsert: true });

    if (upErr) {
      console.error('[upload] storage error:', upErr.message);
      await supabase.from('chats').delete().eq('id', chatId);
      return NextResponse.json({ error: 'ذخیره‌سازی فایل ناموفق بود: ' + upErr.message }, { status: 500 });
    }
    
    await supabase.from('chats').update({ file_path: filePath }).eq('id', chatId);

    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'assistant',
      content: `سند «${file.name}» (${totalPages} صفحه/بخش) بررسی شد. هر سؤالی دارید بپرسید.`,
    });

    return NextResponse.json({ chatId, pageCount: totalPages });
  } catch (error: any) {
    console.error('[upload] error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
