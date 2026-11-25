'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SalesChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 300 }} dir="ltr">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
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
  );
}
