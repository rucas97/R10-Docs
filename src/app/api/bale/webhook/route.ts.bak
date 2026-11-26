import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { baleSendMessage } from '@/lib/bale';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Optional but recommended: verify the secret token in the URL query.
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.BALE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await req.json();
    const message = update?.message;
    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true }); // ignore non-message updates
    }

    const text: string = message.text;
    const chatId = message.chat.id;

    // Only handle /start commands
    if (!text.startsWith('/start')) {
      return NextResponse.json({ ok: true });
    }

    // Extract the sessionId after "/start "
    const parts = text.split(' ');
    const sessionId = parts[1];
    if (!sessionId) {
      await baleSendMessage(chatId, 'سلام! لطفاً از طریق سایت داک وایز وارد شوید.');
      return NextResponse.json({ ok: true });
    }

    // Look up the pending OTP session we created when the user clicked the button.
    const { data: session, error } = await supabase
      .from('bale_otp_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error || !session) {
      await baleSendMessage(chatId, 'نشست منقضی شده است. لطفاً دوباره از سایت تلاش کنید.');
      return NextResponse.json({ ok: true });
    }

    // Prevent reuse
    if (session.used) {
      await baleSendMessage(chatId, 'این کد قبلاً استفاده شده است.');
      return NextResponse.json({ ok: true });
    }

    // Mark as used and store the Bale chat_id for this session
    await supabase
      .from('bale_otp_sessions')
      .update({ used: true, bale_chat_id: chatId })
      .eq('session_id', sessionId);

    // Send the OTP message using the exact text you requested.
    const otpMessage = `داک وایز\nکد ورود شما: ${session.otp_code}`;
    await baleSendMessage(chatId, otpMessage);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[Bale Webhook] error:', e?.message || e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  // Optional health check
  return NextResponse.json({ status: 'ok' });
}
