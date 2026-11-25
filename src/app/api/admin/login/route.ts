import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Trim spaces from input in case of accidental typing spaces
  const username = (body.username || '').trim();
  const password = (body.password || '').trim();

  // Trim spaces from environment variables in case Vercel added invisible spaces
  // Fetch from DB instead of env
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: settings } = await supabase.from('admin_settings').select('username, password').eq('id', 1).single();

  const dbUsername = (settings?.username || 'admin').trim();
  const dbPassword = (settings?.password || 'docwize2026').trim();

  if (username === dbUsername && password === dbPassword) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/', 
      maxAge: 86400 
    });
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
