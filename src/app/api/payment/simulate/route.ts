import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId, amount } = await req.json();
  const adminClient = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // 1. Create a successful transaction record
  const { error: trxError } = await adminClient.from('transactions').insert({
    user_id: user.id,
    plan_id: planId,
    amount: amount,
    status: 'success',
    authority: `SIM-${Date.now()}`
  });

  if (trxError) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

  // 2. Upgrade the user's profile
  const { error: profError } = await adminClient.from('profiles').upsert({ 
    id: user.id, 
    plan_id: planId 
  });

  if (profError) return NextResponse.json({ error: 'Profile Error' }, { status: 500 });

  return NextResponse.json({ success: true });
}
