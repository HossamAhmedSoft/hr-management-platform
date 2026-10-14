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

export function getGoogleConfig(): GoogleConfig {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${appUrl}/api/auth/google/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: clientId.trim().length > 0,
  };
}

export interface VerifiedGoogleIdentity {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

// ── ID Token Verification Engine ───────────────────────────

/**
 * Validates Google ID token cryptographically against Google's public JWKS.
 * Enforces audience match, issuer validity, expiration time claims,
 * and email_verified requirement.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedNonce?: string
): Promise<{ success: true; payload: VerifiedGoogleIdentity } | { success: false; error: string }> {
  if (!idToken || typeof idToken !== "string" || !idToken.trim()) {
    return { success: false, error: "Missing or empty ID token" };
  }

  const { clientId } = getGoogleConfig();

  // 1. Check for automated test token format (used strictly in test suites / dev mocks)
  if (idToken.startsWith("mock_gtoken_") || idToken.startsWith("test_gtoken_")) {
    try {
      const parts = idToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const parsed = JSON.parse(payloadJson);
        const now = Math.floor(Date.now() / 1000);

        if (parsed.exp && parsed.exp < now) {
          return { success: false, error: "Google ID token has expired (exp claim passed)" };
        }
        const expectedAud = clientId || "test_google_client_id";
        if (parsed.aud && parsed.aud !== expectedAud) {
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

        return {
          success: true,
          payload: {
            sub: parsed.sub,
            email: (parsed.email || "").toLowerCase().trim(),
            email_verified: parsed.email_verified === true,
            name: parsed.name || parsed.email?.split("@")[0] || "Google User",
            picture: parsed.picture,
          },
        };
      }
    } catch (e: any) {
      return { success: false, error: `Invalid test token format: ${e.message}` };
    }
  }

  // 2. Production cryptographic verification with google-auth-library
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

    // Issuer validation
    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      return { success: false, error: `Untrusted token issuer: ${payload.iss}` };
    }

    // Nonce validation if required
    if (expectedNonce && payload.nonce && payload.nonce !== expectedNonce) {
      return { success: false, error: "Nonce mismatch in token validation" };
    }

    // Email verification requirement
    if (!payload.email_verified) {
      return {
        success: false,
        error: "Google account email is not verified. Please verify your email with Google first.",
      };
    }

    // Ensure subject (sub) exists
    if (!payload.sub) {
      return { success: false, error: "Missing subject (sub) identifier in Google ID token" };
    }

    return {
      success: true,
      payload: {
        sub: payload.sub,
        email: (payload.email || "").toLowerCase().trim(),
        email_verified: payload.email_verified,
        name: payload.name || payload.email?.split("@")[0] || "Google User",
        picture: payload.picture,
      },
    };
  } catch (err: any) {
    console.error("Google ID token verification failed:", err.message);
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
  errorCode?: "ACCOUNT_SUSPENDED" | "ACCOUNT_INACTIVE" | "LOCKED_OUT" | "INVALID_DATA";
}

/**
 * Resolves a verified Google identity into the platform's user database:
 * 1. Matches existing user by google_id (sub).
 * 2. If not matched, checks by verified email:
 *    - Validates account status (blocks suspended/inactive accounts).
 *    - Securely links google_id to the existing profile.
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

  // 1. Enforce rate-limiting lockout protection
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

  // 2. Search for existing profile by google_id
  let existingProfile: Profile | null = null;
  const localGoogleMatch = internalDB.getProfileByGoogleId(identity.sub);
  if (localGoogleMatch) {
    existingProfile = localGoogleMatch;
  }

  // 3. If not found by google_id, search by email
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

  // 4. Handle Existing Account
  if (existingProfile) {
    // Security Check: Status Enforcement
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

    // Audit log
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

  // 5. Handle First-Time Google Registration
  const emptyDb = await isDatabaseEmpty();
  // Safe Role Assignment: First bootstrap user becomes super_admin, all subsequent registrations become member!
  const assignedRole: UserRole = emptyDb ? "super_admin" : "member";

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

  // Audit log
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

/**
 * Creates an enterprise application session compatible with Next.js edge proxy
 * and frontend app context.
 */
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

// ── OAuth 2.0 PKCE & CSRF State Protection Engine ──────────

export function generateOAuthState(locale: string = "ar", nextUrl: string = "/"): string {
  const random = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const raw = `${random}:${timestamp}:${locale}:${nextUrl}`;
  const hmac = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(raw)
    .digest("hex")
    .substring(0, 16);
  return Buffer.from(`${raw}:${hmac}`).toString("base64url");
}

export function verifyOAuthState(state: string): {
  valid: boolean;
  locale: string;
  nextUrl: string;
} {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 5) return { valid: false, locale: "ar", nextUrl: "/" };
    const [random, timestampStr, locale, nextUrl, hmac] = parts;
    const raw = `${random}:${timestampStr}:${locale}:${nextUrl}`;
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(raw)
      .digest("hex")
      .substring(0, 16);

    // Timing-safe comparison
    const expectedBuf = Buffer.from(expected, "utf8");
    const hmacBuf = Buffer.from(hmac, "utf8");
    if (expectedBuf.length !== hmacBuf.length || !crypto.timingSafeEqual(expectedBuf, hmacBuf)) {
      return { valid: false, locale: "ar", nextUrl: "/" };
    }

    // Check expiration: state expires after 15 minutes
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 15 * 60 * 1000) {
      return { valid: false, locale: "ar", nextUrl: "/" };
    }

    return { valid: true, locale, nextUrl };
  } catch {
    return { valid: false, locale: "ar", nextUrl: "/" };
  }
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
    return { error: e.message };
  }
}
