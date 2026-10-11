'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, MessageSquare, Loader2, Trash2, Pin, PinOff,
  FolderPlus, Folder, FolderOpen, ChevronDown, MoreVertical,
  Search, FolderInput, X, FolderX,
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

type Tab = 'chats' | 'folders';
type MenuState = { chatId: string; x: number; y: number } | null;

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
  const [tab, setTab] = useState<Tab>('chats');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<MenuState>(null);
  const [moveModal, setMoveModal] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setChats(initialChats); }, [initialChats]);
  useEffect(() => { setFolders(initialFolders); }, [initialFolders]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const closeAll = () => {
    setMenu(null);
    setMoveModal(null);
  };

  // ---- Actions ----
  const handleDelete = async (id: string) => {
    closeAll();
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
    closeAll();
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

  const createFolder = async (): Promise<FolderT | null> => {
    const name = prompt('نام پوشه جدید:');
    if (!name || !name.trim()) return null;
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) { showToast('ایجاد پوشه ناموفق بود'); return null; }
    const { folder } = await res.json();
    setFolders((f) => [...f, folder]);
    setExpanded((e) => ({ ...e, [folder.id]: true }));
    router.refresh();
    return folder;
  };

  const renameFolder = async (folder: FolderT) => {
    const name = prompt('نام جدید:', folder.name);
    if (!name || !name.trim() || name.trim() === folder.name) return;
    const res = await fetch(`/api/folders/${folder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) { showToast('تغییر نام ناموفق'); return; }
    setFolders((f) => f.map((x) => x.id === folder.id ? { ...x, name: name.trim() } : x));
    router.refresh();
  };

  const deleteFolder = async (folder: FolderT) => {
    if (!confirm(`پوشه «${folder.name}» حذف شود؟ گفتگوها باقی می‌مانند.`)) return;
    const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('حذف ناموفق'); return; }
    setFolders((f) => f.filter((x) => x.id !== folder.id));
    setChats((c) => c.map((x) => x.folder_id === folder.id ? { ...x, folder_id: null } : x));
    router.refresh();
  };

  const moveChat = async (chatId: string, folderId: string | null) => {
    closeAll();
    const prev = chats;
    setChats((c) => c.map((x) => x.id === chatId ? { ...x, folder_id: folderId } : x));
    const res = await fetch(`/api/chats/${chatId}/folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) {
      setChats(prev);
      showToast('جابجایی ناموفق');
      return;
    }
    showToast(folderId ? 'به پوشه منتقل شد' : 'از پوشه خارج شد');
    router.refresh();
  };

  const openMenu = (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMoveModal(null);
    setMenu({
      chatId,
      x: Math.min(r.right, window.innerWidth - 12),
      y: Math.min(r.bottom + 4, window.innerHeight - 180),
    });
  };

  // ---- Filtering ----
  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, query]);

  const pinned = filteredChats.filter((c) => c.is_pinned);
  const looseChats = filteredChats.filter((c) => !c.is_pinned && !c.folder_id);

  // ---- Render helpers ----
  const renderMenuPortal = () => {
    if (!menu || !mounted) return null;
    const chat = chats.find((c) => c.id === menu.chatId);
    if (!chat) return null;

    return createPortal(
      <>
        <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={closeAll} />
        <div
          className="fixed w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            top: menu.y,
            right: Math.max(8, window.innerWidth - menu.x),
            zIndex: 9999,
          }}
          dir="rtl"
        >
          <button
            onClick={() => handlePin(chat)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 transition"
          >
            {chat.is_pinned ? <PinOff className="w-3.5 h-3.5 text-amber-500" /> : <Pin className="w-3.5 h-3.5 text-amber-500" />}
            <span>{chat.is_pinned ? 'برداشتن پین' : 'پین کردن'}</span>
          </button>
          <button
            onClick={() => { setMenu(null); setMoveModal(chat.id); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 transition border-t border-slate-100 dark:border-slate-800"
          >
            <FolderInput className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>انتقال به پوشه</span>
          </button>
          <button
            onClick={() => handleDelete(chat.id)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border-t border-slate-100 dark:border-slate-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف</span>
          </button>
        </div>
      </>,
      document.body
    );
  };

  const renderMoveModal = () => {
    if (!moveModal || !mounted) return null;
    const chat = chats.find((c) => c.id === moveModal);
    if (!chat) return null;

    return createPortal(
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 999999 }}
        dir="rtl"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAll} />
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">انتقال به پوشه</p>
            <button
              onClick={closeAll}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            <button
              onClick={() => moveChat(chat.id, null)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition ${
                !chat.folder_id
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FolderX className="w-4 h-4 text-slate-400 shrink-0" />
              <span>بدون پوشه</span>
            </button>

            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => moveChat(chat.id, f.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition ${
                  chat.folder_id === f.id
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Folder className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="truncate flex-1 text-right">{f.name}</span>
                {chat.folder_id === f.id && <span className="text-[10px]">فعلی</span>}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={async () => {
                const folder = await createFolder();
                if (folder) moveChat(chat.id, folder.id);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
            >
              <FolderPlus className="w-4 h-4" />
              <span>پوشه جدید بساز و منتقل کن</span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Chat row (used in both tabs, variant changes with context)
  const renderChatRow = (c: Chat, variant: 'list' | 'in-folder') => {
    const active = pathname === `/chat/${c.id}`;
    return (
      <li key={c.id} className="relative group">
        <Link
          href={`/chat/${c.id}`}
          onClick={onClose}
          className={`flex items-center gap-2 ps-2.5 pe-10 py-2.5 rounded-xl transition ${
            active
              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {c.is_pinned ? (
            <Pin className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-500" />
          ) : (
            <MessageSquare className="w-4 h-4 shrink-0" />
          )}
          <span className="text-xs font-semibold truncate flex-1">{c.title}</span>
        </Link>

        <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 ${active ? 'opacity-100' : 'opacity-60 sm:opacity-0 sm:group-hover:opacity-100'} transition-opacity`}>
          {variant === 'in-folder' ? (
            <button
              onClick={(e) => { e.preventDefault(); handleDelete(c.id); }}
              disabled={busyId === c.id}
              title="حذف"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              onClick={(e) => openMenu(c.id, e)}
              title="گزینه‌ها"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {renderMenuPortal()}
      {renderMoveModal()}

      {/* Header */}
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

      {/* New chat */}
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

      {/* Tabs */}
      <div className="px-3 pb-3 shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950">
          <button
            onClick={() => setTab('chats')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'chats'
                ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            گفتگوها
          </button>
          <button
            onClick={() => setTab('folders')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'folders'
                ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            پوشه‌ها
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی گفتگو..."
            className="w-full ps-9 pe-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {tab === 'chats' && (
          <>
            {filteredChats.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8 px-4">
                {query ? 'چیزی پیدا نشد.' : 'هنوز گفتگویی ندارید.'}
              </p>
            ) : (
              <>
                {pinned.length > 0 && (
                  <>
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 px-3 pt-3 pb-1 flex items-center gap-1.5">
                      <Pin className="w-3 h-3 fill-current" />
                      پین‌شده‌ها ({pinned.length}/۴)
                    </p>
                    <ul className="space-y-0.5">{pinned.map((c) => renderChatRow(c, 'list'))}</ul>
                  </>
                )}
                {looseChats.length > 0 && (
                  <>
                    {pinned.length > 0 && (
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-3 pt-4 pb-1">
                        گفتگوهای اخیر
                      </p>
                    )}
                    <ul className="space-y-0.5">{looseChats.map((c) => renderChatRow(c, 'list'))}</ul>
                  </>
                )}
              </>
            )}
          </>
        )}

        {tab === 'folders' && (
          <>
            {folders.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  هنوز پوشه‌ای ندارید.
                </p>
                <button
                  onClick={createFolder}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-md shadow-brand-500/20"
                >
                  <FolderPlus className="w-4 h-4" />
                  افزودن پوشه
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={createFolder}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mb-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  پوشه جدید
                </button>

                {folders.map((f) => {
                  const folderChats = filteredChats.filter((c) => c.folder_id === f.id);
                  const isOpen = expanded[f.id] !== false;
                  return (
                    <div key={f.id} className="mb-1">
                      <div className="flex items-center gap-1 px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition group">
                        <button
                          onClick={() => setExpanded((e) => ({ ...e, [f.id]: !isOpen }))}
                          className="flex items-center gap-2 flex-1 min-w-0 text-right"
                        >
                          {isOpen ? (
                            <FolderOpen className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                          ) : (
                            <Folder className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex-1">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {folderChats.length}
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
                        <ul className="space-y-0.5 ps-3">{folderChats.map((c) => renderChatRow(c, 'in-folder'))}</ul>
                      )}
                      {isOpen && folderChats.length === 0 && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 px-3 py-1.5">
                          خالی — از تب گفتگوها به این پوشه منتقل کنید
                        </p>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
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
