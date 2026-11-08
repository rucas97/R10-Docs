import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const expectedSecret = process.env.SMS_HOOK_SECRET;
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      console.warn('[sms-hook] unauthorized');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const phone: string | undefined = body?.user?.phone;
    const otp: string | undefined = body?.sms?.otp;
    if (!phone || !otp) {
      console.error('[sms-hook] missing phone or otp');
      return new NextResponse('Bad Request', { status: 400 });
    }

    const localPhone = phone.replace(/^\+98/, '0').replace(/^98/, '0');
    const apiKey = process.env.FARAZSMS_API_KEY;
    const patternCode = process.env.FARAZSMS_PATTERN_CODE;
    const sender = process.env.FARAZSMS_SENDER || '+983000505';

    if (!apiKey || !patternCode) {
      console.error('[sms-hook] FarazSMS env vars missing');
      return new NextResponse('Server misconfigured', { status: 500 });
    }

    const FarazSMS = (await import('farazsms')).default;
    const sms = new FarazSMS(apiKey);

    await sms.sendPattern(patternCode, localPhone, { code: otp });

    console.log(`[sms-hook] ✅ OTP sent to ${localPhone}`);
    return new NextResponse('OK', { status: 200 });
  } catch (e: any) {
    console.error('[sms-hook] error:', e?.message || e);
    return new NextResponse('Failed', { status: 500 });
  }
}
