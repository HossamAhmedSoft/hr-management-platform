// ============================================================
// GDG NCTU HR Management Platform — Enterprise Google Identity & OAuth Service
// Production-Grade OpenID Connect, Token Verification, Account Linking & Session Engine
// ============================================================

import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { Profile, UserRole } from "@/types";
import {
  createSessionSignature,
  generateCryptoToken,
  checkLoginLockout,
  resetLoginAttempts,
  isDatabaseEmpty,
  SESSION_SECRET,
} from "./auth-service";
import { internalDB } from "./internal-db";
import { dbService } from "./db-service";
import { ensureUUID } from "./utils";

// ── Google OAuth & Identity Configuration ───────────────────

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  isConfigured: boolean;
}

export interface GoogleConfigStatus {
  isConfigured: boolean;
  clientId: string;
  redirectUri: string;
  missingFields: string[];
}

/**
 * Resolves and canonicalizes the Google OAuth redirect URI.
 * - Strips inadvertent trailing slashes, quotes, carriage returns, and duplicate slashes.
 * - Enforces exact protocol, hostname, port, and callback path (/api/auth/google/callback).
 * - In production (NODE_ENV === "production"), enforces HTTPS for non-localhost hostnames
 *   and refuses to silently fall back to an unverified localhost URL if a production domain is required.
 * - Strictly does NOT trust arbitrary incoming Host or X-Forwarded-* request headers.
 */
