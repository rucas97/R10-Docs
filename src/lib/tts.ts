let currentUtterance: SpeechSynthesisUtterance | null = null;
let voicesLoaded = false;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return resolve([]);
    const ready = window.speechSynthesis.getVoices();
    if (ready.length > 0) {
      voicesLoaded = true;
      return resolve(ready);
    }
    const handler = () => {
      voicesLoaded = true;
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = handler;
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const find = (prefix: string) =>
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix));

  // Priority: Persian → Arabic (shares script) → null
  return (
    find('fa-ir') ||
    find('fa') ||
    find('ar-sa') ||
    find('ar-eg') ||
    find('ar') ||
    null
  );
}

export async function hasVoiceAvailable(): Promise<boolean> {
  const voices = await loadVoices();
  return !!pickVoice(voices);
}

export async function getVoiceInfo(): Promise<{ available: boolean; voiceName: string | null; lang: string | null }> {
  const voices = await loadVoices();
  const v = pickVoice(voices);
  return {
    available: !!v,
    voiceName: v?.name || null,
    lang: v?.lang || null,
  };
}

export async function speak(text: string, onEnd?: () => void): Promise<boolean> {
  stopSpeaking();

  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return false;
  }

  const clean = text
    .replace(/\[منابع:[^\]]+\]/g, '')
    .replace(/[*_`#>]/g, '')
    .trim();

  if (!clean) {
    onEnd?.();
    return false;
  }

  const voices = await loadVoices();
  const voice = pickVoice(voices);

  if (!voice) {
    onEnd?.();
    return false;
  }

  const u = new SpeechSynthesisUtterance(clean.slice(0, 4000));
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.95;
  u.pitch = 1;

  u.onend = () => { currentUtterance = null; onEnd?.(); };
  u.onerror = (e) => {
    console.warn('[tts] error:', e);
    currentUtterance = null;
    onEnd?.();
  };

  currentUtterance = u;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  currentUtterance = null;
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}
