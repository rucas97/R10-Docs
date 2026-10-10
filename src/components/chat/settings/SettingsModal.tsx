'use client';

import { useEffect, useState } from 'react';
import { X, Check, Send, Languages } from 'lucide-react';
import { loadPrefs, savePrefs, usePrefs, type Prefs } from '@/lib/preferences';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const prefs = usePrefs();
  const [local, setLocal] = useState<Prefs>(prefs);

  useEffect(() => { setLocal(prefs); }, [prefs]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    savePrefs(patch);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">تنظیمات</p>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              محل دکمه ارسال
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => update({ sendSide: 'left' })}
                className={`px-4 py-3 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 ${
                  local.sendSide === 'left'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {local.sendSide === 'left' && <Check className="w-3.5 h-3.5" />}
                <span>چپ</span>
              </button>
              <button
                onClick={() => update({ sendSide: 'right' })}
                className={`px-4 py-3 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 ${
                  local.sendSide === 'right'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {local.sendSide === 'right' && <Check className="w-3.5 h-3.5" />}
                <span>راست</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
              انتخاب کنید که دکمه ارسال در کادر گفتگو در سمت چپ یا راست قرار بگیرد.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Languages className="w-3 h-3" />
              تنظیمات بیشتر به‌زودی...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
