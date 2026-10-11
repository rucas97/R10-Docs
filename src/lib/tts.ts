let current: SpeechSynthesisUtterance | null = null;

let cachedVoices: SpeechSynthesisVoice[] = [];
let loaded = false;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const tryResolve = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        cachedVoices = v;
        loaded = true;
        resolve(v);
        return true;
      }
      return false;
    };
    if (tryResolve()) return;

    window.speechSynthesis.onvoiceschanged = () => {
      tryResolve();
    };
    setTimeout(() => resolve(cachedVoices), 1500);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const find = (prefix: string) =>
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix));

  // Prefer Persian, then Arabic (they share script), then anything
  return (
    find('fa-ir') ||
    find('fa') ||
    find('ar-sa') ||
    find('ar') ||
    null
  );
}

export async function speak(text: string, onEnd?: () => void): Promise<boolean> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  stopSpeaking();

  const clean = text
    .replace(/\[منابع:[^\]]+\]/g, '')
    .replace(/[*_`#>]/g, '')
    .trim();
  if (!clean) return false;

  const voices = await loadVoices();
  const voice = pickVoice(voices);
  console.log('[tts] available voices:', voices.length, 'picked:', voice?.name, voice?.lang);

  const u = new SpeechSynthesisUtterance(clean.slice(0, 4000));
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    // No Persian voice installed — Chrome will use default (likely English)
    u.lang = 'fa-IR';
  }
  u.rate = 0.95;
  u.pitch = 1;

  u.onend = () => { current = null; onEnd?.(); };
  u.onerror = (e) => {
    console.warn('[tts] error:', e);
    current = null;
    onEnd?.();
  };

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

export async function hasPersianVoice(): Promise<boolean> {
  const voices = await loadVoices();
  return !!pickVoice(voices);
}
