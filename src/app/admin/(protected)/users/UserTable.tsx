'use client';
import { useState } from 'react';
import { Trash2, User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export function UserTable({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Stop row click
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) setUsers(users.filter(u => u.id !== id));
    else alert('حذف ناموفق بود');
  };

  return (
    <div className="bg-[#171717] border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right min-w-[600px]">
          <thead className="bg-[#1A1A1A] border-b border-neutral-800 text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-bold">شناسه</th>
              <th className="px-6 py-4 font-bold">نام کاربر</th>
              <th className="px-6 py-4 font-bold">ایمیل / شماره</th>
              <th className="px-6 py-4 font-bold">تاریخ عضویت</th>
              <th className="px-6 py-4 font-bold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-800/30 transition group">
                <td className="px-6 py-4 font-mono text-xs text-neutral-500">{u.id.slice(0, 8)}...</td>
                <td className="px-6 py-4 font-medium">
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2 hover:text-gold-500 transition">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center"><User className="w-4 h-4" /></div>
                    {u.user_metadata?.full_name || 'بدون نام'}
                  </Link>
                </td>
                <td className="px-6 py-4 text-neutral-400">{u.email || u.phone || 'نامشخص'}</td>
                <td className="px-6 py-4 text-neutral-500 text-xs" dir="ltr">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 flex items-center justify-end gap-2">
                  <Link href={`/admin/users/${u.id}`} className="p-2 text-neutral-400 hover:text-white transition">
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                  <button onClick={(e) => handleDelete(e, u.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
