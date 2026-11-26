import { createClient } from '@supabase/supabase-js';

export default async function AdminAudit() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">لاگ‌های امنیتی</h1>
      <div className="bg-[#171717] border border-[#333] rounded-2xl p-6">
        {logs && logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="text-xs font-mono bg-[#0A0A0A] p-4 rounded-xl border border-[#222] flex flex-col gap-1" dir="ltr">
                <span className="text-neutral-500">[{new Date(log.created_at).toLocaleString()}]</span>
                <span className="text-gold-500 font-bold">{log.action}</span>
                <span className="text-neutral-300">{log.details}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-neutral-500 text-sm">
            هیچ لاگی ثبت نشده است.
          </div>
        )}
      </div>
    </div>
  );
}
