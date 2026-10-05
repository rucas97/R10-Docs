'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CloudUpload, Loader2, AlertCircle } from 'lucide-react';

type Stage = 'idle' | 'uploading' | 'parsing' | 'summarizing' | 'done' | 'error';

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

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
    setStage('uploading');
    setProgress(15);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const t1 = setTimeout(() => { setStage('parsing'); setProgress(45); }, 800);
      const t2 = setTimeout(() => { setStage('summarizing'); setProgress(75); }, 2000);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      clearTimeout(t1); clearTimeout(t2);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }

      const { chatId } = await res.json();
      setProgress(100);
      setStage('done');
      router.push(`/chat/${chatId}`);
    } catch (e: any) {
      setError(e.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.');
      setStage('error');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const busy = stage === 'uploading' || stage === 'parsing' || stage === 'summarizing';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8">
      <label
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={onDrop}
        className={`block rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition ${
          dragging
            ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40'
            : 'border-brand-200 dark:border-brand-800 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-950/30'
        } ${busy ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            {busy
              ? <Loader2 className="w-8 h-8 animate-spin" />
              : <CloudUpload className="w-8 h-8" />}
          </div>

          {!busy && stage !== 'error' && (
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
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 truncate max-w-full">
                {fileName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {stage === 'uploading' && 'در حال آپلود فایل...'}
                {stage === 'parsing' && 'در حال استخراج متن و صفحات...'}
                {stage === 'summarizing' && 'در حال تولید خلاصه هوشمند...'}
              </p>
              <div className="w-full max-w-sm h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-brand-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}

          {stage === 'error' && (
            <>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">
                خطا در پردازش
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{error}</p>
              <button
                onClick={() => { setStage('idle'); setError(null); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
              >
                تلاش مجدد
              </button>
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
