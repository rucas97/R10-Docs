'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, User, LifeBuoy, CreditCard, Loader2, FileText } from 'lucide-react';
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
        className="w-9 h-9 rounded-full bg-brand-cobalt text-white flex items-center justify-center text-xs font-black hover:opacity-90 transition"
      >
        {(email[0] ?? '?').toUpperCase()}
      </button>

      {open && (
        <div className="absolute top-12 left-0 w-56 bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-[100]">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-[#333] bg-neutral-50 dark:bg-[#1A1A1A]">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-0.5">حساب کاربری</p>
            <p className="text-xs font-bold text-neutral-800 dark:text-white truncate" dir="ltr">
              {email}
            </p>
          </div>

          <Link href="/settings" onClick={() => setOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#222] transition">
            <User className="w-3.5 h-3.5" /> <span>پروفایل و تنظیمات</span>
          </Link>
          
          <Link href="/pricing" onClick={() => setOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#222] transition">
            <CreditCard className="w-3.5 h-3.5" /> <span>پلن و اشتراک</span>
          </Link>
          <Link href="/documents" onClick={() => setOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#222] transition">
            <FileText className="w-3.5 h-3.5" /> <span>اسناد من</span>
          </Link>

          <Link href="/support" onClick={() => setOpen(false)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#222] transition">
            <LifeBuoy className="w-3.5 h-3.5" /> <span>پشتیبانی</span>
          </Link>

          <div className="border-t border-neutral-100 dark:border-[#333]" />

          <button onClick={signOut} disabled={busy} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-60">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />} 
            <span>{busy ? 'در حال خروج...' : 'خروج از حساب'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
