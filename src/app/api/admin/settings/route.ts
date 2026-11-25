import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const { data } = await supabase.from('admin_settings').select('*').eq('id', 1).single();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { username, password, email } = await req.json();
  await supabase.from('admin_settings').update({ username, password, email }).eq('id', 1);
  return NextResponse.json({ success: true });
}
