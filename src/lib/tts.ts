let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export async function speak(text: string, onEnd?: () => void): Promise<boolean> {
  stopSpeaking();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      let detail = '';
      try {
        const data = await res.json();
        detail = data.error || '';
      } catch {}
      console.error('[tts] server error:', res.status, detail);
      onEnd?.();
      return false;
    }

    const blob = await res.blob();
    if (blob.size === 0) {
      console.error('[tts] empty audio');
      onEnd?.();
      return false;
    }

    const url = URL.createObjectURL(blob);
    currentUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      if (currentUrl === url) {
        URL.revokeObjectURL(url);
        currentUrl = null;
        currentAudio = null;
      }
      onEnd?.();
    };
    audio.onerror = () => {
      console.error('[tts] playback error');
      if (currentUrl === url) {
        URL.revokeObjectURL(url);
        currentUrl = null;
        currentAudio = null;
      }
      onEnd?.();
    };

    await audio.play();
    return true;
  } catch (e: any) {
    console.error('[tts] error:', e);
    onEnd?.();
    return false;
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.currentTime = 0; } catch {}
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

export function ttsSupported(): boolean {
  return true;
}
