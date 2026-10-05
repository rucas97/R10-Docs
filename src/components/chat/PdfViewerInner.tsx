'use client';

import { useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronRight, ChevronLeft, ExternalLink, FileText, Loader2, AlertCircle } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

// Use the worker file copied into /public — matches the installed pdfjs-dist 6.4.299
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

console.log('[pdf] react-pdf version:', (pdfjs as any)?.version);
console.log('[pdf] workerSrc:', pdfjs.GlobalWorkerOptions.workerSrc);

export default function PdfViewerInner({
  pdfUrl,
  pageCount,
  currentPage,
  onPageChange,
}: {
  pdfUrl: string | null;
  pageCount: number;
  currentPage: number;
  onPageChange: (p: number) => void;
}) {
  const [numPages, setNumPages] = useState(pageCount || 0);
  const [boxWidth, setBoxWidth] = useState(600);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const el = document.getElementById('pdf-page-wrap');
    if (!el) return;
    const update = () => setBoxWidth(Math.max(240, el.clientWidth - 24));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setLoadError(null);
  }, [pdfUrl]);

  const fileProp = useMemo(
    () => (pdfUrl ? { url: pdfUrl, withCredentials: false } : null),
    [pdfUrl]
  );

  if (!pdfUrl || !fileProp) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500">فایل PDF در دسترس نیست.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            صفحه {toPersianNumber(currentPage)} / {toPersianNumber(numPages || pageCount)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(Math.min(numPages || pageCount, currentPage + 1))}
            disabled={currentPage >= (numPages || pageCount)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
            title="باز در تب جدید"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Page render */}
      <div
        id="pdf-page-wrap"
        className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 p-3 flex justify-center"
      >
        {loadError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
              نمایش سند ممکن نشد
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-3" dir="ltr">
              {loadError}
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition"
            >
              دانلود فایل
            </a>
          </div>
        ) : (
          <Document
            file={fileProp}
            onLoadSuccess={({ numPages: n }) => {
              console.log('[pdf] loaded successfully, pages:', n);
              setNumPages(n);
            }}
            onLoadError={(err) => {
              console.error('[pdf] load error:', err);
              setLoadError(err?.message || 'خطای نامشخص');
            }}
            onSourceError={(err) => {
              console.error('[pdf] source error:', err);
              setLoadError('دریافت فایل از سرور ناموفق بود. ممکن است لینک منقضی شده باشد.');
            }}
            loading={
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                <p className="text-xs text-slate-400 dark:text-slate-500">در حال بارگذاری سند...</p>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertCircle className="w-6 h-6 text-rose-500" />
                <p className="text-xs text-rose-500 text-center px-6">
                  نمایش سند ممکن نشد.
                </p>
              </div>
            }
          >
            <Page
              pageNumber={Math.min(currentPage, numPages || currentPage)}
              width={boxWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              onRenderSuccess={() => console.log('[pdf] page rendered:', currentPage)}
              onRenderError={(err) => {
                console.error('[pdf] page render error:', err);
                setLoadError('خطا در نمایش این صفحه');
              }}
              className="shadow-lg rounded-lg overflow-hidden"
            />
          </Document>
        )}
      </div>
    </div>
  );
}
