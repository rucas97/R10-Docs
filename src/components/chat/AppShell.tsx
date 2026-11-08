'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DocwizeLogo } from '@/components/DocwizeLogo';

type Chat = {
  id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean | null;
  pinned_at: string | null;
  folder_id: string | null;
};
type FolderT = { id: string; name: string; created_at: string };

export function AppShell({
  user, chats, folders, children,
}: {
  user: { email: string; id: string };
  chats: Chat[];
  folders: FolderT[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface-lightMuted dark:bg-surface-dark">
      
      {/* Mobile Sidebar Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 right-0 z-40 w-72 bg-white dark:bg-surface-card
          border-l border-neutral-200 dark:border-neutral-800
          transform transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar user={user} chats={chats} folders={folders} onClose={() => setDrawerOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        {/* Mobile Topbar */}
        <div className="lg:hidden h-14 flex items-center justify-between px-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-surface-card shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition"
            aria-label="باز کردن منو"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <DocwizeLogo className="w-7 h-7 text-gold-500" />
            <span className="font-black text-sm text-neutral-900 dark:text-white">Docwize</span>
          </Link>
          
          <div className="w-10 flex justify-end">
            <ThemeToggle />
          </div>
        </div>

        {/* Desktop Topbar (just theme toggle) */}
        <div className="hidden lg:flex h-14 items-center justify-end px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-surface-card/50 shrink-0">
          <ThemeToggle />
        </div>

        {children}
      </main>
    </div>
  );
}
