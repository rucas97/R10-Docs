import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Trim spaces from input in case of accidental typing spaces
  const username = (body.username || '').trim();
  const password = (body.password || '').trim();

  // Trim spaces from environment variables in case Vercel added invisible spaces
  const envUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
  const envPassword = (process.env.ADMIN_PASSWORD || 'docwize2026').trim();

  if (username === envUsername && password === envPassword) {
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
