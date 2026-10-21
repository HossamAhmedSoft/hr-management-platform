/**
 * GDG NCTU HR Management Platform — QA Audit Test Suite
 * PHASE 3 & 5: DEEP DIVE API SECURITY, BACKDOORS & LOGIC BYPASS
 * 
 * Rules: AUDIT-ONLY. No modifications to production code.
 */

import { NextRequest } from "next/server";
import { getApiAuthContext } from "../../src/lib/api-auth-helper.ts";
import { validateFormSubmission, evaluateLogicRules } from "../../src/lib/forms-service.ts";
import { internalDB } from "../../src/lib/internal-db.ts";
import { createSessionSignature, verifySessionSignature } from "../../src/lib/auth-service.ts";
import fs from "node:fs";
import path from "node:path";

console.log("=============================================================");
console.log("🕵️ EXECUTING QA AUDIT: API SECURITY & LOGIC BYPASS DEEP DIVE");
console.log("=============================================================");

const auditFindings = [];

function recordTest(passed, id, title, category, severity, details) {
  const icon = passed ? "✅ PASS:" : "🚨 VULNERABILITY CONFIRMED:";
  console.log(`  ${icon} [${id}] ${title}`);
  if (!passed) {
    auditFindings.push({
      id,
      title,
      category,
      severity,
      status: "CONFIRMED",
      location: details.location,
      cwe: details.cwe,
      cvss: details.cvss,
      evidence: details.evidence,
      impact: details.impact,
      recommendation: details.recommendation,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// VULN 1: HARDCODED API KEY BACKDOOR (CRITICAL)
// ─────────────────────────────────────────────────────────────
console.log("\n--- TEST 1: API Key Backdoor & Arbitrary Prefix Escalation ---");

// Construct mock NextRequest with arbitrary gdg_live_ token
const reqBackdoor = new NextRequest("http://localhost:3000/api/forms/test", {
  headers: {
    "x-api-key": "gdg_live_attacker_unauthorized_token_999",
  },
});

const backdoorAuth = getApiAuthContext(reqBackdoor);

// Vulnerability test: If backdoorAuth is authenticated with role super_admin, system is VULNERABLE
const isBackdoorSecured = !backdoorAuth.isAuthenticated;

recordTest(
  isBackdoorSecured,
  "SEC-VULN-01",
  "Hardcoded API Key Prefix ('gdg_live_*') Grants Immediate Super Admin Access",
  "Broken Authentication",
  "Critical",
  {
    location: "src/lib/api-auth-helper.ts:59",
    cwe: "CWE-798: Use of Hard-coded Credentials",
    cvss: "9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)",
    evidence: `Supplying header 'x-api-key: gdg_live_attacker_...' yielded isAuthenticated=${backdoorAuth.isAuthenticated}, role='${backdoorAuth.role}'.`,
    impact: "Complete unauthenticated takeover of all Forms API endpoints and administrative operations.",
    recommendation: "Remove wildcard prefix matching and hardcoded secrets. Validate API keys against hashed database records with scoped permissions.",
  }
);

// ─────────────────────────────────────────────────────────────
// VULN 2: CLIENT-SUPPLIED VISIBILITY VALIDATION BYPASS (HIGH)
// ─────────────────────────────────────────────────────────────
console.log("\n--- TEST 2: Client-Supplied visible_question_ids Validation Bypass ---");

const testQuestions = [
  { id: "q_mandatory_name", type: "short_text", title: "Full Name", is_required: true },
  { id: "q_mandatory_email", type: "email", title: "Email", is_required: true },
];

// Attacker sends completely empty answers, but supplies an empty visibleQuestionIds set
const maliciousVisibleIds = new Set(); // Attacker claims 0 questions are visible
const emptyAnswers = {}; // None answered

const bypassResult = validateFormSubmission(testQuestions, emptyAnswers, maliciousVisibleIds);

// Vulnerability test: If isValid is true despite empty required fields, validation is BYPASSABLE
const isBypassPrevented = !bypassResult.isValid;

recordTest(
  isBypassPrevented,
  "SEC-VULN-02",
  "Client-Side Control of visible_question_ids Bypasses Server-Side Validation",
  "Broken Access Control",
  "High",
  {
    location: "src/app/api/forms/public/[slug]/route.ts:187 / src/lib/forms-service.ts:195",
    cwe: "CWE-602: Client-Side Enforcement of Server-Side Security",
    cvss: "7.5 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)",
    evidence: `Submitting empty answers with client-forged visible_question_ids=[] returned isValid=${bypassResult.isValid} with 0 errors.`,
    impact: "Attackers can bypass all mandatory question validations, quizzes, and range restrictions by spoofing visibility array.",
    recommendation: "Server must independently evaluate logic rules against submitted answers to compute visibleQuestionIds; never trust client payload.",
  }
);

// ─────────────────────────────────────────────────────────────
// VULN 3: INSECURE 32-BIT WEAK POLYNOMIAL SESSION HASH & FORGERY (CRITICAL)
// ─────────────────────────────────────────────────────────────
console.log("\n--- TEST 3: Insecure Polynomial Session Signature Algorithm & Offline Forgery ---");

const sampleUserId = "usr_target_admin";
const sampleToken = "tok_random_123456";

// Attacker computes signature offline using the hardcoded fallback secret
const fallbackSecret = "gdg_nctu_session_hmac_secret_2026_enterprise";
let forgedHashVal = 0;
const str = `${fallbackSecret}:${sampleUserId}:super_admin:${sampleToken}`;
for (let i = 0; i < str.length; i++) {
  forgedHashVal = (forgedHashVal << 5) - forgedHashVal + str.charCodeAt(i);
  forgedHashVal |= 0;
}
const forgedSignature = `sig_${Math.abs(forgedHashVal).toString(16)}`;

// Test if the system accepts this offline-forged super_admin signature
const isForgedSigAccepted = verifySessionSignature(sampleUserId, "super_admin", sampleToken, forgedSignature);

recordTest(
  !isForgedSigAccepted,
  "SEC-VULN-03",
  "Session Signature Uses Insecure 32-Bit Linear Polynomial Hash Without HMAC",
  "Cryptographic Failures",
  "Critical",
  {
    location: "src/lib/auth-service.ts:38-65",
    cwe: "CWE-328: Use of Weak Hash / CWE-798: Hardcoded Fallback Secret",
    cvss: "9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)",
    evidence: `Offline calculated signature '${forgedSignature}' was successfully accepted by verifySessionSignature as valid super_admin credentials.`,
    impact: "Complete unauthenticated privilege escalation to super_admin by forging cookie signatures offline.",
    recommendation: "Remove fallback secret, fail closed if SESSION_SECRET is missing, and replace linear hash with Web Crypto HMAC-SHA256.",
  }
);

// ─────────────────────────────────────────────────────────────
// VULN 4: CONDITIONAL LOGIC BRANCHING EVALUATION DEFECT (HIGH)
// ─────────────────────────────────────────────────────────────
console.log("\n--- TEST 4: Conditional Logic Engine Evaluation Defect ---");

const conditionalQuestions = [
  { id: "q_ask_experience", type: "multiple_choice", title: "Have experience?", is_required: true },
  { id: "q_extra_details", type: "short_text", title: "Details", is_required: true },
];

const logicRules = [
  {
    id: "r1",
    form_id: "f1",
    target_type: "question",
    target_id: "q_extra_details",
    action: "show_question",
    conditions: [{ question_id: "q_ask_experience", operator: "equals", value: "yes" }],
  },
];

// Evaluate when answer is 'no'
const evalConditionFalse = evaluateLogicRules(logicRules, { q_ask_experience: "no" }, conditionalQuestions);
const isQuestionHiddenWhenFalse = evalConditionFalse.hiddenQuestionIds.has("q_extra_details");

recordTest(
  isQuestionHiddenWhenFalse,
  "QA-LOGIC-01",
  "Conditional Questions Governed by 'show_question' Remain Visible When Condition is Unmet",
  "Forms Logic Engine",
  "High",
  {
    location: "src/lib/forms-service.ts:271-308",
    cwe: "CWE-670: Always-Incorrect Control Flow Implementation",
    cvss: "5.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N)",
    evidence: `Target question 'q_extra_details' was NOT added to hiddenQuestionIds when q_ask_experience='no'.`,
    impact: "Respondents see irrelevant questions, mandatory validation triggers unexpectedly, breaking conditional form flows.",
    recommendation: "Initialize questions with show_question rules as hidden by default, unhiding them only when matching conditions evaluate to true.",
  }
);

// ─────────────────────────────────────────────────────────────
// SUMMARY & SAVE EVIDENCE
// ─────────────────────────────────────────────────────────────
console.log("\n=============================================================");
console.log(`🏁 DEEP DIVE AUDIT COMPLETE: ${auditFindings.length} CRITICAL/HIGH VULNERABILITIES CONFIRMED`);
console.log("=============================================================");

const evidenceOutPath = path.resolve("qa-audit/evidence/deepdive_findings.json");
fs.writeFileSync(evidenceOutPath, JSON.stringify(auditFindings, null, 2), "utf-8");
console.log(`Saved deep-dive evidence to: ${evidenceOutPath}`);
