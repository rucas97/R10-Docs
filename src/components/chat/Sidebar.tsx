'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, MessageSquare, Loader2, Trash2, Pin, PinOff, FolderPlus, Folder, FolderOpen, ChevronDown, MoreVertical, Search, FolderInput, X } from 'lucide-react';
import { ProfileMenu } from './ProfileMenu';
import { DocwizeLogo } from '@/components/DocwizeLogo';

type Chat = { id: string; title: string; updated_at: string; is_pinned: boolean | null; pinned_at: string | null; folder_id: string | null; };
type FolderT = { id: string; name: string; created_at: string; };

export function Sidebar({ user, chats: initialChats, folders: initialFolders, onClose }: { user: { email: string; id: string }; chats: Chat[]; folders: FolderT[]; onClose: () => void; }) {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState(initialChats);
  const [folders, setFolders] = useState(initialFolders);
  const [tab, setTab] = useState<'chats' | 'folders'>('chats');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
  const [moveModal, setMoveModal] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setChats(initialChats); }, [initialChats]);
  useEffect(() => { setFolders(initialFolders); }, [initialFolders]);

  const handleDelete = async (id: string) => {
    setMenu(null);
    if (!confirm('این گفتگو حذف شود؟')) return;
    const prev = chats;
    setChats((c) => c.filter((x) => x.id !== id));
    setBusyId(id);
    const res = await fetch(`/api/chats/${id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!res.ok) { setChats(prev); alert('حذف ناموفق بود'); return; }
    if (pathname === `/chat/${id}`) router.push('/chat');
    router.refresh();
  };

  const handlePin = async (chat: Chat) => {
    setMenu(null);
    setBusyId(chat.id);
    const method = chat.is_pinned ? 'DELETE' : 'POST';
    const prev = chats;
    setChats((c) => c.map((x) => x.id === chat.id ? { ...x, is_pinned: !chat.is_pinned } : x));
    const res = await fetch(`/api/chats/${chat.id}/pin`, { method });
    setBusyId(null);
    if (!res.ok) { setChats(prev); }
    else router.refresh();
  };

  const createFolder = async (): Promise<FolderT | null> => {
    const name = prompt('نام پوشه جدید:');
    if (!name || !name.trim()) return null;
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) return null;
    const { folder } = await res.json();
    setFolders((f) => [...f, folder]);
    setExpanded((e) => ({ ...e, [folder.id]: true }));
    router.refresh();
    return folder;
  };

  const moveChat = async (chatId: string, folderId: string | null) => {
    setMoveModal(null);
    const prev = chats;
    setChats((c) => c.map((x) => x.id === chatId ? { ...x, folder_id: folderId } : x));
    const res = await fetch(`/api/chats/${chatId}/folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) setChats(prev);
    else router.refresh();
  };

  const openMenu = (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMoveModal(null);
    setMenu({ chatId, x: Math.min(r.right, window.innerWidth - 200), y: Math.min(r.bottom + 4, window.innerHeight - 200) });
  };

  const filteredChats = chats.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));
  const pinned = filteredChats.filter((c) => c.is_pinned);
  const looseChats = filteredChats.filter((c) => !c.is_pinned && !c.folder_id);

  const renderChatRow = (c: Chat, variant: 'list' | 'in-folder') => {
    const active = pathname === `/chat/${c.id}`;
    return (
      <li key={c.id} className="relative group">
        <Link href={`/chat/${c.id}`} onClick={onClose} className={`flex items-center gap-2 px-2.5 py-3 rounded-xl transition ${active ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 font-semibold'}`}>
          {c.is_pinned ? <Pin className="w-4 h-4 shrink-0 text-gold-500 fill-gold-500" /> : <MessageSquare className="w-4 h-4 shrink-0" />}
          <span className="text-xs truncate flex-1">{c.title}</span>
        </Link>
        <div className="absolute left-1.5 top-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          {variant === 'in-folder' ? (
            <button onClick={(e) => { e.preventDefault(); handleDelete(c.id); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={(e) => openMenu(c.id, e)} className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Mobile Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800 lg:hidden">
        <span className="font-black text-sm text-neutral-900 dark:text-white">گفتگوها</span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"><X className="w-5 h-5" /></button>
      </div>

      {/* Desktop Logo */}
      <div className="hidden lg:flex h-16 items-center px-4 border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/" className="flex items-center gap-2.5 group">
          <DocwizeLogo className="w-8 h-8 text-gold-500 group-hover:scale-105 transition-transform" />
          <span className="font-black text-lg text-neutral-900 dark:text-white">Docwize</span>
        </Link>
      </div>

      <div className="p-3">
        <Link href="/chat" onClick={onClose} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-gold-500 text-black text-sm font-bold shadow-sm shadow-gold-500/20 hover:bg-gold-600 transition active:scale-95">
          <Plus className="w-4 h-4" />
          گفتگوی جدید
        </Link>
      </div>

      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-surface-aiBubbleDark">
          <button onClick={() => setTab('chats')} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${tab === 'chats' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
            <MessageSquare className="w-3.5 h-3.5" /> گفتگوها
          </button>
          <button onClick={() => setTab('folders')} className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${tab === 'folders' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}>
            <Folder className="w-3.5 h-3.5" /> پوشه‌ها
          </button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-neutral-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجوی گفتگو..." className="w-full pr-9 pl-3 py-2 rounded-xl bg-neutral-100 dark:bg-surface-aiBubbleDark text-xs border border-transparent focus:border-neutral-300 dark:focus:border-neutral-600 outline-none transition" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {tab === 'chats' && (
          <>
            {pinned.length > 0 && (
              <>
                <p className="text-[10px] font-black text-gold-500 px-3 pt-3 pb-1 flex items-center gap-1.5"><Pin className="w-3 h-3 fill-current" /> پین‌شده‌ها</p>
                <ul className="space-y-0.5">{pinned.map(c => renderChatRow(c, 'list'))}</ul>
              </>
            )}
            {looseChats.length > 0 && (
              <>
                <p className="text-[10px] font-black text-neutral-400 px-3 pt-3 pb-1">گفتگوهای اخیر</p>
                <ul className="space-y-0.5">{looseChats.map(c => renderChatRow(c, 'list'))}</ul>
              </>
            )}
          </>
        )}

        {tab === 'folders' && (
          <>
            <button onClick={createFolder} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mb-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-200 text-xs font-bold transition">
              <FolderPlus className="w-3.5 h-3.5" /> پوشه جدید
            </button>
            {folders.map(f => {
              const folderChats = filteredChats.filter(c => c.folder_id === f.id);
              const isOpen = expanded[f.id] !== false;
              return (
                <div key={f.id} className="mb-1">
                  <button onClick={() => setExpanded(e => ({ ...e, [f.id]: !isOpen }))} className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                    {isOpen ? <FolderOpen className="w-4 h-4 text-gold-500 shrink-0" /> : <Folder className="w-4 h-4 text-gold-500 shrink-0" />}
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate flex-1 text-right">{f.name}</span>
                    <span className="text-[10px] text-neutral-400">{folderChats.length}</span>
                  </button>
                  {isOpen && folderChats.length > 0 && <ul className="space-y-0.5 ps-3">{folderChats.map(c => renderChatRow(c, 'in-folder'))}</ul>}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        <ProfileMenu email={user.email} />
        <span className="text-xs font-semibold truncate flex-1 text-neutral-700 dark:text-neutral-300">{user.email}</span>
      </div>

      {/* Menus */}
      {menu && mounted && createPortal(
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setMenu(null)} />
          <div className="fixed w-48 bg-white dark:bg-surface-aiBubbleDark border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden" style={{ top: menu.y, left: menu.x, zIndex: 9999 }} dir="rtl">
            <button onClick={() => handlePin(chats.find(c => c.id === menu.chatId)!)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
              <Pin className="w-3.5 h-3.5 text-gold-500" /> برداشتن/پین کردن
            </button>
            <button onClick={() => { setMenu(null); setMoveModal(menu.chatId); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition border-t border-neutral-100 dark:border-neutral-800">
              <FolderInput className="w-3.5 h-3.5 text-brand-cobalt" /> انتقال به پوشه
            </button>
            <button onClick={() => handleDelete(menu.chatId)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border-t border-neutral-100 dark:border-neutral-800">
              <Trash2 className="w-3.5 h-3.5" /> حذف
            </button>
          </div>
        </>, document.body
      )}

      {moveModal && mounted && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 999999 }} dir="rtl">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMoveModal(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-surface-aiBubbleDark rounded-3xl shadow-2xl overflow-hidden p-4">
            <h3 className="text-sm font-black text-neutral-900 dark:text-white mb-4">انتقال به پوشه</h3>
            <div className="max-h-60 overflow-y-auto space-y-1">
              <button onClick={() => moveChat(moveModal, null)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                <X className="w-4 h-4" /> بدون پوشه
              </button>
              {folders.map(f => (
                <button key={f.id} onClick={() => moveChat(moveModal, f.id)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                  <Folder className="w-4 h-4 text-gold-500" /> {f.name}
                </button>
              ))}
            </div>
            <button onClick={async () => { const f = await createFolder(); if (f) moveChat(moveModal, f.id); }} className="w-full mt-4 py-2.5 rounded-xl bg-brand-cobalt text-white text-xs font-bold">پوشه جدید +</button>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
