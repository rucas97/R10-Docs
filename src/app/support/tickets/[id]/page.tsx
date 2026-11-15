import { createClient } from '@/lib/supabase/server';
import { UserTicketChat } from './UserTicketChat';

export default async function UserTicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).single();
  const { data: messages } = await supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true });

  if (!ticket) return <div>تیکت یافت نشد</div>;

  return <UserTicketChat ticket={ticket} initialMessages={messages || []} />;
}
