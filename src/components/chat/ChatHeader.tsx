'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { FileText, MoreVertical, Download, RefreshCw, Trash2, Loader2 } from 'lucide-react';
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
    setMenuPos({ 
      x: r.right, 
      y: Math.min(r.bottom + 4, window.innerHeight - 220) 
    });
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
        className="fixed w-56 bg-white dark:bg-surface-card border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          top: menuPos.y,
          right: Math.max(8, Math.min(window.innerWidth - menuPos.x, window.innerWidth - 240)),
          zIndex: 9999,
        }}
        dir="rtl"
      >
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-brand-cobalt" />}
          <span>خروجی PDF از گفتگو</span>
        </button>

        <button
          onClick={handleReset}
          disabled={busy === 'reset'}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-gold-50 dark:hover:bg-gold-900/20 transition border-t border-neutral-100 dark:border-neutral-800 disabled:opacity-50"
        >
          {busy === 'reset' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-gold-600" />}
          <span>بازنشانی گفتگو</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={busy === 'delete'}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border-t border-neutral-100 dark:border-neutral-800 disabled:opacity-50"
        >
          {busy === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          <span>حذف گفتگو</span>
        </button>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="hidden xl:flex h-16 items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-surface-card/50 backdrop-blur-sm shrink-0">
      {menu}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-brand-cobaltLight dark:bg-brand-cobalt/20 flex items-center justify-center text-brand-cobalt shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{chat.fileName}</p>
          <p className="text-[11px] text-neutral-500">{toPersianNumber(chat.pageCount)} صفحه</p>
        </div>
      </div>
      
      <button
        ref={btnRef}
        onClick={openMenu}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-brand-cobalt transition shrink-0"
        title="گزینه‌های بیشتر"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
}
