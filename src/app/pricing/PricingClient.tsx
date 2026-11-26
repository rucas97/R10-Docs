'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { Check, X, MessageSquare, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function PricingClient({ email }: { email: string }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('plans').select('*').order('price', { ascending: true }).then(({ data }) => {
      if (data && data.length > 0) setPlans(data); else setPlans([{id: 'free', name: 'پلن پایه', price: 0, feature_flags: { max_pages: 50, formats: ['pdf'] }}, {id: 'pro', name: 'پلن حرفه‌ای', price: 1000, feature_flags: { max_pages: 1000, formats: ['pdf', 'docx'], popular: true }}, {id: 'enterprise', name: 'پلن سازمانی', price: 1000, feature_flags: { max_pages: 9999, formats: ['pdf', 'docx', 'xlsx', 'pptx', 'image'], ocr: true }}]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark min-h-screen flex flex-col">
      <AppHeader email={email} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col items-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 dark:text-white mb-4">پلن مناسب خود را انتخاب کنید</h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">با هر نیاز و بودجه‌ای، Docwize ابزارهایی را برای سرعت بخشیدن به تحلیل اسناد شما فراهم می‌کند.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-8 w-full max-w-6xl items-center">
            {plans.map(plan => (
              <div key={plan.id} className={`bg-white dark:bg-[#1E1E1E] border ${plan.feature_flags?.popular ? 'border-2 border-gold-500 shadow-xl md:-translate-y-4' : 'border-neutral-200 dark:border-neutral-700 shadow-sm'} rounded-3xl p-6 sm:p-8 flex flex-col h-full relative`}>
                {plan.feature_flags?.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold-500 text-black text-xs font-black px-4 py-1.5 rounded-full shadow-sm">محبوب‌ترین انتخاب</div>}
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{plan.name}</h3>
                
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">{plan.price.toLocaleString('fa-IR')}</span>
                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">تومان / ماه</span>
                </div>
                
                <Link href={plan.id === 'free' ? '/chat' : `/checkout?plan=${plan.id}`} className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-sm text-center hover:bg-gold-600 transition shadow-sm mb-8">
                  {plan.id === 'free' ? 'شروع رایگان' : 'ارتقا به این پلن'}
                </Link>

                <ul className="space-y-4 text-sm flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">{plan.feature_flags?.max_pages?.toLocaleString('fa-IR') || '۵۰'} صفحه پردازش در ماه</span>
                  </li>
                  
                  {/* Format checkboxes */}
                  {['pdf', 'docx', 'xlsx', 'pptx', 'image'].map(fmt => {
                    const hasFormat = (plan.feature_flags?.formats || ['pdf']).includes(fmt);
                    const labels: any = { pdf: 'PDF', docx: 'Word', xlsx: 'Excel', pptx: 'PowerPoint', image: 'تصویر' };
                    return (
                      <li key={fmt} className={`flex items-start gap-2 ${!hasFormat && 'opacity-50'}`}>
                        {hasFormat ? <Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />}
                        <span className={hasFormat ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500 dark:text-neutral-400'}>پشتیبانی از {labels[fmt]}</span>
                      </li>
                    );
                  })}

                  <li className={`flex items-start gap-2 ${!plan.feature_flags?.ocr && 'opacity-50'}`}>
                    {plan.feature_flags?.ocr ? <Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />}
                    <span className={plan.feature_flags?.ocr ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500'}>خوانش دست‌نویس (OCR)</span>
                  </li>
                  <li className={`flex items-start gap-2 ${!plan.feature_flags?.priority_support && 'opacity-50'}`}>
                    {plan.feature_flags?.priority_support ? <Check className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />}
                    <span className={plan.feature_flags?.priority_support ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-500'}>پشتیبانی اولویت‌دار</span>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
