'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SupportForm() {
  const router = useRouter();
  const [form, setForm] = useState({ subject: '', category: 'tech', priority: 'medium', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      router.push('/support/tickets');
    } else {
      alert('خطا در ثبت تیکت');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input required placeholder="موضوع درخواست" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none" />
      <div className="grid grid-cols-2 gap-4">
        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none">
          <option value="tech">مشکل فنی</option>
          <option value="ai">هوش مصنوعی</option>
          <option value="billing">مالی</option>
        </select>
        <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none">
          <option value="low">کم</option>
          <option value="medium">متوسط</option>
          <option value="high">بالا</option>
        </select>
      </div>
      <textarea required rows={5} placeholder="شرح درخواست..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-neutral-50 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm outline-none resize-none" />
      <button type="submit" disabled={loading} className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 rounded-xl transition disabled:opacity-50">
        {loading ? 'در حال ارسال...' : 'ارسال تیکت'}
      </button>
    </form>
  );
}
