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
      const wh = new Webhook(expectedSecret.replace('v1,whsec_', ''));
      body = wh.verify(payload, headers);
    } catch (err: any) {
      console.error('[sms-hook] Signature failed:', err.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone: string = body?.user?.phone;
    const otp: string = body?.sms?.otp;
    const channel: string | undefined = body?.user?.user_metadata?.otp_channel;
    const baleSessionId: string | undefined = body?.user?.user_metadata?.bale_session_id;

    if (!phone || !otp) {
      console.error('[sms-hook] missing phone or otp');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    const localPhone = phone.replace(/^\+98/, '0').replace(/^98/, '0');
    console.log(`[sms-hook] phone=${localPhone} channel=${channel || 'sms'} session=${baleSessionId || '-'}`);

    // ---------- Bale: metadata carries the session_id ----------
    if (channel === 'bale') {
      if (!baleSessionId) {
        console.error('[sms-hook] channel=bale but no session_id');
        return NextResponse.json({ error: 'Missing bale_session_id' }, { status: 400 });
      }
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(url, key);
      const { error } = await supabase
        .from('bale_otp_sessions')
        .update({ otp_code: otp })
        .eq('session_id', baleSessionId)
        .eq('otp_code', 'PENDING');
      if (error) {
        console.error('[sms-hook] could not store Bale OTP:', error);
        return NextResponse.json({ error: 'Failed to store OTP' }, { status: 500 });
      }
      console.log(`[sms-hook] ✅ Bale OTP stored for ${baleSessionId}`);
      return NextResponse.json({ success: true, channel: 'bale' });
    }

    // ---------- Default: SMS via Faraz ----------
    const apiKey = process.env.FARAZSMS_API_KEY;
    const patternCode = process.env.FARAZSMS_PATTERN_CODE;
    if (!apiKey || !patternCode) {
      console.error('[sms-hook] FarazSMS env missing');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    const sms = new FarazSMS(apiKey);
    await sms.sendPattern(patternCode, localPhone, { code: otp });
    console.log(`[sms-hook] ✅ SMS OTP sent to ${localPhone}`);
    return NextResponse.json({ success: true, channel: 'sms' });
  } catch (error: any) {
    console.error('[sms-hook] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
