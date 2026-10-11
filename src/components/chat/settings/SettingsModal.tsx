'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Send } from 'lucide-react';
import { usePrefs, savePrefs, type Prefs } from '@/lib/preferences';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const prefs = usePrefs();
  const [local, setLocal] = useState<Prefs>(prefs);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setLocal(prefs); }, [prefs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  const update = (patch: Partial<Prefs>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    savePrefs(patch);
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} dir="rtl">
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">تنظیمات</p>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-brand-600" />
            محل دکمه ارسال
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => update({ sendSide: 'left' })}
              className={`px-4 py-3 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 ${local.sendSide === 'left' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {local.sendSide === 'left' && <Check className="w-3.5 h-3.5" />}
              <span>چپ</span>
            </button>
            <button onClick={() => update({ sendSide: 'right' })}
              className={`px-4 py-3 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 ${local.sendSide === 'right' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {local.sendSide === 'right' && <Check className="w-3.5 h-3.5" />}
              <span>راست</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
