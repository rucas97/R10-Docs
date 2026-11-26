import { createClient } from '@supabase/supabase-js';

export default async function AdminAccounting() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: transactions } = await supabase.from('transactions').select('amount, plan_id').eq('status', 'success');

  const mrr = transactions?.reduce((acc, t) => acc + t.amount, 0) || 0;
  const arr = mrr * 12;

  // Group by plan
  const byPlan = transactions?.reduce((acc: any, t) => {
    acc[t.plan_id] = (acc[t.plan_id] || 0) + t.amount;
    return acc;
  }, {}) || {};

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">حسابداری و درآمد</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
          <p className="text-sm text-neutral-400 mb-2">درآمد ماهانه (MRR)</p>
          <p className="text-3xl font-black text-green-500">{mrr.toLocaleString('fa-IR')} T</p>
        </div>
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
          <p className="text-sm text-neutral-400 mb-2">درآمد سالانه (ARR)</p>
          <p className="text-3xl font-black text-blue-500">{arr.toLocaleString('fa-IR')} T</p>
        </div>
      </div>

      <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">درآمد به تفکیک پلن</h2>
        <div className="space-y-4">
          {Object.entries(byPlan).map(([plan, amount]: any) => (
            <div key={plan} className="flex justify-between items-center bg-[#0A0A0A] p-4 rounded-xl border border-[#222]">
              <span className="font-bold text-neutral-300 uppercase">{plan}</span>
              <span className="font-black text-white">{amount.toLocaleString('fa-IR')} T</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
