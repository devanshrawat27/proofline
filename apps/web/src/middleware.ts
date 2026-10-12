import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "proofline_session";

const PROTECTED_PREFIXES = [
  "/overview",
  "/members",
  "/settings",
  "/exceptions",
  "/purchase-orders",
  "/receiving",
  "/invoices",
  "/suppliers",
  "/documents",
  "/reports",
];

/**
 * Edge guard: redirects obviously-unauthenticated users away from protected
 * areas. This only checks for the cookie's presence; the real, authoritative
 * session validation happens server-side in the app layout and API.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/members/:path*",
    "/settings/:path*",
    "/exceptions/:path*",
    "/purchase-orders/:path*",
    "/receiving/:path*",
    "/invoices/:path*",
    "/suppliers/:path*",
    "/documents/:path*",
    "/reports/:path*",
  ],
};
