import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBaleDeepLink } from '@/lib/bale';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const { phone } = await req.json();
    const cleaned = String(phone || '').replace(/\D/g, '');
    if (cleaned.length < 10) return NextResponse.json({ error: 'شماره نامعتبر' }, { status: 400 });

    const supabase = createClient(url, key);
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Clear stale PENDING rows so a new attempt starts clean
    await supabase
      .from('bale_otp_sessions')
      .delete()
      .eq('phone', cleaned)
      .eq('otp_code', 'PENDING');

    const { error: insErr } = await supabase.from('bale_otp_sessions').insert({
      session_id: sessionId,
      phone: cleaned,
      otp_code: 'PENDING',
      used: false,
      expires_at: expiresAt,
    });
    if (insErr) return NextResponse.json({ error: 'DB: ' + insErr.message }, { status: 500 });

    return NextResponse.json({
      sessionId,
      deepLink: buildBaleDeepLink(sessionId),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
