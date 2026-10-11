import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const DEFAULT_VOICE = 'fa-IR-DilaraNeural';

export async function POST(req: NextRequest) {
  const log: string[] = [];
  try {
    log.push('start');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    log.push('auth ok');

    const { text, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const cleaned = text
      .replace(/\[منابع:[^\]]+\]/g, '')
      .replace(/[*_`#>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    if (!cleaned) {
      return NextResponse.json({ error: 'Empty text' }, { status: 400 });
    }
    log.push(`cleaned ${cleaned.length} chars`);

    // Dynamic import
    const mod: any = await import('msedge-tts');
    log.push('imported msedge-tts');
    const { MsEdgeTTS, OUTPUT_FORMAT } = mod;

    const tts = new MsEdgeTTS();
    log.push('created instance');
    await tts.setMetadata(voice || DEFAULT_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    log.push('metadata set');

    const { audioStream } = tts.toStream(cleaned);
    log.push('stream requested');

    const chunks: Buffer[] = [];
    const collected = await new Promise<{ ok: boolean; err?: string }>((resolve) => {
      const timeout = setTimeout(() => resolve({ ok: false, err: 'timeout after 20s' }), 20_000);
      audioStream.on('data', (chunk: any) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      audioStream.on('end', () => { clearTimeout(timeout); resolve({ ok: true }); });
      audioStream.on('close', () => { clearTimeout(timeout); resolve({ ok: true }); });
      audioStream.on('error', (err: any) => { clearTimeout(timeout); resolve({ ok: false, err: err?.message || 'stream error' }); });
    });

    if (!collected.ok) {
      console.error('[tts] stream failed:', collected.err, '| log:', log.join(' → '));
      return NextResponse.json(
        { error: 'Stream failed: ' + (collected.err || 'unknown'), steps: log },
        { status: 500 }
      );
    }

    if (chunks.length === 0) {
      console.error('[tts] no audio | log:', log.join(' → '));
      return NextResponse.json({ error: 'No audio chunks', steps: log }, { status: 500 });
    }

    const buffer = Buffer.concat(chunks);
    log.push(`audio ${buffer.length} bytes`);
    console.log('[tts] ✅', log.join(' → '));

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('[tts] error:', e?.message, '| steps:', log.join(' → '));
    return NextResponse.json(
      { error: e?.message || 'unknown', steps: log, stack: e?.stack?.slice(0, 300) },
      { status: 500 }
    );
  }
}
