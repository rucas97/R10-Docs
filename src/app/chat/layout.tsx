import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/chat/AppShell';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: chats } = await supabase
    .from('chats')
    .select('id, title, updated_at, is_pinned, pinned_at')
    .order('is_pinned', { ascending: false })
    .order('pinned_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });

  return (
    <AppShell
      user={{ email: user.email ?? '', id: user.id }}
      chats={chats ?? []}
    >
      {children}
    </AppShell>
  );
}
