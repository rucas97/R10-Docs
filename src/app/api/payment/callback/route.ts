import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.docwize.site';
  try {
    const { searchParams } = new URL(req.url);
    const transid = searchParams.get('transid') || searchParams.get('tracking');
    const invoiceId =
      searchParams.get('inv') ||
      searchParams.get('invoice_id') ||
      searchParams.get('invoice') ||
      searchParams.get('authority');

    console.log('[Payment Callback] hit:', { transid, invoiceId, url: req.url });

    if (!transid) {
      return NextResponse.redirect(`${siteUrl}/payment-result?status=failed&reason=missing_transid`);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let trx: any = null;
    if (invoiceId) {
      const { data } = await supabase
        .from('transactions').select('*').eq('authority', invoiceId).maybeSingle();
      trx = data;
    }
    if (!trx) {
      const { data } = await supabase
        .from('transactions').select('*').eq('authority', transid).maybeSingle();
      trx = data;
    }
    if (!trx) {
      console.error('[Payment Callback] no transaction for', { transid, invoiceId });
      return NextResponse.redirect(`${siteUrl}/payment-result?status=failed&reason=trx_not_found`);
    }

    console.log('[Payment Callback] matched trx:', {
      id: trx.id, user: trx.user_id, plan: trx.plan_id, amount: trx.amount
    });

    const pin = process.env.AQAYEPARDAKHT_PIN || 'C8804D84E2065CA42C0D';
    const params = new URLSearchParams({ pin, amount: String(trx.amount), transid });

    const res = await fetch('https://panel.aqayepardakht.ir/api/v2/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json();
    console.log('[Payment Callback] verify response:', data);

    const ok = data?.status === 'success' && String(data?.code) === '1';

    if (ok) {
      await supabase.from('transactions').update({ status: 'success' }).eq('id', trx.id);

      const { error: profErr } = await supabase
        .from('profiles')
        .upsert({ id: trx.user_id, plan_id: trx.plan_id }, { onConflict: 'id' });
      if (profErr) console.error('[Payment Callback] profile upsert failed:', profErr);

      return NextResponse.redirect(
        `${siteUrl}/payment-result?status=success&tracking=${encodeURIComponent(transid)}&plan=${encodeURIComponent(trx.plan_id || '')}`
      );
    }

    await supabase.from('transactions').update({ status: 'failed' }).eq('id', trx.id);
    console.error('[Payment Callback] verify rejected:', data);
    return NextResponse.redirect(`${siteUrl}/payment-result?status=failed&reason=verify_failed`);
  } catch (error: any) {
    console.error('[Payment Callback] Exception:', error);
    return NextResponse.redirect(`${siteUrl}/payment-result?status=failed&reason=exception`);
  }
}

export async function POST(req: Request) {
  const form = await req.formData();
  const url = new URL(req.url);
  // Merge form fields INTO existing query params instead of overwriting them.
  for (const [k, v] of form.entries()) url.searchParams.set(k, String(v));
  return GET(new Request(url.toString(), { method: 'GET' }));
}
