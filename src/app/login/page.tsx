import Link from 'next/link';

export default function LoginPlaceholder() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <h1 className="text-2xl font-black mb-3">ورود با گوگل</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          این صفحه در مرحله بعدی ساخته می‌شود.
        </p>
        <Link href="/" className="text-brand-600 dark:text-brand-400 font-bold text-sm hover:underline">
          ← بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
