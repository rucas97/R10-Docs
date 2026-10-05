'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, ExternalLink, FileText } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

export function PdfViewer({
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync iframe when currentPage changes
  useEffect(() => {
    if (!iframeRef.current || !pdfUrl) return;
    iframeRef.current.src = `${pdfUrl}#page=${currentPage}&zoom=page-width&toolbar=0`;
  }, [currentPage, pdfUrl]);

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
      <div className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            صفحه {toPersianNumber(currentPage)} / {toPersianNumber(pageCount)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
            title="صفحه قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
            title="صفحه بعد"
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

      {/* iframe */}
      <div className="flex-1 overflow-hidden bg-slate-200 dark:bg-slate-950">
        <iframe
          ref={iframeRef}
          src={`${pdfUrl}#page=${currentPage}&zoom=page-width&toolbar=0`}
          className="w-full h-full border-0"
          title="PDF"
        />
      </div>
    </div>
  );
}
