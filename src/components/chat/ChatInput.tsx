'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, Lightbulb, Loader2, Mic, Plus,
  Sparkles, TrendingUp, BarChart3,
} from 'lucide-react';

const SUGGESTIONS = [
  'این سند را در سه نکته کلیدی خلاصه کن.',
  'نویسنده به چه نتیجه‌گیری اصلی رسیده است؟',
  'چالش‌ها و محدودیت‌های مطرح‌شده چیست؟',
];

export function ChatInput({
  onSend,
  onNewChat,
  streaming,
  onAnalyze,
}: {
  onSend: (text: string) => void;
  onNewChat: () => void;
  streaming: boolean;
  onAnalyze: (kind: 'analysis' | 'mindmap') => void;
}) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const startListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('مرورگر شما از تبدیل گفتار به متن پشتیبانی نمی‌کند. از Chrome استفاده کنید.');
      return;
    }
    const rec = new SR();
    rec.lang = 'fa-IR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const submit = () => {
    const content = input.trim();
    if (!content || streaming) return;
    onSend(content);
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

        {/* DeepSeek-style rounded container */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition p-2">

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="سوالی درباره این سند بپرسید..."
            disabled={streaming}
            className="w-full resize-none bg-transparent outline-none border-0 px-2 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-60"
          />

          {/* Bottom actions row */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <div className="flex items-center gap-0.5 relative">
              {/* Attach (new chat) */}
              <button
                type="button"
                onClick={onNewChat}
                title="سند جدید"
                className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* + menu (analyze / mindmap) */}
              <button
                type="button"
                onClick={() => setShowMenu((v) => !v)}
                title="ابزارهای بیشتر"
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition ${
                  showMenu
                    ? 'bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <Plus className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-45' : ''}`} />
              </button>

              {showMenu && (
                <div className="absolute bottom-11 right-0 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <button
                    onClick={() => { setShowMenu(false); onAnalyze('analysis'); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 transition"
                  >
                    <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>تحلیل سند</span>
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); onAnalyze('mindmap'); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 transition border-t border-slate-100 dark:border-slate-800"
                  >
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>نقشه ذهنی</span>
                  </button>
                </div>
              )}

              {/* Lightbulb suggestions */}
              <button
                type="button"
                onClick={() => setShowSuggestions((v) => !v)}
                title="سوالات پیشنهادی"
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition ${
                  showSuggestions
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <Lightbulb className={`w-4 h-4 ${showSuggestions ? 'fill-amber-400 dark:fill-amber-500' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* Mic (speech to text) */}
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                title={listening ? 'توقف ضبط' : 'گفتار به متن'}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition ${
                  listening
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send */}
              <button
                type="button"
                onClick={submit}
                disabled={streaming || !input.trim()}
                className="w-9 h-9 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white flex items-center justify-center transition disabled:opacity-40 shadow-sm"
              >
                {streaming
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4 -scale-x-100" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
