'use client';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

export async function exportChatToPdf(fileName: string, messages: Msg[]) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;

  let y = margin;

  const addPageIfNeeded = (need: number) => {
    if (y + need > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  // Title
  pdf.setFontSize(18);
  pdf.setTextColor(60, 30, 130);
  pdf.text('R10-Docs — Chat Export', pageW / 2, y, { align: 'center' });
  y += 8;

  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.text(fileName, pageW / 2, y, { align: 'center' });
  y += 6;

  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  pdf.setFontSize(11);
  const lineHeight = 5.5;

  for (const msg of messages) {
    const prefix = msg.role === 'user' ? '👤 شما:' : '🤖 دستیار:';
    const cleanContent = msg.content
      .replace(/\[منابع:[^\]]+\]/g, '')
      .replace(/[*_`#>]/g, '')
      .trim();

    // Prefix line
    addPageIfNeeded(lineHeight * 2);
    pdf.setFontSize(10);
    pdf.setTextColor(msg.role === 'user' ? 60 : 124, msg.role === 'user' ? 60 : 58, msg.role === 'user' ? 130 : 200);
    pdf.text(prefix, margin, y);
    y += lineHeight;

    // Content
    pdf.setFontSize(10);
    pdf.setTextColor(30, 30, 30);
    const lines = pdf.splitTextToSize(cleanContent || '(بدون متن)', contentW);
    for (const line of lines) {
      addPageIfNeeded(lineHeight);
      pdf.text(line, margin + 4, y);
      y += lineHeight;
    }

    y += 3;
    // Separator
    addPageIfNeeded(4);
    pdf.setDrawColor(230, 230, 230);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;
  }

  pdf.save(`chat-${fileName.replace(/\.pdf$/i, '')}.pdf`);
}
