import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: chat } = await supabase
    .from('chats')
    .select('id, file_name, page_count')
    .eq('id', id)
    .single();
  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

  // Delete all messages
  const { error: delErr } = await supabase.from('messages').delete().eq('chat_id', id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  // Re-insert the greeting
  await supabase.from('messages').insert({
    chat_id: id,
    role: 'assistant',
    content: `سند «${chat.file_name ?? 'بدون نام'}» (${chat.page_count ?? 0} صفحه) بررسی شد. هر سؤالی دارید بپرسید.`,
  });

  await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', id);

  return NextResponse.json({ ok: true });
}
