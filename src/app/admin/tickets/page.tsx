import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { MessageSquare, Clock, CheckCircle } from 'lucide-react';

export default async function AdminTicketsPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: tickets } = await supabase.from('tickets').select('*').order('updated_at', { ascending: false });

  const getStatusBadge = (s: string) => {
    if (s === 'progress') return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-brand-cobalt/20 text-blue-400 flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> در حال بررسی</span>;
    if (s === 'awaiting') return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gold-500/20 text-gold-500 flex items-center gap-1 w-fit"><MessageSquare className="w-3 h-3"/> منتظر پاسخ</span>;
    return <span className="px-3 py-1 rounded-lg text-xs font-bold bg-neutral-800 text-neutral-400 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> بسته شده</span>;
  };

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">مدیریت تیکت‌ها</h1>
      <div className="space-y-3">
        {tickets?.map(t => (
          <Link href={`/admin/tickets/${t.id}`} key={t.id} className="block bg-[#171717] border border-neutral-800 p-5 rounded-2xl hover:border-neutral-600 transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-white">{t.subject}</h3>
              {getStatusBadge(t.status)}
            </div>
            <div className="flex justify-between items-center text-xs text-neutral-500 mt-4">
              <span className="font-mono">#{t.id.slice(0, 8)}</span>
              <span dir="ltr">{new Date(t.created_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
