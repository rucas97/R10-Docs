import { createClient } from '@supabase/supabase-js';
import { Users, CreditCard, FileText, CheckCircle } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const [{ count: userCount }, { count: ticketCount }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'progress'),
    supabase.from('transactions').select('amount').eq('status', 'success')
  ]);

  const totalRevenue = transactions?.reduce((acc, t) => acc + t.amount, 0) || 0;

  const stats = [
    { label: 'کاربران کل', value: userCount || 0, icon: Users, color: 'text-blue-500' },
    { label: 'درآمد کل', value: `${totalRevenue.toLocaleString('fa-IR')} تومان`, icon: CreditCard, color: 'text-green-500' },
    { label: 'تیکت‌های باز', value: ticketCount || 0, icon: FileText, color: 'text-gold-500' },
    { label: 'خرید موفق', value: transactions?.length || 0, icon: CheckCircle, color: 'text-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">داشبورد</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#171717] border border-[#333] rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-neutral-400 mb-2">{s.label}</p>
                <p className="text-xl font-black text-white">{s.value}</p>
              </div>
              <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-[#171717] border border-[#333] rounded-2xl p-6 h-80 flex flex-col justify-center items-center text-neutral-500">
        <LineChartIcon />
        <p className="mt-4 text-sm">نمودار درآمد به زودی اینجا اضافه می‌شود...</p>
      </div>
    </div>
  );
}

function LineChartIcon() {
  return <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>;
}
