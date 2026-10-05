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
    if (file.size === 0) return NextResponse.json({ error: 'فایل خالی است.' }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم فایل باید کمتر از ۵۰ مگابایت باشد.' }, { status: 400 });
    }

    // Read bytes ONCE — keep two copies:
    //   1. uploadBytes → uploaded to storage verbatim
    //   2. parseBytes  → given to unpdf (which detaches its buffer)
    const bytes = await file.arrayBuffer();
    const uploadBytes = new Uint8Array(bytes);           // for storage
    const parseBytes  = new Uint8Array(bytes.slice(0));  // for unpdf (own buffer)

    console.log('[upload] received', file.name, uploadBytes.byteLength, 'bytes');

    // 1. Create the chat row first so we have the id
    const { data: chat, error: insertErr } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title: file.name.replace(/\.pdf$/i, ''),
        file_name: file.name,
        page_count: 0,
        document_text: '',
        page_texts: [],
        summary: null,
      })
      .select('id')
      .single();

    if (insertErr || !chat) throw new Error(insertErr?.message || 'Insert failed');
    const chatId = chat.id;

    // 2. Upload to storage FIRST (while uploadBytes is intact)
    const filePath = `${user.id}/${chatId}.pdf`;
    const { error: upErr } = await supabase.storage
      .from('pdfs')
      .upload(filePath, uploadBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (upErr) {
      console.error('[upload] storage error:', upErr.message);
      await supabase.from('chats').delete().eq('id', chatId);
      return NextResponse.json(
        { error: 'ذخیره‌سازی فایل ناموفق بود: ' + upErr.message },
        { status: 500 }
      );
    }

    // Verify the upload actually had bytes
    const { data: check } = await supabase.storage
      .from('pdfs')
      .list(user.id, { search: `${chatId}.pdf` });

    const uploadedSize = check?.[0]?.metadata?.size ?? -1;
    console.log('[upload] uploaded file size in storage:', uploadedSize);

    if (uploadedSize === 0) {
      await supabase.from('chats').delete().eq('id', chatId);
      await supabase.storage.from('pdfs').remove([filePath]);
      return NextResponse.json(
        { error: 'فایل صفر بایت آپلود شد. لطفاً دوباره تلاش کنید.' },
        { status: 500 }
      );
    }

    await supabase.from('chats').update({ file_path: filePath }).eq('id', chatId);

    // 3. Now parse the PDF (parseBytes has its own buffer, safe to detach)
    let pageTexts: string[] = [];
    let totalPages = 0;
    try {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(parseBytes);

      try {
        const { text } = await extractText(pdf, { mergePages: false });
        pageTexts = Array.isArray(text) ? (text as string[]) : [String(text)];
        totalPages = pageTexts.length;
      } catch {
        const { text, totalPages: tp } = await extractText(pdf, { mergePages: true });
        pageTexts = [String(text)];
        totalPages = tp;
      }
    } catch (parseErr: any) {
      console.error('[upload] parse failed:', parseErr?.message);
      // Keep the chat — the file is in storage; user can retry later
      await supabase.from('chats').delete().eq('id', chatId);
      await supabase.storage.from('pdfs').remove([filePath]);
      return NextResponse.json(
        { error: 'پردازش PDF ناموفق بود. فایل ممکن است خراب باشد.' },
        { status: 500 }
      );
    }

    const documentText = pageTexts.join('\n\n---\n\n').slice(0, 200_000);

    await supabase.from('chats').update({
      page_count: totalPages,
      document_text: documentText,
      page_texts: pageTexts,
    }).eq('id', chatId);

    // 4. Welcome message
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'assistant',
      content: `سند «${file.name}» (${totalPages} صفحه) بررسی شد. هر سؤالی دارید بپرسید.`,
    });

    console.log('[upload] ✅ done', { chatId, totalPages, bytes: uploadedSize });

    return NextResponse.json({ chatId, pageCount: totalPages });
  } catch (error: any) {
    console.error('[upload] error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
