'use client';
import { useState } from 'react';
import { Trash2, User } from 'lucide-react';

export function UserTable({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟ تمام اسناد و تیکت‌های او نیز حذف می‌شوند.')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="bg-[#171717] border border-neutral-800 rounded-2xl overflow-hidden">
      <table className="w-full text-sm text-right">
        <thead className="bg-[#1A1A1A] border-b border-neutral-800 text-neutral-400">
          <tr>
            <th className="px-6 py-4 font-bold">شناسه</th>
            <th className="px-6 py-4 font-bold">ایمیل / شماره</th>
            <th className="px-6 py-4 font-bold">تاریخ عضویت</th>
            <th className="px-6 py-4 font-bold">عملیات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-neutral-800/30 transition">
              <td className="px-6 py-4 font-mono text-xs text-neutral-500">{u.id.slice(0, 8)}...</td>
              <td className="px-6 py-4 font-medium flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center"><User className="w-4 h-4" /></div>
                {u.email || u.phone || 'نامشخص'}
              </td>
              <td className="px-6 py-4 text-neutral-400" dir="ltr">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="px-6 py-4">
                <button onClick={() => handleDelete(u.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
