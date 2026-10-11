'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, RefreshCw, Loader2, AlertCircle, Copy, Check } from 'lucide-react';

export function SummaryCard({
  chatId,
  summary,
}: {
  chatId: string;
  summary: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [text, setText] = useState(summary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasSummary = text && text.length >= 20;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('کپی ناموفق بود');
    }
  };

  const regenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      if (!res.ok) throw new Error('ناموفق');
      const data = await res.json();
      if (!data.summary) throw new Error('خلاصه خالی');
      setText(data.summary);
      router.refresh();
    } catch {
      setError('خلاصه‌سازی ناموفق بود.');
    } finally {
      setLoading(false);
    }
  };

  // Collapsed state
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="نمایش خلاصه سند"
        className="self-end me-4 mt-2 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-gradient-to-l from-brand-500 to-indigo-500 hover:from-brand-600 hover:to-indigo-600
          text-white text-[11px] font-black shadow-md shadow-brand-500/30
          active:scale-95 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>خلاصه سند</span>
      </button>
    );
  }

  // Expanded state
  return (
    <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-l from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-100 dark:border-brand-900 relative shrink-0">
      {/* Close button (top-left) */}
      <button
        onClick={() => setOpen(false)}
        className="absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 active:scale-90 transition"
        aria-label="بستن"
        title="جمع کردن خلاصه"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          {/* Header row: label + copy + regenerate */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-black text-brand-700 dark:text-brand-300">خلاصه سند</p>

            <div className="flex items-center gap-1">
              {hasSummary && (
                <button
                  onClick={handleCopy}
                  title={copied ? 'کپی شد' : 'کپی خلاصه'}
                  className={`h-7 px-2 rounded-lg flex items-center gap-1 text-[10px] font-bold transition active:scale-95 ${
                    copied
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white/70 dark:bg-slate-800/70 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden xs:inline">{copied ? 'کپی شد' : 'کپی'}</span>
                </button>
              )}

              <button
                onClick={regenerate}
                disabled={loading}
                title="تولید مجدد"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-600 dark:text-brand-400 bg-white/70 dark:bg-slate-800/70 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-slate-700 active:scale-95 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>در حال تولید خلاصه...</span>
            </div>
          ) : hasSummary ? (
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{text}</p>
          ) : (
            <div className="flex items-center justify-between gap-3 py-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">خلاصه‌ای موجود نیست.</p>
              <button
                onClick={regenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold transition shrink-0 active:scale-95"
              >
                <RefreshCw className="w-3 h-3" />
                تولید خلاصه
              </button>
            </div>
          )}

          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
