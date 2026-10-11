import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_TEXT = 1500;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

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

    // Provider chain — Edge TTS first (best Persian quality), then Google TTS.
    // Browser/macOS/Piper skipped since we're in a serverless Node runtime.
    const voice = new VoiPi({
      providers: ['edge-tts', 'google-tts'],
    });

    // voipi auto-detects Farsi script and picks fa-IR voice automatically
    const audio = await voice.toAudio(cleaned);

    if (!audio || !audio.data) {
      return NextResponse.json({ error: 'No audio returned' }, { status: 502 });
    }

    // Normalize to a plain Uint8Array backed by an ArrayBuffer (not SharedArrayBuffer)
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
    console.error('[tts] error:', e?.message, e?.stack?.slice(0, 300));
    return NextResponse.json(
      { error: e?.message || 'TTS failed' },
      { status: 500 }
    );
  }
}
