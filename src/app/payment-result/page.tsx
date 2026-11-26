import { createClient } from '@/lib/supabase/server';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { PaymentResultClient } from './PaymentResultClient';

export default async function PaymentResultPage({
  searchParams,
}: { searchParams: Promise<{ status?: string, tracking?: string }> }) {
  const { status, tracking } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Do NOT redirect on missing user. The receipt is derived entirely from
  // URL params (status, tracking), so it can render even when the session
  // cookie is dropped on the cross-site gateway return hop.
  const email = user?.email || '';

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark min-h-screen flex flex-col">
      <AppHeader email={email} />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-10 flex flex-col justify-center">
        <PaymentResultClient status={status || 'failed'} tracking={tracking || ''} />
      </main>
      <AppFooter />
    </div>
  );
}
