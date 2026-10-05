const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toEnglishDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

export type Citation = { page: number; snippet: string };

export function extractCitations(raw: string): {
  content: string;
  pages: number[];
  citations: Citation[];
} {
  if (!raw) return { content: '', pages: [], citations: [] };

  const regex = /\[\s*منابع\s*[:：]\s*([^\]]+)\]/g;
  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(raw)) !== null) lastMatch = m;

  if (!lastMatch) return { content: raw.trimEnd(), pages: [], citations: [] };

  const inside = lastMatch[1];
  const normalized = toEnglishDigits(inside);

  // Split on Persian/Arabic commas
  const parts = normalized.split(/[،,]/).map((s) => s.trim()).filter(Boolean);

  const citations: Citation[] = [];
  for (const part of parts) {
    const pageMatch = part.match(/ص\s*(\d+)/);
    if (!pageMatch) continue;
    const page = parseInt(pageMatch[1], 10);
    if (isNaN(page) || page <= 0) continue;

    // Extract snippet inside «...» or "..." if present
    const snippetMatch = part.match(/[«"]([^»"]+)[»"]/);
    const snippet = snippetMatch ? snippetMatch[1].trim() : '';

    if (!citations.find((c) => c.page === page)) {
      citations.push({ page, snippet });
    }
  }

  citations.sort((a, b) => a.page - b.page);
  const pages = citations.map((c) => c.page);

  const content = raw.replace(regex, '').trimEnd();
  return { content, pages, citations };
}

export function toPersianNumber(n: number): string {
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}
