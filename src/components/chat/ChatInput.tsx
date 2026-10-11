'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Send, Lightbulb, Loader2, Mic, Plus, TrendingUp, BarChart3, X,
} from 'lucide-react';
import { usePrefs } from '@/lib/preferences';
import { MicCircle } from './MicCircle';

const FALLBACK = [
  'این سند را در سه نکته کلیدی خلاصه کن.',
  'نویسنده به چه نتیجه‌گیری اصلی رسیده است؟',
  'چالش‌ها و محدودیت‌های مطرح‌شده چیست؟',
];

export function ChatInput({
  onSend,
  streaming,
  onAnalyze,
  suggestions,
  replyTo,
  onCancelReply,
}: {
  onSend: (text: string) => void;
  streaming: boolean;
  onAnalyze: (kind: 'analysis' | 'mindmap') => void;
  suggestions?: string[];
  replyTo?: { id: string; content: string; role: 'user' | 'assistant' } | null;
  onCancelReply?: () => void;
}) {
  const prefs = usePrefs();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalTextRef = useRef('');
  const shouldContinueRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const items = (suggestions && suggestions.length > 0) ? suggestions : FALLBACK;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  // Position the floating menu above the + button
  const openMenu = () => {
    const btn = menuBtnRef.current;
    if (!btn) { setShowMenu(true); return; }
    const r = btn.getBoundingClientRect();
    setMenuPos({ x: r.left, y: r.top - 8 });
    setShowMenu(true);
  };

  // ---- MIC ----
  const startListening = async () => {
    setMicError(null);
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicError('مرورگر شما از تبدیل گفتار به متن پشتیبانی نمی‌کند. از Chrome یا Edge استفاده کنید.');
      return;
    }

    const isAndroid = /Android/i.test(navigator.userAgent);

    shouldContinueRef.current = true;
    finalTextRef.current = input;

    const rec = new SR();
    rec.lang = 'fa-IR';
    // Android Chrome: continuous=true breaks — use single-shot + restart
    rec.continuous = !isAndroid;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => console.log('[mic] onstart');
    rec.onaudiostart = () => console.log('[mic] onaudiostart');
    rec.onspeechstart = () => console.log('[mic] onspeechstart');
    rec.onspeechend = () => console.log('[mic] onspeechend');
    rec.onaudioend = () => console.log('[mic] onaudioend');
    rec.onnomatch = () => console.log('[mic] onnomatch');

    rec.onresult = (e: any) => {
      console.log('[mic] onresult', e.results.length, 'results');
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTextRef.current += (finalTextRef.current ? ' ' : '') + tr.trim();
          console.log('[mic] final:', tr);
        } else {
          interim += tr;
        }
      }
      setInput((finalTextRef.current + (interim ? ' ' + interim : '')).trim());
    };

    rec.onerror = (e: any) => {
      console.error('[mic] onerror:', e.error, e.message);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setMicError('دسترسی به میکروفون داده نشد. لطفاً در تنظیمات مرورگر اجازه دهید.');
        shouldContinueRef.current = false;
        setListening(false);
      } else if (e.error === 'no-speech') {
        // Normal on Android — keep listening
        console.log('[mic] no-speech — restarting');
      } else if (e.error === 'network') {
        setMicError('سرویس تشخیص گفتار در دسترس نیست. اتصال اینترنت را بررسی کنید.');
      } else if (e.error === 'language-not-supported') {
        setMicError('زبان فارسی در این مرورگر پشتیبانی نمی‌شود. از Chrome دسکتاپ استفاده کنید.');
        shouldContinueRef.current = false;
        setListening(false);
      }
    };

    rec.onend = () => {
      console.log('[mic] onend, shouldContinue:', shouldContinueRef.current);
      if (shouldContinueRef.current) {
        // Small delay to avoid rapid restart loop on Android
        setTimeout(() => {
          if (shouldContinueRef.current) {
            try { rec.start(); } catch (err) {
              console.warn('[mic] restart failed:', err);
              shouldContinueRef.current = false;
              setListening(false);
            }
          }
        }, 200);
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
      console.log('[mic] started lang=fa-IR on', isAndroid ? 'Android' : 'desktop');
    } catch (e: any) {
      console.error('[mic] start failed:', e);
      setMicError('شروع ضبط ناموفق بود: ' + (e?.message || ''));
      shouldContinueRef.current = false;
      return;
    }

    // Desktop only: try to get audio stream for the reactive wave.
    // On Android, getUserMedia locks the mic and SpeechRecognition stops
    // receiving audio. So we skip it there and use CSS animation instead.
    if (!isAndroid) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    
        console.log('[mic] audio stream attached for wave');
      } catch (e) {
        console.warn('[mic] getUserMedia failed, using CSS wave');
    
      }
    } else {
      console.log('[mic] Android detected — skipping getUserMedia, using CSS wave');
  
    }
  };

  const stopListening = () => {
    shouldContinueRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setListening(false);
    finalTextRef.current = '';
  };

  const submit = () => {
    const content = input.trim();
    if (!content || streaming) return;
    onSend(content);
    setInput('');
    setShowSuggestions(false);
  };

  // ---- MENU (portal-rendered) ----
  const menuContent = showMenu && mounted ? createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 9998 }}
        onClick={() => setShowMenu(false)}
      />
      <div
        className="fixed w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          left: Math.min(menuPos.x, window.innerWidth - 220),
          top: Math.max(menuPos.y - 100, 20),
          zIndex: 9999,
        }}
        dir="rtl"
      >
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
    </>,
    document.body
  ) : null;

  const leftActions = (
    <div className="flex items-center gap-0.5">
      <button
        ref={menuBtnRef}
        type="button"
        onClick={openMenu}
        title="ابزارها"
        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition ${
          showMenu
            ? 'bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
        }`}
      >
        <Plus className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-45' : ''}`} />
      </button>

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
  );

  const rightActions = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        title={listening ? 'توقف ضبط' : 'گفتار به متن'}
        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition relative z-10 ${
          listening
            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-pulse'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
        }`}
      >
        <Mic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={submit}
        disabled={streaming || !input.trim()}
        className="w-9 h-9 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white flex items-center justify-center transition disabled:opacity-40 shadow-sm relative z-10"
      >
        {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -scale-x-100" />}
      </button>
    </div>
  );

  const sendOnLeft = prefs.sendSide === 'left';

  return (
    <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-4">
      {menuContent}
      <div className="max-w-3xl mx-auto min-w-0">

        {replyTo && (
          <div className="mb-2 flex items-start gap-2 px-3 py-2 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800">
            <div className="w-1 self-stretch bg-brand-500 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-brand-700 dark:text-brand-300 mb-0.5">
                {replyTo.role === 'user' ? 'پاسخ به پیام شما' : 'پاسخ به دستیار'}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {replyTo.content.slice(0, 160) || '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              aria-label="لغو پاسخ"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-90 transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {micError && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300">
            {micError}
          </div>
        )}

        {showSuggestions && (
          <div className="mb-3 flex flex-col gap-2">
            {items.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onSend(s); setShowSuggestions(false); }}
                disabled={streaming}
                className="text-right text-xs px-4 py-3 rounded-2xl bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 border border-brand-200 dark:border-slate-700 text-brand-700 dark:text-brand-300 transition disabled:opacity-50 leading-relaxed"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="relative rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition p-2 overflow-hidden">
          <MicCircle active={listening} />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            rows={1}
            placeholder={listening ? 'در حال ضبط... صحبت کنید' : 'سوالی درباره این سند بپرسید...'}
            disabled={streaming}
            className="relative z-10 w-full resize-none bg-transparent outline-none border-0 px-2 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 disabled:opacity-60"
          />

          <div className="relative z-10 flex items-center justify-between gap-1 pt-1">
            {sendOnLeft ? <>{rightActions}{leftActions}</> : <>{leftActions}{rightActions}</>}
          </div>
        </div>

        {listening && (
          <p className="mt-2 text-[10px] text-rose-500 dark:text-rose-400 text-center animate-pulse">
            🎤 در حال ضبط — واضح صحبت کنید
          </p>
        )}
      </div>
    </div>
  );
}
