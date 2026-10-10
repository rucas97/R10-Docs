'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles, Sun, Moon, Upload, FileUp, Link as LinkIcon,
  CloudUpload, FolderOpen, Check, Lock, ArrowLeft,
  Stethoscope, Scale, TrendingUp, ChevronLeft, Zap, Quote,
  ShieldCheck, Languages, ChevronDown, Loader2,
  User as UserIcon,
} from 'lucide-react';

type UploadMode = 'file' | 'demo';

export default function LandingPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('file');
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [avatarMenu, setAvatarMenu] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUser({ email: data.user.email });
    });
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState<{ name: string; progress: number } | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('r10_theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  const goToChat = () => router.push('/chat');
  const goToLogin = () => router.push('/login');

  const simulateAndGo = (fileName: string) => {
    setProcessing({ name: fileName, progress: 0 });
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(100, current + 20);
      setProcessing({ name: fileName, progress: current });
      if (current >= 100) {
        clearInterval(t);
        setTimeout(() => router.push('/chat'), 300);
      }
    }, 120);
  };

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      alert('فقط فایل‌های PDF پشتیبانی می‌شوند.');
      return;
    }
    simulateAndGo(f.name);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ==================== HEADER ==================== */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="hidden sm:flex flex-col text-right">
              <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">R10-Docs</span>
              <span className="text-[10px] sm:text-xs text-brand-600 dark:text-brand-400 font-semibold">دستیار هوشمند خوانش اسناد</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#uploadSection" className="hover:text-brand-600 dark:hover:text-brand-400 transition">آپلود سند</a>
            <a href="#featuresSection" className="hover:text-brand-600 dark:hover:text-brand-400 transition">امکانات اصلی</a>
            <a href="#howItWorksSection" className="hover:text-brand-600 dark:hover:text-brand-400 transition">مراحل کارکرد</a>
            <a href="#faqSection" className="hover:text-brand-600 dark:hover:text-brand-400 transition">سوالات متداول</a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={toggleTheme}
              title="تغییر تم"
              aria-label="تغییر تم"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 transition active:scale-90 border border-slate-200 dark:border-slate-700 shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Upload — icon only on mobile, full text on desktop */}
            <button
              onClick={goToChat}
              title="آپلود فایل"
              className="text-xs md:text-sm font-bold w-9 h-9 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white shadow-md shadow-brand-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">آپلود فایل رایگان</span>
            </button>

            {/* Login (signed out) — icon only on mobile */}
            {!user && (
              <button
                onClick={goToLogin}
                title="ورود به پنل"
                className="text-xs md:text-sm font-bold w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 sm:bg-transparent sm:dark:bg-transparent transition flex items-center justify-center gap-2 shrink-0 border border-slate-200 dark:border-slate-700 sm:border-0"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">ورود به پنل</span>
              </button>
            )}

            {/* Avatar (signed in) — opens menu */}
            {user && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setAvatarMenu((v) => !v)}
                  title={user.email}
                  className="w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center text-[11px] font-black transition focus:outline-none"
                >
                  {(user.email[0] ?? '?').toUpperCase()}
                </button>

                {avatarMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAvatarMenu(false)} />
                    <div className="absolute top-12 left-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">حساب کاربری</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" dir="ltr">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={() => { setAvatarMenu(false); goToChat(); }}
                        className="w-full text-right px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        پنل کاربری
                      </button>
                      <button
                        onClick={() => { setAvatarMenu(false); alert('تنظیمات به‌زودی'); }}
                        className="w-full text-right px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        تنظیمات
                      </button>
                      <div className="border-t border-slate-100 dark:border-slate-800" />
                      <button
                        onClick={async () => {
                          setAvatarMenu(false);
                          const { createClient } = await import('@/lib/supabase/client');
                          const supabase = createClient();
                          await supabase.auth.signOut();
                          setUser(null);
                          router.refresh();
                        }}
                        className="w-full text-right px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        خروج از حساب
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16 flex flex-col">
        {/* ==================== HERO ==================== */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold mb-4 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 animate-pulse" />
            پشتیبانی کامل از هوش مصنوعی فارسی و بیش از ۵۰ زبان
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.25] tracking-tight">
            با هر سند <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-300">PDF</span> گفتگو کنید
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">
            به جای صرف ساعت‌ها زمان برای خواندن مقاله‌ها و گزارش‌های طولانی، سوالاتتان را بپرسید و پاسخ دقیق با ذکر شماره صفحه دریافت کنید.
          </p>
        </div>

        {/* ==================== UPLOAD MODULE ==================== */}
        <section
          id="uploadSection"
          className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-brand-500/5 dark:shadow-black/60 border border-slate-200/80 dark:border-slate-800 overflow-hidden relative transition-colors"
        >
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-400/10 dark:bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Tabs */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 grid grid-cols-2 gap-2">
            <button
              onClick={() => setUploadMode('file')}
              className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                uploadMode === 'file'
                  ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>بارگذاری فایل</span>
            </button>
            <button
              onClick={() => setUploadMode('demo')}
              className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                uploadMode === 'demo'
                  ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>اسناد نمونه</span>
            </button>
          </div>

          <div className="p-6 sm:p-10">
            {/* File tab */}
            {uploadMode === 'file' && (
              <label
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`dashed-box rounded-3xl p-8 sm:p-14 text-center cursor-pointer relative bg-brand-50/20 dark:bg-slate-950/20 group block ${isDragging ? 'dragover' : ''}`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white dark:bg-slate-800 shadow-md border border-brand-100 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 group-hover:scale-105 transition-all">
                    <CloudUpload className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.8]" />
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 mb-1.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                    فایل PDF خود را بکشید و اینجا رها کنید
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-md">
                    یا با کلیک روی دکمه زیر، فایل مورد نظر خود را از حافظه دستگاه انتخاب نمایید
                  </p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-500/20 transition active:scale-95">
                    <FolderOpen className="w-4 h-4" />
                    <span>انتخاب فایل از دستگاه</span>
                  </div>
                  <div className="mt-8 flex flex-wrap justify-center items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> فقط فرمت PDF</span>
                    <span className="hidden sm:inline w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> حداکثر تا سقف ۵۰ مگابایت</span>
                    <span className="hidden sm:inline w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Lock className="w-3.5 h-3.5" /> رمزنگاری‌شده و خصوصی
                    </span>
                  </div>
                </div>
              </label>
            )}

            {/* URL tab */}
            
            {/* Demo tab */}
            {uploadMode === 'demo' && (
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                  برای تست فوری، یکی از نمونه‌های زیر را انتخاب کنید:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { name: 'پژوهش پزشکی ۲۰۲۶.pdf', type: 'علمی-پژوهشی • ۱۸ صفحه', Icon: Stethoscope, color: 'purple' },
                    { name: 'قرارداد محرمانگی (NDA).pdf', type: 'حقوقی تجاری • ۸ صفحه', Icon: Scale, color: 'blue' },
                    { name: 'گزارش مالی سالانه.pdf', type: 'تحلیل اقتصادی • ۳۲ صفحه', Icon: TrendingUp, color: 'emerald' },
                  ].map(({ name, type, Icon }) => (
                    <button
                      key={name}
                      onClick={goToChat}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-brand-50/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-right flex flex-col justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">{name}</h4>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">{type}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 group-hover:-translate-x-1 transition-transform">
                        بررسی فوری این سند <ChevronLeft className="w-4 h-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Progress simulation */}
            {processing && (
              <div className="mt-6 p-6 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin" />
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-xs sm:max-w-md">
                      {processing.name}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-brand-700 dark:text-brand-300">
                    {processing.progress.toLocaleString('fa-IR')}٪
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-500 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 h-full transition-all duration-200 rounded-full"
                    style={{ width: `${processing.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                  در حال آماده‌سازی محیط گفتگوی تعاملی...
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ==================== FEATURES ==================== */}
        <section id="featuresSection" className="mt-20 max-w-6xl mx-auto w-full">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">امکانات محوری پلتفرم</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              طراحی شده برای دانشجویان، پژوهشگران، وکلا و تحلیل‌گران داده
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { Icon: Zap, title: 'خلاصه‌سازی هوشمند', desc: 'استخراج مفاهیم کلیدی و سرفصل‌های پرحجم‌ترین کتاب‌ها و پایان‌نامه‌ها در چند ثانیه.', bg: 'brand' },
              { Icon: Quote, title: 'ارجاع دقیق به صفحه', desc: 'تمامی پاسخ‌ها با ارجاع مستقیم به شماره صفحه مربوطه ارائه می‌شوند.', bg: 'blue' },
              { Icon: ShieldCheck, title: 'امنیت و حریم خصوصی', desc: 'اسناد در محیط ایزوله رمزنگاری می‌شوند و بدون اجازه شما در هیچ مدلی آموزش داده نمی‌شوند.', bg: 'emerald' },
              { Icon: Languages, title: 'پشتیبانی چندزبانه', desc: 'یک مقاله انگلیسی یا فرانسوی را آپلود کنید و به فارسی با آن گفتگو کنید.', bg: 'amber' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section id="howItWorksSection" className="mt-20 max-w-5xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">چگونه کار می‌کند؟</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              ساده‌ترین روش برای خواندن و فهمیدن اسناد پرحجم
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '۰۱', title: 'آپلود سند', desc: 'فایل PDF، جزوه، قرارداد یا مقاله مورد نظرتان را آسان آپلود کنید.' },
              { num: '۰۲', title: 'تحلیل و پردازش', desc: 'هوش مصنوعی متن، آمارها و مراجع سند را آنالیز کرده و نمایه دقیقی می‌سازد.' },
              { num: '۰۳', title: 'پرسش و پاسخ', desc: 'مانند یک دستیار متخصص، هر آنچه نیاز دارید را بپرسید و پاسخ بگیرید.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="text-3xl font-black text-brand-600/20 dark:text-brand-400/20 mb-2">{num}</div>
                <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 mb-2">{title}</h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ==================== FAQ ==================== */}
        <section id="faqSection" className="mt-20 max-w-3xl mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">سوالات پرتکرار</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'آیا استفاده اولیه از R10-Docs رایگان است؟', a: 'بله، شما می‌توانید اسناد خود را بدون نیاز به پرداخت و با قابلیت کامل تست کنید.' },
              { q: 'آیا اسناد من محرمانه باقی می‌مانند؟', a: 'کاملاً. اسناد در سرورهای ابری امن با پروتکل رمزنگاری پیشرفته ذخیره می‌شوند و هر زمان می‌توانید آن‌ها را حذف کنید.' },
              { q: 'آیا متون دست‌نویس یا اسکن‌های فارسی هم پشتیبانی می‌شوند؟', a: 'بله، موتور OCR هوشمند به صورت خودکار اسکن‌های باکیفیت را به متن قابل جستجو تبدیل می‌کند.' },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                <summary className="cursor-pointer font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 list-none flex items-center justify-between">
                  <span>{q}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>R10-Docs • دستیار نسل جدید تحلیل اسناد</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition">شرایط و قوانین</a>
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition">حریم خصوصی</a>
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition">پشتیبانی</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
