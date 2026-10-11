let current: SpeechSynthesisUtterance | null = null;

export function speak(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  stopSpeaking();
  const clean = text
    .replace(/\[منابع:[^\]]+\]/g, '')
    .replace(/[*_`#>]/g, '')
    .trim();
  if (!clean) return false;

  const u = new SpeechSynthesisUtterance(clean.slice(0, 4000));
  u.lang = 'fa-IR';
  u.rate = 0.95;
  u.pitch = 1;
  u.onend = () => { current = null; onEnd?.(); };
  u.onerror = () => { current = null; onEnd?.(); };
  current = u;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  current = null;
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}
