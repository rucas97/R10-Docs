import { createClient } from '@supabase/supabase-js';
import { AdminTicketChat } from './AdminTicketChat';

export default async function AdminTicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', id).single();
  const { data: messages } = await supabase.from('ticket_messages').select('*').eq('ticket_id', id).order('created_at', { ascending: true });

  if (!ticket) return <div>تیکت یافت نشد</div>;

  return <AdminTicketChat ticket={ticket} initialMessages={messages || []} />;
}
