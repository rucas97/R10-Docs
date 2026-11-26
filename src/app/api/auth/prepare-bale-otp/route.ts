import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaleDeepLink } from '@/lib/bale';

export const runtime = 'nodejs';

// Canonical form: "09xxxxxxxxx" — the exact shape the SMS hook queries with.
function normalizeIranPhone(phone: string): string {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('0098')) p = p.slice(4);
  else if (p.startsWith('98')) p = p.slice(2);
  else if (p.startsWith('0')) p = p.slice(1);
  return '0' + p;
}

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const { phone, channel } = await req.json();
    const normalized = normalizeIranPhone(phone);
    if (normalized.length < 11) return NextResponse.json({ error: 'شماره نامعتبر' }, { status: 400 });

    console.log(`[prepare-bale-otp] channel=${channel} normalized=${normalized}`);

    const admin = createClient(url, key);
    await admin
      .from('bale_otp_sessions')
      .delete()
      .eq('phone', normalized)
      .eq('otp_code', 'PENDING');

    if (channel === 'bale') {
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const { error } = await admin.from('bale_otp_sessions').insert({
        session_id: sessionId,
        phone: normalized,
        otp_code: 'PENDING',
        used: false,
        expires_at: expiresAt,
      });
      if (error) {
        console.error('[prepare-bale-otp] insert failed:', error);
        return NextResponse.json({ error: 'DB: ' + error.message }, { status: 500 });
      }
      return NextResponse.json({ channel: 'bale', sessionId, deepLink: buildBaleDeepLink(sessionId) });
    }

    return NextResponse.json({ channel: 'sms' });
  } catch (e: any) {
    console.error('[prepare-bale-otp] error:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
