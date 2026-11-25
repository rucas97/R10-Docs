import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: folder } = await supabase.from('folders').select('is_pinned').eq('id', id).single();
  const newStatus = !folder?.is_pinned;

  await supabase.from('folders').update({ is_pinned: newStatus, pinned_at: newStatus ? new Date().toISOString() : null }).eq('id', id);
  return NextResponse.json({ success: true, is_pinned: newStatus });
}
