import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { PaymentResultClient } from './PaymentResultClient';

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ status?: string, tracking?: string }> }) {
  const { status, tracking } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark min-h-screen flex flex-col">
      <AppHeader email={user.email || ''} />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-10 flex flex-col justify-center">
        <PaymentResultClient status={status || 'failed'} tracking={tracking || ''} />
      </main>
      <AppFooter />
    </div>
  );
}
