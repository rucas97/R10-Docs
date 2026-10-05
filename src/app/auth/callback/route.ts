import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/chat';

  // Use the public host Vercel forwards, so cookies land on the right domain
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const isLocal = process.env.NODE_ENV === 'development';

  const baseUrl = isLocal
    ? requestUrl.origin
    : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin;

  if (!code) {
    console.error('[auth/callback] No code in URL');
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchange failed:', error.message);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  if (!data.session) {
    console.error('[auth/callback] no session after exchange');
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${baseUrl}${next}`);
}
