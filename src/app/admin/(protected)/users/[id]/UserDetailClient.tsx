'use client';
import { useState } from 'react';
import { User, Mail, Calendar, ShieldAlert, CheckCircle, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UserDetailClient({ user, logs }: { user: any, logs: any[] }) {
  const router = useRouter();
  const [name, setName] = useState(user.user_metadata?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: name })
    });

    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert('خطا در ذخیره تغییرات');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Main Info Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#171717] border border-neutral-800 rounded-3xl p-6 sm:p-8">
          <h1 className="text-xl font-black text-white mb-6">مشخصات کاربر</h1>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">نام و نام خانوادگی</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="نام کاربر را وارد کنید"
                className="w-full bg-[#1A1A1A] border border-neutral-700 text-white rounded-xl px-4 py-3 outline-none focus:border-gold-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">ایمیل</label>
              <div className="w-full bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-xl px-4 py-3 flex items-center gap-2" dir="ltr">
                <Mail className="w-4 h-4" /> {user.email || 'ندارد'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-2">شماره موبایل</label>
              <div className="w-full bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-xl px-4 py-3 flex items-center gap-2" dir="ltr">
                <ShieldAlert className="w-4 h-4" /> {user.phone || 'ندارد'}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Calendar className="w-4 h-4" /> عضویت: {new Date(user.created_at).toLocaleDateString('fa-IR')}
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gold-500 hover:bg-gold-600 text-black font-bold text-sm rounded-xl transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
            </div>

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                <CheckCircle className="w-4 h-4" /> تغییرات با موفقیت ذخیره شد.
              </div>
            )}
          </form>
        </div>

        {/* Live Activity Logs */}
        <div className="bg-[#171717] border border-neutral-800 rounded-3xl p-6 sm:p-8">
          <h2 className="text-sm font-bold text-white mb-4">آخرین فعالیت‌های کاربر (تیکت‌ها)</h2>
          {logs.length > 0 ? (
            <div className="text-xs font-mono text-neutral-300 bg-[#0A0A0A] p-4 rounded-xl overflow-x-auto space-y-2" dir="ltr">
              {logs.map((log, i) => (
                <div key={i}>
                  [{new Date(log.created_at).toLocaleDateString()}] TICKET: {log.subject}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-500 text-xs">
              هیچ لاگی برای این کاربر ثبت نشده است.
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-[#171717] border border-neutral-800 rounded-3xl p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-neutral-500" />
          </div>
          <h2 className="text-lg font-bold text-white">{name || 'کاربر بدون نام'}</h2>
          <p className="text-xs text-neutral-500 mt-1" dir="ltr">{user.id}</p>
        </div>
      </div>

    </div>
  );
}
