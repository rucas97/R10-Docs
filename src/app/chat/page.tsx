import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/SignOutButton';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">ورود موفق</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">اتصال به حساب گوگل برقرار شد</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 mb-6">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">حساب کاربری:</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all" dir="ltr">
            {user.email}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900 mb-6">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <p className="text-xs text-brand-800 dark:text-brand-300 leading-relaxed">
              محیط گفتگو با PDF در مرحله بعدی ساخته می‌شود. این صفحه تأیید می‌کند که احراز هویت با موفقیت کار می‌کند.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/"
            className="flex-1 text-center px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold transition"
          >
            صفحه اصلی
          </Link>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
