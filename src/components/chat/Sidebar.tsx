'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, MessageSquare, LogOut, Loader2, Trash2, Pin, PinOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';

type Chat = {
  id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean | null;
  pinned_at: string | null;
};

export function Sidebar({
  user, chats, onClose,
}: {
  user: { email: string; id: string };
  chats: Chat[];
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('این گفتگو حذف شود؟')) return;
    setBusyId(id);
    const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!res.ok) { showToast('حذف ناموفق بود'); return; }
    router.refresh();
    if (pathname === `/chat/${id}`) router.push('/chat');
  };

  const handlePin = async (chat: Chat) => {
    setBusyId(chat.id);
    const method = chat.is_pinned ? 'DELETE' : 'POST';
    const res = await fetch(`/api/chats/${chat.id}/pin`, { method });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || 'عملیات ناموفق بود');
      return;
    }
    router.refresh();
  };

  const pinned = chats.filter((c) => c.is_pinned);
  const others = chats.filter((c) => !c.is_pinned);

  const renderChat = (c: Chat) => {
    const active = pathname === `/chat/${c.id}`;
    const isPinned = !!c.is_pinned;
    return (
      <li key={c.id} className="relative">
        <Link
          href={`/chat/${c.id}`}
          onClick={onClose}
          className={`flex items-center gap-2 px-2.5 py-2.5 rounded-xl transition pl-16 ${
            active
              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isPinned ? (
            <Pin className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-500" />
          ) : (
            <MessageSquare className="w-4 h-4 shrink-0" />
          )}
          <span className="text-xs font-semibold truncate">{c.title}</span>
        </Link>

        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <button
            onClick={(e) => { e.preventDefault(); handlePin(c); }}
            disabled={busyId === c.id}
            title={isPinned ? 'برداشتن پین' : 'پین کردن'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
              isPinned
                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => { e.preventDefault(); handleDelete(c.id); }}
            disabled={busyId === c.id}
            title="حذف"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link href="/chat" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center">
            <span className="text-xs font-black">R10</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm text-slate-900 dark:text-white leading-tight">R10-Docs</span>
            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">دستیار اسناد</span>
          </div>
        </Link>
      </div>

      <div className="p-3">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white text-sm font-bold transition shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>گفتگوی جدید</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {chats.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8 px-4">
            هنوز گفتگویی ندارید. یک PDF آپلود کنید.
          </p>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 px-3 pt-3 pb-1 flex items-center gap-1.5">
                  <Pin className="w-3 h-3 fill-current" />
                  پین‌شده‌ها ({pinned.length}/۴)
                </p>
                <ul className="space-y-1">{pinned.map(renderChat)}</ul>
              </>
            )}

            {others.length > 0 && (
              <>
                {pinned.length > 0 && (
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-3 pt-4 pb-1">
                    گفتگوهای اخیر
                  </p>
                )}
                <ul className="space-y-1">{others.map(renderChat)}</ul>
              </>
            )}
          </>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-black shrink-0">
            {(user.email[0] ?? '?').toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate flex-1" dir="ltr">
            {user.email}
          </span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-60"
        >
          {signingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          <span>{signingOut ? 'در حال خروج...' : 'خروج از حساب'}</span>
        </button>
      </div>

      {toast && (
        <div className="absolute bottom-24 left-3 right-3 px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold text-center shadow-xl animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
