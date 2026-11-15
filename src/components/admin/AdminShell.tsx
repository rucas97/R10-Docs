'use client';
import { useState } from 'react';
import Link from 'next/link';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { Users, Ticket, LogOut, Menu, X } from 'lucide-react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface-canvasDark text-neutral-100" dir="rtl">
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-[#171717] border-l border-neutral-800 flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <DocwizeLogo className="w-8 h-8 text-gold-500" />
            <span className="font-black text-lg">Docwize Admin</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/users" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800 text-sm font-bold transition">
            <Users className="w-4 h-4" /> کاربران
          </Link>
          <Link href="/admin/tickets" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-neutral-800 text-sm font-bold transition">
            <Ticket className="w-4 h-4" /> تیکت‌ها
          </Link>
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <a href="/api/admin/logout" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-500 text-sm font-bold transition">
            <LogOut className="w-4 h-4" /> خروج
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Topbar */}
        <div className="lg:hidden h-16 flex items-center px-4 border-b border-neutral-800 bg-[#171717] shrink-0">
          <button onClick={() => setIsOpen(true)} className="text-neutral-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold mr-4">پنل مدیریت</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
