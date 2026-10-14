import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleConfig,
  generateOAuthTransaction,
  buildGoogleAuthUrl,
} from "@/lib/google-auth";

/**
 * GET /api/auth/google/oauth
 * Initiates OpenID Connect / OAuth 2.0 Authorization Code flow with PKCE,
 * cryptographic nonce, and HMAC-signed state for CSRF mitigation and transaction binding.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale") || "ar";
  const rawNext = searchParams.get("next") || `/${locale}`;

  const config = getGoogleConfig();
  if (!config.isConfigured) {
    const errorUrl = new URL(`/${locale}/login?error=google_not_configured`, request.url);
    return NextResponse.redirect(errorUrl);
  }

  // 1. Generate full cryptographic transaction: PKCE, Nonce, and Signed State
  const transaction = generateOAuthTransaction(locale, rawNext);

  // 2. Build Google Authorization URL with Nonce
  const authUrl = buildGoogleAuthUrl({
    state: transaction.state,
    codeChallenge: transaction.codeChallenge,
    redirectUri: config.redirectUri,
    nonce: transaction.nonce,
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

  // Securely store code verifier, state, and nonce in short-lived HttpOnly cookies
  response.cookies.set("gdg_oauth_verifier", transaction.codeVerifier, cookieOptions);
  response.cookies.set("gdg_oauth_state", transaction.state, cookieOptions);
  response.cookies.set("gdg_oauth_nonce", transaction.nonce, cookieOptions);

  return response;
}
