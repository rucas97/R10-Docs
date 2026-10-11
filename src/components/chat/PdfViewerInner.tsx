'use client';

import { useMemo, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ZoomIn, ZoomOut } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

export default function PdfViewerInner({
  chatId,
  pageCount,
  currentPage,
  onPageChange,
  highlightSnippet = '',
}: {
  chatId: string;
  pageCount: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  primaryLanguage?: 'fa' | 'en';
  highlightSnippet?: string;
}) {
  const [zoom, setZoom] = useState(100);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const viewerSrc = useMemo(() => {
    if (!origin) return '';
    const fileUrl = `${origin}/api/pdf/${chatId}`;
    const params = new URLSearchParams();
    params.set('file', fileUrl);

    const hash = new URLSearchParams();
    hash.set('page', String(currentPage));
    hash.set('zoom', `${zoom}`);

    if (highlightSnippet && highlightSnippet.trim().length > 3) {
      const cleaned = highlightSnippet
        .replace(/[«»""„"'`]/g, '')
        .replace(/[\u200C\u200D\u200E\u200F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned.length > 3) {
        hash.set('search', cleaned.slice(0, 120));
        hash.set('phrase', 'true');
      }
    }

    return `/pdfjs-viewer/web/viewer.html?${params.toString()}#${hash.toString()}`;
  }, [origin, chatId, currentPage, zoom, highlightSnippet]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Minimal toolbar: prev / counter / next / zoom out / zoom in */}
      <div className="h-12 shrink-0 flex items-center justify-center gap-1 px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
          title="صفحه قبل"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-2 min-w-[80px] text-center">
          {toPersianNumber(currentPage)} / {toPersianNumber(pageCount)}
        </span>

        <button
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          disabled={currentPage >= pageCount}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
          title="صفحه بعد"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        <button
          onClick={() => setZoom((z) => Math.max(50, z - 25))}
          disabled={zoom <= 50}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
          title="کوچک‌نمایی"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 min-w-[40px] text-center">
          {toPersianNumber(zoom)}٪
        </span>

        <button
          onClick={() => setZoom((z) => Math.min(300, z + 25))}
          disabled={zoom >= 300}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
          title="بزرگ‌نمایی"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-200 dark:bg-slate-950">
        {viewerSrc ? (
          <iframe
            key={viewerSrc}
            src={viewerSrc}
            className="w-full h-full border-0"
            title="نمایش سند PDF"
          />
        ) : null}
      </div>
    </div>
  );
}
