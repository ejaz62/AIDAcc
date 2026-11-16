import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: sends visitors without a session cookie straight to the
 * sign-in page. Real authorisation happens in `requireAdmin()` on every page,
 * action and route handler.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/sign-in") return NextResponse.next();
  if (!getSessionCookie(request, { cookiePrefix: "aida" })) {
    return NextResponse.redirect(new URL("/admin/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
