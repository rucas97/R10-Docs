// Detects the dominant language of a document from a text sample.
// Returns 'fa' for Persian/Arabic-heavy text, 'en' for Latin-heavy.
export type DocLang = 'fa' | 'en';

const PERSIAN_RANGES: [number, number][] = [
  [0x0600, 0x06ff], // Arabic
  [0x0750, 0x077f], // Arabic Supplement
  [0xfb50, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
];

function isPersian(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  for (const [lo, hi] of PERSIAN_RANGES) {
    if (c >= lo && c <= hi) return true;
  }
  return false;
}

function isLatinLetter(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return (c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a);
}

export function detectLanguage(sample: string): DocLang {
  const s = (sample || '').slice(0, 20_000);
  let fa = 0;
  let en = 0;
  for (const ch of s) {
    if (isPersian(ch)) fa++;
    else if (isLatinLetter(ch)) en++;
  }
  // If Persian chars outnumber Latin letters, treat as Persian
  return fa > en ? 'fa' : 'en';
}
