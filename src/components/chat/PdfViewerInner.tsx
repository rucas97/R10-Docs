'use client';

import { useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronRight, ChevronLeft, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

// Wire the worker — the file was copied to /public in the batch
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
  const [width, setWidth] = useState(600);
  const containerRef = useState<HTMLDivElement | null>(null)[0] as any; // not used
  const [boxWidth, setBoxWidth] = useState(600);

  // Measure container so pages fit
  useEffect(() => {
    const el = document.getElementById('pdf-page-wrap');
    if (!el) return;
    const update = () => setBoxWidth(el.clientWidth - 24);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fileProp = useMemo(() => (pdfUrl ? { url: pdfUrl } : null), [pdfUrl]);

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
      <div id="pdf-page-wrap" className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-950 p-3 flex justify-center">
        <Document
          file={fileProp}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          }
          error={
            <div className="text-xs text-rose-500 text-center py-12">
              نمایش سند ممکن نیست.
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            width={Math.max(240, boxWidth)}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            className="shadow-lg rounded-lg overflow-hidden"
          />
        </Document>
      </div>
    </div>
  );
}
