// Extracts [منابع: ص۳، ص۷] from the end of a Gemini reply.
// Returns the cleaned content (marker stripped) + array of page numbers.

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toEnglishDigits(s: string): string {
  return s.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

export function extractCitations(raw: string): { content: string; pages: number[] } {
  if (!raw) return { content: '', pages: [] };

  // Match the last occurrence of [منابع: ...]
  const regex = /\[\s*منابع\s*[:：]\s*([^\]]+)\]/g;
  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(raw)) !== null) {
    lastMatch = m;
  }

  if (!lastMatch) return { content: raw.trimEnd(), pages: [] };

  const inside = lastMatch[1];
  const normalized = toEnglishDigits(inside);

  const pages = Array.from(
    new Set(
      Array.from(normalized.matchAll(/ص\s*(\d+)/g)).map((x) => parseInt(x[1], 10))
    )
  ).filter((n) => !isNaN(n) && n > 0).sort((a, b) => a - b);

  const content = raw.replace(regex, '').trimEnd();
  return { content, pages };
}

export function toPersianNumber(n: number): string {
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}
