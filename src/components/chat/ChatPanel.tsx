'use client';

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot, User as UserIcon, FileText, Sparkles, X,
  MessageSquare, BookOpen,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { extractCitations, toPersianNumber } from '@/lib/citations';
import { SourceModal } from './SourceModal';
import { PdfViewer } from './PdfViewer';
import { ChatInput } from './ChatInput';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

type ChatMeta = {
  id: string;
  title: string;
  fileName: string;
  pageCount: number;
  summary: string;
};

type OpenSourceFn = (pages: number[], index: number) => void;

const MessageBubble = memo(function MessageBubble({
  msg,
  onOpenSource,
}: {
  msg: Msg;
  onOpenSource: OpenSourceFn;
}) {
  const isUser = msg.role === 'user';
  const parsed = useMemo(
    () => (isUser ? { content: msg.content, pages: [] } : extractCitations(msg.content)),
    [msg.content, isUser]
  );

  return (
    <div className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-brand-600 text-white'
            : 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
        }`}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`max-w-[85%] min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm leading-relaxed break-words ${
            isUser
              ? 'bg-brand-600 text-white rounded-tr-md'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-md'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          ) : parsed.content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 break-words">
              <ReactMarkdown>{parsed.content}</ReactMarkdown>
            </div>
          ) : (
            <span className="inline-block w-2 h-4 bg-brand-400 dark:bg-brand-500 animate-pulse rounded-sm" />
          )}
        </div>

        {!isUser && parsed.pages.length > 0 && (
          <div className="mt-2 flex items-center flex-wrap gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              منبع:
            </span>
            {parsed.pages.map((p, i) => (
              <button
                key={p}
                onClick={() => onOpenSource(parsed.pages, i)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-bold transition"
              >
                ص {toPersianNumber(p)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export function ChatPanel({
  chat,
  pdfUrl,
  initialMessages,
}: {
  chat: ChatMeta;
  pdfUrl: string | null;
  initialMessages: Msg[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [streaming, setStreaming] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'chat' | 'reader'>('chat');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState<{ pages: number[]; index: number } | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;

      setStreaming(true);
      setViewMode('chat');

      const userMsg: Msg = { id: `local-${Date.now()}`, role: 'user', content };
      const assistantId = `local-${Date.now() + 1}`;

      let payload: Msg[] = [];
      setMessages((prev) => {
        payload = [...prev, userMsg];
        return [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }];
      });

      try {
        await new Promise((r) => setTimeout(r, 0));
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: chat.id,
            messages: payload.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!res.ok || !res.body) throw new Error('Request failed');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((m) =>
            m.map((x) => (x.id === assistantId ? { ...x, content: acc } : x))
          );
        }
      } catch {
        setMessages((m) =>
          m.map((x) =>
            x.id === assistantId
              ? { ...x, content: 'متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.' }
              : x
          )
        );
      } finally {
        setStreaming(false);
        router.refresh();
      }
    },
    [chat.id, router, streaming]
  );

  const openSource = useCallback((pages: number[], index: number) => {
    setCurrentPage(pages[index]);
    setModal({ pages, index });
  }, []);

  const chatColumn = (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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

      {chat.summary && summaryOpen && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-l from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-100 dark:border-brand-900 relative shrink-0">
          <button
            onClick={() => setSummaryOpen(false)}
            className="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-2.5 pl-6">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-black text-brand-700 dark:text-brand-300 mb-1">
                خلاصه سند
              </p>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                {chat.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} onOpenSource={openSource} />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <ChatInput
        onSend={send}
        onNewChat={() => router.push('/chat')}
        streaming={streaming}
      />
    </div>
  );

  const readerColumn = (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <PdfViewer
        pdfUrl={pdfUrl}
        pageCount={chat.pageCount}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );

  return (
    <>
      <div className="xl:hidden flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="shrink-0 grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-950 mx-3 mt-3 rounded-2xl">
          <button
            onClick={() => setViewMode('chat')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'chat'
                ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> گفتگو
          </button>
          <button
            onClick={() => setViewMode('reader')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'reader'
                ? 'bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" /> خواننده
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden mt-3 min-h-0">
          {viewMode === 'chat' ? chatColumn : readerColumn}
        </div>
      </div>

      <div className="hidden xl:flex flex-1 overflow-hidden min-h-0">
        {chatColumn}
        <aside className="w-[460px] border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 shrink-0 flex flex-col overflow-hidden">
          {readerColumn}
        </aside>
      </div>

      {modal && (
        <SourceModal
          pages={modal.pages}
          initialIndex={modal.index}
          pdfUrl={pdfUrl}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
