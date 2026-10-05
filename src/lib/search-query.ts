// Builds a PDF.js viewer-friendly search query from a source snippet.
// Goals:
//   - Strip punctuation that won't appear in the rendered text
//   - Keep the most distinctive 5-6 words (skip Persian/English stopwords)
//   - Return a space-separated string; PDF.js will highlight each word
//     individually, which is more forgiving than exact phrase matching.

const STOPWORDS_FA = new Set([
  'و', 'از', 'به', 'در', 'که', 'این', 'آن', 'را', 'با', 'برای',
  'است', 'هست', 'نیز', 'هم', 'یا', 'اگر', 'تا', 'بر', 'اما', 'ولی',
  'یک', 'دو', 'سه', 'بود', 'شده', 'می', 'های', 'ها', 'ای',
]);

const STOPWORDS_EN = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at',
  'by', 'for', 'with', 'is', 'are', 'was', 'were', 'be', 'been',
  'this', 'that', 'these', 'those', 'it', 'its', 'as', 'from',
]);

export function buildSearchQuery(snippet: string, maxWords = 6): string {
  if (!snippet) return '';

  // Normalize: strip common wrapping punctuation, Persian/Arabic punctuation
  let s = snippet
    .replace(/[«»""„‟"'`]/g, '')      // quotes
    .replace(/[\u060C\u061B\u061F]/g, ' ') // Persian comma/semicolon/question
    .replace(/[\u200C\u200D\u200E\u200F]/g, ' ') // zero-width joiners/marks
    .replace(/[.,;:!?()[\]{}<>]/g, ' ') // English punctuation
    .replace(/\s+/g, ' ')
    .trim();

  if (!s) return '';

  const words = s.split(/\s+/).filter(Boolean);

  // Score words: prefer longer, non-stopword tokens
  type Scored = { word: string; score: number; index: number };
  const scored: Scored[] = words.map((w, i) => {
    const clean = w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
    const isStop = STOPWORDS_FA.has(clean) || STOPWORDS_EN.has(clean);
    const len = clean.length;
    const score = isStop ? len * 0.2 : len * 1.5 + (clean.length >= 5 ? 2 : 0);
    return { word: w, score, index: i };
  });

  const picked = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxWords)
    .sort((a, b) => a.index - b.index)
    .map((x) => x.word);

  return picked.join(' ');
}
