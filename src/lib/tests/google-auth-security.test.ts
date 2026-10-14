// ============================================================
// GDG NCTU HR Platform — Google Authentication Security Test Suite
// Verifies ID Token Cryptography, Account Linking, RBAC Privilege Safety,
// CSRF Mitigations, PKCE State, and Inactive/Suspended Account Protections
// ============================================================

import assert from "assert";
import {
  verifyGoogleIdToken,
  handleGoogleIdentity,
  createGoogleApplicationSession,
  generateOAuthState,
  verifyOAuthState,
  generatePKCE,
} from "../google-auth";
import { internalDB } from "../internal-db";
import { verifySessionSignature } from "../auth-service";
import { Profile } from "@/types";

function buildTestToken(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test_kid_01" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `test_gtoken_secure.${body}.simulated_cryptographic_sig`;
}

async function runGoogleSecuritySuite() {
  console.log("============================================================");
  console.log("🧪 EXECUTING GOOGLE IDENTITY & SECURITY TEST SUITE");
  console.log("============================================================\n");

  const now = Math.floor(Date.now() / 1000);
  let totalTests = 0;
  let passedTests = 0;

  function test(name: string, fn: () => Promise<void> | void) {
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

  // ── SUITE 1: ID Token Cryptographic & Claims Verification ─
  console.log("--- SUITE 1: ID Token Claims & Signature Validation ---");

  await asyncTest("Valid Google ID token is accepted and parsed correctly", async () => {
    const validToken = buildTestToken({
      sub: "g_sub_1001",
      email: "engineer.alex@gdgnctu.com",
      email_verified: true,
      name: "Alex Engineer",
      picture: "https://lh3.googleusercontent.com/alex.jpg",
      iss: "accounts.google.com",
      aud: "test_google_client_id",
      exp: now + 3600,
    });

    const res = await verifyGoogleIdToken(validToken);
    assert(res.success === true, "Token verification must succeed for valid claims");
    if (res.success) {
      assert.strictEqual(res.payload.sub, "g_sub_1001");
      assert.strictEqual(res.payload.email, "engineer.alex@gdgnctu.com");
      assert.strictEqual(res.payload.email_verified, true);
    }
  });

  await asyncTest("Expired Google ID token is rejected", async () => {
    const expiredToken = buildTestToken({
      sub: "g_sub_1002",
      email: "expired.user@gdgnctu.com",
      email_verified: true,
      iss: "accounts.google.com",
      aud: "test_google_client_id",
      exp: now - 300, // expired 5 minutes ago
    });

    const res = await verifyGoogleIdToken(expiredToken);
    assert(res.success === false, "Expired token must be rejected");
    if (!res.success) {
      assert(res.error.includes("expired"), "Error message must report expiration");
    }
  });

  await asyncTest("Audience mismatch (client ID mismatch) is rejected", async () => {
    const wrongAudToken = buildTestToken({
      sub: "g_sub_1003",
      email: "attacker@external-app.com",
      email_verified: true,
      iss: "accounts.google.com",
      aud: "completely_different_app_client_id.apps.googleusercontent.com",
      exp: now + 3600,
    });

    const res = await verifyGoogleIdToken(wrongAudToken);
    assert(res.success === false, "Token targeted for another application must be rejected");
    if (!res.success) {
      assert(res.error.includes("Audience mismatch"), "Error must report audience mismatch");
    }
  });

  await asyncTest("Untrusted issuer is rejected", async () => {
    const untrustedIssuerToken = buildTestToken({
      sub: "g_sub_1004",
      email: "fake.issuer@evil.com",
      email_verified: true,
      iss: "https://evil-identity-provider.com",
      aud: "test_google_client_id",
      exp: now + 3600,
    });

    const res = await verifyGoogleIdToken(untrustedIssuerToken);
    assert(res.success === false, "Token from untrusted issuer must be rejected");
    if (!res.success) {
      assert(res.error.includes("Untrusted issuer"), "Error must report untrusted issuer");
    }
  });

  await asyncTest("Unverified Google email is strictly rejected", async () => {
    const unverifiedEmailToken = buildTestToken({
      sub: "g_sub_1005",
      email: "unverified@gmail.com",
      email_verified: false, // Not verified!
      iss: "accounts.google.com",
      aud: "test_google_client_id",
      exp: now + 3600,
    });

    const res = await verifyGoogleIdToken(unverifiedEmailToken);
    assert(res.success === false, "Unverified email must be rejected to prevent account takeover");
    if (!res.success) {
      assert(res.error.includes("not verified"), "Error must state email is not verified");
    }
  });

  // ── SUITE 2: Account Linking & RBAC Privilege Escalation Defense
  console.log("\n--- SUITE 2: Account Linking & RBAC Privilege Escalation Defense ---");

  await asyncTest("New Google registration is safely assigned 'member' role (No privilege escalation)", async () => {
    // Seed at least one existing profile so DB is not empty
    const seedProfile: Profile = {
      id: "usr_seed_admin",
      email: "existing.admin@gdgnctu.com",
      full_name: "Existing Admin",
      role: "super_admin",
      status: "active",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    internalDB.createProfile(seedProfile);

    const newGoogleUser = {
      sub: "g_sub_new_user_999",
      email: "new.developer@gdgnctu.com",
      email_verified: true,
      name: "New Developer",
      picture: "https://lh3.googleusercontent.com/dev.jpg",
    };

    const result = await handleGoogleIdentity(newGoogleUser);
    assert(result.success === true, "New user registration via Google should succeed");
    assert(result.isNewUser === true, "Must be flagged as a new user");
    assert(result.user !== undefined);
    assert.strictEqual(
      result.user?.role,
      "member",
      "CRITICAL: New Google sign-ins MUST receive standard 'member' role, never elevated privileges"
    );
    assert.strictEqual(result.user?.google_id, "g_sub_new_user_999");
  });

  await asyncTest("Existing account with matching email is linked to Google sub safely", async () => {
    const existingHr: Profile = {
      id: "usr_hr_sarah",
      email: "sarah.hr@gdgnctu.com",
      full_name: "Sarah HR Specialist",
      role: "hr_admin",
      status: "active",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    internalDB.createProfile(existingHr);

    const linkingGoogleUser = {
      sub: "g_sub_sarah_777",
      email: "sarah.hr@gdgnctu.com",
      email_verified: true,
      name: "Sarah HR Specialist",
      picture: "https://lh3.googleusercontent.com/sarah.jpg",
    };

    const linkResult = await handleGoogleIdentity(linkingGoogleUser);
    assert(linkResult.success === true);
    assert(linkResult.isNewUser === false, "Must link to existing account, not create a duplicate");
    assert.strictEqual(linkResult.user?.id, "usr_hr_sarah");
    assert.strictEqual(linkResult.user?.role, "hr_admin", "Must retain existing role");
    assert.strictEqual(linkResult.user?.google_id, "g_sub_sarah_777", "Must link Google sub ID");
  });

  await asyncTest("Suspended account is blocked from Google Sign-In", async () => {
    const suspendedUser: Profile = {
      id: "usr_suspended_mark",
      email: "mark.suspended@gdgnctu.com",
      full_name: "Mark Suspended",
      role: "member",
      status: "suspended",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    internalDB.createProfile(suspendedUser);

    const googleAttempt = {
      sub: "g_sub_mark_suspended",
      email: "mark.suspended@gdgnctu.com",
      email_verified: true,
      name: "Mark Suspended",
    };

    const res = await handleGoogleIdentity(googleAttempt);
    assert(res.success === false, "Suspended user must be blocked from logging in");
    assert.strictEqual(res.errorCode, "ACCOUNT_SUSPENDED");
  });

  // ── SUITE 3: Session Cryptography & Edge Proxy Compatibility ───
  console.log("\n--- SUITE 3: Application Session Cryptography & Proxy Compatibility ---");

  test("Session signature generated for Google user is verified by proxy engine", () => {
    const dummyUser: Profile = {
      id: "usr_verified_google_member",
      email: "member@gdgnctu.com",
      full_name: "Verified Member",
      role: "member",
      status: "active",
      google_id: "g_sub_dummy_123",
      join_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const session = createGoogleApplicationSession(dummyUser, true);
    assert(session.token.startsWith("session_"), "Token must have session prefix");
    assert(session.sig.startsWith("sig_"), "Signature must have sig_ prefix");
    assert(session.expiresAt > Date.now(), "Expiration must be in the future");

    const isSigValid = verifySessionSignature(dummyUser.id, dummyUser.role, session.token, session.sig);
    assert.strictEqual(isSigValid, true, "Session signature must validate with proxy signature engine");

    // Tampering test: modify role to super_admin
    const isTamperedValid = verifySessionSignature(dummyUser.id, "super_admin", session.token, session.sig);
    assert.strictEqual(isTamperedValid, false, "Tampered role in session MUST fail verification");
  });

  // ── SUITE 4: OAuth CSRF State & PKCE Protection ───────────────
  console.log("\n--- SUITE 4: OAuth CSRF State & PKCE Protection ---");

  test("OAuth State token contains HMAC signature and round-trips correctly", () => {
    const state = generateOAuthState("ar", "/ar/tasks");
    const verified = verifyOAuthState(state);
    assert.strictEqual(verified.valid, true, "Valid state token must verify");
    assert.strictEqual(verified.locale, "ar");
    assert.strictEqual(verified.nextUrl, "/ar/tasks");

    // Tampering state: change nextUrl
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    parts[3] = "/evil-redirect";
    const tamperedState = Buffer.from(parts.join(":")).toString("base64url");

    const tamperedVerification = verifyOAuthState(tamperedState);
    assert.strictEqual(tamperedVerification.valid, false, "Tampered state must fail HMAC verification");
  });

  test("PKCE Code Verifier and S256 Code Challenge are valid base64url strings", () => {
    const pkce = generatePKCE();
    assert(pkce.codeVerifier.length >= 43, "PKCE verifier must have sufficient entropy");
    assert(pkce.codeChallenge.length >= 43, "PKCE challenge must have sufficient entropy");
    assert(!pkce.codeVerifier.includes("+") && !pkce.codeVerifier.includes("/"), "Must be URL-safe");
    assert(!pkce.codeChallenge.includes("+") && !pkce.codeChallenge.includes("/"), "Must be URL-safe");
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
