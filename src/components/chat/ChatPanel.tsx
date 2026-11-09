'use client';

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Copy, Check, RefreshCw, MessageCircle, Reply, ThumbsUp, ThumbsDown, RotateCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { extractCitations, toPersianNumber, type Citation } from '@/lib/citations';
import { SourceModal } from './SourceModal';
import { PdfViewer } from './PdfViewer';
import { ChatInput } from './ChatInput';
import { CommentSheet } from './CommentSheet';
import { SummaryCard } from './SummaryCard';
import { MindMapModal } from './MindMapModal';
import { AnalysisModal } from './analysis/AnalysisModal';
import { SettingsModal } from './settings/SettingsModal';
import { DocwizeLogo } from '@/components/DocwizeLogo';

type Msg = { id: string; role: 'user' | 'assistant'; content: string; replyToId?: string | null; };
type ChatMeta = { id: string; title: string; fileName: string; pageCount: number; summary: string; primaryLanguage: 'fa' | 'en'; suggestedQuestions: string[]; mindmap: any; analysis: any; };
type Lookup = Record<string, { role: 'user' | 'assistant'; content: string }>;

const MessageBubble = memo(function MessageBubble({ msg, lookup, onOpenSource, onRegenerate, onComment, onReply }: any) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);
  const parsed = useMemo(() => (isUser ? { content: msg.content, citations: [] as Citation[] } : extractCitations(msg.content)), [msg.content, isUser]);
  const replyParent = msg.replyToId ? lookup[msg.replyToId] : null;
  const isStreaming = !isUser && !parsed.content;

  const handleCopy = async () => { await navigator.clipboard.writeText(parsed.content); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className={`flex items-start gap-3 group ${isUser ? 'justify-start mt-6' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
          <DocwizeLogo className="w-7 h-7 text-gold-500" />
        </div>
      )}
      
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end w-full' : ''}`}>
        {replyParent && (
          <div className={`mb-1.5 px-3 py-1.5 rounded-lg text-[11px] border-e-4 ${isUser ? 'bg-brand-cobalt/20 border-white text-white/90' : 'bg-neutral-100 dark:bg-neutral-800 border-brand-cobalt text-neutral-500'}`}>
            <span className="font-bold block mb-0.5">{replyParent.role === 'user' ? 'شما' : 'دستیار'}</span>
            <span className="line-clamp-2">{replyParent.content.slice(0, 140)}</span>
          </div>
        )}
        
        <div className={`rounded-2xl rounded-tr-sm px-5 py-3 text-sm leading-relaxed shadow-sm ${
          isUser 
            ? 'bg-brand-cobalt text-white w-fit max-w-[85%]' 
            : 'bg-white dark:bg-surface-aiBubbleDark border border-neutral-200/80 dark:border-transparent text-neutral-800 dark:text-neutral-300 w-full max-w-[95%]'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : isStreaming ? (
            <div className="flex gap-1 py-1"><span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce"/><span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce delay-75"/><span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce delay-150"/></div>
          ) : (
            <>
              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                <ReactMarkdown>{parsed.content}</ReactMarkdown>
              </div>
              {parsed.citations.length > 0 && (
                <div className="mt-3 flex items-center flex-wrap gap-2">
                  <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500">منابع:</span>
                  {parsed.citations.map((c: any, i: number) => (
                    <button key={i} onClick={() => onOpenSource(parsed.citations, i)} className="text-[11px] px-3 py-1 rounded-lg bg-gold-500 text-black font-bold hover:bg-gold-600 transition">
                      صفحه {toPersianNumber(c.page)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {parsed.content && !isStreaming && (
          <div className={`mt-2 flex items-center gap-2.5 ${isUser ? 'justify-end' : 'justify-start w-full max-w-[95%]'}`}>
             <button onClick={handleCopy} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition">
               {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
             </button>
             <button onClick={() => onReply(msg)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"><Reply className="w-3.5 h-3.5 -scale-x-100" /></button>
             {!isUser && (
               <>
                 <button onClick={() => onComment(msg)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"><MessageCircle className="w-3.5 h-3.5" /></button>
                 <button onClick={() => onRegenerate(msg)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"><RotateCw className="w-3.5 h-3.5" /></button>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
});

export function ChatPanel({ chat, pdfUrl, initialMessages, messageLookup }: { chat: ChatMeta; pdfUrl: string | null; initialMessages: Msg[]; messageLookup: Lookup; }) {
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
  const accRef = useRef('');

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    setStreaming(true); setViewMode('chat'); accRef.current = '';
    const userMsg: Msg = { id: `local-${Date.now()}`, role: 'user', content, replyToId: replyTarget?.id ?? null };
    const assistantId = `local-${Date.now() + 1}`;
    const capturedReply = replyTarget;
    let payload: Msg[] = [];
    setMessages((prev) => { payload = [...prev, userMsg]; return [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]; });
    setLookup((l) => { const next = { ...l }; if (capturedReply && !next[capturedReply.id]) next[capturedReply.id] = { role: capturedReply.role, content: capturedReply.content }; next[userMsg.id] = { role: 'user', content }; return next; });
    
    try {
      await new Promise((r) => setTimeout(r, 0));
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: chat.id, messages: payload.map((m) => ({ role: m.role, content: m.content })), replyToId: capturedReply?.id ?? null, replyToContent: capturedReply?.content ?? null, replyToRole: capturedReply?.role ?? null }) });
      if (!res.ok || !res.body) throw new Error('Failed');
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let acc = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        acc += decoder.decode(value, { stream: true }); accRef.current = acc;
        setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: acc } : x)));
      }
    } catch {
      setMessages((m) => m.map((x) => x.id === assistantId ? { ...x, content: 'متأسفانه خطایی رخ داد.' } : x));
    } finally {
      setLookup((l) => ({ ...l, [assistantId]: { role: 'assistant', content: accRef.current } }));
      setStreaming(false); setReplyTarget(null); router.refresh();
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

  const openSource = useCallback((citations: Citation[], index: number) => { setCurrentPage(citations[index].page); setModal({ citations, index }); }, []);
  const handleAnalyze = useCallback((kind: 'analysis' | 'mindmap') => { if (kind === 'mindmap') setShowMindmap(true); else setShowAnalysis(true); }, []);

  const chatColumn = (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <div className="hidden xl:flex h-16 items-center justify-between px-6 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-surface-canvas/80 dark:bg-surface-canvasDark/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-surface-aiBubbleDark flex items-center justify-center text-neutral-700 dark:text-neutral-300 shadow-sm border border-neutral-200 dark:border-neutral-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">{chat.fileName}</p>
            <p className="text-[11px] text-neutral-500">{toPersianNumber(chat.pageCount)} صفحه</p>
          </div>
        </div>
      </div>

      <SummaryCard chatId={chat.id} summary={chat.summary} />

      <div className="flex-1 overflow-y-auto px-3 xl:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} lookup={lookup} onOpenSource={openSource} onRegenerate={regenerate} onComment={(msg: any) => setCommentFor(msg.id)} onReply={(msg: any) => setReplyTarget({ id: msg.id, content: msg.content, role: msg.role })} />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <ChatInput onSend={send} streaming={streaming} onAnalyze={handleAnalyze} suggestions={chat.suggestedQuestions} replyTo={replyTarget} onCancelReply={() => setReplyTarget(null)} />
    </div>
  );

  const readerColumn = (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <PdfViewer chatId={chat.id} pageCount={chat.pageCount} currentPage={currentPage} onPageChange={setCurrentPage} primaryLanguage={chat.primaryLanguage} />
    </div>
  );

  return (
    <>
      <div className="xl:hidden flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="shrink-0 grid grid-cols-2 gap-1 p-1 bg-neutral-200/50 dark:bg-surface-aiBubbleDark mx-3 mt-3 rounded-2xl">
          <button onClick={() => setViewMode('chat')} className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${viewMode === 'chat' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}>گفتگو</button>
          <button onClick={() => setViewMode('reader')} className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${viewMode === 'reader' ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}>خواننده</button>
        </div>
        <div className="flex-1 flex overflow-hidden mt-3 min-h-0">{viewMode === 'chat' ? chatColumn : readerColumn}</div>
      </div>
      <div className="hidden xl:flex flex-1 overflow-hidden min-h-0">
        {chatColumn}
        <aside className="w-[420px] bg-white dark:bg-surface-canvasDark border-r border-neutral-200 dark:border-neutral-800 shrink-0 flex flex-col overflow-hidden">{readerColumn}</aside>
      </div>
      {modal && <SourceModal citations={modal.citations} initialIndex={modal.index} chatId={chat.id} primaryLanguage={chat.primaryLanguage} onClose={() => setModal(null)} />}
      {commentFor && <CommentSheet messageId={commentFor} onClose={() => setCommentFor(null)} onCountChange={() => {}} />}
      {showMindmap && <MindMapModal chatId={chat.id} initial={chat.mindmap} onClose={() => setShowMindmap(false)} />}
      {showAnalysis && <AnalysisModal chatId={chat.id} chatTitle={chat.fileName} initial={chat.analysis} onClose={() => setShowAnalysis(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <GlobalSettingsListener onOpen={() => setShowSettings(true)} />
    </>
  );
}

function GlobalSettingsListener({ onOpen }: { onOpen: () => void }) {
  useEffect(() => { const handler = () => onOpen(); window.addEventListener('r10_open_settings', handler); return () => window.removeEventListener('r10_open_settings', handler); }, [onOpen]);
  return null;
}
