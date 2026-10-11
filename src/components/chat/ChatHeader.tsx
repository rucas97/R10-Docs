'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { FileText, MoreVertical, Download, RefreshCw, Trash2, Loader2, X } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

export function ChatHeader({
  chat,
  messages,
}: {
  chat: { id: string; fileName: string; pageCount: number };
  messages: Msg[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const openMenu = () => {
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    setMenuPos({ x: r.right, y: Math.min(r.bottom + 4, window.innerHeight - 220) });
    setOpen(true);
  };

  const handleExport = async () => {
    setOpen(false);
    setExporting(true);
    try {
      const { exportChatToPdf } = await import('./exportChatPdf');
      await exportChatToPdf(chat.fileName, messages);
    } catch (e) {
      console.error('[export] failed:', e);
      alert('خروجی PDF ناموفق بود.');
    } finally {
      setExporting(false);
    }
  };

  const handleReset = async () => {
    setOpen(false);
    if (!confirm('همه پیام‌های این گفتگو پاک شوند؟ سند باقی می‌ماند.')) return;
    setBusy('reset');
    const res = await fetch(`/api/chats/${chat.id}/reset`, { method: 'POST' });
    setBusy(null);
    if (res.ok) router.refresh();
    else alert('بازنشانی ناموفق بود.');
  };

  const handleDelete = async () => {
    setOpen(false);
    if (!confirm('این گفتگو کاملاً حذف شود؟')) return;
    setBusy('delete');
    const res = await fetch(`/api/chats/${chat.id}`, { method: 'DELETE' });
    setBusy(null);
    if (res.ok) {
      router.push('/chat');
      router.refresh();
    } else alert('حذف ناموفق بود.');
  };

  const menu = open && mounted ? createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
      <div
        className="fixed w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          top: Math.max(8, menuPos.y),
          right: Math.max(8, Math.min(window.innerWidth - menuPos.x, window.innerWidth - 240)),
          zIndex: 9999,
        }}
        dir="rtl"
      >
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
          <span>خروجی PDF از گفتگو</span>
        </button>

        <button
          onClick={handleReset}
          disabled={busy === 'reset'}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition border-t border-slate-100 dark:border-slate-800 disabled:opacity-50"
        >
          {busy === 'reset' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          <span>بازنشانی گفتگو</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={busy === 'delete'}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border-t border-slate-100 dark:border-slate-800 disabled:opacity-50"
        >
          {busy === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          <span>حذف گفتگو</span>
        </button>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="h-14 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      {menu}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {chat.fileName}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {toPersianNumber(chat.pageCount)} صفحه
          </p>
        </div>
      </div>

      <button
        ref={btnRef}
        onClick={openMenu}
        title="گزینه‌های بیشتر"
        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
}
