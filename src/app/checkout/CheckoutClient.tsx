'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CreditCard, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function CheckoutClient({ planId }: { planId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const amount = 1000; // Fixed for testing as requested

  const planName = planId === 'enterprise' ? 'پلن سازمانی' : 'پلن حرفه‌ای';


  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, amount })
      });
      if (res.ok) {
        window.location.href = `/payment-result?status=success&tracking=SIM-${Date.now()}`;
      } else {
        alert('خطا در شبیه‌سازی');
        setLoading(false);
      }
    } catch (e) {
      alert('خطا در شبکه');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, amount })
      });
      const data = await res.json();
      if (data.redirect) {
        window.location.href = data.redirect; // Redirect to gateway
      } else {
        alert(data.error || 'خطا در اتصال به درگاه');
        setLoading(false);
      }
    } catch (e) {
      alert('خطا در شبکه');
      setLoading(false);
    }
  };

  return (
    <>
      <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 hover:text-neutral-900 mb-6 w-fit">
        <ArrowRight className="w-4 h-4" /> بازگشت به لیست پلن‌ها
      </Link>

      <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-6 text-center">تکمیل خرید</h1>
        
        <div className="bg-neutral-100 dark:bg-[#1A1A1A] rounded-2xl p-5 mb-6 border border-neutral-300 dark:border-neutral-800">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">خلاصه سفارش</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center"><span className="text-neutral-600 dark:text-neutral-400">پلن انتخابی:</span><span className="font-bold text-neutral-900 dark:text-white">{planName}</span></div>
            <div className="flex justify-between items-center pt-3 border-t border-neutral-300 dark:border-neutral-700"><span className="text-neutral-600 dark:text-neutral-400">مبلغ پلن:</span><span className="font-medium text-neutral-900 dark:text-white dir-ltr">{amount.toLocaleString('fa-IR')} تومان</span></div>
          </div>
        </div>

        <div className="flex justify-between items-end mb-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <span className="text-base font-bold text-neutral-900 dark:text-white">مبلغ قابل پرداخت:</span>
          <div className="flex items-baseline gap-1"><span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white dir-ltr">{amount.toLocaleString('fa-IR')}</span><span className="text-sm font-medium text-neutral-500">تومان</span></div>
        </div>

        <button onClick={handlePayment} disabled={loading} className="w-full py-4 rounded-xl bg-gold-500 text-black font-bold text-base hover:bg-gold-600 transition shadow-sm flex items-center justify-center gap-2 mb-4 disabled:opacity-50">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
          {loading ? 'در حال انتقال...' : 'انتقال به درگاه پرداخت'}
        </button>
        
        <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mb-6">
          <Lock className="w-3.5 h-3.5" /><span>پرداخت امن از طریق درگاه آقای پرداخت</span>
        </div>

        <button onClick={handleSimulate} disabled={loading} className="w-full py-3 rounded-xl bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-sm hover:bg-green-500/20 transition flex items-center justify-center gap-2">
          شبیه‌سازی پرداخت موفق (تست)
        </button>
      </div>
    </>
  );
}
