import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { UserTicketChat } from './UserTicketChat';

export default async function UserTicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  return <UserTicketChat ticket={ticket} initialMessages={messages || []} email={user.email || ''} />;
}
