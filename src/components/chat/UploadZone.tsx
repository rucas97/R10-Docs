'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CloudUpload, Loader2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

type Stage = 'idle' | 'uploading' | 'summarizing' | 'done' | 'error';

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Chat id we created on /api/upload. Reused across summary retries.
  const [chatId, setChatId] = useState<string | null>(null);

  const reset = () => {
    setStage('idle');
    setProgress(0);
    setFileName('');
    setError(null);
    setChatId(null);
  };

  const runSummary = async (cid: string) => {
    setStage('summarizing');
    setError(null);
    setProgress(45);

    // Slowly creep the progress bar so it feels alive while we retry
    let creep = 45;
    const ticker = setInterval(() => {
      creep = Math.min(92, creep + 2);
      setProgress(creep);
    }, 700);

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: cid }),
      });

      clearInterval(ticker);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error === 'All providers failed'
            ? 'سرویس هوش مصنوعی در این لحظه پاسخ نمی‌دهد.'
            : data.error || 'خلاصه‌سازی ناموفق بود'
        );
      }

      const { summary } = await res.json();
      if (!summary || summary.length < 20) {
        throw new Error('خلاصه خالی برگشت');
      }

      setProgress(100);
      setStage('done');
      router.push(`/chat/${cid}`);
    } catch (e: any) {
      clearInterval(ticker);
      setError(e.message || 'خطا در خلاصه‌سازی سند');
      setStage('error');
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('فقط فایل‌های PDF پشتیبانی می‌شوند.');
      setStage('error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('حجم فایل باید کمتر از ۵۰ مگابایت باشد.');
      setStage('error');
      return;
    }

    setFileName(file.name);
    setError(null);
    setChatId(null);
    setStage('uploading');
    setProgress(10);

    try {
      const fd = new FormData();
      fd.append('file', file);

      // Simulate smooth progress while uploading
      let creep = 10;
      const ticker = setInterval(() => {
        creep = Math.min(38, creep + 4);
        setProgress(creep);
      }, 200);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      clearInterval(ticker);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'آپلود ناموفق بود');
      }
      const { chatId: cid } = await res.json();
      setChatId(cid);
      setProgress(40);

      // Now block on summary — do NOT navigate until this succeeds
      await runSummary(cid);
    } catch (e: any) {
      setError(e.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.');
      setStage('error');
    }
  };

  const retrySummary = async () => {
    if (!chatId) {
      reset();
      return;
    }
    await runSummary(chatId);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && stage !== 'uploading' && stage !== 'summarizing') handleFile(file);
  };

  const busy = stage === 'uploading' || stage === 'summarizing';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8">
      <label
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={onDrop}
        className={`block rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition ${
          dragging
            ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40'
            : 'border-brand-200 dark:border-brand-800 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30'
        } ${busy ? 'cursor-wait' : 'cursor-pointer'} ${stage === 'error' ? 'pointer-events-none opacity-95' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${
            stage === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
              : stage === 'summarizing'
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              : 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
          }`}>
            {stage === 'uploading' && <Loader2 className="w-8 h-8 animate-spin" />}
            {stage === 'summarizing' && <Sparkles className="w-8 h-8 animate-pulse" />}
            {stage === 'error' && <AlertCircle className="w-8 h-8" />}
            {(stage === 'idle' || stage === 'done') && <CloudUpload className="w-8 h-8" />}
          </div>

          {stage === 'idle' && (
            <>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                فایل PDF را اینجا رها کنید
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
                یا برای انتخاب از دستگاه کلیک کنید — حداکثر ۵۰ مگابایت
              </p>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 transition">
                انتخاب فایل
              </span>
            </>
          )}

          {busy && (
            <>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 truncate max-w-full px-4">
                {fileName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {stage === 'uploading' && 'در حال آپلود و پردازش فایل...'}
                {stage === 'summarizing' && 'در حال تولید خلاصه هوشمند — این ممکن است کمی طول بکشد...'}
              </p>
              <div className="w-full max-w-sm h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    stage === 'summarizing'
                      ? 'bg-gradient-to-l from-amber-500 to-amber-400'
                      : 'bg-gradient-to-l from-brand-500 to-indigo-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                {progress}٪
              </p>
            </>
          )}

          {stage === 'error' && (
            <>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">
                {chatId ? 'خلاصه‌سازی ناموفق بود' : 'خطا در پردازش سند'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-md px-4">
                {error}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {chatId ? (
                  <>
                    <button
                      onClick={retrySummary}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      تلاش مجدد برای خلاصه‌سازی
                    </button>
                    <button
                      onClick={reset}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                    >
                      آپلود سند جدید
                    </button>
                  </>
                ) : (
                  <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
                  >
                    تلاش مجدد
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </label>

      {stage === 'error' && error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
