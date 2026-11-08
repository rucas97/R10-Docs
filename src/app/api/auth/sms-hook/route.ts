import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Supabase may call GET to verify the endpoint exists.
// Return 200 so the hook configuration can be saved.
export async function GET() {
  return new NextResponse('OK', { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const expectedSecret = process.env.SMS_HOOK_SECRET;

    if (!expectedSecret) {
      console.error('[sms-hook] SMS_HOOK_SECRET is not set');
      return new NextResponse('Server misconfigured', { status: 500 });
    }

    // Supabase sends the secret as: Bearer v1,whsec_...
    // Accept either with or without the "Bearer " prefix.
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (token !== expectedSecret) {
      console.warn('[sms-hook] unauthorized: token mismatch');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const phone: string | undefined = body?.user?.phone;
    const otp: string | undefined = body?.sms?.otp;

    if (!phone || !otp) {
      console.error('[sms-hook] missing phone or otp', JSON.stringify(body).slice(0, 200));
      return new NextResponse('Bad Request', { status: 400 });
    }

    const localPhone = phone.replace(/^\+98/, '0').replace(/^98/, '0');

    const apiKey = process.env.FARAZSMS_API_KEY;
    const patternCode = process.env.FARAZSMS_PATTERN_CODE;

    if (!apiKey || !patternCode) {
      console.error('[sms-hook] FARAZSMS_API_KEY or FARAZSMS_PATTERN_CODE missing');
      return new NextResponse('Server misconfigured', { status: 500 });
    }

    const FarazSMS = (await import('farazsms')).default;
    const sms = new FarazSMS(apiKey);

    await sms.sendPattern(patternCode, localPhone, { code: otp });

    console.log(`[sms-hook] ✅ OTP sent to ${localPhone} via pattern ${patternCode}`);
    return new NextResponse('OK', { status: 200 });
  } catch (e: any) {
    console.error('[sms-hook] error:', e?.message || e);
    return new NextResponse('Failed to send SMS', { status: 500 });
  }
}
