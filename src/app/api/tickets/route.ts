import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, category, priority, description } = await req.json();

  const { data: ticket, error } = await supabase.from('tickets').insert({
    user_id: user.id, subject, category, priority, status: 'progress'
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('ticket_messages').insert({
    ticket_id: ticket.id, sender_id: user.id, sender_role: 'user', message: description
  });

  return NextResponse.json({ ticket });
}
