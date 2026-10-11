'use client';

export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Wait for fonts
  try { await (document as any).fonts?.ready; } catch {}

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    foreignObjectRendering: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
    scrollX: 0,
    scrollY: 0,
    onclone: (doc) => {
      // Force light mode for export
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

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
