import { NextResponse, type NextRequest } from 'next/server';

/**
 * Interim access gate for the CRM until real user accounts ship.
 *
 * - CRM_BASIC_AUTH="user:password" → HTTP Basic auth required for /crm.
 * - DATABASE_URL set (real data) and no CRM_BASIC_AUTH → CRM is refused, so
 *   patient data is never served without authentication.
 * - Neither set → local demo with fictional data, open.
 */
export function middleware(req: NextRequest) {
  const creds = process.env.CRM_BASIC_AUTH;
  if (!creds) {
    if (process.env.DATABASE_URL) {
      return new NextResponse('CRM access is disabled: set CRM_BASIC_AUTH before connecting a real database.', { status: 503 });
    }
    return NextResponse.next();
  }
  const header = req.headers.get('authorization') ?? '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded && safeEqual(atob(encoded), creds)) return NextResponse.next();
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Fetch 22 CRM"' },
  });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const config = { matcher: ['/crm/:path*'] };
