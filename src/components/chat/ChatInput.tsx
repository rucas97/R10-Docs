'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Lightbulb, Loader2, Mic, Plus, TrendingUp, BarChart3, X } from 'lucide-react';
import { usePrefs } from '@/lib/preferences';

const FALLBACK = ['این سند را خلاصه کن.', 'نتیجه‌گیری اصلی چیست؟', 'چالش‌ها چیست؟'];

export function ChatInput({ onSend, streaming, onAnalyze, suggestions, replyTo, onCancelReply }: any) {
  const prefs = usePrefs();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const items = (suggestions && suggestions.length > 0) ? suggestions : FALLBACK;

  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'; } }, [input]);

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return alert('مرورگر شما از تبدیل گفتار به متن پشتیبانی نمی‌کند.');
    const rec = new SR(); rec.lang = 'fa-IR'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => { let t = ''; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; setInput(t); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start(); recognitionRef.current = rec; setListening(true);
  };
  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };
  const submit = () => { const content = input.trim(); if (!content || streaming) return; onSend(content); setInput(''); setShowSuggestions(false); };

  return (
    <div className="shrink-0 bg-gradient-to-t from-surface-canvas via-surface-canvas to-transparent dark:from-surface-canvasDark dark:via-surface-canvasDark p-3 xl:p-6 pt-0">
      <div className="max-w-3xl mx-auto min-w-0">
        {replyTo && (
          <div className="mb-2 flex items-start gap-2 px-3 py-2 rounded-2xl bg-neutral-100 dark:bg-surface-aiBubbleDark border border-neutral-200 dark:border-neutral-800 border-e-4 border-e-brand-cobalt">
            <div className="flex-1 min-w-0"><p className="text-[10px] font-black text-neutral-500 mb-0.5">{replyTo.role === 'user' ? 'پاسخ به پیام شما' : 'پاسخ به دستیار'}</p><p className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate">{replyTo.content.slice(0, 160)}</p></div>
            <button onClick={onCancelReply} className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-200"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {showSuggestions && <div className="mb-3 flex flex-col gap-2">{items.map((s: string) => <button key={s} onClick={() => { onSend(s); setShowSuggestions(false); }} className="text-right text-xs px-4 py-3 rounded-2xl bg-white dark:bg-surface-aiBubbleDark border border-neutral-200 dark:border-neutral-700 hover:border-gold-500 transition">{s}</button>)}</div>}

        <div className="rounded-3xl border border-neutral-500 dark:border-neutral-400 bg-white dark:bg-surface-inputDark p-2 focus-within:border-brand-cobalt focus-within:ring-2 focus-within:ring-brand-cobalt/20 transition">
          <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} rows={1} placeholder="سوالی درباره این سند بپرسید..." disabled={streaming} className="w-full resize-none bg-transparent outline-none px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 max-h-32 min-h-[44px]" />
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center gap-0.5 relative">
              <button onClick={() => setShowMenu(v => !v)} className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"><Plus className={`w-5 h-5 transition-transform ${showMenu ? 'rotate-45' : ''}`} /></button>
              {showMenu && <div className="absolute bottom-11 right-0 w-52 bg-white dark:bg-surface-aiBubbleDark border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <button onClick={() => { setShowMenu(false); onAnalyze('analysis'); }} className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 transition"><BarChart3 className="w-4 h-4 text-brand-cobalt" /> تحلیل سند</button>
                <button onClick={() => { setShowMenu(false); onAnalyze('mindmap'); }} className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 transition border-t border-neutral-100 dark:border-neutral-800"><TrendingUp className="w-4 h-4 text-brand-cobalt" /> نقشه ذهنی</button>
              </div>}
              <button onClick={() => setShowSuggestions(v => !v)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${showSuggestions ? 'text-gold-500 bg-gold-50 dark:bg-gold-900/20' : 'text-gold-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}><Lightbulb className={`w-4 h-4 ${showSuggestions ? 'fill-gold-500' : ''}`} /></button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={listening ? stopListening : startListening} className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${listening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}><Mic className="w-5 h-5" /></button>
              <button onClick={submit} disabled={streaming || !input.trim()} className="w-9 h-9 rounded-xl bg-gold-500 hover:bg-gold-600 text-black flex items-center justify-center transition active:scale-95 shadow-sm disabled:opacity-50">{streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -scale-x-100" />}</button>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 font-medium">Docwize ممکن است اشتباه کند. لطفاً اطلاعات مهم را بررسی کنید.</p>
      </div>
    </div>
  );
}
