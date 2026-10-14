import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale and path
  const localeMatch = pathname.match(/^\/(en|ar)(\/.*)?$/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  const pathWithoutLocale = localeMatch && localeMatch[2] ? localeMatch[2] : pathname;

  // 1. Check for expired session cookies if any are present
  const expiresCookie = request.cookies.get("gdg_session_expires")?.value;
  if (expiresCookie) {
    const expiresAt = parseInt(expiresCookie, 10);
    if (!isNaN(expiresAt) && Date.now() > expiresAt) {
      // Session has expired -> redirect to login and clear cookies
      const loginUrl = new URL(`/${locale}/login?reason=expired`, request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("gdg_session_user");
      response.cookies.delete("gdg_session_role");
      response.cookies.delete("gdg_session_expires");
      response.cookies.delete("gdg_auth_token");
      return response;
    }
  }

  // 2. Enforce authentication on strictly protected administrative routes
  const protectedAdminRoutes = ["/members", "/audit-log", "/hr-kpis", "/reports", "/incidents"];
  const isProtectedAdminRoute = protectedAdminRoutes.some(
    (r) => pathWithoutLocale === r || pathWithoutLocale.startsWith(`${r}/`)
  );

  if (isProtectedAdminRoute) {
    const userCookie = request.cookies.get("gdg_session_user")?.value;
    if (!userCookie) {
      const loginUrl = new URL(`/${locale}/login?reason=expired`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Delegate to internationalization middleware
  const response = intlMiddleware(request);

  // 4. Inject runtime defense headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
