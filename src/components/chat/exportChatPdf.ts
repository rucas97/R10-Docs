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

  const container = document.createElement('div');
  container.setAttribute('dir', 'rtl');
  container.style.cssText = [
    'position: absolute',
    'top: 0',
    'left: -9999px',
    'width: 900px',
    'padding: 50px 60px',
    'background: #ffffff',
    'color: #0f172a',
    'font-family: Vazirmatn, system-ui, -apple-system, sans-serif',
    'direction: rtl',
    'text-align: right',
    'box-sizing: border-box',
    'z-index: 1',
  ].join(';');

  // Each message is a bubble row. User right, assistant left. Bubble max-width ~65%.
  const rows = messages.map((m) => {
    const isUser = m.role === 'user';
    const clean = escapeHtml(
      m.content.replace(/\[منابع:[^\]]+\]/g, '').trim() || '(بدون متن)'
    ).replace(/\n/g, '<br/>');

    const alignment = isUser ? 'justify-content: flex-start;' : 'justify-content: flex-end;';
    // In RTL: flex-start = right, flex-end = left
    const bg = isUser ? '#7c3aed' : '#ffffff';
    const color = isUser ? '#ffffff' : '#0f172a';
    const border = isUser ? 'none' : '1px solid #e2e8f0';
    const roleLabel = isUser ? 'شما' : 'دستیار';
    const roleColor = isUser ? '#ffffff' : '#7c3aed';

    return `
      <div style="
        display: flex;
        ${alignment}
        margin-bottom: 20px;
        width: 100%;
        direction: rtl;
      ">
        <div style="
          max-width: 65%;
          padding: 14px 18px;
          background: ${bg};
          color: ${color};
          border: ${border};
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.85;
          word-wrap: break-word;
          direction: rtl;
          text-align: right;
        ">
          <div style="
            font-size: 10px;
            font-weight: 800;
            color: ${roleColor};
            margin-bottom: 6px;
            opacity: 0.9;
          ">${roleLabel}</div>
          <div>${clean}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
      <div style="display: inline-block; font-size: 26px; font-weight: 900; color: #6d28d9;">R10-Docs</div>
      <div style="font-size: 13px; color: #64748b; margin-top: 6px;">${escapeHtml(fileName)}</div>
    </div>
    ${rows}
    <div style="text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8;">
      تولید شده توسط R10-Docs
    </div>
  `;

  document.body.appendChild(container);

  try {
    try { await (document as any).fonts?.ready; } catch {}
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 150));

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
    a.download = `chat-${(fileName || 'export').replace(/\.pdf$/i, '')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e: any) {
    console.error('[export] failed:', e);
    alert('خروجی PDF ناموفق بود: ' + (e?.message || 'خطای نامشخص'));
  } finally {
    document.body.removeChild(container);
  }
}
