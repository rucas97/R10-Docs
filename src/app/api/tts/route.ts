import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Persian neural voices from Microsoft Edge
// fa-IR-DilaraNeural → female
// fa-IR-FaridNeural  → male
const DEFAULT_VOICE = 'fa-IR-DilaraNeural';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    // Clean and cap the text
    const cleaned = text
      .replace(/\[منابع:[^\]]+\]/g, '')
      .replace(/[*_`#>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    if (!cleaned) {
      return NextResponse.json({ error: 'Empty text' }, { status: 400 });
    }

    console.log('[tts] synthesizing', cleaned.length, 'chars, voice:', voice || DEFAULT_VOICE);

    // Dynamic import so the package isn't bundled at build time on the client
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
    const xmlEscape = (await import('xml-escape')).default;

    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voice || DEFAULT_VOICE,
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );

    const safeText = xmlEscape(cleaned);
    const { audioStream } = tts.toStream(safeText);

    // Collect stream into a buffer
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => resolve());
      audioStream.on('close', () => resolve());
      audioStream.on('error', reject);
    });

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No audio generated' }, { status: 500 });
    }

    const buffer = Buffer.concat(chunks);
    console.log('[tts] generated', buffer.length, 'bytes');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('[tts] error:', e?.message, e?.stack?.slice(0, 300));
    return NextResponse.json(
      { error: 'TTS failed: ' + (e?.message || 'unknown') },
      { status: 500 }
    );
  }
}
