import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { CheckoutClient } from './CheckoutClient';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark min-h-screen flex flex-col">
      <AppHeader email={user.email || ''} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 flex flex-col">
        <CheckoutClient planId={plan || 'pro'} />
      </main>
      <AppFooter />
    </div>
  );
}
