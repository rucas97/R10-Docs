import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch file path to delete from storage too
  const { data: chat } = await supabase
    .from('chats')
    .select('file_path')
    .eq('id', id)
    .single();

  if (chat?.file_path) {
    await supabase.storage.from('pdfs').remove([chat.file_path]);
  }

  const { error } = await supabase.from('chats').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
