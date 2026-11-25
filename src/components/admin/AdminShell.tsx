'use client';
import { useState } from 'react';
import Link from 'next/link';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { Users, Ticket, LogOut, Menu, X, LayoutDashboard, CreditCard, LineChart, Search, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'داشبورد' },
    { href: '/admin/plans', icon: CreditCard, label: 'مدیریت پلن‌ها' },
    { href: '/admin/analytics', icon: LineChart, label: 'آنالیز و آمار' },
    { href: '/admin/users', icon: Users, label: 'کاربران' },
    { href: '/admin/tickets', icon: Ticket, label: 'پشتیبانی' },
    { href: '/admin/settings', icon: Settings, label: 'تنظیمات' },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-neutral-100" dir="rtl">
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#171717] border-l border-[#333] flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#333]">
          <Link href="/" className="flex items-center gap-3">
            <DocwizeLogo className="w-8 h-8" />
            <span className="font-black text-lg">Admin</span>
          </Link>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-neutral-500" />
            <input type="text" placeholder="جستجو..." className="w-full bg-[#0A0A0A] border border-[#333] rounded-lg pr-9 pl-3 py-2 text-xs outline-none focus:border-gold-500" />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${active ? 'bg-[#2A2A2A] text-white' : 'text-neutral-400 hover:bg-[#222] hover:text-white'}`}>
                <link.icon className={`w-4 h-4 ${active ? 'text-gold-500' : ''}`} /> {link.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-[#333]">
          <a href="/api/admin/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-500 text-sm font-bold transition">
            <LogOut className="w-4 h-4" /> خروج
          </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden h-16 flex items-center px-4 border-b border-[#333] bg-[#171717] shrink-0">
          <button onClick={() => setIsOpen(true)} className="text-neutral-400 hover:text-white"><Menu className="w-6 h-6" /></button>
          <span className="font-bold mr-4">پنل مدیریت</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0A0A0A]">
          {children}
        </div>
      </main>
    </div>
  );
}
