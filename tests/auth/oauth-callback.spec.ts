/**
 * Google OAuth callback route — unit tests.
 *
 * These tests are MOCKED. They do not call real Google or Supabase APIs.
 * Live integration requires a configured Google OAuth client and deployed URLs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

function makeRequest(search: Record<string, string>) {
  const url = new URL('http://localhost:3000/auth/callback');
  for (const [k, v] of Object.entries(search)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('auth/callback GET — mocked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /dashboard on successful code exchange', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });
    const req = makeRequest({ code: 'valid-code-abc' });
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/dashboard');
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
