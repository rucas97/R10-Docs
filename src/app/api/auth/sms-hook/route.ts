import { NextRequest, NextResponse } from 'next/server';
import FarazSMS from 'farazsms';
import { Webhook } from 'standardwebhooks';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function POST(req: NextRequest) {
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

    const phone: string = body?.user?.phone;
    const otp: string = body?.sms?.otp;
    if (!phone || !otp) {
      console.error('[sms-hook] missing phone or otp');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const localPhone = phone.replace(/^\+98/, '0').replace(/^98/, '0');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, key);

    // Deterministic routing: if there's a non-expired PENDING Bale session for
    // this phone, this OTP belongs to Bale. Otherwise it goes to SMS.
    const { data: pending } = await supabase
      .from('bale_otp_sessions')
      .select('session_id')
      .eq('phone', localPhone)
      .eq('otp_code', 'PENDING')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

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
      console.log(`[sms-hook] ✅ Bale OTP stored for ${pending.session_id} (${localPhone})`);
      return NextResponse.json({ success: true, channel: 'bale' });
    }

    // No pending Bale session — send via Faraz SMS.
    const apiKey = process.env.FARAZSMS_API_KEY;
    const patternCode = process.env.FARAZSMS_PATTERN_CODE;
    if (!apiKey || !patternCode) {
      console.error('[sms-hook] FarazSMS env missing');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    await new FarazSMS(apiKey).sendPattern(patternCode, localPhone, { code: otp });
    console.log(`[sms-hook] ✅ SMS OTP sent to ${localPhone}`);
    return NextResponse.json({ success: true, channel: 'sms' });
  } catch (error: any) {
    console.error('[sms-hook] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
