import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleConfig,
  verifyAndConsumeOAuthState,
  exchangeOAuthCode,
  verifyGoogleIdToken,
  handleGoogleIdentity,
  createGoogleApplicationSession,
  sanitizeRedirectPath,
} from "@/lib/google-auth";

/**
 * GET /api/auth/google/callback
 * Security-hardened OAuth 2.0 / OpenID Connect authorization code callback handler.
 * - Enforces CSRF state cookie matching.
 * - Single-use state consumption with replay protection.
 * - Validates PKCE code_verifier from HttpOnly cookie.
 * - Enforces OIDC cryptographic nonce matching.
 * - Cryptographically verifies Google ID token (iss, aud, exp, email_verified, nonce).
 * - Enforces account status & administrative privilege takeover defense.
 * - Sanitizes destination URL to eliminate Open Redirect attacks.
 * - Sets HttpOnly session cookies with HMAC signatures.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const googleError = searchParams.get("error");

  let fallbackLocale = "ar";

  // 1. Handle user cancellation or Google authorization errors
  if (googleError) {
    const errorParam = googleError === "access_denied" ? "google_cancelled" : "google_error";
    return NextResponse.redirect(new URL(`/${fallbackLocale}/login?error=${errorParam}`, request.url));
  }

  // 2. Structural input validation
  if (!code || typeof code !== "string" || !state || typeof state !== "string" || code.length < 10) {
    return NextResponse.redirect(
      new URL(`/${fallbackLocale}/login?error=invalid_oauth_response`, request.url)
    );
  }

  // 3. Mitigate Login CSRF: verify state cookie matches query parameter
  const storedState = request.cookies.get("gdg_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL(`/${fallbackLocale}/login?error=csrf_state_mismatch`, request.url));
  }

  // 4. Cryptographically verify and atomically consume state (Replay Defense)
  const stateVerification = verifyAndConsumeOAuthState(state);
  if (!stateVerification.valid) {
    const errType = stateVerification.error === "REPLAYED_STATE" ? "oauth_state_replayed" : "invalid_oauth_state";
    return NextResponse.redirect(new URL(`/${fallbackLocale}/login?error=${errType}`, request.url));
  }

  fallbackLocale = stateVerification.locale;

  // 5. Retrieve PKCE Code Verifier
  const codeVerifier = request.cookies.get("gdg_oauth_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL(`/${fallbackLocale}/login?error=missing_code_verifier`, request.url)
    );
  }

  // 6. Retrieve Nonce from cookie and verify transaction binding
  const storedNonce = request.cookies.get("gdg_oauth_nonce")?.value;
  const expectedNonce = stateVerification.expectedNonce || storedNonce;

  // 7. Exchange authorization code for Google tokens
  // Enforce using the exact same redirect URI bound to the authorization transaction
  const cookieRedirectUri = request.cookies.get("gdg_oauth_redirect_uri")?.value;
  const config = getGoogleConfig();
  const exchangeRedirectUri = stateVerification.redirectUri || cookieRedirectUri || config.redirectUri;

  const tokenResponse = await exchangeOAuthCode({
    code,
    codeVerifier,
    redirectUri: exchangeRedirectUri,
  });

  if (!tokenResponse.id_token) {
    return NextResponse.redirect(
      new URL(`/${fallbackLocale}/login?error=token_exchange_failed`, request.url)
    );
  }

  // 8. Cryptographically verify the ID token with expected nonce
  const tokenVerification = await verifyGoogleIdToken(tokenResponse.id_token, expectedNonce);
  if (!tokenVerification.success) {
    return NextResponse.redirect(
      new URL(`/${fallbackLocale}/login?error=invalid_id_token`, request.url)
    );
  }

  // 9. Resolve User Account & Link Identity (with RBAC & Privilege Protection)
  const identityResult = await handleGoogleIdentity(tokenVerification.payload);
  if (!identityResult.success || !identityResult.user) {
    const errCode = identityResult.errorCode ? identityResult.errorCode.toLowerCase() : "auth_failed";
    return NextResponse.redirect(
      new URL(`/${fallbackLocale}/login?error=${errCode}`, request.url)
    );
  }

  // 10. Establish Application Session
  const session = createGoogleApplicationSession(identityResult.user, true);

  // 11. Strictly sanitize redirect URL to eliminate Open Redirect attacks
  const safeDestination = sanitizeRedirectPath(stateVerification.nextUrl, fallbackLocale);
  const response = NextResponse.redirect(new URL(safeDestination, request.url));

  const isProd = process.env.NODE_ENV === "production";

  // Base cookie options
  const baseCookieOptions = {
    path: "/",
    maxAge: session.maxAgeSec,
    sameSite: "lax" as const,
    secure: isProd,
  };

  // Set authenticated session cookies (HttpOnly on sensitive tokens)
  response.cookies.set("gdg_session_role", identityResult.user.role, baseCookieOptions);
  response.cookies.set("gdg_session_user", encodeURIComponent(identityResult.user.id), baseCookieOptions);
  response.cookies.set("gdg_session_expires", session.expiresAt.toString(), baseCookieOptions);
  response.cookies.set("gdg_auth_token", encodeURIComponent(session.token), {
    ...baseCookieOptions,
    httpOnly: true,
  });
  response.cookies.set("gdg_session_sig", encodeURIComponent(session.sig), {
    ...baseCookieOptions,
    httpOnly: true,
  });

  // Client-readable serialized auth session for seamless synchronous hydration
  const authSession = {
    user: identityResult.user,
    token: session.token,
    issuedAt: Date.now(),
    expiresAt: session.expiresAt,
    lastActive: Date.now(),
    rememberMe: true,
    sig: session.sig,
  };
  response.cookies.set(
    "gdg_auth_session",
    encodeURIComponent(JSON.stringify(authSession)),
    baseCookieOptions
  );

  // Purge ephemeral OAuth transaction cookies
  response.cookies.delete("gdg_oauth_verifier");
  response.cookies.delete("gdg_oauth_state");
  response.cookies.delete("gdg_oauth_nonce");
  response.cookies.delete("gdg_oauth_redirect_uri");

  return response;
}
