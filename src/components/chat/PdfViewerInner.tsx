'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, ExternalLink, FileText, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
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
  const [showThumbs, setShowThumbs] = useState(false);
  const [origin, setOrigin] = useState('');

  // Need origin on client (window is not available during SSR)
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const viewerSrc = useMemo(() => {
    if (!origin) return '';
    // Absolute URL to our PDF proxy — required by PDF.js viewer's origin validation
    const fileUrl = `${origin}/api/pdf/${chatId}`;

    const params = new URLSearchParams();
    params.set('file', fileUrl);

    const hash = new URLSearchParams();
    hash.set('page', String(currentPage));
    hash.set('zoom', 'page-width');
    if (showThumbs) hash.set('pagemode', 'thumbs');
    if (highlightSnippet && highlightSnippet.trim().length > 3) {
      // Clean but keep the whole phrase — the LLM quote is usually a real substring
      const cleaned = highlightSnippet
        .replace(/[«»""„"'`]/g, '')
        .replace(/[\u200C\u200D\u200E\u200F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned.length > 3) {
        // Truncate to avoid absurdly long queries
        hash.set('search', cleaned.slice(0, 120));
        // Use phrase search — PDF.js will try to match the full phrase first
        hash.set('phrase', 'true');
      }
    }

    // Viewer lives in /pdfjs-viewer/web/viewer.html (preserving relative imports)
    return `/pdfjs-viewer/web/viewer.html?${params.toString()}#${hash.toString()}`;
  }, [origin, chatId, currentPage, highlightSnippet, showThumbs]);

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
            onClick={() => setShowThumbs((v) => !v)}
            title={showThumbs ? 'پنهان کردن بندانگشتی‌ها' : 'نمایش بندانگشتی‌ها'}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          >
            {showThumbs
              ? <PanelRightClose className="w-4 h-4" />
              : <PanelRightOpen className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <a
            href={viewerSrc || '#'}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-slate-300 dark:bg-slate-800">
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
