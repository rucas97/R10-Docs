'use client';
import Link from 'next/link';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export function PaymentResultClient({ status, tracking }: { status: string, tracking: string }) {
  const isSuccess = status === 'success';

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-sm text-center">
      {isSuccess ? (
        <>
          <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-6"><CheckCircle className="w-10 h-10 text-green-500" /></div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">پرداخت با موفقیت انجام شد</h1>
          <p className="text-sm text-neutral-500 mb-8">اشتراک شما فعال شد و می‌توانید از تمام قابلیت‌ها استفاده کنید.</p>
          <div className="bg-neutral-100 dark:bg-[#1A1A1A] rounded-2xl p-5 mb-8 text-right border border-neutral-300 dark:border-neutral-800 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">کد رهگیری:</span><span className="font-bold dir-ltr">{tracking}</span></div>
          </div>
          <Link href="/chat" className="block w-full py-3.5 rounded-xl bg-gold-500 text-black font-bold text-sm hover:bg-gold-600 transition">بازگشت به داشبورد</Link>
        </>
      ) : (
        <>
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6"><XCircle className="w-10 h-10 text-red-500" /></div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">پرداخت ناموفق</h1>
          <p className="text-sm text-neutral-500 mb-6">متأسفانه تراکنش انجام نشد.</p>
          <div className="bg-red-500/5 rounded-xl p-4 mb-8 text-right flex items-start gap-3 border border-red-500/20">
            <Info className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400">در صورت کسر مبلغ، تا ۷۲ ساعت آینده به حساب شما بازگردانده می‌شود.</p>
          </div>
          <Link href="/pricing" className="block w-full py-3.5 rounded-xl bg-gold-500 text-black font-bold text-sm hover:bg-gold-600 transition">تلاش مجدد</Link>
        </>
      )}
    </div>
  );
}
