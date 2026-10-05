import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string; page: string }> }
) {
  const { chatId, page: pageStr } = await params;
  const pageNum = parseInt(pageStr, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return new NextResponse('Invalid page', { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: chat } = await supabase
    .from('chats')
    .select('file_path')
    .eq('id', chatId)
    .single();

  if (!chat?.file_path) {
    return new NextResponse('File not found', { status: 404 });
  }

  const { data: fileData, error } = await supabase.storage
    .from('pdfs')
    .download(chat.file_path);

  if (error || !fileData) {
    return new NextResponse('Download failed', { status: 500 });
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  try {
    // Legacy build avoids the Chrome accelerated-canvas bug
    const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    // Set up canvas factory for Node
    const { createCanvas } = await import('@napi-rs/canvas');

    const doc = await pdfjsLib.getDocument({
      data: uint8,
      useSystemFonts: false,
      disableFontFace: true,
      isEvalSupported: false,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/standard_fonts/',
    }).promise;

    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    // Create a node canvas
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const ctx = (canvas as any).getContext('2d');

    // Force LTR + white background
    (ctx as any).direction = 'ltr';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      intent: 'print',
    }).promise;

    const pngBuffer = (canvas as any).toBuffer('image/png');

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('[pdf-page] render failed:', e?.message);
    return new NextResponse('Render failed: ' + e?.message, { status: 500 });
  }
}
