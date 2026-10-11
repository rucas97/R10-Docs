import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950" dir="rtl">
      <div className="w-full max-w-md text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">۴۰۴</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          صفحه‌ای که دنبالش بودید پیدا نشد.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
