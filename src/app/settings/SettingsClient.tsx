'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePrefs, savePrefs } from '@/lib/preferences';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { User, CreditCard, Sliders, Shield, Bell, ChevronLeft, ArrowRight, Sun, Moon, Monitor, Check } from 'lucide-react';

type Tab = 'profile' | 'subscription' | 'preferences' | 'security' | 'notifications';

export function SettingsClient({ email, phone }: { email: string; phone: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const prefs = usePrefs();

  const panelTitles = {
    profile: 'اطلاعات حساب',
    subscription: 'اشتراک و مصرف',
    preferences: 'تنظیمات ظاهری',
    security: 'امنیت و حریم خصوصی',
    notifications: 'اعلان‌ها'
  };

  const openPanel = (tab: Tab) => {
    setActiveTab(tab);
    setMobileView('detail');
  };

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark text-neutral-900 dark:text-neutral-100 antialiased min-h-[100dvh] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-header border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3 group">
            <DocwizeLogo className="w-8 h-8 text-gold-500 group-hover:scale-105 transition-transform" />
            <span className="font-black text-xl tracking-tight hidden sm:block">Docwize</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <Link href="/chat" className="hover:text-neutral-900 dark:hover:text-white transition">داشبورد</Link>
            <Link href="/pricing" className="hover:text-neutral-900 dark:hover:text-white transition">پلن‌ها</Link>
            <Link href="/settings" className="text-neutral-900 dark:text-white font-bold transition">تنظیمات</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-9 h-9 rounded-full bg-brand-cobalt dark:bg-brand-blue text-white flex items-center justify-center text-xs font-black shrink-0 border border-neutral-300 dark:border-neutral-600 shadow-sm">
              {email[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Mobile List View */}
        <div className={`w-full md:hidden flex-col gap-3 ${mobileView === 'list' ? 'flex' : 'hidden'}`}>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-2 px-1">تنظیمات</h1>
          
          {[
            { id: 'profile', icon: User, title: 'اطلاعات حساب', desc: 'نام، ایمیل و تصویر پروفایل' },
            { id: 'subscription', icon: CreditCard, title: 'اشتراک و مصرف', desc: 'مدیریت پلن و سهمیه پردازش' },
            { id: 'preferences', icon: Sliders, title: 'تنظیمات ظاهری', desc: 'تم رنگی و تنظیمات چیدمان' },
            { id: 'security', icon: Shield, title: 'امنیت و حریم خصوصی', desc: 'رمز عبور و حذف اسناد' },
            { id: 'notifications', icon: Bell, title: 'اعلان‌ها', desc: 'مدیریت ایمیل‌ها و اطلاع‌رسانی' },
          ].map(item => (
            <div key={item.id} onClick={() => openPanel(item.id as Tab)} className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center justify-between cursor-pointer shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{item.title}</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-neutral-400" />
            </div>
          ))}
        </div>

        {/* Desktop Sidebar */}
        <aside className={`w-64 shrink-0 flex-col gap-1 ${mobileView === 'list' ? 'hidden md:flex' : 'hidden md:flex'}`}>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 px-2">تنظیمات</h1>
          {[
            { id: 'profile', icon: User, title: 'اطلاعات حساب' },
            { id: 'subscription', icon: CreditCard, title: 'اشتراک و مصرف' },
            { id: 'preferences', icon: Sliders, title: 'تنظیمات ظاهری' },
            { id: 'security', icon: Shield, title: 'امنیت و حریم خصوصی' },
            { id: 'notifications', icon: Bell, title: 'اعلان‌ها' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)}
              className={`flex items-center gap-3 w-full text-right px-4 py-3.5 rounded-xl text-sm transition-all ${
                activeTab === item.id
                  ? 'bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 border border-transparent font-medium'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-gold-500' : ''}`} /> {item.title}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className={`flex-1 w-full bg-transparent md:bg-white dark:md:bg-[#171717] rounded-none md:rounded-3xl border-0 md:border md:border-neutral-200 dark:md:border-neutral-800 shadow-none md:shadow-sm overflow-hidden relative min-h-[500px] ${mobileView === 'detail' ? 'block' : 'hidden md:block'}`}>
          
          <div className="md:hidden flex flex-col items-start px-4 pt-6 pb-2">
            <button onClick={() => setMobileView('list')} className="flex items-center gap-1.5 text-sm font-bold text-brand-cobalt dark:text-brand-blue hover:opacity-80 transition mb-8">
              <ArrowRight className="w-4 h-4" /> بازگشت به تنظیمات
            </button>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white w-full mb-1">{panelTitles[activeTab]}</h2>
          </div>

          {/* PROFILE PANEL */}
          <div className={`p-4 md:p-8 ${activeTab === 'profile' ? 'block' : 'hidden'}`}>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">مشخصات پایه حساب کاربری خود را مدیریت کنید.</p>
            
            <div className="flex flex-col items-center justify-center text-center sm:flex-row sm:items-center sm:justify-start sm:text-right gap-5 mb-8 bg-white dark:bg-[#1A1A1A] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-brand-cobalt dark:bg-brand-blue text-white flex items-center justify-center text-3xl font-black shrink-0 shadow-sm">
                {email[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <button className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-xl transition mb-2 border border-neutral-200 dark:border-neutral-700 shadow-sm">تغییر تصویر</button>
                <p className="text-[11px] text-neutral-500">فرمت‌های مجاز: JPG, PNG.</p>
              </div>
            </div>

            <form className="space-y-6 max-w-xl" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2">نام و نام خانوادگی</label>
                  <input type="text" placeholder="نام شما" className="w-full bg-white dark:bg-[#1A1A1A] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-brand-cobalt" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2">شماره موبایل</label>
                  <input type="text" value={phone || 'ثبت نشده'} dir="ltr" readOnly className="w-full bg-neutral-100 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm rounded-xl px-4 py-3 outline-none cursor-not-allowed text-left" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-2">ایمیل</label>
                <input type="email" value={email} dir="ltr" readOnly className="w-full bg-neutral-100 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm rounded-xl px-4 py-3 outline-none cursor-not-allowed text-left" />
              </div>
              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 mt-8 flex justify-end">
                <button type="submit" className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold text-sm rounded-xl transition shadow-sm w-full md:w-auto">ذخیره تغییرات</button>
              </div>
            </form>
          </div>

          {/* SUBSCRIPTION PANEL */}
          <div className={`p-4 md:p-8 ${activeTab === 'subscription' ? 'block' : 'hidden'}`}>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">وضعیت پلن و میزان استفاده خود را بررسی کنید.</p>
            <div className="bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 mb-1">پلن فعلی شما</p>
                  <p className="text-lg font-bold text-neutral-900 dark:text-white">پلن رایگان</p>
                </div>
                <Link href="/pricing" className="px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-black font-bold text-sm rounded-xl transition shadow-sm text-center">ارتقا به حرفه‌ای</Link>
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-neutral-600 dark:text-neutral-300">مصرف صفحات پردازش‌شده</span>
                  <span className="text-neutral-900 dark:text-white dir-ltr">۱۵ / ۵۰ صفحه</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5">
                  <div className="bg-brand-cobalt dark:bg-brand-blue h-2.5 rounded-full" style={{ width: '30%' }}></div>
                </div>
                <p className="text-[11px] text-neutral-500 mt-2">۳۵ صفحه دیگر تا پایان ماه باقی مانده است.</p>
              </div>
            </div>
          </div>

          {/* PREFERENCES PANEL */}
          <div className={`p-4 md:p-8 ${activeTab === 'preferences' ? 'block' : 'hidden'}`}>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">ظاهر برنامه را شخصی‌سازی کنید.</p>
            <div className="space-y-8 max-w-xl">
              
              <div>
                <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-3">حالت نمایش</label>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => document.documentElement.classList.remove('dark')} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-neutral-600 dark:text-neutral-400 hover:border-brand-cobalt transition"><Sun className="w-5 h-5" /><span className="text-xs font-medium">روشن</span></button>
                  <button onClick={() => document.documentElement.classList.add('dark')} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-neutral-600 dark:text-neutral-400 hover:border-brand-cobalt transition"><Moon className="w-5 h-5" /><span className="text-xs font-medium">تیره</span></button>
                  <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-neutral-600 dark:text-neutral-400 hover:border-brand-cobalt transition"><Monitor className="w-5 h-5" /><span className="text-xs font-medium">سیستم</span></button>
                </div>
              </div>

              {/* SEND BUTTON POSITION (NEW) */}
              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-sm font-bold text-neutral-900 dark:text-white mb-3">محل دکمه ارسال</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => savePrefs({ sendSide: 'left' })} className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition ${prefs.sendSide === 'left' ? 'border-brand-cobalt bg-brand-cobalt/5 dark:bg-brand-cobalt/20 text-brand-cobalt dark:text-blue-300 font-bold' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-neutral-500 font-medium'}`}>
                    {prefs.sendSide === 'left' && <Check className="w-4 h-4" />} چپ
                  </button>
                  <button onClick={() => savePrefs({ sendSide: 'right' })} className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition ${prefs.sendSide === 'right' ? 'border-brand-cobalt bg-brand-cobalt/5 dark:bg-brand-cobalt/20 text-brand-cobalt dark:text-blue-300 font-bold' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1A] text-neutral-500 font-medium'}`}>
                    {prefs.sendSide === 'right' && <Check className="w-4 h-4" />} راست
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <label className="block text-xs font-semibold text-neutral-500 mb-2">زبان پیش‌فرض پاسخ‌دهی هوش مصنوعی</label>
                <select disabled className="w-full bg-neutral-100 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 text-neutral-500 text-sm rounded-xl px-4 py-3 outline-none cursor-not-allowed">
                  <option>فارسی (به زودی)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECURITY PANEL */}
          <div className={`p-4 md:p-8 ${activeTab === 'security' ? 'block' : 'hidden'}`}>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">حساب خود را امن نگه دارید.</p>
            <div className="space-y-8 max-w-xl">
              <div className="pt-6 mt-6 border-t border-red-100 dark:border-red-900/30">
                <h3 className="text-sm font-bold text-red-500 mb-2">منطقه خطر</h3>
                <p className="text-xs text-neutral-500 mb-4">با حذف حساب کاربری، تمام اسناد و تاریخچه شما برای همیشه پاک می‌شود.</p>
                <button className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white text-sm font-bold rounded-xl transition">حذف کامل حساب</button>
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS PANEL */}
          <div className={`p-4 md:p-8 ${activeTab === 'notifications' ? 'block' : 'hidden'}`}>
             <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">مدیریت کنید چه زمانی با شما تماس بگیریم.</p>
             <div className="space-y-6 max-w-xl">
                <div className="flex items-center justify-between pb-6 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">پایان پردازش سند</p>
                    <p className="text-xs text-neutral-500">وقتی هوش مصنوعی آنالیز یک سند را تمام کرد، ایمیل دریافت کنید.</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-gold-500" defaultChecked />
                </div>
                <div className="flex items-center justify-between pb-6 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">خبرنامه و آپدیت‌ها</p>
                    <p className="text-xs text-neutral-500">دریافت ایمیل‌های مربوط به قابلیت‌های جدید Docwize.</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5 accent-gold-500" />
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
