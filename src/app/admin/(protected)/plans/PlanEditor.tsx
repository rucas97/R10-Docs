'use client';
import { useState } from 'react';
import { Save, Loader2, Eye, EyeOff } from 'lucide-react';
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

  const updateFeature = (planId: string, key: string, value: any) => {
    setPlans(plans.map(p => p.id === planId ? { ...p, feature_flags: { ...p.feature_flags, [key]: value } } : p));
  };

  const toggleFormat = (planId: string, format: string) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const current = p.feature_flags?.formats || ['pdf'];
        const next = current.includes(format) ? current.filter((f: string) => f !== format) : [...current, format];
        return { ...p, feature_flags: { ...p.feature_flags, formats: next } };
      }
      return p;
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {plans.map(p => (
        <div key={p.id} className={`bg-[#171717] border rounded-2xl p-6 relative ${p.is_published ? 'border-[#333]' : 'border-rose-500/50 opacity-70'}`}>
          
          <div className="flex justify-between items-start mb-4">
             <input value={p.name} onChange={e => setPlans(plans.map(x => x.id === p.id ? {...x, name: e.target.value} : x))} className="w-full bg-transparent text-lg font-bold text-white outline-none border-b border-transparent focus:border-[#555] pb-1" />
             <button onClick={() => setPlans(plans.map(x => x.id === p.id ? {...x, is_published: !x.is_published} : x))} className={`p-2 rounded-lg ${p.is_published ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
               {p.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
             </button>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-neutral-400">قیمت (تومان):</span>
            <input type="number" value={p.price} onChange={e => setPlans(plans.map(x => x.id === p.id ? {...x, price: parseInt(e.target.value)} : x))} className="w-24 bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-2 py-1 text-sm outline-none" />
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs font-bold text-gold-500 mb-2">فرمت‌های مجاز</p>
            {['pdf', 'docx', 'xlsx', 'pptx', 'image'].map(fmt => (
              <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(p.feature_flags?.formats || ['pdf']).includes(fmt)} onChange={() => toggleFormat(p.id, fmt)} className="w-4 h-4 accent-gold-500" />
                <span className="text-xs text-neutral-300 uppercase">{fmt}</span>
              </label>
            ))}
            
            <p className="text-xs font-bold text-gold-500 mt-4 mb-2">ویژگی‌ها</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={p.feature_flags?.ocr || false} onChange={e => updateFeature(p.id, 'ocr', e.target.checked)} className="w-4 h-4 accent-gold-500" />
              <span className="text-xs text-neutral-300">خوانش دست‌نویس (OCR)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-300">حداکثر صفحات:</span>
              <input type="number" value={p.feature_flags?.max_pages || 50} onChange={e => updateFeature(p.id, 'max_pages', parseInt(e.target.value))} className="w-20 bg-[#0A0A0A] border border-[#333] text-white rounded-lg px-2 py-1 text-xs outline-none" />
            </div>
          </div>

          <button onClick={() => handleSave(p)} disabled={saving === p.id} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gold-500 text-black font-bold text-xs hover:bg-gold-600 transition">
            {saving === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            ذخیره تغییرات
          </button>
        </div>
      ))}
    </div>
  );
}
