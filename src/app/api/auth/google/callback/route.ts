import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleConfig,
  verifyOAuthState,
  exchangeOAuthCode,
  verifyGoogleIdToken,
  handleGoogleIdentity,
  createGoogleApplicationSession,
} from "@/lib/google-auth";

/**
 * GET /api/auth/google/callback
 * Handles OAuth 2.0 / OpenID Connect authorization code callback from Google.
 * Verifies CSRF state, exchanges authorization code using PKCE verifier,
 * cryptographically validates the ID token, resolves the user profile,
 * establishes the application session, and redirects to the target destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const googleError = searchParams.get("error");

  // Default fallback locale
  let locale = "ar";
  let nextUrl = "/ar";

  // Check state validity if provided
  if (state) {
    const verifiedState = verifyOAuthState(state);
    if (verifiedState.valid) {
      locale = verifiedState.locale || "ar";
      nextUrl = verifiedState.nextUrl || `/${locale}`;
    }
  }

  // 1. Handle user cancellation or Google authorization errors
  if (googleError) {
    const errorParam = googleError === "access_denied" ? "google_cancelled" : "google_error";
    return NextResponse.redirect(new URL(`/${locale}/login?error=${errorParam}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=invalid_oauth_response`, request.url)
    );
  }

  // 2. Mitigate Login CSRF: verify state cookie matches query parameter
  const storedState = request.cookies.get("gdg_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL(`/${locale}/login?error=csrf_state_mismatch`, request.url));
  }

  // 3. Retrieve PKCE Code Verifier
  const codeVerifier = request.cookies.get("gdg_oauth_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=missing_code_verifier`, request.url)
    );
  }

  // 4. Exchange authorization code for Google tokens
  const config = getGoogleConfig();
  const tokenResponse = await exchangeOAuthCode({
    code,
    codeVerifier,
    redirectUri: config.redirectUri,
  });

  if (!tokenResponse.id_token) {
    console.error("OAuth token exchange failed:", tokenResponse.error);
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=token_exchange_failed`, request.url)
    );
  }

  // 5. Cryptographically verify the ID token
  const tokenVerification = await verifyGoogleIdToken(tokenResponse.id_token);
  if (!tokenVerification.success) {
    console.error("Google ID token validation failed:", tokenVerification.error);
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=invalid_id_token`, request.url)
    );
  }

  // 6. Resolve User Account & Link Identity
  const identityResult = await handleGoogleIdentity(tokenVerification.payload);
  if (!identityResult.success || !identityResult.user) {
    const errCode = identityResult.errorCode || "auth_failed";
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${errCode.toLowerCase()}`, request.url)
    );
  }

  // 7. Establish Application Session
  const session = createGoogleApplicationSession(identityResult.user, true);

  const destination = nextUrl.startsWith("/") ? nextUrl : `/${locale}`;
  const response = NextResponse.redirect(new URL(destination, request.url));

  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    path: "/",
    maxAge: session.maxAgeSec,
    sameSite: "lax" as const,
    secure: isProd,
  };

  // Set authenticated session cookies
  response.cookies.set("gdg_session_role", identityResult.user.role, cookieOptions);
  response.cookies.set("gdg_session_user", encodeURIComponent(identityResult.user.id), cookieOptions);
  response.cookies.set("gdg_session_expires", session.expiresAt.toString(), cookieOptions);
  response.cookies.set("gdg_auth_token", encodeURIComponent(session.token), cookieOptions);
  response.cookies.set("gdg_session_sig", encodeURIComponent(session.sig), cookieOptions);

  // Clear ephemeral OAuth cookies
  response.cookies.delete("gdg_oauth_verifier");
  response.cookies.delete("gdg_oauth_state");

  return response;
}
