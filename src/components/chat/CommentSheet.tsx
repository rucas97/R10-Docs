'use client';

import { useEffect, useState } from 'react';
import { X, Send, Loader2, Trash2, MessageSquare } from 'lucide-react';

type Comment = { id: string; content: string; created_at: string };

export function CommentSheet({
  messageId,
  onClose,
  onCountChange,
}: {
  messageId: string;
  onClose: () => void;
  onCountChange: (n: number) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/comments?messageId=${messageId}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments ?? []);
      onCountChange((data.comments ?? []).length);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [messageId]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, content }),
    });
    if (res.ok) {
      setInput('');
      await load();
    }
    setSending(false);
  };

  const remove = async (id: string) => {
    if (!confirm('این کامنت حذف شود؟')) return;
    await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[80vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              یادداشت‌های من
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
              هنوز یادداشتی ثبت نکرده‌اید.
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="group flex items-start gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <p className="flex-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {c.content}
                </p>
                <button
                  onClick={() => remove(c.id)}
                  className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="یادداشتی اضافه کنید..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -scale-x-100" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
