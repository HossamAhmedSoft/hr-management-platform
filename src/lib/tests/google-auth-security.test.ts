// ============================================================
// GDG NCTU HR Platform — Enterprise Google Auth Security Hardening Test Suite
// Verifies OpenID Connect Nonce Binding, Replay Protections, PKCE Entropy,
// Open Redirect Defense, Privileged Account Takeover Protection, and RBAC Safety
// ============================================================

(process.env as any).NODE_ENV = "test";
process.env.ENABLE_GOOGLE_SIMULATION = "true";

import assert from "assert";
import {
  verifyGoogleIdToken,
  handleGoogleIdentity,
  createGoogleApplicationSession,
  generateOAuthTransaction,
  verifyAndConsumeOAuthState,
  generatePKCE,
  sanitizeRedirectPath,
  buildGoogleAuthUrl,
  getGoogleConfigStatus,
  getGoogleConfig,
  resolveGoogleRedirectUri,
} from "../google-auth";
import { internalDB } from "../internal-db";
import { verifySessionSignature } from "../auth-service";
import { Profile } from "@/types";

function buildTestToken(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test_kid_01" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `test_gtoken_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${body}.simulated_cryptographic_sig`;
}

async function runGoogleSecuritySuite() {
  console.log("============================================================");
  console.log("🛡️ EXECUTING COMPREHENSIVE GOOGLE AUTH SECURITY TEST SUITE");
  console.log("============================================================\n");

  const now = Math.floor(Date.now() / 1000);
  let totalTests = 0;
  let passedTests = 0;

  function test(name: string, fn: () => void) {
    totalTests++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passedTests++;
    } catch (e: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${e.message}`);
    }
  }

  async function asyncTest(name: string, fn: () => Promise<void>) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedTests++;
    } catch (e: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${e.message}`);
    }
  }

  // ── SUITE 0: Google Configuration Detection & Secret Leak Prevention ──
  console.log("--- SUITE 0: Google Configuration Detection & Secret Leak Prevention ---");

  test("getGoogleConfigStatus correctly reflects environment state", () => {
    const status = getGoogleConfigStatus();
    assert.strictEqual(typeof status.isConfigured, "boolean");
    assert.strictEqual(typeof status.clientId, "string");
    assert.strictEqual(typeof status.redirectUri, "string");
    assert(Array.isArray(status.missingFields));
  });

  test("getGoogleConfigStatus reports missing keys when credentials are absent without leaking secrets", () => {
    const savedClientId = process.env.GOOGLE_CLIENT_ID;
    const savedSecret = process.env.GOOGLE_CLIENT_SECRET;
    try {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      const status = getGoogleConfigStatus();
      assert.strictEqual(status.isConfigured, false);
      assert(status.missingFields.includes("GOOGLE_CLIENT_ID"));
      assert(status.missingFields.includes("GOOGLE_CLIENT_SECRET"));
      assert(!("clientSecret" in status), "clientSecret must never be exposed by getGoogleConfigStatus");
    } finally {
      if (savedClientId) process.env.GOOGLE_CLIENT_ID = savedClientId;
      if (savedSecret) process.env.GOOGLE_CLIENT_SECRET = savedSecret;
    }
  });

  test("resolveGoogleRedirectUri canonicalizes and strips trailing slashes and quotes", () => {
    const savedRedirect = process.env.GOOGLE_REDIRECT_URI;
    try {
      process.env.GOOGLE_REDIRECT_URI = '"http://localhost:3000/api/auth/google/callback/"';
      const resolved = resolveGoogleRedirectUri();
      assert.strictEqual(resolved.uri, "http://localhost:3000/api/auth/google/callback", "Trailing slash and quotes must be stripped");
    } finally {
      if (savedRedirect) process.env.GOOGLE_REDIRECT_URI = savedRedirect;
      else delete process.env.GOOGLE_REDIRECT_URI;
    }
  });

  test("resolveGoogleRedirectUri normalizes NEXT_PUBLIC_APP_URL with trailing slash", () => {
    const savedRedirect = process.env.GOOGLE_REDIRECT_URI;
    const savedAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    try {
      delete process.env.GOOGLE_REDIRECT_URI;
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000/";
      const resolved = resolveGoogleRedirectUri();
      assert.strictEqual(resolved.uri, "http://localhost:3000/api/auth/google/callback", "Must normalize to single clean slash");
    } finally {
      if (savedRedirect) process.env.GOOGLE_REDIRECT_URI = savedRedirect;
      if (savedAppUrl) process.env.NEXT_PUBLIC_APP_URL = savedAppUrl;
      else delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  test("SECURITY ENFORCED: resolveGoogleRedirectUri enforces HTTPS for production domains", () => {
    const savedEnv = process.env.NODE_ENV;
    const savedRedirect = process.env.GOOGLE_REDIRECT_URI;
    const savedAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    try {
      (process.env as any).NODE_ENV = "production";
      delete process.env.GOOGLE_REDIRECT_URI;
      process.env.NEXT_PUBLIC_APP_URL = "http://hr.gdgnctu.com";
      const resolved = resolveGoogleRedirectUri();
      assert(resolved.uri.startsWith("https://hr.gdgnctu.com"), "Production domain must enforce HTTPS");
      assert.strictEqual(resolved.uri, "https://hr.gdgnctu.com/api/auth/google/callback");
    } finally {
      (process.env as any).NODE_ENV = savedEnv;
      if (savedRedirect) process.env.GOOGLE_REDIRECT_URI = savedRedirect;
      if (savedAppUrl) process.env.NEXT_PUBLIC_APP_URL = savedAppUrl;
      else delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  // ── SUITE 1: Open Redirect & Path Neutralization Defense ──
  console.log("\n--- SUITE 1: Open Redirect & Path Neutralization Defense ---");

  test("Neutralizes protocol-relative URL attack (//evil.com)", () => {
    const sanitized = sanitizeRedirectPath("//evil.com", "ar");
    assert.strictEqual(sanitized, "/ar", "Protocol-relative URL must be neutralized to default locale");
  });

  test("Neutralizes backslash bypass attack (/\\evil.com)", () => {
    const sanitized = sanitizeRedirectPath("/\\evil.com", "ar");
    assert.strictEqual(sanitized, "/ar", "Backslash bypass URL must be neutralized");
  });

  test("Neutralizes javascript: URI scheme attack", () => {
    const sanitized = sanitizeRedirectPath("javascript:alert(1)", "ar");
    assert.strictEqual(sanitized, "/ar", "javascript: scheme must be neutralized");
  });

  test("Neutralizes external absolute HTTPS URL (https://attacker.com/steal)", () => {
    const sanitized = sanitizeRedirectPath("https://attacker.com/steal", "en");
    assert.strictEqual(sanitized, "/en", "External absolute URLs must be neutralized");
  });

  test("Neutralizes CRLF carriage-return injection attacks", () => {
    const sanitized = sanitizeRedirectPath("/ar/tasks\r\nSet-Cookie: evil=1", "ar");
    assert(!sanitized.includes("\r") && !sanitized.includes("\n"), "CRLF characters must be stripped");
  });

  test("Preserves valid internal relative route with locale (/ar/tasks)", () => {
    const sanitized = sanitizeRedirectPath("/ar/tasks", "ar");
    assert.strictEqual(sanitized, "/ar/tasks", "Safe internal routes must be preserved");
  });

  test("Prepends locale when safe route is missing locale prefix (/evaluations)", () => {
    const sanitized = sanitizeRedirectPath("/evaluations", "en");
    assert.strictEqual(sanitized, "/en/evaluations", "Locale prefix must be added safely");
  });

  // ── SUITE 2: OAuth 2.0 PKCE, Nonce & State Replay Defense ─
  console.log("\n--- SUITE 2: OAuth 2.0 PKCE, Nonce & State Replay Defense ---");

  test("OAuth transaction generates high-entropy PKCE verifier and challenge", () => {
    const pkce = generatePKCE();
    assert(pkce.codeVerifier.length >= 43, "PKCE verifier must have sufficient entropy");
    assert(pkce.codeChallenge.length >= 43, "PKCE challenge must have sufficient entropy");
    assert(!pkce.codeVerifier.includes("+") && !pkce.codeVerifier.includes("/"), "Must be URL-safe");
  });

  test("OAuth transaction binds Nonce, PKCE challenge, and sanitized redirect target", () => {
    const tx = generateOAuthTransaction("ar", "/ar/tasks");
    assert(tx.nonce.length >= 16, "Nonce must be generated");
    assert(tx.sanitizedNextUrl === "/ar/tasks", "Target URL must be sanitized in transaction");

    const authUrl = buildGoogleAuthUrl({
      state: tx.state,
      codeChallenge: tx.codeChallenge,
      redirectUri: "http://localhost:3000/api/auth/google/callback",
      nonce: tx.nonce,
    });

    assert(authUrl.includes("nonce=" + tx.nonce), "Google auth URL must contain the transaction nonce");
    assert(authUrl.includes("code_challenge=" + tx.codeChallenge), "Google auth URL must contain code challenge");
    assert(authUrl.includes("code_challenge_method=S256"), "Google auth URL must enforce S256");
  });

  test("OAuth State is cryptographically verified on first use", () => {
    const tx = generateOAuthTransaction("ar", "/ar/evaluations");
    const verified = verifyAndConsumeOAuthState(tx.state);
    assert.strictEqual(verified.valid, true, "State must verify on first use");
    assert.strictEqual(verified.locale, "ar");
    assert.strictEqual(verified.nextUrl, "/ar/evaluations");
    assert.strictEqual(verified.expectedNonce, tx.nonce);
  });

  test("SECURITY ENFORCED: OAuth State REPLAY is strictly rejected on second use", () => {
    const tx = generateOAuthTransaction("ar", "/ar/points");
    const firstUse = verifyAndConsumeOAuthState(tx.state);
    assert.strictEqual(firstUse.valid, true, "First use succeeds");

    const secondUse = verifyAndConsumeOAuthState(tx.state);
    assert.strictEqual(secondUse.valid, false, "Second use MUST be rejected as replayed state");
    assert.strictEqual(secondUse.error, "REPLAYED_STATE");
  });

  test("SECURITY ENFORCED: Tampered OAuth State fails HMAC verification", () => {
    const tx = generateOAuthTransaction("ar", "/ar/teams");
    const decoded = Buffer.from(tx.state, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    parts[3] = "/ar/hacked"; // Tamper with destination
    const tampered = Buffer.from(parts.join(":")).toString("base64url");

    const verified = verifyAndConsumeOAuthState(tampered);
    assert.strictEqual(verified.valid, false, "Tampered state must fail HMAC verification");
    assert.strictEqual(verified.error, "HMAC_MISMATCH");
  });

  test("OAuth transaction binds exact redirectUri to state and authorization request", () => {
    const customUri = "http://localhost:3000/api/auth/google/callback";
    const tx = generateOAuthTransaction("ar", "/ar/tasks", customUri);
    assert.strictEqual(tx.redirectUri, customUri, "Transaction must store exact redirectUri");

    const verified = verifyAndConsumeOAuthState(tx.state);
    assert.strictEqual(verified.valid, true, "State must be valid");
    assert.strictEqual(verified.redirectUri, customUri, "Decoded state must yield exact same redirectUri");

    // Build auth URL and verify redirect_uri parameter
    const authUrl = buildGoogleAuthUrl({
      state: tx.state,
      codeChallenge: tx.codeChallenge,
      redirectUri: tx.redirectUri,
    });
    const parsedAuth = new URL(authUrl);
    assert.strictEqual(
      parsedAuth.searchParams.get("redirect_uri"),
      customUri,
      "Authorization URL must use identical redirectUri"
    );
  });

  test("SECURITY ENFORCED: Tampering with bound redirectUri in state fails HMAC check", () => {
    const tx = generateOAuthTransaction("ar", "/ar/tasks", "http://localhost:3000/api/auth/google/callback");
    const decoded = Buffer.from(tx.state, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    // parts[5] is the base64url-encoded redirectUri
    parts[5] = Buffer.from("https://attacker.com/evil/callback").toString("base64url");
    const tamperedState = Buffer.from(parts.join(":")).toString("base64url");

    const verified = verifyAndConsumeOAuthState(tamperedState);
    assert.strictEqual(verified.valid, false, "Tampered redirectUri must fail HMAC verification");
    assert.strictEqual(verified.error, "HMAC_MISMATCH");
  });

  // ── SUITE 3: Google ID Token Cryptographic Verification & Nonce Binding ──
  console.log("\n--- SUITE 3: Google ID Token Cryptographic Verification & Nonce Binding ---");

  await asyncTest("Valid Google ID token with matching Nonce is accepted", async () => {
    const testNonce = "test_nonce_abc_123";
    const token = buildTestToken({
      sub: "g_sub_aud_1",
      email: "engineer.valid@gdgnctu.com",
      email_verified: true,
      name: "Valid Engineer",
      nonce: testNonce,
      iss: "accounts.google.com",
      aud: "test_google_client_id",
      exp: now + 3600,
    });

    const res = await verifyGoogleIdToken(token, testNonce);
    assert.strictEqual(res.success, true, "Token with matching nonce must be accepted");
  });

  await asyncTest("SECURITY ENFORCED: ID Token with mismatched Nonce is strictly rejected", async () => {
    const token = buildTestToken({
      sub: "g_sub_aud_2",
      email: "engineer.nonce@gdgnctu.com",
      email_verified: true,
      nonce: "stolen_transaction_nonce",
      iss: "accounts.google.com",
      aud: "test_google_client_id",
      exp: now + 3600,
    });

    const res = await verifyGoogleIdToken(token, "expected_browser_session_nonce");
    assert.strictEqual(res.success, false, "Token with mismatched nonce must be rejected");
    if (!res.success) {
      assert(res.error.includes("Nonce mismatch"), "Error must report nonce mismatch");
    }
  });

  await asyncTest("SECURITY ENFORCED: Expired ID token is rejected", async () => {
    const expiredToken = buildTestToken({
      sub: "g_sub_aud_3",
      email: "expired@gdgnctu.com",
      email_verified: true,
      iss: "accounts.google.com",
      aud: "test_google_client_id",
      exp: now - 300,
    });

    const res = await verifyGoogleIdToken(expiredToken);
    assert.strictEqual(res.success, false, "Expired token must be rejected");
  });

  await asyncTest("SECURITY ENFORCED: ID Token REPLAY is strictly rejected", async () => {
    const replayToken = buildTestToken({
      sub: "g_sub_aud_replay",
      email: "replay.target@gdgnctu.com",
      email_verified: true,
      iss: "accounts.google.com",
      aud: "test_google_client_id",
      exp: now + 3600,
    });

    const first = await verifyGoogleIdToken(replayToken);
    assert.strictEqual(first.success, true, "First consumption of ID token succeeds");

    const second = await verifyGoogleIdToken(replayToken);
    assert.strictEqual(second.success, false, "Second consumption of same ID token MUST be rejected");
    if (!second.success) {
      assert(second.error.includes("already been consumed"), "Error must report replay attack");
    }
  });

  await asyncTest("SECURITY ENFORCED: Unverified email address is rejected", async () => {
    const unverifiedToken = buildTestToken({
      sub: "g_sub_aud_unverified",
      email: "unverified.user@gmail.com",
      email_verified: false,
      iss: "accounts.google.com",
      aud: "test_google_client_id",
      exp: now + 3600,
    });

    const res = await verifyGoogleIdToken(unverifiedToken);
    assert.strictEqual(res.success, false, "Unverified email must be rejected");
  });

  // ── SUITE 4: Account Linking & Privilege Escalation Defense ──
  console.log("\n--- SUITE 4: Account Linking & Privilege Escalation Defense ---");

  await asyncTest("SECURITY ENFORCED: Unlinked Super Admin account CANNOT be silently hijacked via Google", async () => {
    // Seed an existing super_admin without google_id
    const privilegedAdmin: Profile = {
      id: "usr_priv_admin_01",
      email: "chief.admin@gdgnctu.com",
      full_name: "Chief Administrator",
      role: "super_admin",
      status: "active",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    internalDB.createProfile(privilegedAdmin);

    // Attempt to login with Google identity matching this email
    const hijackAttempt = {
      sub: "attacker_g_sub_9999", // not test_ prefix to trigger production check
      email: "chief.admin@gdgnctu.com",
      email_verified: true,
      name: "Chief Admin (Fake)",
    };

    const res = await handleGoogleIdentity(hijackAttempt);
    assert.strictEqual(res.success, false, "Silent takeover of unlinked privileged account must be blocked");
    assert.strictEqual(res.errorCode, "ADMIN_LINK_REQUIRES_AUTH");
  });

  await asyncTest("Standard Member account with matching email is safely linked", async () => {
    const normalMember: Profile = {
      id: "usr_normal_member_55",
      email: "omar.member@gdgnctu.com",
      full_name: "Omar Member",
      role: "member",
      status: "active",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    internalDB.createProfile(normalMember);

    const linkIdentity = {
      sub: "g_sub_omar_55",
      email: "omar.member@gdgnctu.com",
      email_verified: true,
      name: "Omar Member",
    };

    const res = await handleGoogleIdentity(linkIdentity);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.isNewUser, false);
    assert.strictEqual(res.user?.id, "usr_normal_member_55");
    assert.strictEqual(res.user?.google_id, "g_sub_omar_55");
    assert.strictEqual(res.user?.role, "member");
  });

  await asyncTest("SECURITY ENFORCED: Unregistered Google users are strictly denied (Closed Enterprise Roster)", async () => {
    const unregistered = {
      sub: "g_sub_brand_new_unregistered_user",
      email: "fresh.stranger@gdgnctu.com",
      email_verified: true,
      name: "Fresh Stranger",
    };

    const res = await handleGoogleIdentity(unregistered);
    assert.strictEqual(res.success, false, "Unregistered Google accounts must be rejected");
    assert.strictEqual(res.errorCode, "ACCOUNT_NOT_FOUND", "Error code must be ACCOUNT_NOT_FOUND");
  });

  await asyncTest("SECURITY ENFORCED: Suspended account is blocked from login", async () => {
    const suspended: Profile = {
      id: "usr_susp_77",
      email: "suspended.developer@gdgnctu.com",
      full_name: "Suspended Developer",
      role: "member",
      status: "suspended",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    internalDB.createProfile(suspended);

    const res = await handleGoogleIdentity({
      sub: "g_sub_susp_77",
      email: "suspended.developer@gdgnctu.com",
      email_verified: true,
      name: "Suspended Developer",
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorCode, "ACCOUNT_SUSPENDED");
  });

  // ── SUITE 5: Session Cryptography & Signature Validation ────
  console.log("\n--- SUITE 5: Session Cryptography & Signature Validation ---");

  test("Application session signature verifies and role tampering is rejected", () => {
    const profile: Profile = {
      id: "usr_sec_sess_1",
      email: "sess.test@gdgnctu.com",
      full_name: "Session Test",
      role: "member",
      status: "active",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const session = createGoogleApplicationSession(profile, true);
    assert(session.token.startsWith("session_"), "Token has session prefix");
    assert(session.sig.startsWith("sig_"), "Signature has sig prefix");

    const valid = verifySessionSignature(profile.id, profile.role, session.token, session.sig);
    assert.strictEqual(valid, true, "Signature verifies");

    const tamperedRole = verifySessionSignature(profile.id, "super_admin", session.token, session.sig);
    assert.strictEqual(tamperedRole, false, "Tampered role must fail signature verification");

    const tamperedToken = verifySessionSignature(profile.id, profile.role, "session_fake_token", session.sig);
    assert.strictEqual(tamperedToken, false, "Tampered token must fail signature verification");
  });

  // ── SUITE 6: Simulation Mode Hardening & Denial in Production ──
  console.log("\n--- SUITE 6: Simulation Mode Hardening & Denial in Production ---");

  await asyncTest("SECURITY ENFORCED: Simulated tokens are strictly rejected when NODE_ENV is production", async () => {
    const savedNodeEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = "production";
      const token = buildTestToken({
        sub: "g_sub_prod_sim_attempt",
        email: "test.dev@example.com",
        email_verified: true,
        iss: "accounts.google.com",
        exp: now + 3600,
      });

      const res = await verifyGoogleIdToken(token);
      assert.strictEqual(res.success, false, "Simulation token must be rejected in production");
      assert(res.error.includes("disabled in production mode"));
    } finally {
      (process.env as any).NODE_ENV = savedNodeEnv;
    }
  });

  await asyncTest("SECURITY ENFORCED: Simulated tokens are rejected when simulation is not explicitly enabled", async () => {
    const savedNodeEnv = process.env.NODE_ENV;
    const savedSim = process.env.ENABLE_GOOGLE_SIMULATION;
    try {
      (process.env as any).NODE_ENV = "development";
      delete process.env.ENABLE_GOOGLE_SIMULATION;
      const token = buildTestToken({
        sub: "g_sub_dev_unauth_sim",
        email: "test.dev@example.com",
        email_verified: true,
        iss: "accounts.google.com",
        exp: now + 3600,
      });

      const res = await verifyGoogleIdToken(token);
      assert.strictEqual(res.success, false, "Simulation token must be rejected when not explicitly enabled");
    } finally {
      (process.env as any).NODE_ENV = savedNodeEnv;
      if (savedSim) process.env.ENABLE_GOOGLE_SIMULATION = savedSim;
    }
  });

  await asyncTest("SECURITY ENFORCED: Simulated tokens cannot hijack existing real user profiles", async () => {
    const realUser: Profile = {
      id: "usr_real_member_99",
      email: "real.colleague@gdgnctu.com",
      full_name: "Real Colleague",
      role: "member",
      status: "active",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    internalDB.createProfile(realUser);

    const res = await handleGoogleIdentity({
      sub: "g_sub_sim_hijack_attempt",
      email: "real.colleague@gdgnctu.com",
      email_verified: true,
      name: "Imposter",
      isSimulated: true,
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorCode, "SIMULATION_DENIED");
  });

  // ── SUITE 9: Login Loop Prevention & Session Hydration Security ──
  console.log("\n--- SUITE 9: Login Loop Prevention & Session Hydration Security ---");

  test("Neutralizes login and forbidden destinations to prevent post-auth redirect loop (/ar/login -> /ar)", () => {
    assert.strictEqual(sanitizeRedirectPath("/ar/login", "ar"), "/ar");
    assert.strictEqual(sanitizeRedirectPath("/en/login", "en"), "/en");
    assert.strictEqual(sanitizeRedirectPath("/login?reason=expired", "ar"), "/ar");
    assert.strictEqual(sanitizeRedirectPath("/ar/forbidden", "ar"), "/ar");
  });

  test("Session signature protects against client-side role escalation attempts", () => {
    const testUser: Profile = {
      id: "usr_session_test_01",
      email: "member@gdgnctu.com",
      full_name: "Test Member",
      role: "member",
      status: "active",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const session = createGoogleApplicationSession(testUser, true);
    assert.strictEqual(
      verifySessionSignature(testUser.id, "member", session.token, session.sig),
      true,
      "Valid member session must verify successfully"
    );
    assert.strictEqual(
      verifySessionSignature(testUser.id, "super_admin", session.token, session.sig),
      false,
      "Escalated super_admin role must fail signature verification"
    );
  });

  console.log("\n============================================================");
  console.log(`🏁 TEST EXECUTION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("============================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runGoogleSecuritySuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
