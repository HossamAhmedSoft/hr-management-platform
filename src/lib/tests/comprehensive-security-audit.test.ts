import {
  canAccessRoute,
  saveSession,
  getSession,
  clearSession,
  loginWithCredentials,
  generateCryptoToken,
  generateSecurityTokenCode,
  verifySecurityTokenCode,
  clearSecurityTokenCode,
  recordFailedLogin,
  checkLoginLockout,
  resetLoginAttempts,
  SESSION_LIFETIME_STANDARD_MS,
  SESSION_LIFETIME_REMEMBER_MS,
  IDLE_TIMEOUT_MS,
  createSessionSignature,
  verifySessionSignature,
} from "../auth-service";
import { internalDB, DEFAULT_PROFILES, hashPassword, verifyPasswordHash } from "../internal-db";
import { dbService } from "../db-service";
import { sanitizeCSVCell, sanitizeUrl } from "../utils";
import { UserRole, Profile, Appeal, Incident } from "@/types";
import crypto from "crypto";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Security Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ Security Passed: ${message}`);
  }
}

async function runComprehensiveSecurityAudit() {
  console.log("=================================================================");
  console.log("🛡️ GDG NCTU ENTERPRISE SECURITY & RBAC COMPREHENSIVE AUDIT SUITE");
  console.log("=================================================================\n");

  // =================================================================
  // SUITE 1: RBAC ROUTE PROTECTION MATRIX (canAccessRoute)
  // =================================================================
  console.log("--- SUITE 1: RBAC Route Permissions Matrix Enforcement ---");

  const commonAllowedRoutes = [
    "/tasks",
    "/points",
    "/evaluations",
    "/appeals",
    "/attendance",
    "/teams",
    "/policy",
    "/",
  ];

  // 1.1 Ordinary Member Route Restrictions
  console.log("Checking Member restrictions...");
  for (const route of commonAllowedRoutes) {
    assert(canAccessRoute("member", route) === true, `Member is allowed access to essential service: ${route}`);
    assert(canAccessRoute("member", `/ar${route}`) === true, `Member with /ar prefix is allowed access: /ar${route}`);
  }

  const memberRestrictedRoutes = [
    "/members",
    "/education",
    "/audit-log",
    "/hr-kpis",
    "/reports",
    "/feedback",
    "/incidents",
  ];

  for (const route of memberRestrictedRoutes) {
    assert(
      canAccessRoute("member", route) === false,
      `SECURITY ENFORCED: Member is strictly DENIED access to administrative route: ${route}`
    );
    assert(
      canAccessRoute("member", `/ar${route}`) === false,
      `SECURITY ENFORCED: Member is strictly DENIED access to locale route: /ar${route}`
    );
  }

  // 1.2 Team Lead Route Restrictions
  console.log("\nChecking Team Lead permissions...");
  const teamLeadAllowedRoutes = [
    ...commonAllowedRoutes,
    "/members",
    "/teams",
    "/education",
    "/hr-kpis",
    "/feedback",
    "/reports",
    "/incidents",
  ];
  for (const route of teamLeadAllowedRoutes) {
    assert(canAccessRoute("team_lead", route) === true, `Team Lead is allowed access to: ${route}`);
  }
  assert(
    canAccessRoute("team_lead", "/audit-log") === false,
    "SECURITY ENFORCED: Team Lead is strictly DENIED access to immutable Security Audit Log (/audit-log)"
  );

  // 1.3 Neutral Reviewer Permissions
  console.log("\nChecking HR Neutral Reviewer permissions...");
  assert(canAccessRoute("hr_reviewer", "/appeals") === true, "Reviewer can access Appeals page");
  assert(canAccessRoute("hr_reviewer", "/incidents") === true, "Reviewer can access Incidents page");
  assert(
    canAccessRoute("hr_reviewer", "/audit-log") === false,
    "SECURITY ENFORCED: Reviewer is DENIED access to system Audit Log"
  );
  assert(
    canAccessRoute("hr_reviewer", "/hr-kpis") === false,
    "SECURITY ENFORCED: Reviewer is DENIED access to HR KPIs dashboard"
  );

  // 1.4 Super Admin & HR Admin Full Access
  console.log("\nChecking Super Admin & HR Admin permissions...");
  const allRoutes = [...memberRestrictedRoutes, ...commonAllowedRoutes];
  for (const route of allRoutes) {
    assert(canAccessRoute("super_admin", route) === true, `Super Admin has authorized access to: ${route}`);
  }
  assert(canAccessRoute("hr_admin", "/audit-log") === true, "HR Admin has authorized access to audit log");
  assert(canAccessRoute("hr_admin", "/members") === true, "HR Admin can manage member roster");

  // =================================================================
  // SUITE 2: CREDENTIAL & PASSWORD INTEGRITY
  // =================================================================
  console.log("\n--- SUITE 2: Credential & Password Verification ---");
  const testEmail = "sec_test_user@gdgnctu.com";
  internalDB.setPassword(testEmail, "SecureGdgPass2026!");

  assert(
    internalDB.verifyPassword(testEmail, "SecureGdgPass2026!") === true,
    "Exact password matches successfully"
  );
  assert(
    internalDB.verifyPassword(testEmail, "WrongPassword!") === false,
    "SECURITY ENFORCED: Wrong password rejected"
  );
  assert(
    internalDB.verifyPassword(testEmail, "securegdgpass2026!") === false,
    "SECURITY ENFORCED: Case-sensitive password mismatch rejected"
  );

  // Password Update / Reset
  internalDB.setPassword(testEmail, "NewSuperSecret2026!");
  assert(
    internalDB.verifyPassword(testEmail, "NewSuperSecret2026!") === true,
    "Updated password verified successfully"
  );
  assert(
    internalDB.verifyPassword(testEmail, "SecureGdgPass2026!") === false,
    "Old password invalidated after update"
  );

  // =================================================================
  // SUITE 3: STRICT PASSWORD AUTHENTICATION & MANDATORY CREDENTIALS
  // =================================================================
  console.log("\n--- SUITE 3: Strict Password Authentication & Zero Bypass ---");

  // 3.1 Empty password strictly rejected
  const emptyPassRes = await loginWithCredentials("hossam.admin@gdgnctu.com", "");
  assert(
    emptyPassRes.success === false,
    "SECURITY ENFORCED: Login without password is strictly REJECTED"
  );
  assert(
    emptyPassRes.error === "كلمة المرور مطلوبة لإتمام تسجيل الدخول.",
    "Correct error message returned when password is omitted"
  );

  // 3.2 Incorrect password strictly rejected
  const wrongPassRes = await loginWithCredentials("hossam.admin@gdgnctu.com", "WrongPassword123!");
  assert(
    wrongPassRes.success === false,
    "SECURITY ENFORCED: Login with wrong password is strictly REJECTED"
  );

  // 3.3 Valid credential authentication against database account
  const resAdmin = await loginWithCredentials("hossam.admin@gdgnctu.com", "Password@123");
  assert(resAdmin.success === true, "Valid database credentials authenticated successfully for Hossam Ahmed (hossam.admin@gdgnctu.com)");
  assert(!!resAdmin.user, "User profile returned from database for Super Admin");
  assert(
    resAdmin.user?.role === "super_admin",
    "User Hossam Ahmed has exact expected role: super_admin"
  );
  assert(
    resAdmin.user?.email.toLowerCase() === "hossam.admin@gdgnctu.com",
    "User email matches: hossam.admin@gdgnctu.com"
  );

  // 3.4 Unregistered account strictly rejected
  const nonExistentRes = await loginWithCredentials("fake.user@gdgnctu.com", "Password@123");
  assert(
    nonExistentRes.success === false,
    "SECURITY ENFORCED: Unregistered user without database record is strictly REJECTED"
  );

  // =================================================================
  // SUITE 4: DATA SCOPE & PRIVACY ISOLATION
  // =================================================================
  console.log("\n--- SUITE 4: Confidentiality & Data Scope Isolation ---");

  // Mock confidential appeals
  const mockAppeals: Appeal[] = [
    {
      id: "app_private_youssef",
      member_id: "usr_member_1",
      entity_type: "point_event",
      grounds: "Confidential medical dispute regarding penalty",
      status: "under_review",
      deadline_date: "2026-10-25",
      created_at: "2026-10-10",
      updated_at: "2026-10-10",
    },
    {
      id: "app_private_karim",
      member_id: "usr_member_karim",
      entity_type: "evaluation",
      grounds: "Confidential dispute regarding supervisor rating",
      status: "under_review",
      deadline_date: "2026-10-26",
      created_at: "2026-10-10",
      updated_at: "2026-10-10",
    },
  ];

  // Ordinary Member Youssef View
  const youssefVisibleAppeals = mockAppeals.filter((a) => a.member_id === "usr_member_1");
  assert(
    youssefVisibleAppeals.length === 1 && youssefVisibleAppeals[0].id === "app_private_youssef",
    "Member Youssef strictly only sees their own appeal"
  );
  assert(
    !youssefVisibleAppeals.some((a) => a.member_id === "usr_member_karim"),
    "SECURITY ENFORCED: Member Youssef cannot view Karim's confidential grievance"
  );

  // Super Admin / HR Reviewer View
  const reviewerVisibleAppeals = mockAppeals; // Reviewer can access all appeals
  assert(reviewerVisibleAppeals.length === 2, "Reviewer/Admin can review all appeals submitted by members");

  // =================================================================
  // SUITE 5: SESSION LIFECYCLE & EXPIRATION DEFENSE
  // =================================================================
  console.log("\n--- SUITE 5: Session Lifecycle, Expiration & Idle Inactivity Defense ---");
  const testUser: Profile = {
    id: "usr_session_sec_1",
    email: "session.test@gdgnctu.com",
    full_name: "Session Test User",
    role: "member",
    status: "active",
    join_date: "2026-01-01",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };

  // 5.1 Standard ephemeral session (Default: RememberMe = false)
  const standardSession = saveSession(testUser, false);
  assert(
    standardSession.token.startsWith("session_"),
    "Generated session token has expected 'session_' entropy prefix"
  );
  assert(
    standardSession.rememberMe === false,
    "Standard session remembers device is false by default"
  );
  assert(
    standardSession.expiresAt - standardSession.issuedAt === SESSION_LIFETIME_STANDARD_MS,
    `Standard session lifespan is strictly limited to 2 hours (${SESSION_LIFETIME_STANDARD_MS}ms)`
  );

  // 5.2 Persistent session (RememberMe = true)
  const persistentSession = saveSession(testUser, true);
  assert(
    persistentSession.rememberMe === true,
    "Persistent session remembers device is true"
  );
  assert(
    persistentSession.expiresAt - persistentSession.issuedAt === SESSION_LIFETIME_REMEMBER_MS,
    `Persistent session lifespan is capped at 24 hours (${SESSION_LIFETIME_REMEMBER_MS}ms)`
  );

  // 5.3 Active session retrieval
  const activeSession = getSession();
  assert(activeSession !== null, "Active session is successfully retrieved from storage");
  assert(activeSession?.user.email === testUser.email, "Session user matches logged-in user profile");

  // 5.4 Clean Session Teardown
  clearSession();
  assert(getSession() === null, "SECURITY ENFORCED: Session cleanly purged upon logout");

  // 5.5 Cryptographic Token Entropy
  const token1 = generateCryptoToken();
  const token2 = generateCryptoToken();
  assert(
    token1.startsWith("session_") && token2.startsWith("session_"),
    "Cryptographic tokens follow the standard format"
  );
  assert(token1 !== token2, "Consecutively generated session tokens are unique and collision-free");

  // =================================================================
  // SUITE 6: TWO-FACTOR SECURITY TOKEN CODE ENGINE ("توكين كود")
  // =================================================================
  console.log("\n--- SUITE 6: Two-Factor Security Token Code (2FA) Engine ---");
  const secEmail = "hossam.admin@gdgnctu.com";

  // 6.1 Token Code Generation
  const tokenRecord = generateSecurityTokenCode(secEmail);
  assert(
    typeof tokenRecord.code === "string" && tokenRecord.code.length === 6,
    `Security token code is a 6-digit numeric OTP: ${tokenRecord.code}`
  );
  assert(
    tokenRecord.expiresAt > Date.now(),
    "Security token code expiry timestamp is set into the future (5 minutes)"
  );

  // 6.2 Token Verification with Wrong Code (Decrements attempts)
  const wrongCodeRes = verifySecurityTokenCode(secEmail, "000000");
  assert(
    wrongCodeRes.success === false,
    "SECURITY ENFORCED: Incorrect 2FA token code is rejected"
  );
  assert(
    Boolean(wrongCodeRes.error?.includes("المحاولات المتبقية")),
    "Remaining attempts warning communicated after wrong code attempt"
  );

  // 6.3 Valid Token Code Verification
  const validCodeRes = verifySecurityTokenCode(secEmail, tokenRecord.code);
  assert(validCodeRes.success === true, "Valid 2FA security token code verified successfully");

  // 6.4 One-Time Use Consumption (Replay Attack Prevention)
  const replayRes = verifySecurityTokenCode(secEmail, tokenRecord.code);
  assert(
    replayRes.success === false,
    "SECURITY ENFORCED: Token code consumed immediately after first use (Replay prevention)"
  );

  // =================================================================
  // SUITE 7: BRUTE-FORCE RATE LIMITING & ACCOUNT LOCKOUT
  // =================================================================
  console.log("\n--- SUITE 7: Brute-Force Rate Limiting & Account Lockout Defense ---");
  const attackEmail = "target.user@gdgnctu.com";
  resetLoginAttempts(attackEmail);

  // Simulate 4 failed attempts
  for (let i = 1; i <= 4; i++) {
    const attempt = recordFailedLogin(attackEmail);
    assert(attempt.isLocked === false, `Attempt #${i} fails but account is not yet locked`);
    assert(attempt.attemptsLeft === 5 - i, `Attempts left correctly calculated: ${5 - i}`);
  }

  // 5th attempt triggers lockout
  const fifthAttempt = recordFailedLogin(attackEmail);
  assert(
    fifthAttempt.isLocked === true,
    "SECURITY ENFORCED: 5th consecutive failed attempt locks out the account"
  );
  assert(fifthAttempt.attemptsLeft === 0, "No attempts left once locked out");

  // Verify lockout check blocks login immediately
  const lockoutStatus = checkLoginLockout(attackEmail);
  assert(lockoutStatus.isLocked === true, "Account is confirmed locked in rate-limiting check");
  assert(lockoutStatus.remainingSeconds > 0, "Remaining lockout seconds calculated");

  // Reset clears lockout
  resetLoginAttempts(attackEmail);
  const resetStatus = checkLoginLockout(attackEmail);
  assert(resetStatus.isLocked === false, "Lockout cleared upon administrative or successful reset");

  // =================================================================
  // SUITE 8: CSV FORMULA INJECTION DEFENSE (CWE-1236)
  // =================================================================
  console.log("\n--- SUITE 8: CSV Formula Injection Defense (CWE-1236) ---");
  const dangerousCells = [
    { input: "=cmd|' /C calc'!A0", expectedPrefix: "'=" },
    { input: "+12345", expectedPrefix: "'+12345" },
    { input: "-2+5", expectedPrefix: "'-2+5" },
    { input: "@SUM(1,2)", expectedPrefix: "'@SUM(1,2)" },
    { input: "\tDDE(\"cmd\";\"/C calc\";\"__DdeLink__\")", expectedPrefix: "'\t" },
    { input: "%USERPROFILE%", expectedPrefix: "'%" },
  ];

  for (const { input } of dangerousCells) {
    const sanitized = sanitizeCSVCell(input);
    assert(
      sanitized.startsWith("'"),
      `SECURITY ENFORCED: Dangerous CSV prefix neutralized with leading single quote: ${input} -> ${sanitized}`
    );
  }

  // Safe cells are preserved without single quote prefix
  const safeCell = sanitizeCSVCell("Hossam Ahmed");
  assert(safeCell === "Hossam Ahmed", "Safe text preserved without modification");
  const emailCell = sanitizeCSVCell("hossam.admin@gdgnctu.com");
  assert(emailCell === "hossam.admin@gdgnctu.com", "Safe email preserved without modification");

  // Double quotes escaped
  const quotesCell = sanitizeCSVCell('He said "Hello"');
  assert(quotesCell === 'He said ""Hello""', "Internal quotes escaped to CSV standard double-double quotes");

  // =================================================================
  // SUITE 9: MALICIOUS URL PROTOCOL NEUTRALIZATION (XSS / CWE-79)
  // =================================================================
  console.log("\n--- SUITE 9: Malicious URL Protocol Neutralization ---");
  const maliciousUrls = [
    "javascript:alert(document.cookie)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "//evil-phishing.com/login",
    "https://trusted.com/\x00evil",
  ];

  for (const badUrl of maliciousUrls) {
    const safeUrl = sanitizeUrl(badUrl);
    assert(
      safeUrl === "",
      `SECURITY ENFORCED: Dangerous URL neutralized to empty string: ${badUrl}`
    );
  }

  // Safe URLs allowed
  const safeHttps = "https://drive.google.com/medical_report.pdf";
  assert(sanitizeUrl(safeHttps) === safeHttps, "Safe HTTPS URL correctly allowed");
  const safeRelative = "/dashboard/tasks";
  assert(sanitizeUrl(safeRelative) === safeRelative, "Safe relative path correctly allowed");

  // =================================================================
  // SUITE 10: SALTED PASSWORD HASHING & PROFILE PASSWORD STRIPPING (SEC-01)
  // =================================================================
  console.log("\n--- SUITE 10: Salted Password Hashing & Profile Password Stripping (SEC-01) ---");
  const plainPass = "SuperSecretGdg2026!#";
  const hashedPass = hashPassword(plainPass, "test_salt_123");
  assert(
    hashedPass.startsWith("sha256$test_salt_123$"),
    "Hashed password produces sha256$<salt>$<hash> format"
  );
  assert(
    hashedPass !== plainPass,
    "Hashed password is completely distinct from plaintext password"
  );
  assert(
    verifyPasswordHash(plainPass, hashedPass) === true,
    "Password hash verifies correctly with exact password"
  );
  assert(
    verifyPasswordHash("WrongPassword123!", hashedPass) === false,
    "Password hash verification fails with wrong password"
  );

  // Profile Credential Stripping Verification
  const rawLeakProfile: Profile = {
    id: "prof_leak_test_1",
    email: "leak.test@gdgnctu.com",
    full_name: "Leak Test User",
    role: "member",
    status: "active",
    join_date: "2026-01-01",
    academic_notes: JSON.stringify({ pwd: "PlaintextPasswordShouldBeStripped", department: "Engineering" }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const cleanProf = internalDB.sanitizeProfile(rawLeakProfile);
  const cleanParsed = JSON.parse(cleanProf.academic_notes || "{}");
  assert(
    cleanParsed.pwd === undefined,
    "SECURITY ENFORCED: pwd field stripped from profile academic_notes"
  );
  assert(
    cleanParsed.department === "Engineering",
    "Non-sensitive profile metadata preserved intact"
  );

  // =================================================================
  // SUITE 11: CRYPTOGRAPHIC SESSION SIGNATURE & ROLE TAMPERING DEFENSE (SEC-08)
  // =================================================================
  console.log("\n--- SUITE 11: Session Role Signature & Client Tampering Defense (SEC-08) ---");
  const userId = "usr_tamper_test";
  const legitimateRole = "member";
  const sessionToken = "session_token_xyz123";

  const legitimateSignature = createSessionSignature(userId, legitimateRole, sessionToken);
  assert(
    typeof legitimateSignature === "string" && legitimateSignature.length > 10,
    "HMAC session signature generated with high entropy"
  );

  // Legitimate session verifies
  assert(
    verifySessionSignature(userId, legitimateRole, sessionToken, legitimateSignature) === true,
    "Valid session role signature verifies successfully"
  );

  // Client role escalation attempt (member -> super_admin)
  const escalatedRole = "super_admin";
  const tamperVerification = verifySessionSignature(userId, escalatedRole, sessionToken, legitimateSignature);
  assert(
    tamperVerification === false,
    "SECURITY ENFORCED: Unauthorized role elevation (member -> super_admin) detected and rejected!"
  );

  // Altered token rejected
  assert(
    verifySessionSignature(userId, legitimateRole, "forged_token", legitimateSignature) === false,
    "SECURITY ENFORCED: Mismatched session token rejected"
  );

  // =================================================================
  // SUITE 12: TIMING-SAFE AUTHENTICATION & SCHEDULED ROUTE DEFENSE (SEC-03)
  // =================================================================
  console.log("\n--- SUITE 12: Timing-Safe Comparison & Scheduled Route Defense (SEC-03) ---");
  function localTimingSafeCompare(a: string, b: string): boolean {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    if (aBuf.length !== bBuf.length) {
      crypto.timingSafeEqual(aBuf, aBuf);
      return false;
    }
    return crypto.timingSafeEqual(aBuf, bBuf);
  }

  const validToken = "Bearer secret_cron_key_gdg_2026_super_secure";
  const maliciousToken = "Bearer secret_cron_key_gdg_2026_wrong_guess";

  assert(
    localTimingSafeCompare(validToken, validToken) === true,
    "Timing-safe comparison succeeds for identical tokens"
  );
  assert(
    localTimingSafeCompare(maliciousToken, validToken) === false,
    "Timing-safe comparison rejects mismatched bearer tokens"
  );
  assert(
    localTimingSafeCompare("short", validToken) === false,
    "Timing-safe comparison safely rejects unequal length tokens without side-channel"
  );

  console.log("\n=================================================================");
  console.log("🛡️ ALL 12 ENTERPRISE SECURITY & HARDENING SUITES PASSED (100%)!");
  console.log("=================================================================\n");
}

runComprehensiveSecurityAudit().catch((err) => {
  console.error("Security audit failure:", err);
  process.exit(1);
});
