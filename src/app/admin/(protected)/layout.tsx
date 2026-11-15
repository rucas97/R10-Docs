import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { Users, Ticket, LogOut } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.has('admin_session')) redirect('/admin/login');

  return (
    <div className="flex h-screen bg-surface-canvasDark text-neutral-100" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-[#171717] border-l border-neutral-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-neutral-800 gap-3">
          <DocwizeLogo className="w-8 h-8 text-gold-500" />
          <span className="font-black text-lg">Docwize Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800 text-sm font-bold transition">
            <Users className="w-4 h-4" /> کاربران
          </Link>
          <Link href="/admin/tickets" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800 text-sm font-bold transition">
            <Ticket className="w-4 h-4" /> تیکت‌ها
          </Link>
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <a href="/api/admin/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-500 text-sm font-bold transition">
            <LogOut className="w-4 h-4" /> خروج
          </a>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-surface-canvasDark p-8">{children}</main>
    </div>
  );
}
