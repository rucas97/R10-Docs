'use client';

export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas-pro')).default;
  const { jsPDF } = await import('jspdf');

  try { await (document as any).fonts?.ready; } catch {}

  // Clone the analysis content off-screen
  const clone = el.cloneNode(true) as HTMLElement;
  const container = document.createElement('div');
  container.setAttribute('dir', 'rtl');
  container.style.cssText = [
    'position: absolute',
    'top: 0',
    'left: -9999px',
    'width: 900px',
    'padding: 40px',
    'background: #ffffff',
    'color: #0f172a',
    'font-family: Vazirmatn, system-ui, -apple-system, sans-serif',
    'direction: rtl',
    'text-align: right',
    'box-sizing: border-box',
    'z-index: 1',
  ].join(';');

  // Force light mode
  clone.classList.remove('dark');
  clone.querySelectorAll('.dark').forEach((n) => n.classList.remove('dark'));

  // Remove interactive elements before capture
  clone.querySelectorAll('button, iframe, canvas[role="img"]').forEach((n) => {
    // keep canvas — needed for charts — but drop buttons
    if (n.tagName === 'BUTTON') n.remove();
  });

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 200));

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

    console.log('[analysis-pdf] canvas:', canvas.width, 'x', canvas.height);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    // A4 aspect ratio in canvas pixels
    const pxPerMm = canvas.width / pdfW;
    const pageHeightInPx = Math.floor(pdfH * pxPerMm);

    // Add a small safety margin so slicing doesn't split text awkwardly
    // Reserve 8mm at the bottom of each page as white space
    const bottomMarginPx = Math.floor(8 * pxPerMm);
    const usableHeightPx = pageHeightInPx - bottomMarginPx;

    let srcY = 0;
    let pageNum = 0;

    while (srcY < canvas.height) {
      const remaining = canvas.height - srcY;
      const sliceH = Math.min(usableHeightPx, remaining);

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = pageHeightInPx; // full page height so blank space is consistent
      const ctx = slice.getContext('2d');
      if (!ctx) break;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);

      // Draw the content slice at the top
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const imgData = slice.toDataURL('image/jpeg', 0.92);

      if (pageNum > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

      srcY += sliceH;
      pageNum++;
    }

    console.log('[analysis-pdf] pages:', pageNum);

    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e: any) {
    console.error('[analysis-pdf] failed:', e);
    alert('خروجی PDF ناموفق بود: ' + (e?.message || 'خطای نامشخص'));
  } finally {
    document.body.removeChild(container);
  }
}
