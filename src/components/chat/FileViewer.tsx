'use client';
import { useState, useEffect } from 'react';
import { FileText, Download, Image as ImageIcon, FileSpreadsheet, Presentation, ExternalLink } from 'lucide-react';
import { toPersianNumber } from '@/lib/citations';

export function FileViewer({
  fileUrl, fileName, currentPage, onPageChange, pageCount
}: {
  fileUrl: string | null; fileName: string; currentPage: number; onPageChange: (p: number) => void; pageCount: number;
}) {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface-canvas dark:bg-[#0a0a0a]">
      {/* Toolbar */}
      <div className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#171717]">
        <div className="flex items-center gap-2">
          {isPdf ? <FileText className="w-4 h-4 text-red-500" /> : 
           isImage ? <ImageIcon className="w-4 h-4 text-blue-500" /> : 
           ext === 'xlsx' ? <FileSpreadsheet className="w-4 h-4 text-green-500" /> :
           <Presentation className="w-4 h-4 text-orange-500" />}
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{fileName}</span>
        </div>
        {isPdf && (
          <span className="text-xs font-bold text-neutral-500">{toPersianNumber(currentPage)} / {toPersianNumber(pageCount)}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
        {!fileUrl ? (
          <div className="text-sm text-neutral-500 mt-10">فایل در دسترس نیست.</div>
        ) : isImage ? (
          <img src={fileUrl} alt={fileName} className="max-w-full h-auto rounded-lg shadow-lg" />
        ) : isPdf ? (
          <iframe src={`${fileUrl}#page=${currentPage}&zoom=page-width&toolbar=0`} className="w-full h-full border-0" title="PDF" />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-[#171717] rounded-3xl border border-neutral-200 dark:border-neutral-800 mt-10 max-w-sm text-center">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">نمایش این فایل در مرورگر ممکن نیست</h3>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              فایل‌های Word، Excel و PowerPoint باید دانلود شوند تا بتوانید آن‌ها را مشاهده کنید.
            </p>
            <a href={fileUrl} download className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gold-500 text-black font-bold text-sm hover:bg-gold-600 transition">
              <Download className="w-4 h-4" /> دانلود فایل
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
