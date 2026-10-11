import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_TEXT = 2000;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // Clean but preserve Latin characters so voipi can detect English segments
    const cleaned = text
      .replace(/\[منابع:[^\]]+\]/g, '')
      .replace(/[*_`#>]/g, '')
      .replace(/[\u200C\u200D\u200E\u200F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_TEXT);

    if (!cleaned) return NextResponse.json({ error: 'Empty text' }, { status: 400 });

    console.log(`[tts] synthesizing ${cleaned.length} chars`);

    const mod: any = await import('voipi');
    const VoiPi = mod.VoiPi || mod.default?.VoiPi || mod.default;

    // Prefer Edge TTS (best Farsi neural voice), then Google TTS as fallback.
    // voipi auto-detects script per-text and selects a matching voice.
    const voice = new VoiPi({
      providers: ['edge-tts', 'google-tts'],
    });

    const audio = await voice.toAudio(cleaned);

    if (!audio || !audio.data) {
      console.error('[tts] no audio data');
      return NextResponse.json({ error: 'No audio returned' }, { status: 502 });
    }

    const raw = audio.data instanceof Uint8Array ? audio.data : new Uint8Array(audio.data);
    const buf = new ArrayBuffer(raw.byteLength);
    new Uint8Array(buf).set(raw);

    console.log(`[tts] ✅ ${raw.byteLength} bytes, ${audio.duration}s`);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': audio.mimeType || 'audio/mpeg',
        'Content-Length': String(raw.byteLength),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('[tts] error:', e?.message, e?.stack?.slice(0, 400));
    return NextResponse.json(
      { error: e?.message || 'TTS failed' },
      { status: 500 }
    );
  }
}
