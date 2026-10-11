/**
 * Google OAuth redirect & callback route — unit tests.
 *
 * These tests are MOCKED. They do not call real Google or Supabase APIs.
 * Live integration requires a configured Google OAuth client and deployed URLs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  getSiteUrl,
  getAuthCallbackUrl,
  getAuthRedirectOrigin,
  isSafeReturnPath,
  normalizeUrl,
  isLocalhost,
} from '../../apps/web/src/lib/auth-url';

// ── Minimal mocks ────────────────────────────────────────────────────────────

const mockExchangeCodeForSession = vi.fn();
const mockGetAll = vi.fn(() => []);
const mockSetAll = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ getAll: mockGetAll, set: vi.fn(), setAll: mockSetAll }),
  ),
}));

// Route handler under test
const { GET } = await import(
  '../../apps/web/src/app/auth/callback/route'
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  search: Record<string, string>,
  baseUrl = 'http://localhost:3000/auth/callback',
  headers?: Record<string, string>,
) {
  const url = new URL(baseUrl);
  for (const [k, v] of Object.entries(search)) url.searchParams.set(k, v);
  const req = new NextRequest(url.toString(), {
    headers: headers ? new Headers(headers) : undefined,
  });
  return req;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('auth-url helper unit tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('normalizes URLs correctly (trims slashes, ensures protocol)', () => {
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('localhost:3000')).toBe('http://localhost:3000');
    expect(normalizeUrl('')).toBe('');
  });

  it('detects localhost and loopback hosts correctly', () => {
    expect(isLocalhost('localhost:3000')).toBe(true);
    expect(isLocalhost('http://localhost:3000')).toBe(true);
    expect(isLocalhost('127.0.0.1')).toBe(true);
    expect(isLocalhost('https://ledgerly.vercel.app')).toBe(false);
  });

  it('uses NEXT_PUBLIC_SITE_URL in production environment', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ledgerly.app';

    const siteUrl = getSiteUrl({ isDev: false });
    expect(siteUrl).toBe('https://ledgerly.app');

    const callbackUrl = getAuthCallbackUrl();
    expect(callbackUrl).toBe('https://ledgerly.app/auth/callback');
  });

  it('appends safe returnPath to callback URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ledgerly.app';

    const callbackUrl = getAuthCallbackUrl('/loans');
    expect(callbackUrl).toBe('https://ledgerly.app/auth/callback?next=%2Floans');
  });

  it('prevents localhost from overriding production configuration', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ledgerly.app';

    // Even if browser window reports localhost, in production prodUrl wins
    const siteUrl = getSiteUrl({
      windowOrigin: 'http://localhost:3000',
      isDev: false,
    });
    expect(siteUrl).toBe('https://ledgerly.app');

    // Callback route redirect origin rejects localhost header in production
    const origin = getAuthRedirectOrigin({
      headers: { get: (name: string) => (name === 'x-forwarded-host' ? 'localhost:3000' : null) },
      url: 'http://localhost:3000/auth/callback',
    });
    expect(origin).toBe('https://ledgerly.app');
  });

  it('preserves localhost for local development', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NODE_ENV = 'development';

    const siteUrl = getSiteUrl({
      windowOrigin: 'http://localhost:3000',
      isDev: true,
    });
    expect(siteUrl).toBe('http://localhost:3000');

    const origin = getAuthRedirectOrigin({
      url: 'http://localhost:3000/auth/callback',
    });
    expect(origin).toBe('http://localhost:3000');
  });

  describe('isSafeReturnPath open-redirect validation', () => {
    it('allows valid relative paths', () => {
      expect(isSafeReturnPath('/dashboard')).toBe(true);
      expect(isSafeReturnPath('/transactions?page=2')).toBe(true);
      expect(isSafeReturnPath('/loans')).toBe(true);
    });

    it('rejects external absolute URLs', () => {
      expect(isSafeReturnPath('https://evil.com')).toBe(false);
      expect(isSafeReturnPath('http://evil.com/dashboard')).toBe(false);
      expect(isSafeReturnPath('//evil.com')).toBe(false);
      expect(isSafeReturnPath('/\\evil.com')).toBe(false);
    });

    it('rejects dangerous protocols and formats', () => {
      expect(isSafeReturnPath('javascript:alert(1)')).toBe(false);
      expect(isSafeReturnPath('data:text/html,evil')).toBe(false);
      expect(isSafeReturnPath(null)).toBe(false);
      expect(isSafeReturnPath('')).toBe(false);
      expect(isSafeReturnPath('relative/without/slash')).toBe(false);
    });
  });
});

describe('auth/callback GET route handler', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('redirects to /dashboard on production domain when configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ledgerly.app';
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const req = makeRequest({ code: 'valid-code-abc' }, 'https://ledgerly.app/auth/callback');
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location')!;
    const locUrl = new URL(location);
    expect(locUrl.origin).toBe('https://ledgerly.app');
    expect(locUrl.pathname).toBe('/dashboard');
  });

  it('redirects to /dashboard on localhost in development', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NODE_ENV = 'development';
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const req = makeRequest({ code: 'valid-code-abc' }, 'http://localhost:3000/auth/callback');
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location')!;
    const locUrl = new URL(location);
    expect(locUrl.origin).toBe('http://localhost:3000');
    expect(locUrl.pathname).toBe('/dashboard');
  });

  it('redirects to custom safe next path on success', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const req = makeRequest({ code: 'valid-code-abc', next: '/loans' });
    const res = await GET(req);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/loans');
  });

  it('rejects unsafe external next path, falls back to /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const req = makeRequest({ code: 'valid-code-abc', next: 'https://evil.example.com' });
    const res = await GET(req);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard');
  });

  it('rejects double-slash open-redirect next path', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const req = makeRequest({ code: 'valid-code-abc', next: '//evil.example.com' });
    const res = await GET(req);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard');
  });

  it('redirects to /login with error when no code present', async () => {
    const req = makeRequest({});
    const res = await GET(req);
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get('location')!);
    expect(loc.pathname).toBe('/login');
    expect(loc.searchParams.has('error')).toBe(true);
  });

  it('redirects to /login with error when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      error: { message: 'Token exchange error' },
    });
    const req = makeRequest({ code: 'expired-code' });
    const res = await GET(req);
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get('location')!);
    expect(loc.pathname).toBe('/login');
    expect(loc.searchParams.has('error')).toBe(true);
  });

  it('includes OAuth provider error_description in redirect when no code', async () => {
    const req = makeRequest({ error_description: 'access_denied' });
    const res = await GET(req);
    const loc = new URL(res.headers.get('location')!);
    expect(decodeURIComponent(loc.searchParams.get('error')!)).toContain('access_denied');
  });
});
