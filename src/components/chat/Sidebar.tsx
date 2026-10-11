'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, MessageSquare, Loader2, Trash2, Pin, PinOff,
  FolderPlus, Folder, FolderOpen, ChevronDown, FolderInput,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProfileMenu } from './ProfileMenu';

type Chat = {
  id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean | null;
  pinned_at: string | null;
  folder_id: string | null;
};
type FolderT = { id: string; name: string; created_at: string };

export function Sidebar({
  user, chats: initialChats, folders: initialFolders, onClose,
}: {
  user: { email: string; id: string };
  chats: Chat[];
  folders: FolderT[];
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState(initialChats);
  const [folders, setFolders] = useState(initialFolders);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [movingChatId, setMovingChatId] = useState<string | null>(null);
  const [movePos, setMovePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setChats(initialChats); }, [initialChats]);
  useEffect(() => { setFolders(initialFolders); }, [initialFolders]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('این گفتگو حذف شود؟')) return;
    const prev = chats;
    setChats((c) => c.filter((x) => x.id !== id));
    setBusyId(id);
    const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!res.ok) { setChats(prev); showToast('حذف ناموفق بود'); return; }
    if (pathname === `/chat/${id}`) router.push('/chat');
    router.refresh();
  };

  const handlePin = async (chat: Chat) => {
    setBusyId(chat.id);
    const method = chat.is_pinned ? 'DELETE' : 'POST';
    const prev = chats;
    setChats((c) => c.map((x) => x.id === chat.id
      ? { ...x, is_pinned: !chat.is_pinned, pinned_at: !chat.is_pinned ? new Date().toISOString() : null }
      : x));
    const res = await fetch(`/api/chats/${chat.id}/pin`, { method });
    setBusyId(null);
    if (!res.ok) {
      setChats(prev);
      const d = await res.json().catch(() => ({}));
      showToast(d.error || 'عملیات ناموفق بود');
      return;
    }
    router.refresh();
  };

  const createFolder = async () => {
    const name = prompt('نام پوشه جدید:');
    if (!name || !name.trim()) return;
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) { showToast('ایجاد پوشه ناموفق بود'); return; }
    const { folder } = await res.json();
    setFolders((f) => [...f, folder]);
    setExpanded((e) => ({ ...e, [folder.id]: true }));
    router.refresh();
  };

  const renameFolder = async (folder: FolderT) => {
    const name = prompt('نام جدید پوشه:', folder.name);
    if (!name || !name.trim() || name.trim() === folder.name) return;
    const res = await fetch(`/api/folders/${folder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) { showToast('تغییر نام ناموفق بود'); return; }
    setFolders((f) => f.map((x) => x.id === folder.id ? { ...x, name: name.trim() } : x));
    router.refresh();
  };

  const deleteFolder = async (folder: FolderT) => {
    if (!confirm(`پوشه «${folder.name}» حذف شود؟ گفتگوها باقی می‌مانند.`)) return;
    const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('حذف ناموفق بود'); return; }
    setFolders((f) => f.filter((x) => x.id !== folder.id));
    setChats((c) => c.map((x) => x.folder_id === folder.id ? { ...x, folder_id: null } : x));
    router.refresh();
  };

  const moveChat = async (chatId: string, folderId: string | null) => {
    setMovingChatId(null);
    const prev = chats;
    setChats((c) => c.map((x) => x.id === chatId ? { ...x, folder_id: folderId } : x));
    const res = await fetch(`/api/chats/${chatId}/folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) {
      setChats(prev);
      showToast('جابجایی ناموفق بود');
      return;
    }
    showToast(folderId ? 'به پوشه منتقل شد' : 'از پوشه خارج شد');
    router.refresh();
  };

  const openMoveMenu = (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMovePos({ x: r.right, y: r.top });
    setMovingChatId(chatId);
  };

  const pinned = chats.filter((c) => c.is_pinned);
  const others = chats.filter((c) => !c.is_pinned && !c.folder_id);

  const renderChat = (c: Chat, showFolderIcon = true) => {
    const active = pathname === `/chat/${c.id}`;
    const isPinned = !!c.is_pinned;
    return (
      <li key={c.id} className="relative">
        <Link
          href={`/chat/${c.id}`}
          onClick={onClose}
          className={`flex items-center gap-2 px-2.5 py-2.5 rounded-xl transition pl-[72px] ${
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
          {showFolderIcon && folders.length > 0 && (
            <button
              onClick={(e) => openMoveMenu(c.id, e)}
              title="انتقال به پوشه"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition"
            >
              <FolderInput className="w-3.5 h-3.5" />
            </button>
          )}
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

  const moveMenu = movingChatId && mounted ? createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setMovingChatId(null)} />
      <div
        className="fixed w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          top: Math.min(movePos.y, window.innerHeight - 220),
          left: Math.max(8, movePos.x - 210),
          zIndex: 9999,
        }}
        dir="rtl"
      >
        <div className="px-3 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
          انتقال به پوشه
        </div>
        {chats.find((c) => c.id === movingChatId)?.folder_id && (
          <button
            onClick={() => moveChat(movingChatId, null)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border-b border-slate-100 dark:border-slate-800"
          >
            <FolderInput className="w-3.5 h-3.5" />
            خارج کردن از پوشه
          </button>
        )}
        {folders.length === 0 ? (
          <div className="px-3 py-4 text-[11px] text-slate-400 dark:text-slate-500 text-center">
            پوشه‌ای وجود ندارد. یکی بسازید.
          </div>
        ) : (
          folders.map((f) => (
            <button
              key={f.id}
              onClick={() => moveChat(movingChatId, f.id)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 transition"
            >
              <Folder className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span className="truncate">{f.name}</span>
            </button>
          ))
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="flex flex-col h-full relative">
      {moveMenu}

      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white flex items-center justify-center">
            <span className="text-xs font-black">R10</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm text-slate-900 dark:text-white leading-tight">R10-Docs</span>
            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">دستیار اسناد</span>
          </div>
        </Link>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white text-xs font-bold transition shadow-md shadow-brand-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>گفتگوی جدید</span>
        </Link>
        <button
          onClick={createFolder}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>پوشه جدید</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {chats.length === 0 && folders.length === 0 ? (
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
                <ul className="space-y-1">{pinned.map((c) => renderChat(c, false))}</ul>
              </>
            )}

            {folders.length > 0 && (
              <>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-3 pt-4 pb-1">
                  پوشه‌ها
                </p>
                {folders.map((f) => {
                  const folderChats = chats.filter((c) => c.folder_id === f.id && !c.is_pinned);
                  const isOpen = expanded[f.id] !== false; // default open
                  return (
                    <div key={f.id} className="mb-1">
                      <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition group">
                        <button
                          onClick={() => setExpanded((e) => ({ ...e, [f.id]: !isOpen }))}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          {isOpen ? (
                            <FolderOpen className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                          ) : (
                            <Folder className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ({folderChats.length})
                          </span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isOpen ? '' : '-rotate-90'}`} />
                        </button>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => renameFolder(f)}
                            title="تغییر نام"
                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700 transition"
                          >
                            <span className="text-[10px]">✎</span>
                          </button>
                          <button
                            onClick={() => deleteFolder(f)}
                            title="حذف پوشه"
                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {isOpen && folderChats.length > 0 && (
                        <ul className="space-y-1 ps-3">{folderChats.map((c) => renderChat(c, false))}</ul>
                      )}
                      {isOpen && folderChats.length === 0 && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 px-3 py-1.5">
                          خالی — گفتگویی به این پوشه منتقل کنید
                        </p>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {others.length > 0 && (
              <>
                {(pinned.length > 0 || folders.length > 0) && (
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-3 pt-4 pb-1">
                    گفتگوهای اخیر
                  </p>
                )}
                <ul className="space-y-1">{others.map((c) => renderChat(c))}</ul>
              </>
            )}
          </>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <ProfileMenu email={user.email} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate flex-1" dir="ltr">
            {user.email}
          </span>
          <ThemeToggle />
        </div>
      </div>

      {toast && (
        <div className="absolute bottom-24 left-3 right-3 px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold text-center shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
