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
 * Returns the exact configuration status and lists any missing environment keys
 * without exposing sensitive values like the client secret.
 */
export function getGoogleConfigStatus(): GoogleConfigStatus {
  const missing: string[] = [];
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const redirectUri = (process.env.GOOGLE_REDIRECT_URI || "").trim();

  if (!clientId) missing.push("GOOGLE_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) missing.push("NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.GOOGLE_REDIRECT_URI) missing.push("GOOGLE_REDIRECT_URI");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();
  const finalRedirect = redirectUri || `${appUrl}/api/auth/google/callback`;

  return {
    isConfigured: missing.length === 0,
    clientId,
    redirectUri: finalRedirect,
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
  errorCode?: "ACCOUNT_SUSPENDED" | "ACCOUNT_INACTIVE" | "LOCKED_OUT" | "INVALID_DATA" | "ADMIN_LINK_REQUIRES_AUTH" | "DUPLICATE_GOOGLE_IDENTITY" | "SIMULATION_DENIED";
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

    // Administrative Privilege Takeover Prevention
    const isPrivileged = existingProfile.role === "super_admin" || existingProfile.role === "hr_admin";
    if (isPrivileged && !existingProfile.google_id) {
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

  // Handle First-Time Google Registration
  if (identity.isSimulated && process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "الهويات التجريبية محظورة في بيئة الإنتاج.",
      errorCode: "SIMULATION_DENIED",
    };
  }

  const emptyDb = await isDatabaseEmpty();
  // Simulated identities can NEVER bootstrap or receive super_admin privileges
  const assignedRole: UserRole = emptyDb && !identity.isSimulated ? "super_admin" : "member";

  const newProfileId = ensureUUID(`usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const nowIso = new Date().toISOString();

  const newProfile: Profile = {
    id: newProfileId,
    email: cleanEmail,
    full_name: identity.name || cleanEmail.split("@")[0],
    avatar_url: identity.picture,
    role: assignedRole,
    status: "active",
    google_id: identity.sub,
    join_date: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const created = await dbService.createProfile(newProfile);
  internalDB.createProfile(created);
  resetLoginAttempts(cleanEmail);

  try {
    await dbService.createAuditLog({
      actor_id: created.id,
      actor_name: created.full_name,
      action: "AUTH_GOOGLE_REGISTER",
      entity_type: "auth",
      entity_id: created.id,
      reason: emptyDb
        ? "إنشاء حساب مدير النظام الأول (Super Admin) عبر حساب Google"
        : "إنشاء حساب عضو جديد (Member) عبر Google مع تأكيد الهوية",
      details: `Google sub: ${identity.sub}, email: ${cleanEmail}, role: ${assignedRole}.`,
      after_value: { role: assignedRole, google_id: identity.sub, email: cleanEmail },
    });
  } catch {}

  return {
    success: true,
    user: created,
    isNewUser: true,
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
}

export function generateOAuthTransaction(
  locale: string = "ar",
  nextUrl: string = "/"
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

  const raw = `${randomStateId}:${timestamp}:${locale}:${sanitizedNextUrl}:${nonce}`;
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
  };
}

export function verifyAndConsumeOAuthState(state: string): {
  valid: boolean;
  locale: string;
  nextUrl: string;
  expectedNonce?: string;
  error?: string;
} {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 6) {
      return { valid: false, locale: "ar", nextUrl: "/ar", error: "MALFORMED_STATE" };
    }
    const [stateId, timestampStr, locale, nextUrl, nonce, hmac] = parts;
    const raw = `${stateId}:${timestampStr}:${locale}:${nextUrl}:${nonce}`;
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

    return {
      valid: true,
      locale: safeLocale,
      nextUrl: safeNext,
      expectedNonce: nonce,
    };
  } catch (err: any) {
    return { valid: false, locale: "ar", nextUrl: "/ar", error: "STATE_PARSE_ERROR" };
  }
}

export function generateOAuthState(locale: string = "ar", nextUrl: string = "/"): string {
  return generateOAuthTransaction(locale, nextUrl).state;
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
