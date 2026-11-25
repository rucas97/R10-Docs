'use client';
import { useState } from 'react';
import { Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AdminTicketChat({ ticket, initialMessages }: { ticket: any, initialMessages: any[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(ticket.status);
  const router = useRouter();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, role: 'admin' })
    });
    if (res.ok) {
      const data = await res.json();
      setMessages([...messages, data.message]);
      setInput('');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await fetch(`/api/tickets/${ticket.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    router.refresh();
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-8rem)] gap-6 pb-20 lg:pb-0">
      
      {/* Chat Area */}
      <div className="flex-1 bg-[#171717] border border-neutral-800 rounded-3xl flex flex-col overflow-hidden min-h-[500px]">
        <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/admin/tickets" className="text-neutral-400 hover:text-white"><ArrowRight className="w-5 h-5" /></Link>
            <h2 className="font-bold text-white truncate max-w-[200px] sm:max-w-md">{ticket.subject}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.sender_role === 'admin' ? 'bg-brand-cobalt text-white rounded-tl-sm' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tr-sm'}`}>
                {m.message}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-neutral-800 bg-[#1A1A1A]">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-2xl p-2">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="پاسخ خود را بنویسید..." className="flex-1 bg-transparent outline-none text-sm px-3 text-white" />
            <button type="submit" className="w-10 h-10 rounded-xl bg-gold-500 text-black flex items-center justify-center shrink-0"><Send className="w-4 h-4 -scale-x-100" /></button>
          </div>
        </form>
      </div>

      {/* Sidebar (Stacks below on mobile) */}
      <div className="w-full lg:w-64 bg-[#171717] border border-neutral-800 rounded-3xl p-6 shrink-0 h-fit">
        <h3 className="font-bold text-white mb-4">تغییر وضعیت</h3>
        <select value={status} onChange={e => handleStatusChange(e.target.value)} className="w-full bg-[#1A1A1A] border border-neutral-700 text-white rounded-xl px-4 py-3 outline-none">
          <option value="progress">در حال بررسی</option>
          <option value="awaiting">منتظر پاسخ شما</option>
          <option value="closed">بسته شده</option>
        </select>
      </div>

    </div>
  );
}
