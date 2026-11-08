'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, RefreshCw, Loader2, Copy, Check } from 'lucide-react';

export function SummaryCard({ chatId, summary }: { chatId: string; summary: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [text, setText] = useState(summary);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasSummary = text && text.length >= 20;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const regenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (data.summary) { setText(data.summary); router.refresh(); }
    } catch {}
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-end me-4 mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500 hover:bg-gold-600 text-black text-[11px] font-black shadow-md shadow-gold-500/30 active:scale-95 transition"
      >
        <Sparkles className="w-3.5 h-3.5" />
        خلاصه سند
      </button>
    );
  }

  return (
    <div className="mx-3 xl:mx-6 mt-3 xl:mt-4 p-4 rounded-2xl bg-white dark:bg-surface-aiBubbleDark border border-neutral-200 dark:border-neutral-800 relative shadow-sm">
      <button
        onClick={() => setOpen(false)}
        className="absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
        aria-label="بستن"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-neutral-900 dark:text-white mb-1.5">خلاصه سند</p>

          {loading ? (
            <div className="flex items-center gap-2 text-xs text-neutral-500 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              در حال تولید خلاصه...
            </div>
          ) : hasSummary ? (
            <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{text}</p>
          ) : (
            <p className="text-xs text-neutral-500 py-1">خلاصه‌ای موجود نیست.</p>
          )}

          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
            {hasSummary && (
              <button
                onClick={handleCopy}
                className={`h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                  copied
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-gold-500 hover:text-black border border-transparent'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'کپی شد' : 'کپی'}
              </button>
            )}
            <button
              onClick={regenerate}
              disabled={loading}
              className="h-7 px-2.5 rounded-lg text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-gold-500 hover:text-black transition border border-transparent flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              بازتولید
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
