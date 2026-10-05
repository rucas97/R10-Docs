import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: chat } = await supabase
    .from('chats')
    .select('file_path')
    .eq('id', chatId)
    .single();

  if (!chat) return new NextResponse('Chat not found', { status: 404 });

  let filePath = chat.file_path;
  if (!filePath) {
    filePath = `${user.id}/${chatId}.pdf`;
    await supabase.from('chats').update({ file_path: filePath }).eq('id', chatId);
  }

  let { data, error } = await supabase.storage.from('pdfs').download(filePath);

  if ((error || !data)) {
    const alt = `${user.id}/${chatId}.pdf`;
    if (alt !== filePath) {
      const altRes = await supabase.storage.from('pdfs').download(alt);
      if (altRes.data && !altRes.error) {
        data = altRes.data;
        error = null;
        await supabase.from('chats').update({ file_path: alt }).eq('id', chatId);
      }
    }
  }

  if (error || !data) {
    return new NextResponse(`File not available: ${error?.message ?? 'unknown'}`, { status: 500 });
  }

  const arrayBuffer = await data.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    return new NextResponse('File is empty in storage', { status: 500 });
  }

  // Check whether this is a HEAD/range request for PDF streaming
  const rangeHeader = req.headers.get('range');

  // Range support: browsers use it for PDF streaming in iframes
  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const bytes = new Uint8Array(arrayBuffer);
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : bytes.length - 1;
      const chunk = bytes.slice(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(chunk.length),
          'Content-Range': `bytes ${start}-${end}/${bytes.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, max-age=600',
        },
      });
    }
  }

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(arrayBuffer.byteLength),
      'Content-Disposition': 'inline',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=600',
      // Allow our own origin to embed this in an iframe
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
