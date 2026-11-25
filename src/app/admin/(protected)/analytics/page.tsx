import { createClient } from '@supabase/supabase-js';

export default async function AdminAnalytics() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const [{ count: chatsCount }, { count: msgsCount }, { count: ticketsCount }] = await Promise.all([
    supabase.from('chats').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('tickets').select('*', { count: 'exact', head: true })
  ]);

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">آنالیز و آمار</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6 text-center">
          <p className="text-sm text-neutral-400 mb-2">کل اسناد آپلود شده</p>
          <p className="text-3xl font-black text-white">{chatsCount || 0}</p>
        </div>
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6 text-center">
          <p className="text-sm text-neutral-400 mb-2">کل پیام‌های رد و بدل شده</p>
          <p className="text-3xl font-black text-white">{msgsCount || 0}</p>
        </div>
        <div className="bg-[#171717] border border-[#333] rounded-2xl p-6 text-center">
          <p className="text-sm text-neutral-400 mb-2">کل تیکت‌های ثبت شده</p>
          <p className="text-3xl font-black text-white">{ticketsCount || 0}</p>
        </div>
      </div>
    </div>
  );
}
