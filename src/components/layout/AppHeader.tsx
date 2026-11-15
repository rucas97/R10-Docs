'use client';
import Link from 'next/link';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProfileMenu } from '@/components/chat/ProfileMenu';

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-50 glass-header border-b border-neutral-200/60 dark:border-neutral-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <DocwizeLogo className="w-8 h-8 text-gold-500 group-hover:scale-105 transition-transform" />
          <span className="font-black text-xl tracking-tight hidden sm:block">Docwize</span>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <Link href="/chat" className="hover:text-neutral-900 dark:hover:text-white transition">داشبورد</Link>
          <Link href="/pricing" className="hover:text-neutral-900 dark:hover:text-white transition">پلن‌ها</Link>
          <Link href="/support" className="hover:text-neutral-900 dark:hover:text-white transition">پشتیبانی</Link>
        </nav>

        {/* Actions: Theme + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <ProfileMenu email={email} />
        </div>
      </div>
    </header>
  );
}
