import { createClient } from '@supabase/supabase-js';
import { Users, CreditCard, FileText, CheckCircle } from 'lucide-react';
import { SalesChart } from './SalesChart';

export default async function AdminDashboard() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const [{ count: userCount }, { count: ticketCount }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'progress'),
    supabase.from('transactions').select('amount, created_at').eq('status', 'success')
  ]);

  const totalRevenue = transactions?.reduce((acc, t) => acc + t.amount, 0) || 0;
  
  // Process data for chart (Last 7 days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayTrx = transactions?.filter(t => t.created_at.startsWith(dateStr)) || [];
    const dayRevenue = dayTrx.reduce((acc, t) => acc + t.amount, 0);
    
    chartData.push({
      name: date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
      revenue: dayRevenue,
      sales: dayTrx.length
    });
  }

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
      
      <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">نمودار فروش ۷ روز اخیر</h2>
        <SalesChart data={chartData} />
      </div>
    </div>
  );
}
