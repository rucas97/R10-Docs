import { NextRequest, NextResponse } from 'next/server';
import FarazSMS from 'farazsms';
import { Webhook } from 'standardwebhooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 1. Supabase needs a GET to verify the endpoint exists during setup
export async function GET() {
  return new NextResponse(null, { status: 200 });
}

// 2. Handle the actual POST from Supabase
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text(); // Read as text for verification
    const headers = Object.fromEntries(req.headers.entries());
    
    const expectedSecret = process.env.SMS_HOOK_SECRET;

    if (!expectedSecret) {
      console.error('[sms-hook] SMS_HOOK_SECRET is missing');
      return new NextResponse('Server misconfigured', { status: 500 });
    }

    // Supabase stores the secret as "v1,whsec_<base64>"
    // The Standard Webhooks library needs just the base64 part.
    const base64Secret = expectedSecret.replace('v1,whsec_', '');
    const wh = new Webhook(base64Secret);

    let body: any;
    try {
      // Verify the signature using Supabase's headers
      body = wh.verify(payload, headers);
    } catch (err: any) {
      console.error('[sms-hook] Signature verification failed:', err.message);
      // Return 401 to match Supabase's expected error format
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[sms-hook] Payload verified:', JSON.stringify(body).slice(0, 300));

    const phone = body?.user?.phone;
    const otp = body?.sms?.otp;

    if (!phone || !otp) {
      console.error('[sms-hook] Missing phone or otp');
      return new NextResponse('Bad Request', { status: 400 });
    }

    const localPhone = phone.replace(/^\+98/, '0').replace(/^98/, '0');
    console.log(`[sms-hook] Sending OTP ${otp} to ${localPhone}`);

    const apiKey = process.env.FARAZSMS_API_KEY;
    const patternCode = process.env.FARAZSMS_PATTERN_CODE;

    if (!apiKey || !patternCode) {
      console.error('[sms-hook] FarazSMS env vars missing');
      return new NextResponse('Server misconfigured', { status: 500 });
    }

    const sms = new FarazSMS(apiKey);
    await sms.sendPattern(patternCode, localPhone, { code: otp });
    
    console.log(`[sms-hook] ✅ Success: OTP sent to ${localPhone}`);

    // Supabase expects an empty 200 OK response
    return new NextResponse(null, { status: 200 });

  } catch (error: any) {
    console.error('[sms-hook] Error:', error?.message || error);
    return new NextResponse('Failed to send SMS', { status: 500 });
  }
}
