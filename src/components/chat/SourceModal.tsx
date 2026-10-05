'use client';

import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

export function SourceModal({
  pages,
  initialIndex,
  pdfUrl,
  onClose,
}: {
  pages: number[];
  initialIndex: number;
  pdfUrl: string | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const page = pages[index];

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index > 0) setIndex(index - 1);
      if (e.key === 'ArrowLeft' && index < pages.length - 1) setIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, pages.length, onClose]);

  // Build iframe URL with page fragment — works in every modern browser
  const iframeSrc = pdfUrl ? `${pdfUrl}#page=${page}&zoom=page-width&toolbar=0` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                منبع — صفحه {toPersianNumber(page)}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {toPersianNumber(index + 1)} از {toPersianNumber(pages.length)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
              title="منبع قبلی"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))}
              disabled={index === pages.length - 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition"
              title="منبع بعدی"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
          {iframeSrc ? (
            <iframe
              key={page}
              src={iframeSrc}
              className="w-full h-full border-0"
              title={`صفحه ${page}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 dark:text-slate-500">
              فایل PDF در دسترس نیست.
            </div>
          )}
        </div>

        {/* Page switcher strip */}
        {pages.length > 1 && (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                منابع این پیام:
              </span>
              {pages.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setIndex(i)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    i === index
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                  }`}
                >
                  ص {toPersianNumber(p)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
