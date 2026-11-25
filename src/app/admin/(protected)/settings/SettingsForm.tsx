'use client';
import { useState } from 'react';
import { Save, Loader2, CheckCircle } from 'lucide-react';

export function AdminSettingsForm({ initialData }: { initialData: any }) {
  const [form, setForm] = useState({
    username: initialData?.username || 'admin',
    password: initialData?.password || 'docwize2026',
    email: initialData?.email || 'info@docwize.site'
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="bg-[#171717] border border-[#333] rounded-2xl p-6 space-y-6">
      <div>
        <label className="block text-xs font-bold text-neutral-400 mb-2">نام کاربری ادمین</label>
        <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-xl px-4 py-3 outline-none focus:border-gold-500" />
      </div>
      <div>
        <label className="block text-xs font-bold text-neutral-400 mb-2">رمز عبور جدید</label>
        <input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-xl px-4 py-3 outline-none focus:border-gold-500" />
      </div>
      <div>
        <label className="block text-xs font-bold text-neutral-400 mb-2">ایمیل ادمین</label>
        <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-[#0A0A0A] border border-[#333] text-white rounded-xl px-4 py-3 outline-none focus:border-gold-500" dir="ltr" />
      </div>
      
      {success && <div className="text-emerald-400 text-xs font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> ذخیره شد</div>}

      <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-sm hover:bg-gold-600 transition disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} ذخیره تغییرات
      </button>
    </form>
  );
}
