'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const params = useSearchParams();
  const errorParam = params.get('error');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam ?? null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        // Explicit scopes help Supabase's server exchange the code with Google
        scopes: 'openid email profile',
        // Force PKCE flow which is more reliable with @supabase/ssr
        flowType: 'pkce',
        queryParams: { prompt: 'select_account' },
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const friendly = (raw: string | null) => {
    if (!raw) return null;
    if (raw === 'no_code') return 'پاسخ گوگل ناقص بود. لطفاً دوباره تلاش کنید.';
    if (raw === 'auth_failed') return 'ورود ناموفق بود. لطفاً دوباره تلاش کنید.';
    if (raw.toLowerCase().includes('unable to exchange')) {
      return 'سرور احراز هویت قادر به تکمیل ورود نیست. لطفاً یک دقیقه صبر کنید و دوباره تلاش کنید.';
    }
    if (raw.toLowerCase().includes('code verifier')) {
      return 'کوکی‌های مرورگر اجازه ورود نمی‌دهند. کوکی‌ها را برای این سایت فعال کنید.';
    }
    return raw;
  };

  const shownError = friendly(error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">R10-Docs</span>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">دستیار هوشمند خوانش اسناد</span>
          </div>
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-8 sm:p-10">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">خوش آمدید</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
            برای ذخیره سوابق گفتگو و اسناد خود، با حساب گوگل وارد شوید.
          </p>

          {shownError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span dir="auto" className="break-all">{shownError}</span>
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال اتصال به گوگل...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>ورود با حساب گوگل</span>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
              با ورود، شما با{' '}
              <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">شرایط و قوانین</a>{' '}
              و{' '}
              <a href="#" className="text-brand-600 dark:text-brand-400 hover:underline">سیاست حریم خصوصی</a>{' '}
              موافقت می‌کنید.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
            ← بازگشت به صفحه اصلی
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
