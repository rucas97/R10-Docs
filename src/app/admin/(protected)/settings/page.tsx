import { AdminSettingsForm } from './SettingsForm';
import { createClient } from '@supabase/supabase-js';

export default async function AdminSettingsPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await supabase.from('admin_settings').select('*').eq('id', 1).single();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black mb-6">تنظیمات ادمین</h1>
      <AdminSettingsForm initialData={data} />
    </div>
  );
}
