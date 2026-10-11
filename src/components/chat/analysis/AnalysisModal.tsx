'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X, Loader2, RefreshCw, Download, TrendingUp, TrendingDown,
  Minus, Sparkles, FileText, BarChart3,
} from 'lucide-react';
import { AnalysisChart } from './AnalysisCharts';
import { exportElementToPdf } from './pdfExport';

export function AnalysisModal({
  chatId,
  chatTitle,
  initial,
  onClose,
}: {
  chatId: string;
  chatTitle: string;
  initial: any;
  onClose: () => void;
}) {
  const [analysis, setAnalysis] = useState<any>(initial);
  const [loading, setLoading] = useState(!initial);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const load = useCallback(async (regenerate = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, regenerate }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'تحلیل ناموفق بود');
      }
      const { analysis } = await res.json();
      setAnalysis(analysis);
    } catch (e: any) {
      setError(e.message || 'خطا');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (!initial) load(false);
  }, [initial, load]);

  const exportPdf = async () => {
    if (!printRef.current || !analysis) return;
    setExporting(true);
    try {
      // Ensure fonts are ready
      await (document as any).fonts?.ready;
      await exportElementToPdf(printRef.current, `analysis-${chatTitle || chatId}`);
    } catch (e: any) {
      console.error('[export] failed:', e);
      alert('خروجی PDF ناموفق بود.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl h-[92dvh] bg-slate-50 dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100">تحلیل سند</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => load(true)}
              disabled={loading}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              بازتولید
            </button>
            <button
              onClick={exportPdf}
              disabled={exporting || !analysis}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition disabled:opacity-40"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">خروجی PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400">در حال تحلیل سند...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={() => load(true)}
                className="text-xs px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition"
              >
                تلاش مجدد
              </button>
            </div>
          ) : analysis ? (
            <div ref={printRef} className="p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 space-y-6">
              {/* Cover */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <p className="text-[10px] font-black text-brand-700 dark:text-brand-300 tracking-wide">
                    تحلیل هوشمند سند
                  </p>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                  {analysis.title}
                </h1>
                {analysis.executiveSummary && (
                  <p className="text-sm leading-loose text-slate-600 dark:text-slate-300">
                    {analysis.executiveSummary}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                  <FileText className="w-3 h-3" />
                  <span>سند: {chatTitle}</span>
                </div>
              </div>

              {/* KPIs */}
              {analysis.kpis?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {analysis.kpis.map((k: any, i: number) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
                    >
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-2 truncate">
                        {k.label}
                      </p>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100 truncate" dir="auto">
                          {k.value}
                        </p>
                        {k.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />}
                        {k.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />}
                        {k.trend === 'neutral' && <Minus className="w-4 h-4 text-slate-400 shrink-0" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Charts */}
              {analysis.charts?.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {analysis.charts.map((c: any, i: number) => (
                    <AnalysisChart key={i} chart={c} />
                  ))}
                </div>
              )}

              {/* Key findings */}
              {analysis.keyFindings?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    یافته‌های کلیدی
                  </h2>
                  <ul className="space-y-3">
                    {analysis.keyFindings.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs leading-loose text-slate-700 dark:text-slate-200">
                          {f}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Figures */}
              {analysis.figures?.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4">
                    اشکال و جداول سند
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.figures.map((f: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-1">
                          {f.title}
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {f.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center py-4 text-[10px] text-slate-400 dark:text-slate-500">
                تولید شده توسط R10-Docs · تحلیل هوشمند اسناد
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
