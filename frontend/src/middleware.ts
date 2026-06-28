import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // A simple client-side logic handled mostly by AuthContext and hooks in standard React
  // but we can block direct access to protected routes if no token exists in cookies.
  // Since we are using localStorage for simplicity, we won't strictly block here,
  // but we can redirect /login to / if token is present (if we used cookies).
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
