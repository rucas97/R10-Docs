'use client';

import { useState } from 'react';
import { Send, Paperclip, Lightbulb, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  'این سند را در سه نکته کلیدی خلاصه کن.',
  'نویسنده به چه نتیجه‌گیری اصلی رسیده است؟',
  'چالش‌ها و محدودیت‌های مطرح‌شده چیست؟',
];

export function ChatInput({
  onSend,
  onNewChat,
  streaming,
}: {
  onSend: (text: string) => void;
  onNewChat: () => void;
  streaming: boolean;
}) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    onSend(input);
    setInput('');
    setShowSuggestions(false);
  };

  return (
    <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-4">
      <div className="max-w-3xl mx-auto min-w-0">
        {showSuggestions && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onSend(s); setShowSuggestions(false); }}
                disabled={streaming}
                className="text-xs px-3 py-2 rounded-xl bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 border border-brand-200 dark:border-slate-700 text-brand-700 dark:text-brand-300 transition disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
          <button
            type="button"
            onClick={onNewChat}
            title="سند جدید"
            className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowSuggestions((v) => !v)}
            title="سوالات پیشنهادی"
            className={`w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-2xl flex items-center justify-center transition ${
              showSuggestions
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lightbulb className={`w-4 h-4 sm:w-5 sm:h-5 ${showSuggestions ? 'fill-amber-400 dark:fill-amber-500' : ''}`} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="سوالی درباره این سند..."
            disabled={streaming}
            className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white flex items-center justify-center transition disabled:opacity-50 shadow-md shadow-brand-500/20"
          >
            {streaming
              ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              : <Send className="w-4 h-4 sm:w-5 sm:h-5 -scale-x-100" />}
          </button>
        </form>
      </div>
    </div>
  );
}
