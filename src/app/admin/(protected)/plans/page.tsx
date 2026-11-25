import { createClient } from '@supabase/supabase-js';
import { PlanEditor } from './PlanEditor';

export default async function AdminPlansPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: plans } = await supabase.from('plans').select('*').order('price', { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">مدیریت پلن‌ها (Ecommerce)</h1>
      <PlanEditor initialPlans={plans || []} />
    </div>
  );
}
