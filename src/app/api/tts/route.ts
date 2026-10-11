import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Vercel AI Gateway — free tier models that live in Vercel's infra.
// Fish Audio S2 Pro supports Persian and is free per Vercel docs.
const GATEWAY = 'https://ai-gateway.vercel.sh/v4/ai/speech-model';
const PRIMARY_MODEL = 'fish-audio/s2-pro-free';
const FALLBACK_MODEL = 'openai/tts-1';
const MAX_TEXT = 2000;

async function synthesize(
  text: string,
  model: string,
  apiKey: string
): Promise<{ audio?: Buffer; error?: string; status?: number }> {
  const body: any = {
    text,
    outputFormat: 'mp3',
  };

  // openai/tts-1 requires a voice; fish-audio auto-detects but accepts one
  if (model === 'openai/tts-1') {
    body.voice = 'alloy';
  } else {
    // fish-audio: use a generic default voice; model auto-adapts to language
    body.voice = 'default';
  }

  try {
    const res = await fetch(GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'ai-model-id': model,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.warn(`[tts] ${model} → ${res.status}:`, detail.slice(0, 200));
      return { error: `${res.status}: ${detail.slice(0, 120)}`, status: res.status };
    }

    const data = await res.json();
    if (!data?.audio) {
      return { error: 'no audio in response' };
    }

    const buf = Buffer.from(data.audio, 'base64');
    console.log(`[tts] ${model} → ${buf.length} bytes`);
    return { audio: buf };
  } catch (e: any) {
    console.warn(`[tts] ${model} fetch error:`, e?.message);
    return { error: e?.message ?? 'fetch failed' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI_GATEWAY_API_KEY not set on server' },
        { status: 500 }
      );
    }

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

    console.log(`[tts] request ${cleaned.length} chars`);

    // Try primary, then fallback
    let result = await synthesize(cleaned, PRIMARY_MODEL, apiKey);
    if (!result.audio) {
      console.warn('[tts] primary failed, trying fallback');
      result = await synthesize(cleaned, FALLBACK_MODEL, apiKey);
    }

    if (!result.audio) {
      return NextResponse.json(
        { error: result.error || 'All TTS models failed' },
        { status: 502 }
      );
    }

    const audioBytes = new Uint8Array(result.audio);
    return new NextResponse(audioBytes, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBytes.byteLength),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('[tts] error:', e?.message);
    return NextResponse.json({ error: e?.message || 'TTS failed' }, { status: 500 });
  }
}
