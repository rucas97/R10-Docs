'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocwizeLogo } from '@/components/DocwizeLogo';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) router.push('/admin/users');
    else setError('نام کاربری یا رمز عبور اشتباه است');
  };

  return (
    <div className="min-h-screen bg-surface-canvasDark flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-[#171717] border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6"><DocwizeLogo className="w-12 h-12 text-gold-500" /></div>
        <h1 className="text-xl font-black text-white text-center mb-6">ورود به پنل مدیریت</h1>
        {error && <p className="text-rose-500 text-xs text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" placeholder="نام کاربری" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#1A1A1A] border border-neutral-700 text-white rounded-xl px-4 py-3 outline-none focus:border-gold-500" />
          <input type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1A1A1A] border border-neutral-700 text-white rounded-xl px-4 py-3 outline-none focus:border-gold-500" />
          <button type="submit" className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-3 rounded-xl transition">ورود</button>
        </form>
      </div>
    </div>
  );
}
