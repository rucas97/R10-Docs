import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { message, role } = await req.json();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Use admin client if sending as admin to bypass RLS
  const db = role === 'admin' 
    ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    : supabase;

  const { data, error } = await db.from('ticket_messages').insert({
    ticket_id: id,
    sender_id: role === 'admin' ? null : user!.id,
    sender_role: role || 'user',
    message
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Update ticket status if user replies
  if (role !== 'admin') {
    await supabase.from('tickets').update({ status: 'progress', updated_at: new Date().toISOString() }).eq('id', id);
  }

  return NextResponse.json({ message: data });
}
