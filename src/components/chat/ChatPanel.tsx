'use client';

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot, User as UserIcon, Sparkles, X,
  MessageSquare, BookOpen, Copy, Check, RefreshCw, MessageCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { extractCitations, toPersianNumber, type Citation } from '@/lib/citations';
import { SourceModal } from './SourceModal';
import { PdfViewer } from './PdfViewer';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { CommentSheet } from './CommentSheet';
import { SummaryCard } from './SummaryCard';
import { MindMapModal } from './MindMapModal';
import { AnalysisModal } from './analysis/AnalysisModal';
import { SettingsModal } from './settings/SettingsModal';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  replyToId?: string | null;
};
type ChatMeta = { id: string; title: string; fileName: string; pageCount: number; summary: string; primaryLanguage: 'fa' | 'en'; suggestedQuestions: string[]; mindmap: any; analysis: any };
type OpenSourceFn = (citations: Citation[], index: number) => void;
type Lookup = Record<string, { role: 'user' | 'assistant'; content: string }>;

// Double-line curved reply arrow (custom SVG)
function ReplyArrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" className={className}>
      {/* Outer curve */}
      <path d="M20 19c0-5-3.5-9-9-9H5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Inner curve (double-line effect) */}
      <path d="M20 15c0-3.5-2.5-6-6-6H5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      {/* Arrowhead */}
      <path d="M8 5l-4 5 4 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MessageBubble = memo(function MessageBubble({
  msg,
  lookup,
  onOpenSource,
  onRegenerate,
  onComment,
  onReply,
}: {
  msg: Msg;
  lookup: Lookup;
  onOpenSource: OpenSourceFn;
  onRegenerate: (msg: Msg) => void;
  onComment: (msg: Msg) => void;
  onReply: (msg: Msg) => void;
}) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(
    () => (isUser ? { content: msg.content, pages: [] as number[], citations: [] as Citation[] } : extractCitations(msg.content)),
    [msg.content, isUser]
  );

  const replyParent = msg.replyToId ? lookup[msg.replyToId] : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(parsed.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const isStreaming = !isUser && !parsed.content;

  return (
    <div className={`group/bubble flex items-start gap-2.5 sm:gap-3 ${isUser ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser ? 'bg-brand-600 text-white' : 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
      }`}>
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Wrapper: bubble + side reply arrow */}
      <div className={`relative max-w-[85%] min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`} style={{ overflow: 'visible' }}>
        {/* Reply arrow — always visible on outer edge */}
        {parsed.content && !isStreaming && (
          <button
            onClick={() => onReply(msg)}
            title="پاسخ"
            aria-label="پاسخ"
            className={`absolute top-1 z-20 w-8 h-8 rounded-full flex items-center justify-center
              bg-white dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              shadow-sm text-slate-400 dark:text-slate-500
              hover:text-brand-600 dark:hover:text-brand-400
              hover:border-brand-300 dark:hover:border-brand-700
              active:scale-90 transition-all ${
                isUser ? '-start-10' : '-end-10'
              }`}
          >
            <ReplyArrow className="w-4 h-4" />
          </button>
        )}

        <div className={`rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm leading-relaxed break-words ${
          isUser
            ? 'bg-brand-600 text-white rounded-tr-md'
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-md'
        }`}>
          {/* Reply parent quote — inside the bubble at the top */}
          {replyParent && (
            <div className={`mb-2 px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed border-e-2 ${
              isUser
                ? 'bg-white/15 border-white/60 text-white/90'
                : 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 text-slate-600 dark:text-slate-300'
            }`}>
              <p className={`font-black mb-0.5 ${isUser ? 'text-white/80' : 'text-brand-700 dark:text-brand-300'}`}>
                {replyParent.role === 'user' ? 'شما' : 'دستیار'}
              </p>
              <p className="line-clamp-2">{replyParent.content.slice(0, 140) || '—'}</p>
            </div>
          )}

          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          ) : isStreaming ? (
            <div className="flex items-center gap-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-brand-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-brand-500 animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-brand-500 animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : (
            <>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 break-words">
                <ReactMarkdown>{parsed.content}</ReactMarkdown>
              </div>

              {parsed.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center flex-wrap gap-1.5">
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">منابع:</span>
                  {parsed.citations.map((c, i) => (
                    <button
                      key={`${c.page}-${i}`}
                      onClick={() => onOpenSource(parsed.citations, i)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-bold transition"
                    >
                      ص {toPersianNumber(c.page)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action row — below the bubble */}
        {parsed.content && !isStreaming && (
          <div className={`mt-2 flex items-center flex-wrap gap-1.5 ${isUser ? 'justify-start flex-row-reverse' : ''}`}>
            <button
              onClick={handleCopy}
              title={copied ? 'کپی شد' : 'کپی'}
              className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold transition ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'کپی شد' : 'کپی'}</span>
            </button>

            {!isUser && (
              <>
                <button
                  onClick={() => onComment(msg)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-bold flex items-center gap-1 transition"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>یادداشت</span>
                </button>
                <button
                  onClick={() => onRegenerate(msg)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-bold flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازتولید</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export function ChatPanel({
  chat, pdfUrl, initialMessages, messageLookup,
}: {
  chat: ChatMeta;
  pdfUrl: string | null;
  initialMessages: Msg[];
  messageLookup: Lookup;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [lookup, setLookup] = useState<Lookup>(messageLookup);
  const [streaming, setStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<'chat' | 'reader'>('chat');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState<{ citations: Citation[]; index: number } | null>(null);
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [showMindmap, setShowMindmap] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; content: string; role: 'user' | 'assistant' } | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;

    setStreaming(true);
    setViewMode('chat');

    const userMsg: Msg = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      replyToId: replyTarget?.id ?? null,
    };
    const assistantId = `local-${Date.now() + 1}`;
    const capturedReply = replyTarget;

    let payload: Msg[] = [];
    setMessages((prev) => {
      payload = [...prev, userMsg];
      return [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }];
    });

    // Register user in lookup so reply references resolve immediately
    if (capturedReply) {
      setLookup((l) => ({
        ...l,
        [userMsg.id]: { role: 'user', content },
      }));
    }

    try {
      await new Promise((r) => setTimeout(r, 0));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chat.id,
          messages: payload.map((m) => ({ role: m.role, content: m.content })),
          replyToId: capturedReply?.id ?? null,
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
        setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: acc } : x)));
      }
    } catch {
      setMessages((m) => m.map((x) => x.id === assistantId ? { ...x, content: 'متأسفانه خطایی رخ داد.' } : x));
    } finally {
      setStreaming(false);
      setReplyTarget(null);
      router.refresh();
    }
  }, [chat.id, router, streaming, replyTarget]);

  const regenerate = useCallback((msg: Msg) => {
    const idx = messages.findIndex((m) => m.id === msg.id);
    if (idx < 1) return;
    const prevUser = messages[idx - 1];
    if (prevUser.role !== 'user') return;
    setMessages((m) => m.filter((x) => x.id !== msg.id));
    setTimeout(() => send(prevUser.content), 100);
  }, [messages, send]);

  const openSource = useCallback((citations: Citation[], index: number) => {
    setCurrentPage(citations[index].page);
    setModal({ citations, index });
  }, []);

  const handleAnalyze = useCallback((kind: 'analysis' | 'mindmap') => {
    if (kind === 'mindmap') { setShowMindmap(true); return; }
    setShowAnalysis(true);
  }, []);

  const chatColumn = (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <ChatHeader chat={chat} />

      {chat.summary && <SummaryCard chatId={chat.id} summary={chat.summary} />}

      <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              lookup={lookup}
              onOpenSource={openSource}
              onRegenerate={regenerate}
              onComment={(msg) => setCommentFor(msg.id)}
              onReply={(msg) => setReplyTarget({ id: msg.id, content: msg.content, role: msg.role })}
            />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <ChatInput
        onSend={send}
        streaming={streaming}
        onAnalyze={handleAnalyze}
        suggestions={chat.suggestedQuestions}
        replyTo={replyTarget}
        onCancelReply={() => setReplyTarget(null)}
      />
    </div>
  );

  const readerColumn = (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <PdfViewer
        chatId={chat.id}
        pageCount={chat.pageCount}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        primaryLanguage={chat.primaryLanguage}
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
          citations={modal.citations}
          initialIndex={modal.index}
          chatId={chat.id}
          primaryLanguage={chat.primaryLanguage}
          onClose={() => setModal(null)}
        />
      )}

      {commentFor && (
        <CommentSheet
          messageId={commentFor}
          onClose={() => setCommentFor(null)}
          onCountChange={() => {}}
        />
      )}

      {showMindmap && (
        <MindMapModal chatId={chat.id} initial={chat.mindmap} onClose={() => setShowMindmap(false)} />
      )}

      {showAnalysis && (
        <AnalysisModal
          chatId={chat.id}
          chatTitle={chat.fileName}
          initial={chat.analysis}
          onClose={() => setShowAnalysis(false)}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <GlobalSettingsListener onOpen={() => setShowSettings(true)} />
    </>
  );
}

function GlobalSettingsListener({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('r10_open_settings', handler);
    return () => window.removeEventListener('r10_open_settings', handler);
  }, [onOpen]);
  return null;
}
