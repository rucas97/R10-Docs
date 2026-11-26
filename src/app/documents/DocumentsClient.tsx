'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Folder, Plus, HardDrive, MessageSquare, Layers, X, Info, Image as ImageIcon, FileSpreadsheet, Presentation } from 'lucide-react';

type Chat = {
  id: string;
  title: string;
  file_name: string;
  file_size: number;
  page_count: number;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  primary_language: string;
};
type FolderT = { id: string; name: string };

export function DocumentsClient({ chats, folders }: { chats: Chat[], folders: FolderT[], email: string }) {
  const [query, setQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Chat | null>(null);

  // Moved formatSize to the top to prevent hoisting errors
  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '۰ KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const filtered = chats.filter(c => 
    (c.file_name || c.title || '').toLowerCase().includes(query.toLowerCase())
  );

  const totalFiles = chats.length;
  const totalSizeBytes = chats.reduce((acc, c) => acc + (Number(c.file_size) || (c.page_count * 120000) || 50000), 0);
  const totalSizeFormatted = formatSize(totalSizeBytes);
  const totalPages = chats.reduce((acc, c) => acc + (c.page_count || 0), 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const calcReadingTime = (pages: number) => {
    const totalMinutes = Math.round(pages * 1.25);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) return `${hrs} ساعت و ${mins} دقیقه`;
    return `${mins} دقیقه`;
  };

  const calcHostingEnd = (createdAt: string) => {
    const uploadDate = new Date(createdAt);
    const endDate = new Date(uploadDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysLeft > 0 ? `${daysLeft} روز دیگر` : 'منقضی شده';
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 mb-1">کل اسناد</span>
          <div className="flex items-end gap-2"><span className="text-2xl font-black text-neutral-900 dark:text-white">{totalFiles}</span><FileText className="w-4 h-4 text-neutral-400 mb-1" /></div>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
          <span className="text-xs font-semibold text-neutral-500 mb-1">فضای مصرفی</span>
          <div className="flex items-end gap-2"><span className="text-2xl font-black text-neutral-900 dark:text-white" dir="ltr">{totalSizeFormatted}</span><HardDrive className="w-4 h-4 text-neutral-400 mb-1" /></div>
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

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute right-3 top-3 w-4 h-4 text-neutral-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در نام اسناد..." className="w-full bg-white dark:bg-[#1E1E1E] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-sm rounded-xl pr-10 pl-4 py-2.5 outline-none focus:border-brand-cobalt transition-all shadow-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-start">
        {filtered.map(chat => {
          const folder = folders.find(f => f.id === chat.folder_id);
          return (
            <div key={chat.id} onClick={() => setSelectedDoc(chat)} className="bg-white dark:bg-[#1E1E1E] border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 flex flex-col group relative shadow-sm cursor-pointer hover:border-brand-cobalt dark:hover:border-brand-blue transition-colors">
              <div className="flex items-start justify-between mb-3">
                {(() => {
                const ext = chat.file_name.split('.').pop()?.toLowerCase();
                if (ext === 'pdf') return <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center"><FileText className="w-5 h-5" /></div>;
                if (['jpg','jpeg','png'].includes(ext || '')) return <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><ImageIcon className="w-5 h-5" /></div>;
                if (ext === 'xlsx') return <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center"><FileSpreadsheet className="w-5 h-5" /></div>;
                if (ext === 'pptx') return <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center"><Presentation className="w-5 h-5" /></div>;
                return <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><FileText className="w-5 h-5" /></div>;
              })()}
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1 truncate" title={chat.file_name}>{chat.file_name}</h3>
              <div className="flex flex-col gap-0.5 mb-4">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 dir-ltr text-right">{formatSize(Number(chat.file_size) || (chat.page_count * 120000) || 50000)} • {chat.page_count} صفحه</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{formatDate(chat.created_at)}</p>
              </div>
              <div className="mt-auto pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  {folder ? <><Folder className="w-4 h-4 text-brand-cobalt" /><span>{folder.name}</span></> : <span>-</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/chat/${chat.id}`} onClick={(e) => e.stopPropagation()} className="px-3 py-1.5 rounded-lg bg-gold-500 text-black text-xs font-bold hover:bg-gold-600 transition shadow-sm">گفتگو</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center pointer-events-none" dir="rtl">
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 pointer-events-auto backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#1A1A1A] sm:rounded-3xl rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[85vh] sm:max-h-[90vh] transform transition-transform duration-300 translate-y-0">
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-pointer" onClick={() => setSelectedDoc(null)}>
              <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full"></div>
            </div>
            <div className="sticky top-0 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-start justify-between z-10 sm:rounded-t-3xl">
              <div className="flex items-start gap-3 min-w-0">
                {(() => {
                  const ext = selectedDoc.file_name.split('.').pop()?.toLowerCase();
                  if (ext === 'pdf') return <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 mt-0.5"><FileText className="w-5 h-5" /></div>;
                  if (['jpg','jpeg','png'].includes(ext || '')) return <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5"><ImageIcon className="w-5 h-5" /></div>;
                  if (ext === 'xlsx') return <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5"><FileSpreadsheet className="w-5 h-5" /></div>;
                  if (ext === 'pptx') return <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 mt-0.5"><Presentation className="w-5 h-5" /></div>;
                  return <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5"><FileText className="w-5 h-5" /></div>;
                })()}
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">{selectedDoc.file_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {selectedDoc.folder_id ? (
                      <><Folder className="w-3.5 h-3.5 text-brand-cobalt" /><span>{folders.find(f => f.id === selectedDoc.folder_id)?.name}</span></>
                    ) : (<span>-</span>)}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 transition shrink-0 mt-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 pb-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-500">فرمت فایل</span>
                  <div className="flex items-center gap-1.5">
                  {(() => {
                    const ext = selectedDoc.file_name.split('.').pop()?.toLowerCase() || 'pdf';
                    const colors: Record<string, string> = { pdf: 'text-red-500', docx: 'text-blue-500', xlsx: 'text-green-500', pptx: 'text-orange-500', jpg: 'text-purple-500', jpeg: 'text-purple-500', png: 'text-purple-500' };
                    const Icon = ['jpg','jpeg','png'].includes(ext) ? ImageIcon : ext === 'xlsx' ? FileSpreadsheet : ext === 'pptx' ? Presentation : FileText;
                    return <><Icon className={`w-4 h-4 ${colors[ext] || 'text-neutral-500'}`} /><span className="text-sm font-normal text-neutral-900 dark:text-white uppercase dir-ltr">{ext}</span></>;
                  })()}
                </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-500">تاریخ بارگذاری</span>
                  <span className="text-sm font-normal text-neutral-900 dark:text-white">{formatDate(selectedDoc.created_at)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-500">حجم فایل</span>
                  <span className="text-sm font-normal text-neutral-900 dark:text-white dir-ltr text-right">{formatSize(Number(selectedDoc.file_size) || (selectedDoc.page_count * 120000) || 50000)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-500">تعداد صفحات</span>
                  <span className="text-sm font-normal text-neutral-900 dark:text-white">{selectedDoc.page_count} صفحه</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1"><span className="text-[11px] text-neutral-500">تخمین زمان صرفه‌جویی</span><Info className="w-3 h-3 text-neutral-400" /></div>
                  <span className="text-sm font-normal text-neutral-900 dark:text-white">{calcReadingTime(selectedDoc.page_count)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-500">زبان سند</span>
                  <span className="text-sm font-normal text-neutral-900 dark:text-white">{selectedDoc.primary_language === 'fa' ? 'فارسی' : 'انگلیسی'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-500">زمان پایان میزبانی سند</span>
                  <span className="text-sm font-normal text-neutral-900 dark:text-white">{calcHostingEnd(selectedDoc.created_at)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-neutral-500">آخرین تعامل با سند</span>
                  <span className="text-sm font-normal text-neutral-900 dark:text-white">{formatDate(selectedDoc.updated_at || selectedDoc.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-[#151515] rounded-b-3xl">
               <Link href={`/chat/${selectedDoc.id}`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold-500 text-black font-bold text-sm hover:bg-gold-600 transition">
                 <MessageSquare className="w-4 h-4" /> باز کردن گفتگو
               </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
