'use client';

import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PALETTE = [
  '#7c3aed', '#4f46e5', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6',
];

const CHART_STYLE = {
  fontFamily: 'Vazirmatn, system-ui, sans-serif',
  fontSize: 12,
} as const;

const TICK_STYLE = {
  fontFamily: 'Vazirmatn, system-ui, sans-serif',
  fontSize: 12,
  fill: '#64748b',
} as const;

export function AnalysisChart({ chart }: { chart: any }) {
  const data = chart.data || [];
  const unit = chart.unit ? ` (${chart.unit})` : '';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-3">
        {chart.title}{unit}
      </h3>
      <div style={{ width: '100%', height: 240 }} dir="ltr">
        <ResponsiveContainer>
          {chart.type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry: any) => `${entry.name}: ${entry.value}`}
                labelLine={false}
              >
                {data.map((_: any, i: number) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_STYLE} />
              <Legend wrapperStyle={{ direction: 'rtl', fontFamily: 'Vazirmatn, system-ui, sans-serif', fontSize: 12 }} />
            </PieChart>
          ) : chart.type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={CHART_STYLE} reversed />
              <YAxis tick={CHART_STYLE} orientation="right" />
              <Tooltip contentStyle={CHART_STYLE} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_: any, i: number) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : chart.type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={CHART_STYLE} reversed />
              <YAxis tick={CHART_STYLE} orientation="right" />
              <Tooltip contentStyle={CHART_STYLE} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ fill: '#7c3aed', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <RadarChart data={data}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" tick={CHART_STYLE} />
              <PolarRadiusAxis tick={CHART_STYLE} />
              <Radar
                dataKey="value"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.4}
              />
              <Tooltip contentStyle={CHART_STYLE} />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
