'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, ExternalLink, FileText } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

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
  primaryLanguage?: 'fa' | 'en';
  highlightSnippet?: string;
}) {
  const [zoomPct, setZoomPct] = useState(100);

  // Build the iframe URL with browser-native PDF viewer parameters.
  // Supported by Chrome, Edge, Brave, Opera, and Chromium-based browsers.
  // Safari/Firefox honor #page and #zoom; #search is Chrome/Edge only.
  const iframeSrc = useMemo(() => {
    if (!pdfUrl) return '';
    const hash = new URLSearchParams();
    hash.set('page', String(currentPage));
    hash.set('zoom', String(zoomPct));
    hash.set('toolbar', '1');
    if (highlightSnippet && highlightSnippet.trim().length > 3) {
      hash.set('search', highlightSnippet.trim().slice(0, 200));
    }
    return `${pdfUrl}#${hash.toString()}`;
  }, [pdfUrl, currentPage, zoomPct, highlightSnippet]);

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
            صفحه {toPersianNumber(currentPage)} / {toPersianNumber(pageCount)}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setZoomPct((z) => Math.max(50, z - 25))}
            disabled={zoomPct <= 50}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
            title="کوچک‌نمایی"
          >
            <span className="text-xs">−</span>
          </button>
          <button
            onClick={() => setZoomPct((z) => Math.min(300, z + 25))}
            disabled={zoomPct >= 300}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
            title="بزرگ‌نمایی"
          >
            <span className="text-xs">+</span>
          </button>
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
            href={iframeSrc || '#'}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
            title="باز در تب جدید"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Native PDF iframe */}
      <div className="flex-1 overflow-hidden bg-slate-300 dark:bg-slate-800">
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          className="w-full h-full border-0"
          title="نمایش سند PDF"
        />
      </div>
    </div>
  );
}
