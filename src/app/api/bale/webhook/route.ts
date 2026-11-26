import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { baleSendMessage } from '@/lib/bale';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.BALE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 });
    const supabase = createClient(url, key);

    const update = await req.json();
    const message = update?.message;
    if (!message?.text || !message?.chat?.id) return NextResponse.json({ ok: true });

    const text: string = message.text;
    const chatId = message.chat.id;
    if (!text.startsWith('/start')) return NextResponse.json({ ok: true });

    const sessionId = text.split(' ')[1];
    if (!sessionId) {
      await baleSendMessage(chatId, 'سلام! لطفاً از طریق سایت داک وایز وارد شوید.');
      return NextResponse.json({ ok: true });
    }

    const { data: session, error } = await supabase
      .from('bale_otp_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error || !session) {
      await baleSendMessage(chatId, 'نشست منقضی شده است. لطفاً دوباره از سایت تلاش کنید.');
      return NextResponse.json({ ok: true });
    }
    if (session.used) {
      await baleSendMessage(chatId, 'این کد قبلاً استفاده شده است.');
      return NextResponse.json({ ok: true });
    }
    if (session.otp_code === 'PENDING') {
      await baleSendMessage(chatId, 'کد هنوز آماده نیست. چند لحظه صبر کنید و دوباره تلاش کنید.');
      return NextResponse.json({ ok: true });
    }

    await supabase
      .from('bale_otp_sessions')
      .update({ used: true, bale_chat_id: chatId })
      .eq('session_id', sessionId);

    await baleSendMessage(chatId, `داک وایز\nکد ورود شما: ${session.otp_code}`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[Bale Webhook] exception:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Internal' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
