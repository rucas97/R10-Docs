'use client';
import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PlanEditor({ initialPlans }: { initialPlans: any[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async (plan: any) => {
    setSaving(plan.id);
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });
    setSaving(null);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {plans.map(p => (
        <div key={p.id} className="bg-[#171717] border border-[#333] rounded-2xl p-6">
          <input 
            value={p.name} 
            onChange={e => setPlans(plans.map(x => x.id === p.id ? {...x, name: e.target.value} : x))}
            className="w-full bg-transparent text-lg font-bold text-white outline-none border-b border-transparent focus:border-[#555] pb-1 mb-4" 
          />
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-neutral-400">قیمت (تومان):</span>
            <input 
              type="number"
              value={p.price} 
              onChange={e => setPlans(plans.map(x => x.id === p.id ? {...x, price: parseInt(e.target.value)} : x))}
              className="w-24 bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-2 py-1 text-sm outline-none" 
            />
          </div>
          <textarea 
            value={p.features.join('\n')}
            onChange={e => setPlans(plans.map(x => x.id === p.id ? {...x, features: e.target.value.split('\n')} : x))}
            className="w-full bg-[#0A0A0A] border border-[#333] text-neutral-300 text-xs rounded-xl p-3 h-32 outline-none mb-4"
          />
          <button onClick={() => handleSave(p)} disabled={saving === p.id} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gold-500 text-black font-bold text-xs hover:bg-gold-600 transition">
            {saving === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            ذخیره تغییرات
          </button>
        </div>
      ))}
    </div>
  );
}
