import { createClient } from '@supabase/supabase-js';
import { OrderTable } from './OrderTable';

export default async function AdminOrders() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Fetch transactions, profiles, and chats to calculate storage
  const [{ data: transactions }, { data: profiles }, { data: chats }] = await Promise.all([
    supabase.from('transactions').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, plan_id'),
    supabase.from('chats').select('user_id, file_size')
  ]);

  // Calculate storage usage per user
  const storageMap: Record<string, number> = {};
  chats?.forEach(c => {
    storageMap[c.user_id] = (storageMap[c.user_id] || 0) + (Number(c.file_size) || 0);
  });

  const profileMap = profiles?.reduce((acc: any, p) => { acc[p.id] = p.plan_id; return acc; }, {}) || {};

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">مدیریت سفارشات و تراکنش‌ها</h1>
      <OrderTable 
        transactions={transactions || []} 
        profileMap={profileMap} 
        storageMap={storageMap} 
      />
    </div>
  );
}
