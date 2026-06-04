// Phase 1 — Foundation
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // The actual JWT is held in Zustand memory client-side. 
  // This middleware reads a parallel route-guard cookie set at login for server-side route protection.
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
