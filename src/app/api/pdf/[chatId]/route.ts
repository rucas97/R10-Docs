import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: chat } = await supabase
    .from('chats')
    .select('file_path')
    .eq('id', chatId)
    .single();

  if (!chat?.file_path) {
    console.error('[pdf-proxy] no file_path for chat', chatId);
    return new NextResponse('File not found', { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from('pdfs')
    .download(chat.file_path);

  if (error || !data) {
    console.error('[pdf-proxy] download failed:', error?.message);
    return new NextResponse('Download failed: ' + (error?.message ?? 'unknown'), { status: 500 });
  }

  const arrayBuffer = await data.arrayBuffer();
  console.log('[pdf-proxy] serving', chat.file_path, arrayBuffer.byteLength, 'bytes');

  if (arrayBuffer.byteLength === 0) {
    return new NextResponse('File is empty in storage', { status: 500 });
  }

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(arrayBuffer.byteLength),
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=600',
    },
  });
}
