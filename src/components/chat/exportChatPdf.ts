'use client';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function exportChatToPdf(fileName: string, messages: Msg[]) {
  const html2canvas = (await import('html2canvas-pro')).default;
  const { jsPDF } = await import('jspdf');

  // Create container IN the viewport but hidden — html2canvas needs visible layout
  const container = document.createElement('div');
  container.setAttribute('dir', 'rtl');
  container.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'width: 800px',
    'padding: 40px',
    'background: #ffffff',
    'color: #0f172a',
    'font-family: Vazirmatn, system-ui, -apple-system, sans-serif',
    'direction: rtl',
    'text-align: right',
    'box-sizing: border-box',
    'opacity: 0',
    'pointer-events: none',
    'z-index: -1',
  ].join(';');

  const rows = messages.map((m) => {
    const isUser = m.role === 'user';
    const clean = escapeHtml(
      m.content.replace(/\[منابع:[^\]]+\]/g, '').trim() || '(بدون متن)'
    ).replace(/\n/g, '<br/>');
    return `
      <div style="margin-bottom: 16px; page-break-inside: avoid; direction: rtl;">
        <div style="font-size: 11px; font-weight: 800; color: ${isUser ? '#7c3aed' : '#4c1d95'}; margin-bottom: 6px;">
          ${isUser ? '👤 شما' : '🤖 دستیار'}
        </div>
        <div style="
          padding: 12px 16px;
          background: ${isUser ? '#f5f3ff' : '#ffffff'};
          border: 1px solid ${isUser ? '#ddd6fe' : '#e2e8f0'};
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.9;
          word-wrap: break-word;
          direction: rtl;
          text-align: right;
        ">${clean}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; font-size: 24px; font-weight: 900; color: #6d28d9;">R10-Docs</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${escapeHtml(fileName)}</div>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 24px;" />
    ${rows}
  `;

  document.body.appendChild(container);

  try {
    try { await (document as any).fonts?.ready; } catch {}

    // Wait one frame for layout
    await new Promise((r) => requestAnimationFrame(r));

    console.log('[export] container size:', container.scrollWidth, 'x', container.scrollHeight);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
    });

    console.log('[export] canvas size:', canvas.width, 'x', canvas.height);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const pageHeightInSrcPx = (pdfH / pdfW) * canvas.width;

    let srcY = 0;
    let pageNum = 0;

    while (srcY < canvas.height) {
      const sliceH = Math.min(pageHeightInSrcPx, canvas.height - srcY);

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceH;
      const ctx = slice.getContext('2d');
      if (!ctx) break;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const imgData = slice.toDataURL('image/jpeg', 0.92);
      const drawH = (sliceH / canvas.width) * pdfW;

      if (pageNum > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, drawH);

      srcY += sliceH;
      pageNum++;
    }

    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${fileName.replace(/\.pdf$/i, '') || 'export'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    console.log('[export] ✅ pdf saved, pages:', pageNum);
  } catch (e: any) {
    console.error('[export] failed:', e);
    alert('خروجی PDF ناموفق بود: ' + (e?.message || 'خطای نامشخص'));
  } finally {
    document.body.removeChild(container);
  }
}
