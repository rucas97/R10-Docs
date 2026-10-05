'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

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

  if (!open) return null;

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
      setError('خلاصه‌سازی ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const hasSummary = text && text.length >= 20;

  return (
    <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-l from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-100 dark:border-brand-900 relative shrink-0">
      <button
        onClick={() => setOpen(false)}
        className="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition"
        aria-label="بستن"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-2.5 pl-6">
        <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-brand-700 dark:text-brand-300 mb-1">خلاصه سند</p>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>در حال تولید خلاصه...</span>
            </div>
          ) : hasSummary ? (
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{text}</p>
          ) : (
            <div className="flex items-center justify-between gap-3 py-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                خلاصه‌ای تولید نشده است.
              </p>
              <button
                onClick={regenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold transition shrink-0"
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
