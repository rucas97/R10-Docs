import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'نام الزامی است' }, { status: 400 });
  }

  const { error } = await supabase
    .from('folders')
    .update({ name: name.trim().slice(0, 60) })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Optional query param: ?deleteChats=true to also delete chats inside
  const deleteChats = req.nextUrl.searchParams.get('deleteChats') === 'true';

  if (deleteChats) {
    // Fetch files so we can clean storage
    const { data: chatsToDelete } = await supabase
      .from('chats')
      .select('id, file_path')
      .eq('folder_id', id);

    // Delete from storage first
    for (const c of (chatsToDelete ?? [])) {
      if (c.file_path) {
        await supabase.storage.from('pdfs').remove([c.file_path]).catch(() => {});
      }
    }

    // Delete chats (cascade will delete messages)
    const { error: chatsErr } = await supabase.from('chats').delete().eq('folder_id', id);
    if (chatsErr) return NextResponse.json({ error: chatsErr.message }, { status: 500 });
  } else {
    // Detach chats (set folder_id = null)
    await supabase.from('chats').update({ folder_id: null }).eq('folder_id', id);
  }

  // Delete the folder itself
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, deletedChats: deleteChats });
}
