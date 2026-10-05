import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatPanel } from '@/components/chat/ChatPanel';

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: chat } = await supabase
    .from('chats')
    .select('id, title, file_name, page_count, summary, file_path, created_at')
    .eq('id', id)
    .single();

  if (!chat) notFound();

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('chat_id', id)
    .order('created_at', { ascending: true });

  // Signed URL for PDF (1 hour)
  let pdfUrl: string | null = null;
  if (chat.file_path) {
    const { data } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(chat.file_path, 3600);
    pdfUrl = data?.signedUrl ?? null;
  }

  return (
    <ChatPanel
      chat={{
        id: chat.id,
        title: chat.title,
        fileName: chat.file_name ?? chat.title,
        pageCount: chat.page_count ?? 0,
        summary: chat.summary ?? '',
      }}
      pdfUrl={pdfUrl}
      initialMessages={(messages ?? []).map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))}
    />
  );
}
