'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { createClient } from '@/lib/supabase/client';
import { User as UserIcon } from 'lucide-react';


export default function LandingPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUser({ email: data.user.email });
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('docwize_theme', next ? 'dark' : 'light'); } catch {}
    setIsDark(next);
  };

  const goChat = () => router.push('/chat');
  const goLogin = () => router.push('/login');

  return (
    <div className="bg-white dark:bg-surface-dark text-neutral-900 dark:text-neutral-100 min-h-screen flex flex-col">

      {/* Header */}
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

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition active:scale-95"
              aria-label="تغییر تم"
            >
              {isDark ? '☀' : '☾'}
            </button>
            {!user ? (
              <button
                onClick={goLogin}
                className="hidden sm:inline-flex text-sm font-bold px-4 py-2.5 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                ورود به پنل
              </button>
            ) : (
              <button
                onClick={goChat}
                title={user.email}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-cobaltLight dark:bg-brand-cobalt/20 border border-brand-cobalt/20 hover:bg-brand-cobalt hover:text-white transition group"
              >
                <div className="w-7 h-7 rounded-full bg-brand-cobalt text-white flex items-center justify-center text-xs font-black group-hover:bg-white group-hover:text-brand-cobalt transition">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold text-brand-cobalt dark:text-brand-cobalt max-w-[120px] truncate group-hover:text-white transition">
                  پنل کاربری
                </span>
              </button>
            )}
            <button
              onClick={goChat}
              className="text-xs md:text-sm font-bold px-4 sm:px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-black shadow-sm shadow-gold-500/20 active:scale-95 transition-all"
            >
              <span className="hidden sm:inline">آپلود فایل رایگان</span>
              <span className="sm:hidden">آپلود</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-24 flex flex-col">

        {/* Hero */}
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

        {/* Upload Card */}
        <section id="upload" className="w-full max-w-4xl mx-auto bg-white dark:bg-surface-card rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
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
            <label className="dashed-box rounded-3xl p-8 sm:p-16 text-center cursor-pointer relative bg-neutral-50 dark:bg-neutral-900/30 group block">
              <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={() => goChat()} />
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
                <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-xs font-medium text-neutral-500">
                  <span>✓ فرمت PDF</span>
                  <span>•</span>
                  <span>✓ حداکثر ۵۰MB</span>
                  <span>•</span>
                  <span>🔒 رمزنگاری شده</span>
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mt-24 max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">امکانات محوری پلتفرم</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">طراحی شده برای دانشجویان، پژوهشگران، وکلا و تحلیل‌گران داده</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: '⚡', title: 'خلاصه‌سازی هوشمند', desc: 'استخراج مفاهیم کلیدی و سرفصل‌ها در چند ثانیه.' },
              { icon: '❝', title: 'ارجاع دقیق به صفحه', desc: 'پاسخ‌ها با ارجاع مستقیم به شماره صفحه.' },
              { icon: '🛡', title: 'امنیت و حریم خصوصی', desc: 'اسناد رمزنگاری شده و بدون اشتراک با مدل‌های عمومی.' },
              { icon: '🌐', title: 'پشتیبانی چندزبانه', desc: 'سند انگلیسی آپلود کنید و به فارسی گفتگو نمایید.' },
            ].map((f) => (
              <div key={f.title} className="bg-white dark:bg-surface-card p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 hover:border-gold-500/50 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-brand-blue flex items-center justify-center mb-5 text-2xl group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mt-24 max-w-5xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">چگونه کار می‌کند؟</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '۰۱', title: 'آپلود سند', desc: 'فایل PDF، جزوه، یا مقاله‌تان را آپلود کنید.' },
              { n: '۰۲', title: 'تحلیل و پردازش', desc: 'هوش مصنوعی متن و مراجع سند را آنالیز می‌کند.' },
              { n: '۰۳', title: 'پرسش و پاسخ', desc: 'پاسخ جامع همراه با استناد به صفحه دریافت کنید.' },
            ].map((s) => (
              <div key={s.n} className="bg-neutral-50 dark:bg-surface-card p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-4xl font-black text-neutral-200 dark:text-neutral-800 mb-4">{s.n}</div>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">{s.title}</h4>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-24 max-w-3xl mx-auto w-full mb-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">سوالات پرتکرار</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'آیا استفاده اولیه از Docwize رایگان است؟', a: 'بله، می‌توانید اسناد تا سقف ۵۰ صفحه را بدون پرداخت تست کنید.' },
              { q: 'آیا اسناد من محرمانه باقی می‌مانند؟', a: 'کاملاً. اسناد در سرورهای امن رمزنگاری شده ذخیره می‌شوند و هر زمان می‌توانید آن‌ها را حذف کنید.' },
              { q: 'آیا اسکن‌های فارسی پشتیبانی می‌شوند؟', a: 'بله، موتور OCR هوشمند اسکن‌های باکیفیت را به متن قابل جستجو تبدیل می‌کند.' },
            ].map((f) => (
              <details key={f.q} className="bg-white dark:bg-surface-card p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 group">
                <summary className="cursor-pointer font-bold text-sm text-neutral-900 dark:text-neutral-100 list-none flex items-center justify-between">
                  <span>{f.q}</span>
                  <span className="text-neutral-400 group-open:rotate-180 group-open:text-gold-500 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-surface-dark py-8">
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

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 p-4 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 z-50">
        <button onClick={goChat} className="w-full py-3.5 rounded-xl bg-gold-500 text-black font-bold text-sm shadow-md active:scale-95 transition-transform">
          📤 همین حالا سند خود را آپلود کنید
        </button>
      </div>
    </div>
  );
}
