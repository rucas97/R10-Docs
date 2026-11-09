'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { User as UserIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    // Set default theme to dark if no preference
    const stored = localStorage.getItem('docwize_theme');
    if (stored === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUser({ email: data.user.email });
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('docwize_theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  const goChat = () => router.push('/chat');
  const goLogin = () => router.push('/login');

  return (
    <div className="bg-white dark:bg-surface-canvasDark text-neutral-900 dark:text-neutral-100 min-h-screen flex flex-col transition-colors duration-300">

      <header className="sticky top-0 z-40 glass-header border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-3 group">
            <DocwizeLogo className="w-8 h-8 text-gold-500 group-hover:scale-105 transition-transform" />
            <span className="font-black text-xl text-neutral-900 dark:text-white hidden sm:block">Docwize</span>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <a href="#upload" className="hover:text-neutral-900 dark:hover:text-white transition">آپلود سند</a>
            <a href="#features" className="hover:text-neutral-900 dark:hover:text-white transition">امکانات</a>
            <a href="#how-it-works" className="hover:text-neutral-900 dark:hover:text-white transition">مراحل کارکرد</a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition">سوالات متداول</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition active:scale-95 shrink-0"
            >
              {isDark ? '☀' : '☾'}
            </button>
            
            {!user ? (
              <button
                onClick={goLogin}
                className="flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shrink-0"
              >
                <span className="hidden sm:inline text-sm font-bold">ورود به پنل</span>
                <UserIcon className="w-4 h-4 sm:hidden" />
              </button>
            ) : (
              <button
                onClick={goChat}
                title={user.email}
                className="flex items-center justify-center gap-2 sm:px-1.5 sm:py-1.5 rounded-full sm:rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition shrink-0"
              >
                <div className="w-9 h-9 sm:w-7 sm:h-7 rounded-full bg-brand-cobalt text-white flex items-center justify-center text-xs font-black">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-neutral-700 dark:text-neutral-200 max-w-[120px] truncate pr-2">
                  پنل کاربری
                </span>
              </button>
            )}

            <button
              onClick={goChat}
              className="text-xs md:text-sm font-bold px-3 sm:px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-black shadow-sm shadow-gold-500/20 active:scale-95 transition-all shrink-0"
            >
              <span className="hidden sm:inline">آپلود فایل رایگان</span>
              <span className="sm:hidden">آپلود</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-24 flex flex-col">
        <section className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse"></span>
            پشتیبانی کامل از هوش مصنوعی فارسی و بیش از ۵۰ زبان
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white leading-[1.3] tracking-tight">
            با هر سند <span className="text-gold-500">PDF</span> گفتگو کنید
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-500 dark:text-neutral-400 mt-5 max-w-2xl mx-auto leading-relaxed">
            به جای صرف ساعت‌ها زمان برای خواندن مقاله‌ها و گزارش‌های طولانی، سوالاتتان را بپرسید و پاسخ دقیق با ذکر شماره صفحه دریافت کنید.
          </p>
        </section>

        <section id="upload" className="w-full max-w-4xl mx-auto bg-white dark:bg-surface-aiBubbleDark rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex gap-2">
            <button className="flex-1 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm border border-neutral-200/80 dark:border-neutral-700">
              <span className="text-brand-blue">📄</span>
              <span>بارگذاری فایل</span>
            </button>
            <button className="flex-1 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
              <span>🔗</span>
              <span className="hidden sm:inline">آدرس اینترنتی</span>
              <span className="sm:hidden">لینک</span>
            </button>
            <button className="hidden sm:flex flex-1 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold items-center justify-center gap-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
              <span className="text-gold-500">✨</span>
              <span>اسناد نمونه</span>
            </button>
          </div>

          <div className="p-4 sm:p-10">
            <label onClick={goChat} className="block cursor-pointer rounded-3xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-gold-500 dark:hover:border-gold-500 hover:bg-neutral-50 dark:hover:bg-surface-inputDark p-8 sm:p-16 text-center transition group">
              <input type="file" accept=".pdf" className="hidden" />
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-gold-500 mb-6 transition">
                  <span className="text-3xl">☁️</span>
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 group-hover:text-gold-500 transition">
                  فایل PDF خود را اینجا رها کنید
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                  یا با کلیک روی دکمه زیر، فایل مورد نظر خود را از حافظه سیستم یا گوشی انتخاب نمایید
                </p>
                <div className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gold-500 hover:bg-gold-600 text-black text-sm sm:text-base font-bold shadow-lg shadow-gold-500/20 transition active:scale-95">
                  📂 انتخاب فایل از دستگاه
                </div>
              </div>
            </label>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-surface-canvasDark py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-200">
            <DocwizeLogo className="w-5 h-5 text-gold-500" />
            <span>Docwize • دستیار نسل جدید تحلیل اسناد</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-gold-500 transition">شرایط و قوانین</a>
            <a href="#" className="hover:text-gold-500 transition">حریم خصوصی</a>
            <a href="#" className="hover:text-gold-500 transition">پشتیبانی</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
