// ============================================================
// GDG NCTU HR Platform — Unified Auth & Registration Approval Workflow
// TypeScript Test Suite
// ============================================================

import {
  registrationService,
  canTransitionStatus,
  generateReferenceNumber,
  generateNumericOtp,
} from "../registration-service";
import { canAccessRoute } from "../auth-service";
import { internalDB, hashPassword } from "../internal-db";
import { dbService } from "../db-service";
import { RegistrationRequest, Profile } from "@/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

export async function runRegistrationApprovalWorkflowTests() {
  console.log("=================================================================");
  console.log("🚀 REGISTRATION APPROVAL WORKFLOW & UNIFIED AUTH TEST SUITE");
  console.log("=================================================================\n");

  // SUITE 1: Reference Number Formatting & Generation
  console.log("--- SUITE 1: Reference Number Generation ---");
  const ref1 = generateReferenceNumber();
  const ref2 = generateReferenceNumber();
  const refPattern = /^REG-2026-NCTU-[A-Z0-9]+$/;
  assert(refPattern.test(ref1), `Generated reference ${ref1} matches REG-2026-NCTU-XXXX`);
  assert(ref1 !== ref2, `Generated references ${ref1} and ${ref2} are strictly unique`);

  // SUITE 2: Verification Code Engine
  console.log("\n--- SUITE 2: Verification Code Engine ---");
  const otp1 = generateNumericOtp();
  const otp2 = generateNumericOtp();
  assert(/^\d{6}$/.test(otp1), `OTP ${otp1} is exactly 6 numerical digits`);
  assert(/^\d{6}$/.test(otp2), `OTP ${otp2} is exactly 6 numerical digits`);

  // SUITE 3: Schema Validation Engine
  console.log("\n--- SUITE 3: Schema Validation ---");
  const fields = internalDB.getRegistrationFields();

  // Missing required field
  const missingEmailResult = registrationService.validateSubmission(fields, {
    full_name: "Tarek Nour",
    phone: "01012345678",
  });
  assert(!missingEmailResult.isValid, "Submission missing required email is invalid");

  // Valid submission
  const validSubmissionResult = registrationService.validateSubmission(fields, {
    full_name: "Tarek Nour",
    email: "tarek@nctu.edu.eg",
    phone: "01012345678",
    national_id: "29901011234567",
    university: "NCTU",
    faculty: "Faculty of Computer Science & AI",
    graduation_year: 2027,
    tshirt_size: "L",
    skills: ["React", "TypeScript"],
  });
  assert(validSubmissionResult.isValid, "Valid applicant submission passes dynamic schema validation");

  // SUITE 4: State Machine Transitions
  console.log("\n--- SUITE 4: State Machine Matrix ---");
  assert(canTransitionStatus("pending_email_verification", "pending_approval"), "pending_email_verification -> pending_approval is valid");
  assert(canTransitionStatus("pending_approval", "approved"), "pending_approval -> approved is valid");
  assert(canTransitionStatus("pending_approval", "rejected"), "pending_approval -> rejected is valid");
  assert(canTransitionStatus("pending_approval", "needs_info"), "pending_approval -> needs_info is valid");
  assert(canTransitionStatus("needs_info", "pending_approval"), "needs_info -> pending_approval is valid");
  assert(canTransitionStatus("pending_approval", "cancelled"), "pending_approval -> cancelled is valid");

  // Forbidden transitions
  assert(!canTransitionStatus("rejected", "approved"), "rejected -> approved is strictly forbidden");
  assert(!canTransitionStatus("cancelled", "approved"), "cancelled -> approved is strictly forbidden");
  assert(!canTransitionStatus("approved", "pending_approval"), "approved -> pending_approval is strictly forbidden");

  // SUITE 5: RBAC Routing Restrictions for /members/registrations
  console.log("\n--- SUITE 5: Route Access Control ---");
  assert(canAccessRoute("super_admin", "/members/registrations"), "Super Admin can access registration queue");
  assert(canAccessRoute("hr_admin", "/members/registrations"), "HR Admin can access registration queue");
  assert(canAccessRoute("hr_reviewer", "/members/registrations"), "HR Reviewer can access registration queue");
  assert(!canAccessRoute("member", "/members/registrations"), "Regular Member blocked from registration queue");
  assert(!canAccessRoute("team_lead", "/members/registrations"), "Team Lead without HR role blocked from registration queue");

  // SUITE 6: Atomic Approval Transaction & Credentials Transfer
  console.log("\n--- SUITE 6: Atomic Approval & Profile Promotion ---");
  const adminActor: Profile = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "superadmin@gdgnctu.com",
    full_name: "Super Administrator",
    role: "super_admin",
    team_id: "team_core",
    status: "active",
    join_date: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  const passHash = hashPassword("TestApplicantPass1!", "salttest123456");
  const testReq: RegistrationRequest = {
    id: "e0000000-0000-0000-0000-000000000001",
    reference_no: "REG-2026-NCTU-TEST",
    status: "pending_approval",
    email: "test.applicant@nctu.edu.eg",
    password_hash: passHash,
    full_name: "Test Applicant",
    phone: "+201099887766",
    assigned_role: "member",
    assigned_team_id: "team_web",
    submitted_data: {
      university: "NCTU",
      faculty: "Computer Science",
      graduation_year: 2027,
      national_id: "29901011234567",
    },
    schema_version: 1,
    locale: "en",
    reason_visible_to_applicant: true,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  internalDB.createRegistrationRequest(testReq);

  const approvalResult = await dbService.approveRegistrationRequest(
    testReq.id,
    adminActor,
    { role: "member", team_id: "team_web" }
  );

  assert(approvalResult.success, "Atomic approval transaction succeeds");
  assert(Boolean(approvalResult.profile), "Profile is generated on approval");
  assert(approvalResult.profile?.email === testReq.email, "Generated profile preserves applicant email");
  assert(approvalResult.profile?.role === "member", "Assigned role mapped correctly");
  assert(approvalResult.profile?.team_id === "team_web", "Assigned team mapped correctly");

  const updatedReq = internalDB.getRegistrationRequestById(testReq.id);
  assert(updatedReq?.status === "approved", "Request status updated to approved");
  assert(updatedReq?.promoted_profile_id === approvalResult.profile?.id, "Request linked to new profile ID");

  console.log("\n=================================================================");
  console.log("🎉 ALL REGISTRATION APPROVAL WORKFLOW TESTS COMPLETED SUCCESSFULLY!");
  console.log("=================================================================\n");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runRegistrationApprovalWorkflowTests().catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  });
}
