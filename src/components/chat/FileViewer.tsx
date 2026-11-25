'use client';
import { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Image as ImageIcon, FileSpreadsheet, Presentation, Highlighter, Eye } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

export function FileViewer({
  fileUrl, fileName, currentPage, onPageChange, pageCount, pageTexts, highlightSnippet
}: {
  fileUrl: string | null;
  fileName: string;
  currentPage: number;
  onPageChange: (p: number) => void;
  pageCount: number;
  pageTexts?: string[];
  highlightSnippet?: string;
}) {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
  
  // For Office files, we can view original via Google Docs Viewer or view extracted text
  const [viewMode, setViewMode] = useState<'original' | 'text'>('original');

  // Auto-switch to text mode if there is a highlight request
  useEffect(() => {
    if (highlightSnippet && !isPdf && !isImage) {
      setViewMode('text');
    }
  }, [highlightSnippet, isPdf, isImage]);

  const googleViewerUrl = useMemo(() => {
    if (!fileUrl || isPdf || isImage) return '';
    return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  }, [fileUrl, isPdf, isImage]);

  // Highlight the text for non-PDFs
  const highlightedHtml = useMemo(() => {
    const rawText = pageTexts?.[currentPage - 1] || '';
    if (!highlightSnippet || !rawText) return rawText.replace(/\n/g, '<br/>');

    // Escape regex special characters in the snippet
    const escaped = highlightSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    
    // Replace matching text with a yellow <mark> tag
    return rawText
      .replace(/\n/g, '<br/>')
      .replace(regex, '<mark class="bg-gold-500/30 text-white rounded px-1">$1</mark>');
  }, [pageTexts, currentPage, highlightSnippet]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-canvas dark:bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#171717]">
        <div className="flex items-center gap-2">
          {isPdf ? <FileText className="w-4 h-4 text-red-500" /> : 
           isImage ? <ImageIcon className="w-4 h-4 text-blue-500" /> : 
           ext === 'xlsx' ? <FileSpreadsheet className="w-4 h-4 text-green-500" /> :
           <Presentation className="w-4 h-4 text-orange-500" />}
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[150px]">{fileName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isPdf && !isImage && (
            <div className="flex bg-neutral-100 dark:bg-[#0A0A0A] rounded-lg p-0.5 border border-neutral-200 dark:border-[#333]">
              <button onClick={() => setViewMode('original')} className={`px-2 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 ${viewMode === 'original' ? 'bg-white dark:bg-[#333] text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}>
                <Eye className="w-3 h-3" /> اصلی
              </button>
              <button onClick={() => setViewMode('text')} className={`px-2 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 ${viewMode === 'text' ? 'bg-white dark:bg-[#333] text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500'}`}>
                <Highlighter className="w-3 h-3" /> متن
              </button>
            </div>
          )}
          
          {(isPdf || viewMode === 'text') && (
            <span className="text-xs font-bold text-neutral-500">{toPersianNumber(currentPage)} / {toPersianNumber(pageCount)}</span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-[#0a0a0a] p-4 flex justify-center items-start">
        {!fileUrl ? (
          <div className="text-sm text-neutral-500 mt-10">فایل در دسترس نیست.</div>
        ) : isImage ? (
          <img src={fileUrl} alt={fileName} className="max-w-full h-auto rounded-lg shadow-lg" />
        ) : isPdf ? (
          <iframe src={`${fileUrl}#page=${currentPage}&zoom=page-width&toolbar=0`} className="w-full h-full border-0 bg-white" title="PDF" />
        ) : viewMode === 'original' ? (
          <div className="w-full h-full flex flex-col rounded-xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800 bg-white">
            <iframe src={googleViewerUrl} className="w-full h-full border-0" title="Document" />
          </div>
        ) : (
          // Text view for Office files (allows highlighting)
          <div className="w-full max-w-3xl bg-white dark:bg-[#171717] rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-8">
             <div className="prose prose-sm dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          </div>
        )}
      </div>
    </div>
  );
}
