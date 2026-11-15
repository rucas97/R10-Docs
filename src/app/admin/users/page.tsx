import { createClient } from '@supabase/supabase-js';
import { UserTable } from './UserTable';

export default async function AdminUsersPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { users } } = await supabase.auth.admin.listUsers();

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">مدیریت کاربران</h1>
      <UserTable initialUsers={users || []} />
    </div>
  );
}
