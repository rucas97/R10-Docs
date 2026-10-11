'use client';

export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas-pro')).default;
  const { jsPDF } = await import('jspdf');

  try { await (document as any).fonts?.ready; } catch {}

  // Clone the analysis content into an off-screen visible container.
  // Never capture the live element — it may have overflow, transforms,
  // or dark-mode classes that break html2canvas.
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

  // Force light colors in the clone
  clone.classList.remove('dark');
  clone.querySelectorAll('.dark').forEach((n) => n.classList.remove('dark'));
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 100));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (doc) => {
        doc.documentElement.classList.remove('dark');
      },
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
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e: any) {
    console.error('[export-pdf] failed:', e);
    alert('خروجی PDF ناموفق بود: ' + (e?.message || 'خطای نامشخص'));
  } finally {
    document.body.removeChild(container);
  }
}
