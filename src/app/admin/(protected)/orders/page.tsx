import { createClient } from '@supabase/supabase-js';

export default async function AdminOrders() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: transactions } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">سفارشات و تراکنش‌ها</h1>
      <div className="bg-[#171717] border border-[#333] rounded-2xl overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-[#1A1A1A] border-b border-[#333] text-neutral-400">
            <tr>
              <th className="px-6 py-4">شناسه تراکنش</th>
              <th className="px-6 py-4">شناسه کاربر</th>
              <th className="px-6 py-4">پلن</th>
              <th className="px-6 py-4">مبلغ (تومان)</th>
              <th className="px-6 py-4">وضعیت</th>
              <th className="px-6 py-4">تاریخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {transactions?.map(t => (
              <tr key={t.id} className="hover:bg-[#1A1A1A]">
                <td className="px-6 py-4 font-mono text-xs text-neutral-500">{t.authority || t.id.slice(0,8)}</td>
                <td className="px-6 py-4 font-mono text-xs text-neutral-500">{t.user_id.slice(0,8)}...</td>
                <td className="px-6 py-4 font-bold text-white">{t.plan_id}</td>
                <td className="px-6 py-4 font-bold text-white">{t.amount.toLocaleString('fa-IR')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'success' ? 'bg-green-500/10 text-green-500' : t.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-gold-500/10 text-gold-500'}`}>{t.status}</span>
                </td>
                <td className="px-6 py-4 text-neutral-400" dir="ltr">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
