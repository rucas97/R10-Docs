import { NextRequest, NextResponse } from 'next/server';
import FarazSMS from 'farazsms';
import { Webhook } from 'standardwebhooks';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeIranPhone(phone: string): string {
  let p = String(phone || '').replace(/\D/g, '');
  if (p.startsWith('0098')) p = p.slice(4);
  else if (p.startsWith('98')) p = p.slice(2);
  else if (p.startsWith('0')) p = p.slice(1);
  return '0' + p;
}

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    const expectedSecret = process.env.SMS_HOOK_SECRET;
    if (!expectedSecret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    let body: any;
    try {
      body = new Webhook(expectedSecret.replace('v1,whsec_', '')).verify(payload, headers);
    } catch (err: any) {
      console.error('[sms-hook] Signature failed:', err.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawPhone: string = body?.user?.phone;
    const otp: string = body?.sms?.otp;
    if (!rawPhone || !otp) {
      console.error('[sms-hook] missing phone or otp');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const normalized = normalizeIranPhone(rawPhone);
    console.log(`[sms-hook] raw=${rawPhone} normalized=${normalized} t=${startedAt}`);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key);

    const { data: pending, error: qErr } = await supabase
      .from('bale_otp_sessions')
      .select('session_id')
      .eq('phone', normalized)
      .eq('otp_code', 'PENDING')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (qErr) console.error('[sms-hook] query error:', qErr);

    if (pending?.session_id) {
      const { error } = await supabase
        .from('bale_otp_sessions')
        .update({ otp_code: otp })
        .eq('session_id', pending.session_id)
        .eq('otp_code', 'PENDING');
      if (error) {
        console.error('[sms-hook] could not store Bale OTP:', error);
        return NextResponse.json({ error: 'Failed to store OTP' }, { status: 500 });
      }
      console.log(`[sms-hook] ✅ Bale OTP stored for ${pending.session_id} (${normalized}) in ${Date.now() - startedAt}ms`);
      return NextResponse.json({ success: true, channel: 'bale' });
    }

    console.log(`[sms-hook] no PENDING for ${normalized} → SMS`);
    const apiKey = process.env.FARAZSMS_API_KEY;
    const patternCode = process.env.FARAZSMS_PATTERN_CODE;
    if (!apiKey || !patternCode) {
      console.error('[sms-hook] FarazSMS env missing');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    await new FarazSMS(apiKey).sendPattern(patternCode, normalized, { code: otp });
    console.log(`[sms-hook] ✅ SMS OTP sent to ${normalized} in ${Date.now() - startedAt}ms`);
    return NextResponse.json({ success: true, channel: 'sms' });
  } catch (error: any) {
    console.error('[sms-hook] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
