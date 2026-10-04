import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
