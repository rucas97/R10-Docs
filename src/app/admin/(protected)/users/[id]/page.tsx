import { createClient } from '@supabase/supabase-js';
import { UserDetailClient } from './UserDetailClient';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: { user }, error } = await supabase.auth.admin.getUserById(id);
  
  if (error || !user) return <div className="text-white text-center py-10">کاربر یافت نشد</div>;

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-white mb-6 transition">
        <ArrowRight className="w-4 h-4" /> بازگشت به لیست کاربران
      </Link>
      <UserDetailClient user={user} />
    </div>
  );
}
