import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { Loader2, MessageSquare, CheckCircle, PlusCircle, ArrowLeft } from 'lucide-react';
import { SupportForm } from './SupportForm';

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch real ticket counts from the database
  const { data: tickets } = await supabase
    .from('tickets')
    .select('status')
    .eq('user_id', user.id);

  const total = tickets?.length || 0;
  const progress = tickets?.filter(t => t.status === 'progress').length || 0;
  const awaiting = tickets?.filter(t => t.status === 'awaiting').length || 0;
  const closed = tickets?.filter(t => t.status === 'closed').length || 0;

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark min-h-screen">
<AppHeader email={user.email || ''} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black mb-2">مرکز پشتیبانی</h1>
          <p className="text-sm text-neutral-500">وضعیت تیکت‌های خود را بررسی کنید یا تیکت جدیدی ثبت نمایید.</p>
        </div>

        {/* Real Data Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
           <Link href="/support/tickets?filter=all" className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex justify-between shadow-sm">
             <span className="text-sm font-bold">کل تیکت‌ها</span>
             <span className="font-black">{total}</span>
           </Link>
           <Link href="/support/tickets?filter=progress" className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex justify-between shadow-sm">
             <span className="text-sm font-bold text-brand-cobalt">در حال بررسی</span>
             <span className="font-black text-brand-cobalt">{progress}</span>
           </Link>
           <Link href="/support/tickets?filter=awaiting" className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex justify-between shadow-sm">
             <span className="text-sm font-bold text-gold-500">منتظر پاسخ شما</span>
             <span className="font-black text-gold-500">{awaiting}</span>
           </Link>
           <Link href="/support/tickets?filter=closed" className="bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex justify-between shadow-sm">
             <span className="text-sm font-bold text-neutral-500">بسته شده</span>
             <span className="font-black text-neutral-500">{closed}</span>
           </Link>
        </div>

        {/* New Ticket Form */}
        <div className="bg-white dark:bg-[#171717] rounded-3xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-gold-500" /> ثبت تیکت جدید</h2>
          <SupportForm />
        </div>
      </main>
    </div>
  );
}
