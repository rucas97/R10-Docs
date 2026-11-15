import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight, Wrench, CreditCard, User, Bot, MessageSquare, CheckCircle } from 'lucide-react';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function UserTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: tickets } = await supabase.from('tickets').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark min-h-screen">
      <header className="sticky top-0 z-50 glass-header border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3"><DocwizeLogo className="w-8 h-8 text-gold-500" /><span className="font-black text-xl hidden sm:block">Docwize</span></Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/support" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 mb-6"><ArrowRight className="w-4 h-4" /> بازگشت به مرکز پشتیبانی</Link>
        <h1 className="text-2xl font-black mb-6">مدیریت تیکت‌ها</h1>
        
        <div className="space-y-3">
          {tickets?.map(t => (
            <Link href={`/support/tickets/${t.id}`} key={t.id} className="block p-5 bg-white dark:bg-[#171717] border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">#{t.id.slice(0,6)}</span>
                  <span className="flex items-center gap-1">{t.category === 'tech' ? <Wrench className="w-3 h-3"/> : <CreditCard className="w-3 h-3"/>} {t.category}</span>
                </div>
                <span className="text-xs font-bold text-gold-500 flex items-center gap-1">مشاهده <ArrowRight className="w-3.5 h-3.5 rotate-180" /></span>
              </div>
              <h3 className="font-bold text-white mb-3">{t.subject}</h3>
              <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs text-neutral-500" dir="ltr">{new Date(t.created_at).toLocaleDateString()}</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${t.status === 'progress' ? 'bg-brand-cobalt/10 text-brand-cobalt' : t.status === 'awaiting' ? 'bg-gold-500/10 text-gold-500' : 'bg-neutral-100 text-neutral-500'}`}>
                  {t.status === 'progress' ? 'در حال بررسی' : t.status === 'awaiting' ? 'منتظر پاسخ شما' : 'بسته شده'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
