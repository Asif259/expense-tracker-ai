import { NextRequest } from 'next/server';

/**
 * Normalizes a URL string by ensuring a scheme and stripping trailing slashes.
 */
export function normalizeUrl(url: string): string {
  let trimmed = url.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    // If localhost, use http, otherwise default to https
    const isLocal = /^localhost(:\d+)?$/i.test(trimmed) || /^127\.0\.0\.1(:\d+)?$/i.test(trimmed);
    trimmed = `${isLocal ? 'http' : 'https'}://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
}

/**
 * Checks if a host/URL is localhost or loopback.
 */
export function isLocalhost(urlOrHost: string): boolean {
  if (!urlOrHost) return false;
  try {
    const host = urlOrHost.includes('://')
      ? new URL(urlOrHost).hostname
      : urlOrHost.split(':')[0].trim();
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch {
    return false;
  }
}

/**
 * Returns the configured production site URL from environment variables, if any.
 */
export function getProductionSiteUrl(): string | null {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    (process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : null);

  if (envUrl) {
    return normalizeUrl(envUrl);
  }
  return null;
}

/**
 * Resolves the base site URL for OAuth redirects and app navigation.
 *
 * Rules:
 * 1. If in production (NODE_ENV === 'production' or running on a non-localhost host):
 *    - Prefers NEXT_PUBLIC_SITE_URL (or Vercel production url).
 *    - In browser, falls back to window.location.origin (if not localhost).
 *    - Localhost CANNOT override production configuration.
 * 2. In local development:
 *    - If running in browser on localhost, preserves localhost origin.
 *    - If no window is available, falls back to NEXT_PUBLIC_SITE_URL or 'http://localhost:3000'.
 */
export function getSiteUrl(options?: {
  windowOrigin?: string;
  isDev?: boolean;
}): string {
  const isDev = options?.isDev ?? (process.env.NODE_ENV !== 'production');
  const prodUrl = getProductionSiteUrl();

  // In browser runtime
  const currentOrigin =
    options?.windowOrigin ??
    (typeof window !== 'undefined' ? window.location.origin : undefined);

  if (currentOrigin) {
    const isCurrentLocal = isLocalhost(currentOrigin);
    // In local development, respect localhost origin
    if (isCurrentLocal && isDev) {
      return normalizeUrl(currentOrigin);
    }
    // In production or on a remote origin, do not let localhost override prodUrl
    if (isCurrentLocal && !isDev && prodUrl) {
      return prodUrl;
    }
    // Remote origin: prefer configured prodUrl if set, else current origin
    return prodUrl || normalizeUrl(currentOrigin);
  }

  // Server-side / SSR resolution
  if (prodUrl && !isDev) {
    return prodUrl;
  }

  return prodUrl || 'http://localhost:3000';
}

/**
 * Validates post-authentication redirect targets to prevent open redirects.
 * Allows only relative paths that do not begin with double slashes or contain schemes.
 */
export function isSafeReturnPath(path: string | null): path is string {
  if (!path) return false;
  // Must start with single slash, no double slashes or protocol schemes
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) {
    return false;
  }
  // No protocol schemes like javascript:, data:, https:
  if (path.includes(':')) {
    return false;
  }
  // No backslashes
  if (path.includes('\\')) {
    return false;
  }
  try {
    const parsed = new URL(path, 'http://dummy.local');
    return parsed.origin === 'http://dummy.local' && parsed.pathname.startsWith('/');
  } catch {
    return false;
  }
}

/**
 * Constructs the absolute OAuth callback URL.
 */
export function getAuthCallbackUrl(returnPath?: string): string {
  const base = getSiteUrl();
  let callbackPath = '/auth/callback';
  if (returnPath && isSafeReturnPath(returnPath) && returnPath !== '/dashboard') {
    callbackPath += `?next=${encodeURIComponent(returnPath)}`;
  }
  return `${base}${callbackPath}`;
}

/**
 * Resolves the destination origin for the callback route redirect.
 *
 * Ensures localhost cannot override production redirects.
 */
export function getAuthRedirectOrigin(
  request?: NextRequest | { headers?: { get(name: string): string | null }; url?: string; nextUrl?: { origin?: string; hostname?: string } },
): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const prodUrl = getProductionSiteUrl();

  // If in production and a production site URL is configured, always use it
  if (!isDev && prodUrl && !isLocalhost(prodUrl)) {
    return prodUrl;
  }

  // Check request headers or URL
  if (request) {
    const forwardedHost = request.headers?.get('x-forwarded-host');
    const forwardedProto = request.headers?.get('x-forwarded-proto') || 'https';
    if (forwardedHost) {
      const isForwardedLocal = isLocalhost(forwardedHost);
      if (isForwardedLocal && !isDev && prodUrl) {
        return prodUrl; // localhost header cannot override production
      }
      const proto = isForwardedLocal ? 'http' : forwardedProto;
      return `${proto}://${forwardedHost}`;
    }

    if (request.nextUrl?.origin) {
      const isReqLocal = isLocalhost(request.nextUrl.origin);
      if (isReqLocal && !isDev && prodUrl) {
        return prodUrl;
      }
      return request.nextUrl.origin;
    }

    if (request.url) {
      const origin = new URL(request.url).origin;
      const isReqLocal = isLocalhost(origin);
      if (isReqLocal && !isDev && prodUrl) {
        return prodUrl;
      }
      return origin;
    }
  }

  return prodUrl || 'http://localhost:3000';
}
