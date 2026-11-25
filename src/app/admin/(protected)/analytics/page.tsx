import { createClient } from '@supabase/supabase-js';
import { AnalyticsClient } from './AnalyticsClient';

export default async function AdminAnalytics() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const [{ count: chatsCount }, { count: msgsCount }, { count: ticketsCount }, { data: transactions }] = await Promise.all([
    supabase.from('chats').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('amount, created_at').eq('status', 'success')
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">آنالیز و آمار</h1>
      <AnalyticsClient 
        chatsCount={chatsCount || 0} 
        msgsCount={msgsCount || 0} 
        ticketsCount={ticketsCount || 0} 
        transactions={transactions || []} 
      />
    </div>
  );
}
