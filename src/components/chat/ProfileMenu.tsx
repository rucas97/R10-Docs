'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ProfileMenu({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const signOut = async () => {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={email}
        className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-black hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        {(email[0] ?? '?').toUpperCase()}
      </button>

      {open && (
        <div className="absolute bottom-10 left-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">حساب کاربری</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" dir="ltr">
              {email}
            </p>
          </div>

          <button
            onClick={() => { setOpen(false); alert('تنظیمات به‌زودی'); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>پروفایل</span>
          </button>

          <button
            onClick={() => { setOpen(false); alert('تنظیمات به‌زودی'); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>تنظیمات</span>
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          <button
            onClick={signOut}
            disabled={busy}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            <span>{busy ? 'در حال خروج...' : 'خروج از حساب'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
