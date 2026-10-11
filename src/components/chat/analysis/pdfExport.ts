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

  // Remove buttons (interactive noise)
  clone.querySelectorAll('button').forEach((n) => n.remove());

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 200));

    // Gather top-level blocks. If the clone only has one child (a wrapper),
    // descend into it to find the actual sections.
    let blocks: HTMLElement[] = Array.from(clone.children) as HTMLElement[];
    if (blocks.length === 1) {
      const inner = Array.from(blocks[0].children) as HTMLElement[];
      if (inner.length > 1) blocks = inner;
    }

    console.log('[analysis-pdf] capturing', blocks.length, 'blocks');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const marginX = 8;
    const marginY = 8;
    const usableW = pdfW - marginX * 2;
    const usableH = pdfH - marginY * 2;

    let cursorY = marginY; // current vertical position in mm on the active page

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Capture this block individually
      const canvas = await html2canvas(block, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: block.scrollWidth,
        height: block.scrollHeight,
        windowWidth: block.scrollWidth,
        windowHeight: block.scrollHeight,
      });

      if (canvas.width === 0 || canvas.height === 0) continue;

      // Convert canvas → mm dimensions
      const blockAspect = canvas.height / canvas.width;
      let blockWmm = usableW;
      let blockHmm = blockWmm * blockAspect;

      // If block is taller than a full page, scale down to fit one page
      if (blockHmm > usableH) {
        blockHmm = usableH;
        blockWmm = blockHmm / blockAspect;
      }

      // Does it fit on the current page?
      if (cursorY + blockHmm > pdfH - marginY) {
        pdf.addPage();
        cursorY = marginY;
      }

      // Center horizontally
      const xOffset = marginX + (usableW - blockWmm) / 2;

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', xOffset, cursorY, blockWmm, blockHmm);

      cursorY += blockHmm + 4; // small gap between blocks
    }

    console.log('[analysis-pdf] done, pages:', pdf.getNumberOfPages());

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
