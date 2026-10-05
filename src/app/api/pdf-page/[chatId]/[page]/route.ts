import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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
    console.error('[pdf-page] no file_path for', chatId);
    return new NextResponse('File not found', { status: 404 });
  }

  // Download the PDF
  const { data: fileData, error: dlErr } = await supabase.storage
    .from('pdfs')
    .download(chat.file_path);

  if (dlErr || !fileData) {
    console.error('[pdf-page] download failed:', dlErr?.message);
    return new NextResponse('Download failed: ' + (dlErr?.message ?? ''), { status: 500 });
  }

  const arrayBuffer = await fileData.arrayBuffer();
  console.log('[pdf-page] downloaded', arrayBuffer.byteLength, 'bytes');

  let stage = 'init';
  try {
    stage = 'import-pdfjs';
    // Import the legacy build (works in plain Node — no DOM, no worker)
    const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log('[pdf-page] pdfjs version:', pdfjsLib.version);

    stage = 'import-canvas';
    const { createCanvas } = await import('@napi-rs/canvas');
    console.log('[pdf-page] @napi-rs/canvas loaded');

    // Custom CanvasFactory so pdfjs knows how to make canvases on Node
    class NodeCanvasFactory {
      create(width: number, height: number) {
        const canvas = createCanvas(width, height);
        return { canvas, context: canvas.getContext('2d') };
      }
      reset(canvasAndContext: any, width: number, height: number) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
      }
      destroy(canvasAndContext: any) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
      }
    }

    stage = 'getDocument';
    const uint8 = new Uint8Array(arrayBuffer);

    // For CMaps + standard fonts: since we can't reliably fetch from unpkg
    // inside Vercel's runtime (Iran-origin requests have no proxy here),
    // we point at our own /public copies served via the deployment URL.
    const origin = req.nextUrl.origin;

    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      // No worker in Node — this is the correct way to disable it
      disableWorker: true,
      // Use our own bundled resources
      cMapUrl: `${origin}/pdfjs/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${origin}/pdfjs/standard_fonts/`,
      // Path-based glyph rendering (avoids FontFace API bugs)
      disableFontFace: true,
      useSystemFonts: false,
      isEvalSupported: false,
      canvasFactory: new NodeCanvasFactory(),
      verbosity: 0,
    } as any);

    const doc = await loadingTask.promise;
    console.log('[pdf-page] doc loaded, pages:', doc.numPages);

    stage = 'getPage';
    const page = await doc.getPage(pageNum);

    stage = 'viewport';
    const viewport = page.getViewport({ scale: 2.0 });

    stage = 'createCanvas';
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const ctx: any = canvas.getContext('2d');

    // Force LTR (this route renders the raw PDF; direction doesn't matter
    // for the pixel content — pdfjs already laid the glyphs out per the PDF)
    ctx.direction = 'ltr';

    // White background so transparent PDFs don't show as black
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stage = 'render';
    await page.render({
      canvasContext: ctx,
      viewport,
      canvasFactory: new NodeCanvasFactory(),
      intent: 'print',
    } as any).promise;

    stage = 'toBuffer';
    const pngBuffer = canvas.toBuffer('image/png');
    console.log('[pdf-page] ✅ rendered page', pageNum, pngBuffer.length, 'bytes');

    return new NextResponse(pngBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=3600',
        'X-Render-Stage': 'ok',
      },
    });
  } catch (e: any) {
    console.error(`[pdf-page] ❌ failed at stage=${stage}:`, e?.message);
    console.error('[pdf-page] stack:', e?.stack?.slice(0, 500));
    return new NextResponse(
      `Render failed at ${stage}: ${e?.message ?? 'unknown'}`,
      {
        status: 500,
        headers: { 'X-Render-Stage': stage },
      }
    );
  }
}
