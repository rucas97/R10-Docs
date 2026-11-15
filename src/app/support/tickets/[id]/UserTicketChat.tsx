'use client';
import { useState } from 'react';
import { Send, ArrowRight, Headset, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { DocwizeLogo } from '@/components/DocwizeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function UserTicketChat({ ticket, initialMessages }: { ticket: any, initialMessages: any[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, role: 'user' })
    });
    if (res.ok) {
      const data = await res.json();
      setMessages([...messages, data.message]);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface-canvas dark:bg-surface-canvasDark">
      <header className="shrink-0 glass-header border-b border-neutral-200/60 dark:border-neutral-800/60 h-16 flex items-center justify-between px-4">
        <Link href="/chat" className="flex items-center gap-3"><DocwizeLogo className="w-8 h-8 text-gold-500" /><span className="font-black text-xl hidden sm:block">Docwize</span></Link>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex w-full min-h-0">
        <aside className="hidden lg:flex w-72 border-l border-neutral-200 dark:border-neutral-800 p-6 flex-col gap-4">
          <Link href="/support/tickets" className="text-xs font-bold text-neutral-500 mb-4 flex items-center gap-1"><ArrowRight className="w-4 h-4" /> بازگشت به لیست</Link>
          <h2 className="text-lg font-bold text-white">{ticket.subject}</h2>
          <span className="text-xs text-neutral-500 font-mono">#{ticket.id.slice(0,8)}</span>
          <div className="mt-4 p-4 rounded-xl bg-[#171717] border border-neutral-800 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center"><Headset className="w-5 h-5 text-neutral-400"/></div>
             <div><p className="text-xs text-neutral-500">کارشناس پشتیبانی</p><p className="text-sm font-bold text-white">تیم Docwize</p></div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.sender_role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.sender_role === 'admin' && <span className="text-[11px] text-neutral-500 mb-1 mr-1">پشتیبانی</span>}
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.sender_role === 'user' ? 'bg-brand-cobalt text-white rounded-tr-sm' : 'bg-white dark:bg-[#1C1C1C] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-tl-sm'}`}>
                  {m.message}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1" dir="ltr">{new Date(m.created_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-surface-canvas dark:bg-surface-canvasDark border-t border-neutral-200 dark:border-neutral-800">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2 bg-white dark:bg-[#1A1A1A] border border-neutral-400 dark:border-neutral-600 rounded-3xl p-2">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="پاسخ خود را بنویسید..." className="flex-1 bg-transparent outline-none px-3 text-sm text-neutral-900 dark:text-white" />
              <button type="submit" className="w-9 h-9 rounded-xl bg-gold-500 text-black flex items-center justify-center shrink-0"><Send className="w-4 h-4 -scale-x-100" /></button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
