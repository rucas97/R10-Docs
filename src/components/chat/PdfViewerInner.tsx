'use client';

import { useEffect, useState } from 'react';
import {
  ChevronRight, ChevronLeft, ExternalLink, FileText,
  Loader2, AlertCircle, ZoomIn, ZoomOut, RefreshCw,
} from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

export default function PdfViewerInner({
  pdfUrl,
  chatId,
  pageCount,
  currentPage,
  onPageChange,
  primaryLanguage = 'en',
  highlightSnippet = '',
}: {
  pdfUrl: string | null;
  chatId: string;
  pageCount: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  primaryLanguage?: 'fa' | 'en';
  highlightSnippet?: string;
}) {
  const [numPages, setNumPages] = useState(pageCount || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [renderKey, setRenderKey] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);

  // Server-rendered image URL
  const serverImgUrl = `/api/pdf-page/${chatId}/${currentPage}?z=${zoom}&r=${renderKey}`;

  useEffect(() => {
    setNumPages(pageCount || 0);
    setLoading(false);
  }, [pageCount]);

  if (!pdfUrl) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500">فایل PDF در دسترس نیست.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
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

      {/* Page render */}
      <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 p-3 sm:p-4 flex justify-center items-start">
        {error ? (
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
        ) : (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`${currentPage}-${zoom}-${renderKey}`}
              src={serverImgUrl}
              alt={`صفحه ${currentPage}`}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError('رندر صفحه از سرور ناموفق بود.');
              }}
              style={{
                width: `${zoom * 100}%`,
                maxWidth: `${zoom * 800}px`,
                display: 'block',
              }}
              className="shadow-lg rounded-lg"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
