import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { DocumentsClient } from './DocumentsClient';

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch real data
  const { data: chats } = await supabase
    .from('chats')
    .select('id, title, file_name, file_size, page_count, created_at, folder_id')
    .order('created_at', { ascending: false });

  const { data: folders } = await supabase
    .from('folders')
    .select('id, name');

  return (
    <div className="bg-surface-canvas dark:bg-surface-canvasDark min-h-screen flex flex-col">
      <AppHeader email={user.email || ''} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col">
        <DocumentsClient chats={chats || []} folders={folders || []} email={user.email || ''} />
      </main>
      <AppFooter />
    </div>
  );
}
