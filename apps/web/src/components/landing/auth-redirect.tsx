'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

/**
 * Signed-in visitors go straight to the dashboard, matching the app's previous
 * behaviour. Rendered by the public homepage so the marketing content can stay
 * a server component.
 */
export function AuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return null;
}
