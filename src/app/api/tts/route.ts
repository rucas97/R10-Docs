import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_TEXT = 2000;
const FA_VOICE = 'fa-IR-FaridNeural';       // male, clearer than Dilara
const EN_VOICE = 'en-US-AndrewNeural';      // modern US English

type Segment = { text: string; lang: 'fa' | 'en' };

// Split text into Persian / English segments based on character script.
// Latin letters + digits → English segment; everything else → Persian.
function splitByScript(text: string): Segment[] {
  const segments: Segment[] = [];
  let current = '';
  let currentLang: 'fa' | 'en' | null = null;

  // Whitespace/punctuation attaches to the CURRENT segment, not the next one.
  const isLatin = (ch: string) => /[A-Za-z0-9]/.test(ch);
  const isPersian = (ch: string) => /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(ch);
  const isNeutral = (ch: string) => !isLatin(ch) && !isPersian(ch);

  for (const ch of text) {
    let lang: 'fa' | 'en' | null = null;
    if (isLatin(ch)) lang = 'en';
    else if (isPersian(ch)) lang = 'fa';
    // Neutral (spaces, punctuation, marks) keeps the current language

    if (lang === null) {
      // Neutral character: append to current buffer
      if (currentLang === null) {
        // Leading neutral — hold in a buffer until we know the language
        current += ch;
      } else {
        current += ch;
      }
      continue;
    }

    if (currentLang === null) {
      // First real character — establish language
      currentLang = lang;
      current += ch;
    } else if (lang === currentLang) {
      current += ch;
    } else {
      // Language switched — flush current segment (trimmed) and start new
      const trimmed = current.trim();
      if (trimmed) segments.push({ text: trimmed, lang: currentLang });
      current = ch;
      currentLang = lang;
    }
  }

  const trimmed = current.trim();
  if (trimmed && currentLang) segments.push({ text: trimmed, lang: currentLang });

  // Merge segments shorter than 3 chars into the previous one to avoid voice thrashing
  const merged: Segment[] = [];
  for (const seg of segments) {
    if (seg.text.length < 3 && merged.length > 0) {
      merged[merged.length - 1].text += ' ' + seg.text;
    } else {
      merged.push(seg);
    }
  }

  return merged.length > 0 ? merged : [{ text: text.trim(), lang: 'fa' }];
}

async function synthesizeSegment(text: string, voice: string): Promise<Buffer | null> {
  try {
    const mod: any = await import('voipi');
    const VoiPi = mod.VoiPi || mod.default?.VoiPi || mod.default;

    const instance = new VoiPi({
      providers: [['edge-tts', { voice }]],
    });

    const audio = await instance.toAudio(text);
    if (!audio || !audio.data) {
      console.warn('[tts] no audio for segment:', text.slice(0, 30));
      return null;
    }

    const raw = audio.data instanceof Uint8Array ? audio.data : new Uint8Array(audio.data);
    return Buffer.from(raw);
  } catch (e: any) {
    console.warn(`[tts] segment failed (${voice}):`, e?.message);
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

    if (!cleaned) return NextResponse.json({ error: 'Empty text' }, { status: 400 });

    const segments = splitByScript(cleaned);
    console.log(`[tts] ${cleaned.length} chars → ${segments.length} segments:`,
      segments.map((s) => `${s.lang}(${s.text.length})`).join(' '));

    // Synthesize segments sequentially (avoids rate-limiting)
    const buffers: Buffer[] = [];
    for (const seg of segments) {
      const voice = seg.lang === 'fa' ? FA_VOICE : EN_VOICE;
      const buf = await synthesizeSegment(seg.text, voice);
      if (buf && buf.length > 0) buffers.push(buf);
    }

    if (buffers.length === 0) {
      return NextResponse.json({ error: 'No audio generated' }, { status: 502 });
    }

    // Concatenate MP3 buffers. MP3 frames play sequentially without gaps.
    const combined = Buffer.concat(buffers);
    const ab = new ArrayBuffer(combined.byteLength);
    new Uint8Array(ab).set(combined);

    console.log(`[tts] ✅ ${buffers.length}/${segments.length} segments, ${combined.length} bytes`);

    return new NextResponse(ab, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(combined.byteLength),
        'Cache-Control': 'private, max-age=3600',
        'X-TTS-Segments': String(segments.length),
      },
    });
  } catch (e: any) {
    console.error('[tts] error:', e?.message, e?.stack?.slice(0, 400));
    return NextResponse.json({ error: e?.message || 'TTS failed' }, { status: 500 });
  }
}
