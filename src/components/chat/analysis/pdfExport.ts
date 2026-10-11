'use client';

export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  // How many source pixels of height fit on one A4 page
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
