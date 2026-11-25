'use client';
import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AnalyticsClient({ chatsCount, msgsCount, ticketsCount, transactions }: any) {
  const [range, setRange] = useState<7 | 30 | 365>(7);

  const totalRevenue = transactions.reduce((acc: number, t: any) => acc + t.amount, 0);

  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTrx = transactions.filter((t: any) => t.created_at.startsWith(dateStr));
      const dayRevenue = dayTrx.reduce((acc: number, t: any) => acc + t.amount, 0);
      
      data.push({
        name: d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        sales: dayTrx.length
      });
    }
    return data;
  }, [transactions, range]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
          <p className="text-xs text-neutral-400 mb-2">کل اسناد آپلود شده</p>
          <p className="text-2xl font-black text-white">{chatsCount}</p>
        </div>
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
          <p className="text-xs text-neutral-400 mb-2">کل پیام‌ها</p>
          <p className="text-2xl font-black text-white">{msgsCount}</p>
        </div>
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
          <p className="text-xs text-neutral-400 mb-2">تیکت‌ها</p>
          <p className="text-2xl font-black text-white">{ticketsCount}</p>
        </div>
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
          <p className="text-xs text-neutral-400 mb-2">درآمد کل (نت)</p>
          <p className="text-2xl font-black text-gold-500">{totalRevenue.toLocaleString('fa-IR')} T</p>
        </div>
      </div>

      <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-white">نمودار درآمد</h2>
          <div className="flex bg-[#0A0A0A] rounded-lg p-1 border border-[#333]">
            <button onClick={() => setRange(7)} className={`px-3 py-1 text-xs font-bold rounded-md transition ${range === 7 ? 'bg-[#333] text-white' : 'text-neutral-500'}`}>۷ روز</button>
            <button onClick={() => setRange(30)} className={`px-3 py-1 text-xs font-bold rounded-md transition ${range === 30 ? 'bg-[#333] text-white' : 'text-neutral-500'}`}>۳۰ روز</button>
            <button onClick={() => setRange(365)} className={`px-3 py-1 text-xs font-bold rounded-md transition ${range === 365 ? 'bg-[#333] text-white' : 'text-neutral-500'}`}>۱ سال</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 350 }} dir="ltr">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFB200" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FFB200" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#333', color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#FFB200" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
