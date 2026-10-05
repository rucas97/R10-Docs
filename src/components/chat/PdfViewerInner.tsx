'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronRight, ChevronLeft, ExternalLink, FileText,
  Loader2, AlertCircle, ZoomIn, ZoomOut,
} from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

type Props = {
  pdfUrl: string | null;
  pageCount: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  highlightSnippet?: string;
};

export default function PdfViewerInner({
  pdfUrl, pageCount, currentPage, onPageChange, highlightSnippet = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderingRef = useRef<boolean>(false);

  const [numPages, setNumPages] = useState(pageCount || 0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Load the PDF once
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch as blob first so we can show meaningful HTTP errors
        const res = await fetch(pdfUrl);
        if (!res.ok) {
          const map: Record<number, string> = {
            401: 'دسترسی به فایل مجاز نیست. لطفاً صفحه را دوباره بارگذاری کنید.',
            403: 'دسترسی به فایل مجاز نیست.',
            404: 'فایل PDF در سرور پیدا نشد. لطفاً دوباره آپلود کنید.',
            500: 'خطای سرور در ارائه فایل.',
          };
          throw new Error(map[res.status] || `خطا در دریافت فایل (${res.status})`);
        }
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          throw new Error('فایل PDF خالی است یا به‌درستی آپلود نشده است.');
        }

        const pdfjsLib: any = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setLoading(false);
        console.log('[pdf] loaded, pages:', doc.numPages);
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

  // Render the current page + highlight the snippet
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    if (renderingRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        renderingRef.current = true;
        setRendering(true);

        const pdfjsLib: any = await import('pdfjs-dist');
        const doc = pdfDocRef.current;
        const page = await doc.getPage(currentPage);
        if (cancelled) return;

        const containerWidth = containerRef.current?.clientWidth ?? 800;
        const unscaled = page.getViewport({ scale: 1 });
        const fitScale = Math.max(0.4, (containerWidth - 32) / unscaled.width);
        const scale = fitScale * zoom;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;

        // Highlight snippet if provided
        if (highlightSnippet && highlightSnippet.trim().length > 3) {
          try {
            const textContent = await page.getTextContent();
            const rects = findHighlightRects(textContent.items, highlightSnippet, viewport, pdfjsLib);
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

        console.log('[pdf] rendered page', currentPage);
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
  }, [currentPage, zoom, numPages, highlightSnippet]);

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
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">نمایش سند ممکن نشد</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4" dir="rtl">{error}</p>
            <a href={pdfUrl} target="_blank" rel="noreferrer"
              className="text-xs px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition">
              دانلود فایل
            </a>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <p className="text-xs text-slate-400 dark:text-slate-500">در حال بارگذاری سند...</p>
          </div>
        ) : (
          <div className="relative">
            <canvas ref={canvasRef} className="shadow-lg rounded-lg overflow-hidden bg-white" />
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 rounded-lg backdrop-blur-[1px]">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Find rectangles for text items whose combined line matches the snippet.
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

  // Position each text item using its transform matrix
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

  // Group into lines by Y (bucket rounded to 4 px)
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
