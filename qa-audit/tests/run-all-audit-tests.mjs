/**
 * GDG NCTU HR Management Platform — Master Audit Test Runner
 * Executes all audit phases sequentially:
 *   - Phase 1: Static Analysis, Dependency Audit & Production Build
 *   - Phase 2: Functional Validation, Signatures & RBAC Matrix
 *   - Phase 3 & 5: Deep Dive API Security, Backdoor & Logic Bypass
 *   - Phase 4 & 6: Performance Benchmarks, Load Boundaries & UI/RTL
 * 
 * Usage: npx tsx qa-audit/tests/run-all-audit-tests.mjs
 */

import { execSync } from "node:child_process";
import path from "node:path";

console.log("======================================================================");
console.log("🚀 GDG NCTU HR MANAGEMENT PLATFORM — COMPREHENSIVE QA & SECURITY AUDIT");
console.log("======================================================================");

const suites = [
  { name: "Phase 1: Static Baseline & Build Verification", script: "qa-audit/tests/phase1-static-baseline.runner.mjs" },
  { name: "Phase 2: Functional, Validation & RBAC Matrix", script: "qa-audit/tests/phase2-functional-and-api.runner.mjs" },
  { name: "Phase 3 & 5: Deep Dive API Security & Logic Bypass", script: "qa-audit/tests/phase3-api-security-deepdive.runner.mjs" },
  { name: "Phase 4 & 6: Performance, Scalability & UI/RTL Integrity", script: "qa-audit/tests/phase4-phase6-perf-and-ui.runner.mjs" },
];

let totalFailed = 0;

for (const suite of suites) {
  console.log(`\n▶️ RUNNING: ${suite.name}...`);
  try {
    execSync(`npx tsx "${path.resolve(suite.script)}"`, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log(`✨ COMPLETED: ${suite.name}`);
  } catch (err) {
    console.error(`💥 ERROR executing ${suite.name}:`, err.message);
    totalFailed++;
  }
}

console.log("\n======================================================================");
if (totalFailed === 0) {
  console.log("🎉 ALL AUDIT TEST SUITES EXECUTED SUCCESSFULLY.");
} else {
  console.log(`⚠️ ${totalFailed} TEST SUITE(S) ENCOUNTERED AUDIT DEFECTS OR ERRORS.`);
}
console.log("Evidence files saved to /qa-audit/evidence/");
console.log("Master reports available at /qa-audit/reports/");
console.log("======================================================================");
