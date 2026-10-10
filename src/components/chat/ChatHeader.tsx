'use client';

import { useRouter } from 'next/navigation';
import { FileText, Plus, Download, ExternalLink, MessageSquare } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

export function ChatHeader({
  chat,
}: {
  chat: { id: string; fileName: string; pageCount: number };
}) {
  const router = useRouter();

  return (
    <div className="h-14 shrink-0 flex items-center justify-between gap-3 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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

      <div className="flex items-center gap-0.5 shrink-0">
        <a
          href={`/api/pdf/${chat.id}`}
          target="_blank"
          rel="noreferrer"
          title="باز کردن PDF"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <a
          href={`/api/pdf/${chat.id}`}
          download
          title="دانلود"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Download className="w-4 h-4" />
        </a>
        <button
          onClick={() => router.push('/chat')}
          title="گفتگوی جدید"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
