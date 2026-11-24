'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Folder, MoreVertical, Plus, HardDrive, MessageSquare, Layers } from 'lucide-react';

export function DocumentsClient({ chats, folders, email }: { chats: any[], folders: any[], email: string }) {
  const [query, setQuery] = useState('');

  const filtered = chats.filter(c => 
    (c.file_name || c.title || '').toLowerCase().includes(query.toLowerCase())
  );

  const totalFiles = chats.length;
  const totalSizeBytes = chats.reduce((acc, c) => acc + (c.file_size || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  const totalPages = chats.reduce((acc, c) => acc + (c.page_count || 0), 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mb-1">اسناد من</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">مدیریت، سازماندهی و گفتگو با اسناد آپلود شده.</p>
        </div>
        <Link href="/chat" className="flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-black font-bold text-sm rounded-xl transition shadow-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> آپلود سند جدید
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 mb-1">کل اسناد</span>
          <div className="flex items-end gap-2"><span className="text-2xl font-black text-neutral-900 dark:text-white">{totalFiles}</span><FileText className="w-4 h-4 text-neutral-400 mb-1" /></div>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 mb-1">فضای مصرفی</span>
          <div className="flex items-end gap-2"><span className="text-2xl font-black text-neutral-900 dark:text-white" dir="ltr">{totalSizeMB} MB</span><HardDrive className="w-4 h-4 text-neutral-400 mb-1" /></div>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 mb-1">گفتگوهای فعال</span>
          <div className="flex items-end gap-2"><span className="text-2xl font-black text-neutral-900 dark:text-white">{totalFiles}</span><MessageSquare className="w-4 h-4 text-brand-cobalt dark:text-brand-blue mb-1" /></div>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 mb-1">صفحات پردازش‌شده</span>
          <div className="flex items-end gap-2"><span className="text-2xl font-black text-neutral-900 dark:text-white">{totalPages}</span><Layers className="w-4 h-4 text-gold-500 mb-1" /></div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute right-3 top-3 w-4 h-4 text-neutral-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در نام اسناد..." className="w-full bg-white dark:bg-[#1E1E1E] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-brand-cobalt transition-all shadow-sm" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-start">
        {filtered.map(chat => {
          const folder = folders.find(f => f.id === chat.folder_id);
          return (
            <div key={chat.id} className="bg-white dark:bg-[#1E1E1E] border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 flex flex-col group relative shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 truncate" title={chat.file_name}>{chat.file_name}</h3>
              <div className="flex flex-col gap-0.5 mb-4">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 dir-ltr text-right">{((chat.file_size || 0)/(1024*1024)).toFixed(1)} MB • {chat.page_count} صفحه</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{formatDate(chat.created_at)}</p>
              </div>
              <div className="mt-auto pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  {folder ? <><Folder className="w-4 h-4 text-brand-cobalt" /><span>{folder.name}</span></> : <span>-</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/chat/${chat.id}`} className="px-3 py-1.5 rounded-lg bg-gold-500 text-black text-xs font-bold hover:bg-gold-600 transition shadow-sm">گفتگو</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
