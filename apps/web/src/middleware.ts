import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "proofline_session";
const SUPPLIER_COOKIE_NAME =
  process.env.SUPPLIER_COOKIE_NAME ?? "proofline_supplier_session";

const PROTECTED_PREFIXES = [
  "/overview",
  "/members",
  "/settings",
  "/exceptions",
  "/cases",
  "/purchase-orders",
  "/receiving",
  "/invoices",
  "/suppliers",
  "/documents",
  "/reports",
  "/audit",
  "/notifications",
];

/**
 * Edge guard: redirects obviously-unauthenticated users away from protected
 * areas. This only checks for the cookie's presence; the real, authoritative
 * session validation happens server-side in the app layout and API.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Supplier portal has its own identity and cookie.
  const isSupplierLogin = pathname === "/supplier/login";
  const isSupplierArea = pathname === "/supplier" || pathname.startsWith("/supplier/");
  if (isSupplierArea && !isSupplierLogin) {
    if (!request.cookies.get(SUPPLIER_COOKIE_NAME)?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/supplier/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

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
    "/cases/:path*",
    "/purchase-orders/:path*",
    "/receiving/:path*",
    "/invoices/:path*",
    "/suppliers/:path*",
    "/documents/:path*",
    "/reports/:path*",
    "/audit/:path*",
    "/notifications/:path*",
    "/supplier/:path*",
  ],
};
