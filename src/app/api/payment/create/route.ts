import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { planId, amount } = await req.json();
    
    // Use the new PIN provided
    const pin = process.env.AQAYEPARDAKHT_PIN || 'C8804D84E2065CA42C0D';
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.docwize.site'}/api/payment/callback`;

    // Create transaction record
    const invoiceId = `INV-${Date.now()}`;
    const { data: trx, error } = await supabase.from('transactions').insert({
      user_id: user.id, plan_id: planId, amount, status: 'pending', authority: invoiceId
    }).select().single();

    if (error) {
      console.error('[Payment] DB Error:', error);
      return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    }

    // Call Agha-ye Pardakht
    const params = new URLSearchParams({
      pin: pin, amount: amount.toString(), callback: callbackUrl, invoice_id: invoiceId
    });

    const res = await fetch('https://panel.aqayepardakht.ir/api/v2/create', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
    });
    
    const data = await res.json();
    console.log('[Payment] Gateway Response:', data); // Logged to Vercel for debugging

    if (data.status === 'success') {
      return NextResponse.json({ redirect: `https://panel.aqayepardakht.ir/startpay/${data.transid}` });
    }
    return NextResponse.json({ error: data.message || 'خطای درگاه پرداخت' }, { status: 400 });
  } catch (e: any) {
    console.error('[Payment] Error:', e.message);
    return NextResponse.json({ error: 'خطای شبکه درگاه' }, { status: 500 });
  }
}
