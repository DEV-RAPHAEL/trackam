import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // E.g. "abccorp.trackam.com.ng" or "abccorp.localhost:3000"
  // Remove port if exists for cleaner matching
  const cleanHostname = hostname.split(':')[0];

  // Define main domains that shouldn't be treated as subdomains
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost';
  const mainDomains = ['localhost', baseDomain, `www.${baseDomain}`, 'railway.app'];

  const isSubdomain = !mainDomains.includes(cleanHostname) && !cleanHostname.endsWith('.railway.app');

  if (isSubdomain) {
    // Extract the subdomain part
    const subdomain = cleanHostname.split('.')[0];
    
    // Pass the subdomain to the application via headers
    // The application can read this header in API routes to enforce data isolation,
    // or the frontend can read it to display custom branding.
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant-subdomain', subdomain);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
