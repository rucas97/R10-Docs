'use client';

import { useState } from 'react';
import { Menu, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';

type Chat = {
  id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean | null;
  pinned_at: string | null;
};

export function AppShell({
  user, chats, children,
}: {
  user: { email: string; id: string };
  chats: Chat[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside
        className={`
          fixed inset-y-0 right-0 z-40 w-72 bg-white dark:bg-slate-900
          border-l border-slate-200 dark:border-slate-800
          transform transition-transform duration-200 ease-out
          lg:relative lg:translate-x-0
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar user={user} chats={chats} onClose={() => setDrawerOpen(false)} />
      </aside>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="lg:hidden h-14 flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="باز کردن منو"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <Link href="/chat" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-black text-sm text-slate-900 dark:text-white">R10-Docs</span>
          </Link>
          <div className="w-10" />
        </div>

        {children}
      </main>
    </div>
  );
}
