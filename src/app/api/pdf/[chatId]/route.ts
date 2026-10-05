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

  if (!chat) {
    console.error('[pdf-proxy] chat row not found:', chatId);
    return new NextResponse('Chat not found', { status: 404 });
  }

  // Try the stored path first; fall back to the deterministic convention
  let filePath = chat.file_path;
  let usedFallback = false;
  if (!filePath) {
    filePath = `${user.id}/${chatId}.pdf`;
    usedFallback = true;
    console.log('[pdf-proxy] file_path was null, trying fallback:', filePath);
  }

  // Attempt download
  let { data, error } = await supabase.storage.from('pdfs').download(filePath);

  // If fallback path fails, try the OTHER common shape: {userId}/{chatId}.pdf under a different userId prefix
  if ((error || !data) && usedFallback) {
    console.log('[pdf-proxy] fallback failed:', error?.message);
  }

  // If the stored path failed, try fallback as a last resort
  if ((error || !data) && !usedFallback) {
    const alt = `${user.id}/${chatId}.pdf`;
    console.log('[pdf-proxy] stored path failed, trying alt:', alt);
    const altRes = await supabase.storage.from('pdfs').download(alt);
    if (altRes.data && !altRes.error) {
      data = altRes.data;
      error = null;
      filePath = alt;
      // Heal the DB row so future requests skip the fallback
      await supabase.from('chats').update({ file_path: alt }).eq('id', chatId);
    }
  }

  if (error || !data) {
    console.error('[pdf-proxy] download failed for', filePath, '→', error?.message);
    return new NextResponse(
      `File not available. path=${filePath} err=${error?.message ?? 'unknown'}`,
      { status: 500 }
    );
  }

  const arrayBuffer = await data.arrayBuffer();
  console.log('[pdf-proxy] serving', filePath, arrayBuffer.byteLength, 'bytes');

  if (arrayBuffer.byteLength === 0) {
    return new NextResponse(
      `File is empty in storage. path=${filePath}`,
      { status: 500 }
    );
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
