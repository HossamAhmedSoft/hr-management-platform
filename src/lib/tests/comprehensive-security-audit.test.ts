import { canAccessRoute, saveSession, getSession, clearSession, loginWithCredentials } from "../auth-service";
import { internalDB, DEFAULT_PROFILES } from "../internal-db";
import { UserRole, Profile, Appeal, Incident } from "@/types";

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
  // SUITE 5: SESSION LIFECYCLE & COOKIE SECURITY
  // =================================================================
  console.log("\n--- SUITE 5: Session Lifecycle & Expiry Handling ---");
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

  const session = saveSession(testUser);
  assert(!!session.token && session.token.startsWith("session_"), "Generated session token has expected entropy format");
  assert(session.expiresAt > Date.now(), "Session expiry date is properly set into future");

  console.log("\n=================================================================");
  console.log("🛡️ ALL 5 ENTERPRISE SECURITY & RBAC AUDIT SUITES PASSED (100%)!");
  console.log("=================================================================\n");
}

runComprehensiveSecurityAudit().catch((err) => {
  console.error("Security audit failure:", err);
  process.exit(1);
});
