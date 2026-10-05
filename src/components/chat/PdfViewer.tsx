'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PdfViewerInner = dynamic(() => import('./PdfViewerInner'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
    </div>
  ),
});

export function PdfViewer(props: {
  pdfUrl: string | null;
  pageCount: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  primaryLanguage?: 'fa' | 'en';
  highlightSnippet?: string;
}) {
  return <PdfViewerInner {...props} />;
}
