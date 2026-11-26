import { createClient } from '@supabase/supabase-js';

export default async function AdminAccounting() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: transactions } = await supabase.from('transactions').select('amount').eq('status', 'success');

  const mrr = transactions?.reduce((acc, t) => acc + t.amount, 0) || 0;
  const arr = mrr * 12;

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">حسابداری و درآمد (Accounting)</h1>
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
      <div className="bg-[#171717] border border-[#333] rounded-2xl p-8 text-center text-neutral-500">
        <p className="text-sm">گزارش‌های Deferred Revenue و Journal Entries به زودی...</p>
      </div>
    </div>
  );
}
