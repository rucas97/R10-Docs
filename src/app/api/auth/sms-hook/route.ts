import { NextRequest, NextResponse } from 'next/server';
import FarazSMS from 'farazsms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Prevent caching

// 1. Supabase needs a GET to verify the endpoint exists
export async function GET() {
  console.log('[sms-hook] GET received (verification)');
  return new NextResponse(null, { status: 200 });
}

// 2. Handle OPTIONS (some proxies send preflight requests)
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

// 3. Handle the actual POST from Supabase
export async function POST(req: NextRequest) {
  console.log('[sms-hook] POST received');
  
  try {
    const authHeader = req.headers.get('authorization') || '';
    const expectedSecret = process.env.SMS_HOOK_SECRET;

    if (!expectedSecret) {
      console.error('[sms-hook] SMS_HOOK_SECRET is missing in Vercel env vars');
      return new NextResponse('Server misconfigured', { status: 500 });
    }

    // Supabase sends: Bearer v1,whsec_...
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    
    if (token !== expectedSecret) {
      console.error('[sms-hook] Secret mismatch. Received:', token.slice(0, 15) + '...');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    console.log('[sms-hook] Payload:', JSON.stringify(body).slice(0, 300));

    const phone = body?.user?.phone;
    const otp = body?.sms?.otp;

    if (!phone || !otp) {
      console.error('[sms-hook] Missing phone or otp in payload');
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Convert +98912... to 0912...
    const localPhone = phone.replace(/^\+98/, '0').replace(/^98/, '0');
    console.log(`[sms-hook] Sending OTP ${otp} to ${localPhone}`);

    const apiKey = process.env.FARAZSMS_API_KEY;
    const patternCode = process.env.FARAZSMS_PATTERN_CODE;

    if (!apiKey || !patternCode) {
      console.error('[sms-hook] FarazSMS env vars missing');
      return new NextResponse('Server misconfigured', { status: 500 });
    }

    const sms = new FarazSMS(apiKey);
    
    // Send via FarazSMS pattern
    await sms.sendPattern(patternCode, localPhone, { code: otp });
    
    console.log(`[sms-hook] ✅ Success: OTP sent to ${localPhone}`);

    // Supabase expects an empty 200 response
    return new NextResponse(null, { status: 200 });

  } catch (error: any) {
    console.error('[sms-hook] Error:', error?.message || error);
    // Return 500 so Supabase knows it failed, but log the exact error
    return new NextResponse('Failed to send SMS', { status: 500 });
  }
}
