'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronRight, ChevronLeft, ExternalLink, FileText,
  Loader2, AlertCircle, ZoomIn, ZoomOut, RefreshCw,
} from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

// Module-level pdfjs handle — loaded once, shared across effects and helpers.
let pdfjsLib: any = null;
let pdfjsPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const lib: any = await import('pdfjs-dist');
      lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      pdfjsLib = lib;
      console.log('[pdf] pdfjs version:', lib.version);
      return lib;
    })();
  }
  return pdfjsPromise;
}

export default function PdfViewerInner({
  pdfUrl,
  pageCount,
  currentPage,
  onPageChange,
  highlightSnippet = '',
}: {
  pdfUrl: string | null;
  pageCount: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  highlightSnippet?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderingRef = useRef<boolean>(false);

  const [numPages, setNumPages] = useState(pageCount || 0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [renderKey, setRenderKey] = useState(0);

  // Load PDF
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[pdf] loading from', pdfUrl);

        const res = await fetch(pdfUrl);
        console.log('[pdf] fetch status:', res.status, 'content-type:', res.headers.get('content-type'));
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          console.error('[pdf] server error body:', detail);
          throw new Error(detail || `خطای سرور (${res.status})`);
        }
        const arrayBuffer = await res.arrayBuffer();
        console.log('[pdf] downloaded bytes:', arrayBuffer.byteLength);
        if (arrayBuffer.byteLength === 0) {
          throw new Error('فایل PDF خالی است.');
        }

        const lib = await loadPdfJs();

        const doc = await lib.getDocument({
          data: arrayBuffer,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
        }).promise;

        if (cancelled) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);
        console.log('[pdf] ✅ loaded', doc.numPages, 'pages');
      } catch (e: any) {
        if (cancelled) return;
        console.error('[pdf] load error:', e);
        setError(e?.message || 'خطا در بارگذاری سند');
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (pdfDocRef.current) {
        try { pdfDocRef.current.destroy(); } catch {}
        pdfDocRef.current = null;
      }
    };
  }, [pdfUrl]);

  // Render current page
  useEffect(() => {
    if (loading) return;
    if (!pdfDocRef.current) {
      console.log('[pdf] render skipped: no doc yet');
      return;
    }
    if (!canvasRef.current) {
      console.log('[pdf] render skipped: canvas not in DOM yet');
      return;
    }
    if (renderingRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        renderingRef.current = true;
        setRendering(true);
        console.log('[pdf] render start: page', currentPage, 'zoom', zoom);

        const doc = pdfDocRef.current;
        const page = await doc.getPage(currentPage);
        if (cancelled) return;

        // Compute scale
        const containerWidth = containerRef.current?.clientWidth ?? 800;
        const unscaled = page.getViewport({ scale: 1 });
        const fitScale = Math.max(0.4, (containerWidth - 32) / unscaled.width);
        const scale = fitScale * zoom;
        const viewport = page.getViewport({ scale });

        console.log('[pdf] container width:', containerWidth,
                    'unscaled width:', unscaled.width,
                    'fit scale:', fitScale,
                    'final scale:', scale,
                    'viewport:', viewport.width, 'x', viewport.height);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2 to avoid huge canvases
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.background = 'white';

        console.log('[pdf] canvas set to', canvas.width, 'x', canvas.height, 'dpr', dpr);

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          throw new Error('canvas 2d context unavailable');
        }

        // Fill with white first (some PDFs render with transparent backgrounds)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        await page.render({
          canvasContext: ctx,
          viewport,
          intent: 'display',
        }).promise;

        if (cancelled) return;
        console.log('[pdf] ✅ render complete for page', currentPage);

        // Blank-canvas detection: sample a handful of pixels
        try {
          const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let nonWhite = 0;
          // sample every ~1000th pixel
          for (let i = 0; i < sample.length; i += 4000) {
            const r = sample[i], g = sample[i + 1], b = sample[i + 2];
            if (r < 240 || g < 240 || b < 240) nonWhite++;
          }
          console.log('[pdf] non-white samples:', nonWhite);
          if (nonWhite < 5) {
            console.warn('[pdf] ⚠️ canvas looks mostly blank — CMaps or fonts may be missing');
            setError('صفحه سفید رندر شد. احتمالاً فایل شامل فونت‌های خاص است.');
          }
        } catch (e) {
          console.warn('[pdf] pixel sampling failed (may be cross-origin):', e);
        }

        // Highlight snippet
        if (highlightSnippet && highlightSnippet.trim().length > 3) {
          try {
            const textContent = await page.getTextContent();
            const lib = await loadPdfJs();
            const rects = findHighlightRects(textContent.items, highlightSnippet, viewport, lib);
            if (rects.length > 0) {
              ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
              ctx.strokeStyle = 'rgba(217, 119, 6, 0.65)';
              ctx.lineWidth = 1;
              rects.forEach((r) => {
                ctx.fillRect(r.x, r.y, r.w, r.h);
                ctx.strokeRect(r.x, r.y, r.w, r.h);
              });
              console.log('[pdf] highlighted', rects.length, 'rects');
            }
          } catch (he) {
            console.warn('[pdf] highlight failed:', he);
          }
        }
      } catch (e: any) {
        if (cancelled) return;
        console.error('[pdf] render error:', e);
        setError(e?.message || 'خطا در نمایش این صفحه');
      } finally {
        renderingRef.current = false;
        if (!cancelled) setRendering(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentPage, zoom, numPages, highlightSnippet, loading, renderKey]);

  if (!pdfUrl) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500">فایل PDF در دسترس نیست.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 shrink-0 flex items-center justify-between px-2 sm:px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
            صفحه {toPersianNumber(currentPage)} / {toPersianNumber(numPages || pageCount)}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} disabled={zoom <= 0.5}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} disabled={zoom >= 3}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setRenderKey((k) => k + 1)} title="رندر مجدد"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => onPageChange(Math.min(numPages || pageCount, currentPage + 1))} disabled={currentPage >= (numPages || pageCount)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <a href={pdfUrl} target="_blank" rel="noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 p-3 sm:p-4 flex justify-center items-start">
        {error && !rendering ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">نمایش سند ممکن نشد</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4" dir="rtl">{error}</p>
            <div className="flex gap-2">
              <button onClick={() => { setError(null); setRenderKey((k) => k + 1); }}
                className="text-xs px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition">
                تلاش مجدد
              </button>
              <a href={pdfUrl} target="_blank" rel="noreferrer"
                className="text-xs px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition">
                دانلود فایل
              </a>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <p className="text-xs text-slate-400 dark:text-slate-500">در حال بارگذاری سند...</p>
          </div>
        ) : (
          <div className="relative">
            <canvas ref={canvasRef} className="shadow-lg rounded-lg overflow-hidden" />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 rounded-lg backdrop-blur-[1px]">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function findHighlightRects(
  items: any[],
  snippet: string,
  viewport: any,
  pdfjsLib: any
): { x: number; y: number; w: number; h: number }[] {
  const normalizedSnippet = snippet.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!normalizedSnippet) return [];

  const snippetWords = normalizedSnippet
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((w) => w.length >= 3);
  if (snippetWords.length === 0) return [];

  type Item = { str: string; x: number; y: number; w: number; h: number };
  const positioned: Item[] = items
    .filter((it: any) => it.str && it.str.trim().length > 0)
    .map((it: any) => {
      const tx = pdfjsLib.Util.transform(viewport.transform, it.transform);
      const fontHeight = Math.hypot(tx[2], tx[3]);
      return {
        str: it.str,
        x: tx[4],
        y: tx[5] - fontHeight,
        w: it.width * viewport.scale,
        h: fontHeight * 1.15,
      };
    });

  const lines = new Map<number, Item[]>();
  for (const it of positioned) {
    const key = Math.round(it.y / 4) * 4;
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key)!.push(it);
  }

  const rects: { x: number; y: number; w: number; h: number }[] = [];
  for (const [, lineItems] of lines) {
    lineItems.sort((a, b) => a.x - b.x);
    const lineText = lineItems.map((i) => i.str).join(' ').toLowerCase();
    const cleaned = lineText.replace(/[^\p{L}\p{N}\s]/gu, ' ');

    let matched = 0;
    for (const w of snippetWords) {
      if (cleaned.includes(w)) matched++;
    }
    const ratio = matched / snippetWords.length;

    if (ratio >= 0.5) {
      const minX = Math.min(...lineItems.map((i) => i.x)) - 2;
      const maxX = Math.max(...lineItems.map((i) => i.x + i.w)) + 2;
      const minY = Math.min(...lineItems.map((i) => i.y)) - 2;
      const maxY = Math.max(...lineItems.map((i) => i.y + i.h)) + 2;
      rects.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
    }
  }

  return rects;
}
