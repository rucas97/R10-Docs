import { NextRequest, NextResponse } from 'next/server';
import FarazSMS from 'farazsms';
import { Webhook } from 'standardwebhooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Health check for Supabase setup
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

// 2. Handle the actual SMS dispatch
export async function POST(req: NextRequest) {
  try {
    // Read raw body as text for signature verification
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    const expectedSecret = process.env.SMS_HOOK_SECRET;
    if (!expectedSecret) {
      console.error('[sms-hook] SMS_HOOK_SECRET is missing');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Strip the "v1,whsec_" prefix required by the Standard Webhooks library
    const base64Secret = expectedSecret.replace('v1,whsec_', '');
    const wh = new Webhook(base64Secret);

    let body: any;
    try {
      // Supabase sends standard webhook headers (webhook-id, webhook-timestamp, webhook-signature)
      body = wh.verify(payload, headers);
    } catch (err: any) {
      console.error('[sms-hook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = body?.user?.phone;
    const otp = body?.sms?.otp;

    if (!phone || !otp) {
      console.error('[sms-hook] Missing phone or otp in payload');
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    // Convert +98912... to 0912...
    const localPhone = phone.replace(/^\+98/, '0').replace(/^98/, '0');
    console.log(`[sms-hook] Sending OTP ${otp} to ${localPhone}`);

    const apiKey = process.env.FARAZSMS_API_KEY;
    const patternCode = process.env.FARAZSMS_PATTERN_CODE;

    if (!apiKey || !patternCode) {
      console.error('[sms-hook] FarazSMS env vars missing');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const sms = new FarazSMS(apiKey);
    await sms.sendPattern(patternCode, localPhone, { code: otp });
    
    console.log(`[sms-hook] ✅ Success: OTP sent to ${localPhone}`);

    // CRITICAL FIX: Return a JSON object, not an empty response
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[sms-hook] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
