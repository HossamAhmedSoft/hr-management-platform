import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleConfig,
  generateOAuthState,
  generatePKCE,
  buildGoogleAuthUrl,
} from "@/lib/google-auth";

/**
 * GET /api/auth/google/oauth
 * Initiates OpenID Connect / OAuth 2.0 Authorization Code flow with PKCE
 * and cryptographically signed state for CSRF mitigation.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale") || "ar";
  const nextUrl = searchParams.get("next") || `/${locale}`;

  const config = getGoogleConfig();
  if (!config.isConfigured) {
    const errorUrl = new URL(`/${locale}/login?error=google_not_configured`, request.url);
    return NextResponse.redirect(errorUrl);
  }

  // 1. Generate PKCE & Signed State
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = generateOAuthState(locale, nextUrl);

  // 2. Build Google Authorization URL
  const authUrl = buildGoogleAuthUrl({
    state,
    codeChallenge,
    redirectUri: config.redirectUri,
  });

  const response = NextResponse.redirect(authUrl);

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    maxAge: 15 * 60, // 15 minutes validity
  };

  // Securely store code verifier & state in short-lived HttpOnly cookies
  response.cookies.set("gdg_oauth_verifier", codeVerifier, cookieOptions);
  response.cookies.set("gdg_oauth_state", state, cookieOptions);

  return response;
}
