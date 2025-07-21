
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // If the user is at the root path, redirect them to the dashboard.
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/',
}
