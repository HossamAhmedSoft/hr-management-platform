import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { canAccessRoute } from "./lib/auth-service";
import { UserRole } from "./types";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale and path
  const localeMatch = pathname.match(/^\/(en|ar)(\/.*)?$/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  const pathWithoutLocale = localeMatch && localeMatch[2] ? localeMatch[2] : pathname;

  // 1. Redirect legacy /login and /register to unified /auth
  if (pathWithoutLocale === "/login" || pathWithoutLocale === "/register") {
    const targetMode = pathWithoutLocale === "/register" ? "register" : "login";
    const authUrl = new URL(`/${locale}/auth`, request.url);
    authUrl.searchParams.set("mode", targetMode);
    // Forward any other query params (e.g. error, next, reason)
    request.nextUrl.searchParams.forEach((val, key) => {
      if (key !== "mode") {
        authUrl.searchParams.set(key, val);
      }
    });
    return NextResponse.redirect(authUrl);
  }

  // 2. Check for expired session cookies if any are present
  const expiresCookie = request.cookies.get("gdg_session_expires")?.value;
  if (expiresCookie) {
    const expiresAt = parseInt(expiresCookie, 10);
    if (!isNaN(expiresAt) && Date.now() > expiresAt) {
      // Session has expired -> redirect to unified auth and clear cookies
      const loginUrl = new URL(`/${locale}/auth?mode=login&reason=expired`, request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("gdg_session_user");
      response.cookies.delete("gdg_session_role");
      response.cookies.delete("gdg_session_expires");
      response.cookies.delete("gdg_auth_token");
      response.cookies.delete("gdg_session_sig");
      response.cookies.delete("gdg_auth_session");
      return response;
    }
  }

  // 3. Enforce authentication & RBAC authorization on restricted routes
  const strictlyAdminRoutes = ["/audit-log", "/members", "/incidents", "/feedback", "/reports", "/hr-kpis"];
  const isProtectedAdminRoute = strictlyAdminRoutes.some(
    (r) => pathWithoutLocale === r || pathWithoutLocale.startsWith(`${r}/`)
  );

  const userCookie = request.cookies.get("gdg_session_user")?.value;
  const roleCookie = request.cookies.get("gdg_session_role")?.value as UserRole | undefined;

  if (isProtectedAdminRoute) {
    if (!userCookie) {
      const loginUrl = new URL(`/${locale}/auth?mode=login&reason=expired`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (roleCookie && !canAccessRoute(roleCookie, pathWithoutLocale)) {
      const forbiddenUrl = new URL(`/${locale}/forbidden`, request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  } else if (roleCookie && !canAccessRoute(roleCookie, pathWithoutLocale)) {
    const forbiddenUrl = new URL(`/${locale}/forbidden`, request.url);
    return NextResponse.redirect(forbiddenUrl);
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
