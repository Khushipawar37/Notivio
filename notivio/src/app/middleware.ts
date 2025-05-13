import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Add security headers to all responses
  const response = NextResponse.next()

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com; style-src 'self' 'unsafe-inline' *.googleapis.com; font-src 'self' data: *.gstatic.com; img-src 'self' data: blob: *.googleapis.com; connect-src 'self' *.googleapis.com *.google.com *.facebook.com;",
  )

  // XSS Protection
  response.headers.set("X-XSS-Protection", "1; mode=block")

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Frame Options
  response.headers.set("X-Frame-Options", "DENY")

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
