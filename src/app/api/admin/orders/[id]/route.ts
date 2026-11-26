import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, plan_id, user_id } = await req.json();

  await supabase.from('transactions').update({ status }).eq('id', id);

  if (status === 'success' && plan_id && user_id) {
    await supabase.from('profiles').upsert({ id: user_id, plan_id });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabase.from('transactions').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