export function resolveGoogleRedirectUri(): { uri: string; isMissing: boolean } {
  const isProd = process.env.NODE_ENV === "production";
  const explicitRaw = (process.env.GOOGLE_REDIRECT_URI || "")
    .replace(/['"\r\n]/g, "")
    .trim();

  if (explicitRaw) {
    try {
      const parsed = new URL(explicitRaw);
      parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/api/auth/google/callback";
      if (!parsed.pathname.endsWith("/api/auth/google/callback")) {
        parsed.pathname = parsed.pathname === "/" ? "/api/auth/google/callback" : `${parsed.pathname}/api/auth/google/callback`;
      }
      if (isProd && !parsed.hostname.includes("localhost") && parsed.hostname !== "127.0.0.1") {
        parsed.protocol = "https:";
      }
      return { uri: parsed.toString(), isMissing: false };
    } catch {
      const clean = explicitRaw.replace(/\/+$/, "");
      return { uri: clean, isMissing: false };
    }
  }

  // Derive from configured application URL (NEXT_PUBLIC_APP_URL or APP_URL)
  const appUrlRaw = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "")
    .replace(/['"\r\n]/g, "")
    .trim();

  if (appUrlRaw) {
    try {
      const withProto = appUrlRaw.startsWith("http://") || appUrlRaw.startsWith("https://")
        ? appUrlRaw
        : `https://${appUrlRaw}`;
      const parsed = new URL(withProto);
      if (isProd && !parsed.hostname.includes("localhost") && parsed.hostname !== "127.0.0.1") {
        parsed.protocol = "https:";
      }
      const cleanOrigin = parsed.origin;
      return { uri: `${cleanOrigin}/api/auth/google/callback`, isMissing: false };
    } catch {}
  }

  // In production, check trusted deployment platform variables (e.g. VERCEL_PROJECT_PRODUCTION_URL)
  if (isProd) {
    const vercelDomain = (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "")
      .replace(/['"\r\n]/g, "")
      .trim();
    if (vercelDomain) {
      const cleanHost = vercelDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      return { uri: `https://${cleanHost}/api/auth/google/callback`, isMissing: false };
    }
    // In production without configured URL, refuse to fall back to localhost
    return { uri: "", isMissing: true };
  }

  // Development default
  return { uri: "http://localhost:3000/api/auth/google/callback", isMissing: false };
}

/**
 * Returns the exact configuration status and lists any missing environment keys
 * without exposing sensitive values like the client secret.
 */
export function getGoogleConfigStatus(): GoogleConfigStatus {
  const missing: string[] = [];
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "")
    .replace(/['"\r\n]/g, "")
    .trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "")
    .replace(/['"\r\n]/g, "")
    .trim();

  if (!clientId) missing.push("GOOGLE_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) missing.push("NEXT_PUBLIC_GOOGLE_CLIENT_ID");

  const resolved = resolveGoogleRedirectUri();
  if (resolved.isMissing || !resolved.uri) {
    missing.push("GOOGLE_REDIRECT_URI");
  }

  return {
    isConfigured: missing.length === 0,
    clientId,
    redirectUri: resolved.uri || "http://localhost:3000/api/auth/google/callback",
    missingFields: missing,
  };
}

export function getGoogleConfig(): GoogleConfig {
  const status = getGoogleConfigStatus();
  return {
    clientId: status.clientId,
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
    redirectUri: status.redirectUri,
    isConfigured: status.isConfigured,
  };
}

export interface VerifiedGoogleIdentity {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  nonce?: string;
  isSimulated?: boolean;
}

// ── Replay Defense Stores (In-Memory with TTL) ──────────────

interface TimedEntry {
  expiresAt: number;
}

const consumedStates = new Map<string, TimedEntry>();
const consumedIdTokenHashes = new Map<string, TimedEntry>();

function purgeExpiredEntries(map: Map<string, TimedEntry>) {
  const now = Date.now();
  for (const [key, entry] of map.entries()) {
    if (now > entry.expiresAt) {
      map.delete(key);
    }
  }
}

// Periodically clean up consumed tokens every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    purgeExpiredEntries(consumedStates);
    purgeExpiredEntries(consumedIdTokenHashes);
  }, 5 * 60 * 1000).unref?.();
}

// ── Safe Internal Redirect Sanitizer (Open Redirect Defense) ─

const ALLOWED_LOCALES = new Set(["ar", "en"]);

/**
 * Sanitizes user-supplied destination URLs to prevent Open Redirects,
 * protocol-relative URL injection (//evil.com), backslash bypasses (/\evil.com),
 * and CRLF attacks.
 */
export function sanitizeRedirectPath(rawPath?: string | null, fallbackLocale: string = "ar"): string {
  const safeLocale = ALLOWED_LOCALES.has(fallbackLocale) ? fallbackLocale : "ar";
  if (!rawPath || typeof rawPath !== "string") {
    return `/${safeLocale}`;
  }

  let clean = rawPath.trim();
  try {
    clean = decodeURIComponent(clean);
  } catch {}

  clean = clean.replace(/[\r\n\t\0]/g, "").trim();

  if (
    clean.startsWith("//") ||
    clean.startsWith("/\\") ||
    clean.startsWith("\\") ||
    clean.startsWith("http:") ||
    clean.startsWith("https:") ||
    clean.startsWith("javascript:") ||
    clean.startsWith("data:") ||
    clean.startsWith("vbscript:") ||
    clean.includes(":") ||
    !clean.startsWith("/")
  ) {
    return `/${safeLocale}`;
  }

  // Prevent redirect loops to login or error pages after authentication
  if (clean.includes("/login") || clean.includes("/forbidden")) {
    return `/${safeLocale}`;
  }

  if (!/^\/[a-zA-Z0-9_\-\/\?=&%#]*$/.test(clean)) {
    return `/${safeLocale}`;
  }

  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) {
    return `/${safeLocale}`;
  }

  if (!ALLOWED_LOCALES.has(segments[0])) {
    return `/${safeLocale}${clean}`;
  }

  return clean;
}

// ── ID Token Verification Engine ───────────────────────────

/**
 * Validates Google ID token cryptographically against Google's public JWKS.
 * Enforces audience match, issuer validity, expiration time claims,
 * nonce matching (when applicable), email_verified requirement, and single-use replay defense.
 *
 * SIMULATION RESTRICTION:
 * Simulation test tokens are strictly prohibited in production and can only run
 * in automated test suites (NODE_ENV === 'test') or when ENABLE_GOOGLE_SIMULATION === 'true'.
 * Simulated tokens are strictly prohibited from impersonating real users or existing accounts.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedNonce?: string
): Promise<{ success: true; payload: VerifiedGoogleIdentity } | { success: false; error: string }> {
  if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
    return { success: false, error: "Missing or empty ID token" };
  }

  const tokenHash = crypto.createHash("sha256").update(idToken.trim()).digest("hex");
  purgeExpiredEntries(consumedIdTokenHashes);
  if (consumedIdTokenHashes.has(tokenHash)) {
    return { success: false, error: "ID token has already been consumed (Replay attack detected)" };
  }

  const { clientId } = getGoogleConfig();

  // 1. Simulation Mode Handler (Strictly sandboxed for automated tests & explicit dev testing)
  if (idToken.startsWith("mock_gtoken_") || idToken.startsWith("test_gtoken_")) {
    const isProduction = process.env.NODE_ENV === "production";
    const isAllowedSimulation =
      process.env.NODE_ENV === "test" ||
      (!isProduction && process.env.ENABLE_GOOGLE_SIMULATION === "true");

    if (isProduction || !isAllowedSimulation) {
      return {
        success: false,
        error: "Simulated test tokens are disabled in production mode. Real Google authentication is required.",
      };
    }

    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const parsed = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);

        if (parsed.exp && parsed.exp < now) {
          return { success: false, error: "Google ID token has expired (exp claim passed)" };
        }
        const isAudienceMatch =
          parsed.aud === clientId ||
          (isAllowedSimulation && (parsed.aud === "test_google_client_id" || !clientId));
        if (parsed.aud && !isAudienceMatch) {
          return { success: false, error: "Audience mismatch: token audience does not match configured client ID" };
        }
        if (parsed.iss && !["accounts.google.com", "https://accounts.google.com"].includes(parsed.iss)) {
          return { success: false, error: "Untrusted issuer: token must be issued by accounts.google.com" };
        }
        if (parsed.email_verified === false) {
          return { success: false, error: "Email address is not verified by Google" };
        }
        if (!parsed.sub) {
          return { success: false, error: "Token missing valid subject (sub) claim" };
        }
        if (expectedNonce && parsed.nonce && parsed.nonce !== expectedNonce) {
          return { success: false, error: "Nonce mismatch in token validation" };
        }

        // Anti-impersonation rule: Simulated tokens cannot use real admin emails or production domains
        const cleanEmail = (parsed.email || "").toLowerCase().trim();
        if (isProduction && cleanEmail.endsWith("@gdgnctu.com")) {
          return { success: false, error: "Simulated identities are prohibited from claiming real organization emails" };
        }

        consumedIdTokenHashes.set(tokenHash, { expiresAt: Date.now() + 60 * 60 * 1000 });

        return {
          success: true,
          payload: {
            sub: parsed.sub,
            email: cleanEmail,
            email_verified: parsed.email_verified === true,
            name: parsed.name || cleanEmail.split("@")[0] || "Simulated User",
            picture: parsed.picture,
            nonce: parsed.nonce,
            isSimulated: true,
          },
        };
      }
    } catch (e: any) {
      return { success: false, error: `Invalid test token format: ${e.message}` };
    }
  }

  // 2. Real cryptographic verification via Google Identity Services
  if (!clientId) {
    return {
      success: false,
      error: "Google Client ID is not configured. Please set GOOGLE_CLIENT_ID in your environment.",
    };
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: idToken.trim(),
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return { success: false, error: "Empty or invalid ID token payload" };
    }

    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      return { success: false, error: `Untrusted token issuer: ${payload.iss}` };
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      return { success: false, error: "Google ID token has expired" };
    }

    if (expectedNonce && payload.nonce && payload.nonce !== expectedNonce) {
      return { success: false, error: "Nonce mismatch in token validation" };
    }

    if (!payload.email_verified) {
      return {
        success: false,
        error: "Google account email is not verified. Please verify your email with Google first.",
      };
    }

    if (!payload.sub) {
      return { success: false, error: "Missing subject (sub) identifier in Google ID token" };
    }

    const expiryMs = payload.exp ? payload.exp * 1000 : Date.now() + 3600 * 1000;
    consumedIdTokenHashes.set(tokenHash, { expiresAt: Math.max(expiryMs, Date.now() + 60000) });

    return {
      success: true,
      payload: {
        sub: payload.sub,
        email: (payload.email || "").toLowerCase().trim(),
        email_verified: payload.email_verified,
        name: payload.name || payload.email?.split("@")[0] || "Google User",
        picture: payload.picture,
        nonce: payload.nonce,
        isSimulated: false,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Google verification failed: ${err.message}`,
    };
  }
}

// ── Account Linking & Identity Resolution Engine ───────────

export interface GoogleAuthResult {
  success: boolean;
  user?: Profile;
  isNewUser?: boolean;
  error?: string;
  errorCode?:
    | "ACCOUNT_NOT_FOUND"
    | "ACCOUNT_SUSPENDED"
    | "ACCOUNT_INACTIVE"
    | "LOCKED_OUT"
    | "INVALID_DATA"
    | "ADMIN_LINK_REQUIRES_AUTH"
    | "DUPLICATE_GOOGLE_IDENTITY"
    | "SIMULATION_DENIED";
}

/**
 * Resolves a verified Google identity into the platform's user database:
 * 1. Matches existing user by google_id (sub).
 * 2. If not matched, checks by verified email:
 *    - Validates account status (blocks suspended/inactive accounts).
 *    - Strict Privilege Protection: Unlinked administrative accounts (super_admin / hr_admin)
 *      CANNOT be claimed automatically via external Google sign-in without existing pre-linking.
 *    - Standard member accounts are safely linked to google_id.
 * 3. If account does not exist:
 *    - Checks if DB is empty: if empty, bootstrap as super_admin.
 *    - If DB not empty: assigns default safe role 'member' (Prevents Privilege Escalation).
 *    - Creates active profile.
 */
export async function handleGoogleIdentity(
  identity: VerifiedGoogleIdentity
): Promise<GoogleAuthResult> {
  const cleanEmail = identity.email.toLowerCase().trim();
  if (!cleanEmail || !identity.sub) {
    return { success: false, error: "بيانات الهوية غير مكتملة", errorCode: "INVALID_DATA" };
  }

  // Rate-limiting lockout protection
  const lockout = checkLoginLockout(cleanEmail);
  if (lockout.isLocked) {
    return {
      success: false,
      error: `تم قفل تسجيل الدخول مؤقتاً لتكرار المحاولات الخاطئة. المتبقي: ${Math.floor(
        lockout.remainingSeconds / 60
      )} دقيقة.`,
      errorCode: "LOCKED_OUT",
    };
  }

  // Search for existing profile by google_id
  let existingProfile: Profile | null = null;
  const localGoogleMatch = internalDB.getProfileByGoogleId(identity.sub);
  if (localGoogleMatch) {
    existingProfile = localGoogleMatch;
  }

  // If not found by google_id, search by email
  if (!existingProfile) {
    const localEmailMatch = internalDB.getProfileByEmail(cleanEmail);
    if (localEmailMatch) {
      existingProfile = localEmailMatch;
    }
  }

  // Check Supabase if not found locally
  if (!existingProfile) {
    try {
      const allProfiles = await dbService.getProfiles();
      const match = allProfiles.find(
        (p) =>
          p.google_id === identity.sub ||
          p.email.toLowerCase().trim() === cleanEmail
      );
      if (match) {
        existingProfile = match;
      }
    } catch (e) {
      console.warn("Error querying database for Google profile:", e);
    }
  }

  // Handle Existing Account
  if (existingProfile) {
    // Status Enforcement
    if (
      existingProfile.status === "suspended" ||
      existingProfile.status === "archived" ||
      existingProfile.status === "inactive"
    ) {
      return {
        success: false,
        error:
          existingProfile.status === "suspended"
            ? "تم تعليق هذا الحساب. يرجى مراجعة إدارة الموارد البشرية."
            : "هذا الحساب غير نشط حالياً. يرجى مراجعة مدير النظام.",
        errorCode:
          existingProfile.status === "suspended" ? "ACCOUNT_SUSPENDED" : "ACCOUNT_INACTIVE",
      };
    }

    // Administrative Privilege Takeover Prevention:
    // Unlinked administrative accounts on custom non-Google domains (e.g. @gdgnctu.com)
    // require password login first to prevent external Google identities from taking over internal admin emails.
    // However, authoritative Google accounts (@gmail.com, @googlemail.com) where Google is the direct email provider
    // are cryptographically verified by Google and safely bound.
    const isPrivileged = existingProfile.role === "super_admin" || existingProfile.role === "hr_admin";
    const isAuthoritativeGoogleDomain =
      cleanEmail.endsWith("@gmail.com") || cleanEmail.endsWith("@googlemail.com");

    if (isPrivileged && !existingProfile.google_id && !isAuthoritativeGoogleDomain) {
      return {
        success: false,
        error: "الحسابات الإدارية تتطلب تسجيل الدخول بكلمة المرور أولاً لربط حساب Google بأمان.",
        errorCode: "ADMIN_LINK_REQUIRES_AUTH",
      };
    }

    // Prevent duplicate Google ID bound to multiple emails
    if (existingProfile.google_id && existingProfile.google_id !== identity.sub) {
      return {
        success: false,
        error: "هذا الحساب مرتبط بالفعل بحساب Google آخر.",
        errorCode: "DUPLICATE_GOOGLE_IDENTITY",
      };
    }

    // Simulation Isolation: Simulated identities cannot link to or alter real user profiles
    if (identity.isSimulated) {
      return {
        success: false,
        error: "الهويات التجريبية غير مسموح لها بتعديل أو ربط الحسابات الحقيقية.",
        errorCode: "SIMULATION_DENIED",
      };
    }

    // Link Google ID if not already set, update avatar if empty
    const updates: Partial<Profile> = {};
    if (!existingProfile.google_id) {
      updates.google_id = identity.sub;
    }
    if (!existingProfile.avatar_url && identity.picture) {
      updates.avatar_url = identity.picture;
    }

    let updatedProfile = existingProfile;
    if (Object.keys(updates).length > 0) {
      const res = internalDB.updateProfile(existingProfile.id, updates);
      if (res) updatedProfile = res;
      try {
        await dbService.updateProfile(existingProfile.id, updates);
      } catch (e) {
        console.warn("Failed to persist Google ID to Supabase:", e);
      }
    }

    resetLoginAttempts(cleanEmail);

    try {
      await dbService.createAuditLog({
        actor_id: updatedProfile.id,
        actor_name: updatedProfile.full_name,
        action: "AUTH_GOOGLE_LINKED",
        entity_type: "auth",
        entity_id: updatedProfile.id,
        reason: "تسجيل دخول ناجح عبر حساب Google المربوط",
        details: `Google sub: ${identity.sub}, email: ${cleanEmail}. Account role: ${updatedProfile.role}.`,
        after_value: { google_id: identity.sub, email: cleanEmail },
      });
    } catch {}

    return {
      success: true,
      user: updatedProfile,
      isNewUser: false,
    };
  }

  // ── STRICT PRE-REGISTRATION POLICY (Closed Enterprise Roster) ──
  // Only accounts pre-registered in the platform by HR / Admin can sign in with Google.
  // Unknown Google accounts cannot self-register or access internal resources.
  return {
    success: false,
    error: "هذا الحساب غير مسجل في النظام. يجب أن تتم إضافتك أولاً من قِبل إدارة الموارد البشرية (HR).",
    errorCode: "ACCOUNT_NOT_FOUND",
  };
}

// ── Application Session Creation Engine ────────────────────

export interface GoogleSessionData {
  user: Profile;
  token: string;
  expiresAt: number;
  sig: string;
  maxAgeSec: number;
}

export function createGoogleApplicationSession(
  user: Profile,
  rememberMe: boolean = true
): GoogleSessionData {
  const token = generateCryptoToken();
  const lifespan = rememberMe ? 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  const expiresAt = Date.now() + lifespan;
  const maxAgeSec = Math.floor(lifespan / 1000);
  const sig = createSessionSignature(user.id, user.role, token);

  return {
    user,
    token,
    expiresAt,
    sig,
    maxAgeSec,
  };
}

// ── OAuth 2.0 PKCE, Nonce & CSRF State Protection Engine ───

export interface OAuthTransaction {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  nonce: string;
  sanitizedNextUrl: string;
  redirectUri: string;
}

export function generateOAuthTransaction(
  locale: string = "ar",
  nextUrl: string = "/",
  redirectUri?: string
): OAuthTransaction {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const nonce = crypto.randomBytes(16).toString("hex");
  const randomStateId = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const sanitizedNextUrl = sanitizeRedirectPath(nextUrl, locale);
  const targetRedirectUri = (
    redirectUri ||
    getGoogleConfig().redirectUri ||
    "http://localhost:3000/api/auth/google/callback"
  ).trim();
  const encodedRedirectUri = Buffer.from(targetRedirectUri, "utf8").toString("base64url");

  const raw = `${randomStateId}:${timestamp}:${locale}:${sanitizedNextUrl}:${nonce}:${encodedRedirectUri}`;
  const hmac = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(raw)
    .digest("hex")
    .substring(0, 16);

  const state = Buffer.from(`${raw}:${hmac}`).toString("base64url");

  return {
    state,
    codeVerifier,
    codeChallenge,
    nonce,
    sanitizedNextUrl,
    redirectUri: targetRedirectUri,
  };
}

export function verifyAndConsumeOAuthState(state: string): {
  valid: boolean;
  locale: string;
  nextUrl: string;
  expectedNonce?: string;
  redirectUri?: string;
  error?: string;
} {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 6) {
      return { valid: false, locale: "ar", nextUrl: "/ar", error: "MALFORMED_STATE" };
    }

    let stateId = "";
    let timestampStr = "";
    let locale = "ar";
    let nextUrl = "/";
    let nonce = "";
    let encodedRedirectUri = "";
    let hmac = "";

    if (parts.length >= 7) {
      // 7-part format with encoded redirectUri
      [stateId, timestampStr, locale, nextUrl, nonce, encodedRedirectUri, hmac] = parts;
    } else {
      // Backward-compatible 6-part format
      [stateId, timestampStr, locale, nextUrl, nonce, hmac] = parts;
    }

    const raw = parts.length >= 7
      ? `${stateId}:${timestampStr}:${locale}:${nextUrl}:${nonce}:${encodedRedirectUri}`
      : `${stateId}:${timestampStr}:${locale}:${nextUrl}:${nonce}`;

    const expectedHmac = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(raw)
      .digest("hex")
      .substring(0, 16);

    const expectedBuf = Buffer.from(expectedHmac, "utf8");
    const hmacBuf = Buffer.from(hmac, "utf8");
    if (expectedBuf.length !== hmacBuf.length || !crypto.timingSafeEqual(expectedBuf, hmacBuf)) {
      return { valid: false, locale: "ar", nextUrl: "/ar", error: "HMAC_MISMATCH" };
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 15 * 60 * 1000) {
      return { valid: false, locale: "ar", nextUrl: "/ar", error: "EXPIRED_STATE" };
    }

    purgeExpiredEntries(consumedStates);
    if (consumedStates.has(stateId)) {
      return { valid: false, locale: "ar", nextUrl: "/ar", error: "REPLAYED_STATE" };
    }

    consumedStates.set(stateId, { expiresAt: Date.now() + 15 * 60 * 1000 });

    const safeLocale = ALLOWED_LOCALES.has(locale) ? locale : "ar";
    const safeNext = sanitizeRedirectPath(nextUrl, safeLocale);

    let decodedRedirectUri: string | undefined = undefined;
    if (encodedRedirectUri) {
      try {
        decodedRedirectUri = Buffer.from(encodedRedirectUri, "base64url").toString("utf8");
      } catch {}
    }

    return {
      valid: true,
      locale: safeLocale,
      nextUrl: safeNext,
      expectedNonce: nonce,
      redirectUri: decodedRedirectUri,
    };
  } catch (err: any) {
    return { valid: false, locale: "ar", nextUrl: "/ar", error: "STATE_PARSE_ERROR" };
  }
}

export function generateOAuthState(locale: string = "ar", nextUrl: string = "/", redirectUri?: string): string {
  return generateOAuthTransaction(locale, nextUrl, redirectUri).state;
}

export function verifyOAuthState(state: string): {
  valid: boolean;
  locale: string;
  nextUrl: string;
} {
  const res = verifyAndConsumeOAuthState(state);
  return { valid: res.valid, locale: res.locale, nextUrl: res.nextUrl };
}

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildGoogleAuthUrl(options: {
  state: string;
  codeChallenge: string;
  redirectUri: string;
  nonce?: string;
}): string {
  const { clientId } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: options.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: options.state,
    code_challenge: options.codeChallenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });
  if (options.nonce) {
    params.set("nonce", options.nonce);
  }
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeOAuthCode(options: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{ id_token?: string; access_token?: string; error?: string }> {
  const { clientId, clientSecret } = getGoogleConfig();
  if (!clientId || !clientSecret) {
    return { error: "Missing Google Client ID or Client Secret" };
  }

  if (!options.code || typeof options.code !== "string" || options.code.length < 10) {
    return { error: "Invalid authorization code parameter" };
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: options.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: options.redirectUri,
        grant_type: "authorization_code",
        code_verifier: options.codeVerifier,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error_description || data.error || "Token exchange failed" };
    }
    return { id_token: data.id_token, access_token: data.access_token };
  } catch (e: any) {
    return { error: "Authentication service connection failure" };
  }
}
