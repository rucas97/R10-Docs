'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Loader2, MessageSquare, CheckCircle, PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  const router = useRouter();
  const [form, setForm] = useState({ subject: '', category: 'tech', priority: 'medium', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) router.push('/support/tickets');
  };

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark min-h-screen">
      <header className="sticky top-0 z-50 glass-header border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3"><DocwizeLogo className="w-8 h-8 text-gold-500" /><span className="font-black text-xl hidden sm:block">Docwize</span></Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black mb-2">مرکز پشتیبانی</h1>
          <p className="text-sm text-neutral-500">وضعیت تیکت‌های خود را بررسی کنید یا تیکت جدیدی ثبت نمایید.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
           <Link href="/support/tickets?filter=all" className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex justify-between shadow-sm"><span className="text-sm font-bold">کل تیکت‌ها</span><span className="font-black">۴</span></Link>
           <Link href="/support/tickets?filter=progress" className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex justify-between shadow-sm"><span className="text-sm font-bold text-brand-cobalt">در حال بررسی</span><span className="font-black text-brand-cobalt">۱</span></Link>
           <Link href="/support/tickets?filter=awaiting" className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex justify-between shadow-sm"><span className="text-sm font-bold text-gold-500">منتظر پاسخ شما</span><span className="font-black text-gold-500">۱</span></Link>
           <Link href="/support/tickets?filter=closed" className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex justify-between shadow-sm"><span className="text-sm font-bold text-neutral-500">بسته شده</span><span className="font-black text-neutral-500">۲</span></Link>
        </div>

        <div className="bg-white dark:bg-[#171717] rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-gold-500" /> ثبت تیکت جدید</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="موضوع درخواست" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none"><option value="tech">مشکل فنی</option><option value="ai">هوش مصنوعی</option><option value="billing">مالی</option></select>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none"><option value="low">کم</option><option value="medium">متوسط</option><option value="high">بالا</option></select>
            </div>
            <textarea required rows={5} placeholder="شرح درخواست..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
            <button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 rounded-xl transition">ارسال تیکت</button>
          </form>
        </div>
      </main>
    </div>
  );
}
