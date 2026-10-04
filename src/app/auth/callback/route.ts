import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get('next') ?? '/chat';

  // Prefer the public host Vercel forwards, so cookies land on the right domain
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const isLocal = process.env.NODE_ENV === 'development';

  const baseUrl = isLocal
    ? requestUrl.origin
    : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : requestUrl.origin;

  // The @supabase/ssr middleware already exchanged the code.
  // We only need to check if a user session exists now.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Success: send them to the app
    return NextResponse.redirect(`${baseUrl}${next}`);
  }

  // If no user, something went wrong earlier in the flow.
  return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
}
