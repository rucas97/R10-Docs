import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId, amount } = await req.json();
  const pin = process.env.AQAYEPARDAKHT_PIN;
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback`;

  if (!pin) return NextResponse.json({ error: 'Gateway not configured' }, { status: 500 });

  // Create transaction record
  const invoiceId = `INV-${Date.now()}`;
  const { data: trx, error } = await supabase.from('transactions').insert({
    user_id: user.id, plan_id: planId, amount, status: 'pending', authority: invoiceId
  }).select().single();

  if (error) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

  // Call Agha-ye Pardakht
  const params = new URLSearchParams({
    pin, amount: amount.toString(), callback: callbackUrl, invoice_id: invoiceId
  });

  const res = await fetch('https://panel.aqayepardakht.ir/api/v2/create', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
  });
  
  const data = await res.json();
  if (data.status === 'success') {
    return NextResponse.json({ redirect: `https://panel.aqayepardakht.ir/startpay/${data.transid}` });
  }
  return NextResponse.json({ error: data.message || 'خطای درگاه' }, { status: 400 });
}
