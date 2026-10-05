'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, ChevronRight, ChevronLeft, FileText, Loader2, Quote } from 'lucide-react';
import { toPersianNumber, type Citation } from '@/lib/citations';

const PdfViewerInner = dynamic(() => import('./PdfViewerInner'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
    </div>
  ),
});

export function SourceModal({
  citations,
  initialIndex,
  chatId,
  primaryLanguage = 'en',
  onClose,
}: {
  citations: Citation[];
  initialIndex: number;
  chatId: string;
  primaryLanguage?: 'fa' | 'en';
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = citations[index];
  const page = current.page;
  const snippet = current.snippet;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index > 0) setIndex(index - 1);
      if (e.key === 'ArrowLeft' && index < citations.length - 1) setIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, citations.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl h-[90dvh] sm:h-[86dvh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
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
                {toPersianNumber(index + 1)} از {toPersianNumber(citations.length)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setIndex((i) => Math.min(citations.length - 1, i + 1))} disabled={index === citations.length - 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {snippet && (
          <div className="shrink-0 px-4 py-3 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900">
            <div className="flex items-start gap-2">
              <Quote className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                «{snippet}»
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-200 dark:bg-slate-950">
          <PdfViewerInner
            chatId={chatId}
            pageCount={Math.max(...citations.map((c) => c.page))}
            currentPage={page}
            onPageChange={(p) => {
              const i = citations.findIndex((c) => c.page === p);
              if (i >= 0) setIndex(i);
            }}
            highlightSnippet={snippet}
            primaryLanguage={primaryLanguage}
          />
        </div>

        {citations.length > 1 && (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                منابع این پیام:
              </span>
              {citations.map((c, i) => (
                <button key={`${c.page}-${i}`} onClick={() => setIndex(i)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    i === index
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                  }`}>
                  ص {toPersianNumber(c.page)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
