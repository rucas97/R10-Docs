'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Lightbulb, Loader2, Mic, Plus, TrendingUp, BarChart3,
} from 'lucide-react';
import { usePrefs } from '@/lib/preferences';
import { MicWave } from './MicWave';

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
  const [listening, setListening] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalTextRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const items = (suggestions && suggestions.length > 0) ? suggestions : FALLBACK;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const startListening = async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('مرورگر شما از تبدیل گفتار به متن پشتیبانی نمی‌کند. از Chrome یا Edge استفاده کنید.');
      return;
    }

    // Start typing FIRST so it gets mic priority
    const rec = new SR();
    rec.lang = 'fa-IR';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    finalTextRef.current = input; // preserve what's already typed

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTextRef.current += (finalTextRef.current ? ' ' : '') + tr.trim();
        } else {
          interim += tr;
        }
      }
      setInput((finalTextRef.current + ' ' + interim).trim());
    };

    rec.onerror = (e: any) => {
      console.warn('[mic] recognition error:', e?.error);
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        alert('دسترسی به میکروفون داده نشد. لطفاً در تنظیمات مرورگر اجازه دهید.');
        setListening(false);
      }
    };

    rec.onend = () => {
      // Chrome stops on silence — restart if user hasn't tapped stop
      if (recognitionRef.current && streamRef.current !== null) {
        try { rec.start(); } catch {}
      } else if (recognitionRef.current && listening) {
        try { rec.start(); } catch {}
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
      console.log('[mic] recognition started');
    } catch (e) {
      console.error('[mic] rec.start failed:', e);
      alert('شروع ضبط ناموفق بود.');
      return;
    }

    // Now try to get the audio stream for the wave visualization.
    // If this fails, typing still works — we just lose the audio-reactive wave.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicStream(stream);
      console.log('[mic] audio stream ready for wave');
    } catch (e) {
      console.warn('[mic] getUserMedia failed — wave will use CSS fallback:', e);
      // Set a fake stream so MicWave uses CSS animation
      const fakeStream = new MediaStream();
      streamRef.current = fakeStream;
      setMicStream(null);
    }
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMicStream(null);
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

  const leftActions = (
    <div className="flex items-center gap-0.5 relative">
      <button type="button" onClick={() => setShowMenu((v) => !v)} title="ابزارها"
        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition ${
          showMenu ? 'bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
                   : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
        }`}>
        <Plus className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-45' : ''}`} />
      </button>

      {showMenu && (
        <div className="absolute bottom-11 end-0 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          <button onClick={() => { setShowMenu(false); onAnalyze('analysis'); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 transition">
            <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>تحلیل سند</span>
          </button>
          <button onClick={() => { setShowMenu(false); onAnalyze('mindmap'); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-800 transition border-t border-slate-100 dark:border-slate-800">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>نقشه ذهنی</span>
          </button>
        </div>
      )}

      <button type="button" onClick={() => setShowSuggestions((v) => !v)} title="سوالات پیشنهادی"
        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition ${
          showSuggestions ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
        }`}>
        <Lightbulb className={`w-4 h-4 ${showSuggestions ? 'fill-amber-400 dark:fill-amber-500' : ''}`} />
      </button>
    </div>
  );

  const rightActions = (
    <div className="flex items-center gap-1">
      <button type="button" onClick={listening ? stopListening : startListening}
        title={listening ? 'توقف ضبط' : 'گفتار به متن'}
        className={`w-9 h-9 rounded-2xl flex items-center justify-center transition relative z-10 ${
          listening ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
        }`}>
        <Mic className="w-4 h-4" />
      </button>
      <button type="button" onClick={submit} disabled={streaming || !input.trim()}
        className="w-9 h-9 rounded-2xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white flex items-center justify-center transition disabled:opacity-40 shadow-sm relative z-10">
        {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -scale-x-100" />}
      </button>
    </div>
  );

  const sendOnLeft = prefs.sendSide === 'left';

  return (
    <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-4">
      <div className="max-w-3xl mx-auto min-w-0">

        {replyTo && (
          <div className="mb-2 flex items-start gap-2 px-3 py-2 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 border-e-4 border-e-brand-500">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-brand-700 dark:text-brand-300 mb-0.5">
                {replyTo.role === 'user' ? 'پاسخ به پیام شما' : 'پاسخ به دستیار'}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {replyTo.content.slice(0, 160) || '—'}
              </p>
            </div>
            <button onClick={onCancelReply}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0">
              <span className="text-xs">✕</span>
            </button>
          </div>
        )}

        {showSuggestions && (
          <div className="mb-3 flex flex-col gap-2">
            {items.map((s) => (
              <button key={s} type="button" onClick={() => { onSend(s); setShowSuggestions(false); }}
                disabled={streaming}
                className="text-right text-xs px-4 py-3 rounded-2xl bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 border border-brand-200 dark:border-slate-700 text-brand-700 dark:text-brand-300 transition disabled:opacity-50 leading-relaxed">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="relative rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition p-2 overflow-hidden">
          <MicWave active={listening} stream={micStream} />

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
            🎤 در حال ضبط — صحبت کنید (Chrome/Edge)
          </p>
        )}
      </div>
    </div>
  );
}
