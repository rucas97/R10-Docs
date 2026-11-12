'use client';

import Link from 'next/link';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Check, X, MessageSquare } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="bg-neutral-100 dark:bg-surface-canvasDark text-neutral-900 dark:text-neutral-100 antialiased min-h-[100dvh] flex flex-col selection:bg-gold-500 selection:text-black">
      <header className="sticky top-0 z-50 glass-header border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3 group">
            <DocwizeLogo className="w-8 h-8 text-gold-500 group-hover:scale-105 transition-transform" />
            <span className="font-black text-xl tracking-tight hidden sm:block">Docwize</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <Link href="/chat" className="hover:text-neutral-900 dark:hover:text-white transition">داشبورد</Link>
            <Link href="/pricing" className="text-neutral-900 dark:text-white font-bold transition">پلن‌ها</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/settings" className="w-9 h-9 rounded-full bg-brand-cobalt dark:bg-brand-blue text-white flex items-center justify-center text-xs font-black shrink-0 border border-neutral-300 dark:border-neutral-600 shadow-sm">
              S
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col items-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white mb-4">پلن مناسب خود را انتخاب کنید</h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
            با هر نیاز و بودجه‌ای، Docwize ابزارهایی را برای سرعت بخشیدن به تحلیل اسناد شما فراهم می‌کند.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-8 w-full max-w-6xl items-center">
          {/* Basic Plan */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-3xl p-6 sm:p-8 flex flex-col h-full shadow-sm relative">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">پلن پایه</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">برای شروع و تست کردن قابلیت‌های هوش مصنوعی.</p>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">۰</span>
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">تومان / ماه</span>
            </div>
            <Link href="/login" className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-sm text-center hover:bg-gold-600 transition shadow-sm mb-8">شروع رایگان</Link>
            <ul className="space-y-4 text-sm flex-1">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">۵۰ صفحه پردازش در ماه</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">حداکثر حجم فایل ۱۰ مگابایت</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">پشتیبانی از PDF و DOCX</span></li>
              <li className="flex items-start gap-2 opacity-50"><X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" /><span className="text-neutral-500 dark:text-neutral-400">خوانش دست‌نویس (OCR)</span></li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-gold-500 rounded-3xl p-6 sm:p-8 flex flex-col h-full shadow-xl relative md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold-500 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-sm">محبوب‌ترین انتخاب</div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">پلن حرفه‌ای</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">برای کاربران جدی، پژوهشگران و متخصصان.</p>
            <div className="mb-6 flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">۱۹۹,۰۰۰</span>
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">تومان / ماه</span>
              </div>
            </div>
            <button className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-sm hover:bg-gold-600 transition shadow-sm mb-8">ارتقا به حرفه‌ای</button>
            <ul className="space-y-4 text-sm flex-1">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300 font-medium">۱۰۰۰ صفحه پردازش در ماه</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">حداکثر حجم فایل ۵۰ مگابایت</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">پشتیبانی کامل از فرمت‌ها</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">خوانش دست‌نویس (OCR) پیشرفته</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">پشتیبانی اولویت‌دار</span></li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-3xl p-6 sm:p-8 flex flex-col h-full shadow-sm relative">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">پلن سازمانی</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">برای تیم‌های حقوقی، شرکت‌ها و دانشگاه‌ها.</p>
            <div className="mb-6 flex items-center h-[48px] sm:h-[56px]">
              <span className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">با پشتیبانی ارتباط بگیرید</span>
            </div>
            <button className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-sm hover:bg-gold-600 transition shadow-sm mb-8">درخواست دمو</button>
            <ul className="space-y-4 text-sm flex-1">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">پردازش صفحات نامحدود</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">حجم فایل نامحدود</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">فضای کاری تیمی</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /><span className="text-neutral-700 dark:text-neutral-300">دسترسی به API اختصاصی</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-20 w-full max-w-3xl text-center">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">سوالی درباره پلن‌ها دارید؟</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">اگر مطمئن نیستید کدام پلن برای شما مناسب است، با ما در ارتباط باشید.</p>
          <button className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-[#1E1E1E] border border-neutral-300 dark:border-neutral-700 text-brand-cobalt dark:text-brand-blue font-bold text-sm shadow-md transition-all">
            <MessageSquare className="w-4 h-4" />
            گفتگو با پشتیبانی
          </button>
        </div>
      </main>
    </div>
  );
}
