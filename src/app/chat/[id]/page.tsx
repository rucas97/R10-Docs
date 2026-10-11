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
    .select('id, title, file_name, page_count, summary, file_path, created_at, primary_language, suggested_questions, mindmap')
    .eq('id', id)
    .single();

  if (!chat) notFound();

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at, reply_to_id')
    .eq('chat_id', id)
    .order('created_at', { ascending: true });

  const pdfUrl = chat.file_path ? `/api/pdf/${chat.id}` : null;

  // Build a parent lookup: messageId → { role, content }
  const lookup: Record<string, { role: 'user' | 'assistant'; content: string }> = {};
  for (const m of (messages ?? [])) {
    lookup[m.id] = { role: m.role as 'user' | 'assistant', content: m.content };
  }

  return (
    <ChatPanel
      chat={{
        id: chat.id,
        title: chat.title,
        fileName: chat.file_name ?? chat.title,
        pageCount: chat.page_count ?? 0,
        summary: chat.summary ?? '',
        primaryLanguage: (chat.primary_language as 'fa' | 'en') ?? 'en',
        suggestedQuestions: Array.isArray(chat.suggested_questions)
          ? (chat.suggested_questions as string[])
          : [],
        mindmap: chat.mindmap ?? null,
      }}
      pdfUrl={pdfUrl}
      initialMessages={(messages ?? []).map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        replyToId: m.reply_to_id ?? null,
      }))}
      messageLookup={lookup}
    />
  );
}
