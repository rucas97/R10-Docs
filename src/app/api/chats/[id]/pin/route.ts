import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MAX_PINS = 4;

async function getUserChat(supabase: any, id: string, userId: string) {
  const { data } = await supabase
    .from('chats')
    .select('id, is_pinned')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  return data;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const chat = await getUserChat(supabase, id, user.id);
  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  if (chat.is_pinned) return NextResponse.json({ ok: true, already: true });

  const { count } = await supabase
    .from('chats')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_pinned', true);

  if ((count ?? 0) >= MAX_PINS) {
    return NextResponse.json(
      { error: `حداکثر ${MAX_PINS} گفتگو را می‌توانید پین کنید.` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('chats')
    .update({ is_pinned: true, pinned_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('chats')
    .update({ is_pinned: false, pinned_at: null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
