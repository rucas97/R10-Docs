'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, Loader2, RefreshCw, Save, Download } from 'lucide-react';
import { treeToNodes, layoutNodes, type MindMapTree, type MindMapNode } from '@/lib/mindmap';
import { MindMapNode as MindMapNodeComponent } from './MindMapNode';

const nodeTypes = { mindmapNode: MindMapNodeComponent };

export function MindMapModal({
  chatId,
  initial,
  onClose,
}: {
  chatId: string;
  initial: MindMapTree | null;
  onClose: () => void;
}) {
  const [tree, setTree] = useState<MindMapTree | null>(initial);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(!initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Build flow graph whenever tree changes
  useEffect(() => {
    if (!tree) return;
    const flat: MindMapNode[] = treeToNodes(tree);
    const { nodes: fn, edges: fe } = layoutNodes(flat);
    // Inject edit callback into data
    const withEdit = fn.map((n) => ({
      ...n,
      data: { ...n.data, onEdit: handleEdit },
    }));
    setNodes(withEdit);
    setEdges(fe);
  }, [tree, setNodes, setEdges]);

  // Load from server if no initial
  useEffect(() => {
    if (initial) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'تولید نقشه ناموفق بود');
        }
        const { mindmap } = await res.json();
        setTree(mindmap);
      } catch (e: any) {
        setError(e.message || 'خطا');
      } finally {
        setLoading(false);
      }
    })();
  }, [chatId, initial]);

  const handleEdit = useCallback((id: string, newLabel: string) => {
    // Rebuild tree from current node labels (flat edit)
    setTree((prev) => {
      if (!prev) return prev;
      const flat = treeToNodes(prev);
      const updated = flat.map((n) => n.id === id ? { ...n, label: newLabel } : n);
      // Rebuild tree by id path — simple approach: reconstruct from parentId chain
      const byId = new Map(updated.map((n) => [n.id, n]));
      const root = updated.find((n) => !n.parentId);
      if (!root) return prev;
      const build = (n: MindMapNode): MindMapTree => ({
        label: n.label,
        children: updated.filter((x) => x.parentId === n.id).map(build),
      });
      return build(root);
    });
  }, []);

  const regenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, regenerate: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا');
      }
      const { mindmap } = await res.json();
      setTree(mindmap);
      setToast('نقشه جدید ساخته شد');
      setTimeout(() => setToast(null), 2000);
    } catch (e: any) {
      setError(e.message || 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!tree) return;
    setSaving(true);
    try {
      await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, saveTree: tree }),
      });
      setToast('ذخیره شد');
      setTimeout(() => setToast(null), 1500);
    } catch {}
    setSaving(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-6xl h-[92dvh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">

        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">نقشه ذهنی سند</p>
          <div className="flex items-center gap-1">
            <button onClick={save} disabled={saving || !tree}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              ذخیره
            </button>
            <button onClick={regenerate} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              بازتولید
            </button>
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-50 dark:bg-slate-950">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400">در حال ساخت نقشه ذهنی...</p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
              <button onClick={regenerate}
                className="text-xs px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition">
                تلاش مجدد
              </button>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#cbd5e1" gap={20} size={1} />
              <Controls position="bottom-left" showInteractive={false} />
              <MiniMap pannable zoomable className="!bg-white dark:!bg-slate-800" />
            </ReactFlow>
          )}

          {toast && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xl">
              {toast}
            </div>
          )}
        </div>

        <div className="shrink-0 h-10 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
          برای ویرایش، روی هر گره کلیک کنید · برای جابه‌جایی، بکشید · Enter = تأیید
        </div>
      </div>
    </div>
  );
}
