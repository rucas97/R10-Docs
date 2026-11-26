'use client';
import { useState } from 'react';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function OrderTable({ transactions, profileMap, storageMap }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatus = async (id: string, status: string, plan_id: string, user_id: string) => {
    if (!confirm(`تغییر وضعیت به ${status}؟`)) return;
    setLoading(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, plan_id, user_id })
    });
    setLoading(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف این تراکنش؟')) return;
    setLoading(id);
    await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
    setLoading(null);
    router.refresh();
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '۰ MB';
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="bg-[#171717] border border-[#333] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm min-w-[800px]">
          <thead className="bg-[#1A1A1A] border-b border-[#333] text-neutral-400">
            <tr>
              <th className="px-4 py-4">شناسه تراکنش</th>
              <th className="px-4 py-4">شناسه کاربر</th>
              <th className="px-4 py-4">پلن فعلی کاربر</th>
              <th className="px-4 py-4">فضای مصرفی</th>
              <th className="px-4 py-4">پلن خریداری شده</th>
              <th className="px-4 py-4">مبلغ (تومان)</th>
              <th className="px-4 py-4">وضعیت</th>
              <th className="px-4 py-4">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {transactions.map((t: any) => (
              <tr key={t.id} className="hover:bg-[#1A1A1A]">
                <td className="px-4 py-4 font-mono text-xs text-neutral-500">{t.authority || t.id.slice(0,8)}</td>
                <td className="px-4 py-4 font-mono text-xs text-neutral-500">{t.user_id.slice(0,8)}...</td>
                <td className="px-4 py-4 font-bold text-white">{profileMap[t.user_id] || 'free'}</td>
                <td className="px-4 py-4 text-neutral-400 text-xs">{formatSize(storageMap[t.user_id])}</td>
                <td className="px-4 py-4 font-bold text-brand-cobalt dark:text-brand-blue">{t.plan_id}</td>
                <td className="px-4 py-4 font-bold text-white">{t.amount.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'success' ? 'bg-green-500/10 text-green-500' : t.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-gold-500/10 text-gold-500'}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {t.status === 'pending' && (
                      <button onClick={() => handleStatus(t.id, 'success', t.plan_id, t.user_id)} disabled={loading === t.id} className="p-1.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20" title="تایید دستی">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {t.status === 'pending' && (
                      <button onClick={() => handleStatus(t.id, 'failed', t.plan_id, t.user_id)} disabled={loading === t.id} className="p-1.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" title="رد کردن">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(t.id)} disabled={loading === t.id} className="p-1.5 rounded bg-neutral-800 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
