'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CloudUpload, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

type Stage = 'idle' | 'uploading' | 'summarizing' | 'done' | 'error';

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
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

      if (!res.ok) throw new Error('خلاصه‌سازی ناموفق بود');
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
      await runSummary(cid);
    } catch (e: any) {
      setError(e.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.');
      setStage('error');
    }
  };

  const retrySummary = async () => {
    if (!chatId) { reset(); return; }
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
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-4 sm:p-8">
      <label
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={onDrop}
        className={`block rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center transition cursor-pointer ${
          dragging
            ? 'border-gold-500 bg-gold-50/50 dark:bg-gold-900/10'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-gold-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
        } ${busy ? 'cursor-wait' : ''}`}
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
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors ${
            stage === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
              : stage === 'summarizing'
              ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-600'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-gold-500'
          }`}>
            {stage === 'uploading' && <Loader2 className="w-8 h-8 animate-spin text-brand-cobalt" />}
            {stage === 'summarizing' && <RefreshCw className="w-8 h-8 animate-spin" />}
            {stage === 'error' && <AlertCircle className="w-8 h-8" />}
            {(stage === 'idle' || stage === 'done') && <CloudUpload className="w-10 h-10 stroke-[1.5]" />}
          </div>

          {stage === 'idle' && (
            <>
              <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">
                فایل PDF را اینجا رها کنید
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                یا برای انتخاب از دستگاه کلیک کنید — حداکثر ۵۰ مگابایت
              </p>
              <span className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gold-500 hover:bg-gold-600 text-black text-sm font-bold shadow-lg shadow-gold-500/20 transition active:scale-95">
                انتخاب فایل
              </span>
            </>
          )}

          {busy && (
            <>
              <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-1 truncate max-w-full px-4">
                {fileName}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                {stage === 'uploading' && 'در حال آپلود و پردازش فایل...'}
                {stage === 'summarizing' && 'در حال تولید خلاصه هوشمند...'}
              </p>
              <div className="w-full max-w-sm h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    stage === 'summarizing'
                      ? 'bg-gradient-to-l from-gold-500 to-gold-400'
                      : 'bg-brand-cobalt'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2">
                {progress}٪
              </p>
            </>
          )}

          {stage === 'error' && (
            <>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">
                {chatId ? 'خلاصه‌سازی ناموفق بود' : 'خطا در پردازش سند'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 max-w-md px-4">
                {error}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {chatId ? (
                  <>
                    <button
                      onClick={(e) => { e.preventDefault(); retrySummary(); }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-cobalt hover:bg-brand-cobaltHover text-white text-xs font-bold transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      تلاش مجدد
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); reset(); }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition"
                    >
                      سند جدید
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.preventDefault(); reset(); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-cobalt hover:bg-brand-cobaltHover text-white text-xs font-bold transition"
                  >
                    تلاش مجدد
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
