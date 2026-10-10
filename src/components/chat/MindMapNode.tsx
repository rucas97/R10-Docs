'use client';

import { useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export function MindMapNode({ id, data }: NodeProps) {
  const [label, setLabel] = useState((data as any).label ?? '');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setLabel((data as any).label ?? '');
  }, [data]);

  return (
    <div
      className={`px-3 py-2 rounded-2xl border-2 shadow-sm bg-white dark:bg-slate-800 text-right min-w-[140px] max-w-[220px] ${
        editing
          ? 'border-brand-500 ring-2 ring-brand-500/20'
          : 'border-brand-200 dark:border-brand-800'
      }`}
      dir="rtl"
    >
      <Handle type="target" position={Position.Top} className="!bg-brand-400 !w-2 !h-2" />
      {editing ? (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            setEditing(false);
            (data as any).onEdit?.(id, label.trim() || 'بدون عنوان');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') { setLabel((data as any).label ?? ''); setEditing(false); }
          }}
          autoFocus
          className="w-full bg-transparent outline-none text-xs font-bold text-slate-800 dark:text-slate-100"
        />
      ) : (
        <button
          onDoubleClick={() => setEditing(true)}
          onClick={() => setEditing(true)}
          className="text-xs font-bold text-slate-800 dark:text-slate-100 text-right w-full leading-relaxed"
        >
          {label}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-brand-400 !w-2 !h-2" />
    </div>
  );
}
