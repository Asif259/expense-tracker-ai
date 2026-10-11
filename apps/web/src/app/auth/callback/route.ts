import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthRedirectOrigin, isSafeReturnPath } from '@/lib/auth-url';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getAuthRedirectOrigin(request);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const returnPath = isSafeReturnPath(next) ? next : '/dashboard';

  // No code → OAuth was cancelled or provider error
  if (!code) {
    const errorDesc = searchParams.get('error_description') ?? 'OAuth sign-in was cancelled or failed.';
    const url = new URL('/login', origin);
    url.searchParams.set('error', encodeURIComponent(errorDesc));
    return NextResponse.redirect(url);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Do NOT log the code — it is a one-time secret
    console.error('[auth/callback] Code exchange failed:', error.message);
    const url = new URL('/login', origin);
    url.searchParams.set('error', encodeURIComponent('Sign-in failed. Please try again.'));
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(returnPath, origin));
}
