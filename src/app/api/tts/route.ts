import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Google Translate TTS endpoint — free, no key, supports Persian.
// Hard limit: ~200 chars per request. We chunk at 180 to be safe.
const GTTS = 'https://translate.google.com/translate_tts';
const CHUNK_SIZE = 180;
const MAX_TEXT = 3000;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function chunkText(text: string): string[] {
  // Prefer breaking at sentence boundaries (Persian: ., !, ?, ؟, ؛, ،)
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?؟۔])\s+/);
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  for (const sentence of sentences) {
    if (sentence.length > CHUNK_SIZE) {
      // Long sentence: split by word
      pushCurrent();
      const words = sentence.split(/\s+/);
      for (const w of words) {
        if ((current + ' ' + w).trim().length > CHUNK_SIZE) pushCurrent();
        current = (current ? current + ' ' : '') + w;
      }
    } else if ((current + ' ' + sentence).trim().length > CHUNK_SIZE) {
      pushCurrent();
      current = sentence;
    } else {
      current = (current ? current + ' ' : '') + sentence;
    }
  }
  pushCurrent();

  return chunks.filter(Boolean);
}

async function fetchChunk(chunk: string): Promise<Buffer | null> {
  const params = new URLSearchParams({
    ie: 'UTF-8',
    q: chunk,
    tl: 'fa',
    client: 'tw-ob',
    ttsspeed: '0.95',
  });

  const url = `${GTTS}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!res.ok) {
      console.warn('[tts] google chunk failed:', res.status);
      return null;
    }

    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch (e: any) {
    console.warn('[tts] fetch error:', e?.message);
    return null;
  }
}

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

    if (!cleaned) {
      return NextResponse.json({ error: 'Empty text' }, { status: 400 });
    }

    const chunks = chunkText(cleaned);
    console.log(`[tts] ${cleaned.length} chars → ${chunks.length} chunks`);

    // Sequential to avoid Google rate-limiting. Each chunk ~0.3-0.8s.
    const buffers: Buffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const buf = await fetchChunk(chunks[i]);
      if (buf) buffers.push(buf);
      else console.warn(`[tts] chunk ${i} failed`);
    }

    if (buffers.length === 0) {
      return NextResponse.json({ error: 'Google TTS failed for all chunks' }, { status: 502 });
    }

    const audio = Buffer.concat(buffers);
    console.log(`[tts] ✅ ${buffers.length}/${chunks.length} chunks, ${audio.length} bytes`);

    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audio.length),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('[tts] error:', e?.message);
    return NextResponse.json({ error: e?.message || 'TTS failed' }, { status: 500 });
  }
}
