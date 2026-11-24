import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transid = searchParams.get('transid');
  const invoiceId = searchParams.get('invoice_id');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.docwize.site';

  if (!transid || !invoiceId) return NextResponse.redirect(`${siteUrl}/payment-result?status=failed`);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: trx } = await supabase.from('transactions').select('*').eq('authority', invoiceId).single();
  
  if (!trx) return NextResponse.redirect(`${siteUrl}/payment-result?status=failed`);

  // Verify with Agha-ye Pardakht
  const params = new URLSearchParams({
    pin: process.env.AQAYEPARDAKHT_PIN!, amount: trx.amount.toString(), transid
  });

  const res = await fetch('https://panel.aqayepardakht.ir/api/v2/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
  });
  const data = await res.json();

  if (data.status === 'success' && data.code === '1') {
    await supabase.from('transactions').update({ status: 'success' }).eq('id', trx.id);
    await supabase.from('profiles').upsert({ id: trx.user_id, plan_id: trx.plan_id });
    return NextResponse.redirect(`${siteUrl}/payment-result?status=success&tracking=${transid}`);
  } else {
    await supabase.from('transactions').update({ status: 'failed' }).eq('id', trx.id);
    return NextResponse.redirect(`${siteUrl}/payment-result?status=failed`);
  }
}
