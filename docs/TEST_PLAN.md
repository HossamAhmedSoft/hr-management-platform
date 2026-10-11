# GDG on Campus NCTU — Comprehensive Quality Assurance & Test Plan

**Document Reference:** `docs/TEST_PLAN.md` (See also [PILOT_TEST_PLAN.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/PILOT_TEST_PLAN.md))  
**QA Lead:** Senior QA Automation Engineer & Security Auditor  

---

## 1. Test Strategy Overview

The testing framework employs a 4-tier validation pyramid:

```
          [End-to-End User Journeys (E2E)]
                  (6 Journeys - PASS)
         ─────────────────────────────────
         [Deterministic Policy Suites]
              (12 Tests - 100% PASS)
       ─────────────────────────────────────
       [Controlled Pilot Scenarios (A - J)]
              (10 Scenarios - PASS)
     ─────────────────────────────────────────
     [Static Analysis & Production Build]
          (TypeScript & Next.js Exit Code 0)
```

---

## 2. Automated Test Execution Commands

```bash
# 1. Typecheck and Next.js Turbopack Production Build
npm run build

# 2. Execute Deterministic Calculation & Policy Test Runner
npx tsx src/lib/tests/audit-verification-runner.mjs

# 3. Execute End-to-End User Journey Runner
npx tsx src/lib/tests/e2e-journey-runner.mjs
```

---

## 3. Deterministic Policy Test Suite Matrix

| Test ID | Test Objective | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|:---:|
| `TEST-1` | Monthly Evaluation Formula | Sum of ratings × weights = 80.00; Band = "Strong Performance" | Score: 80.00, Band: Strong Performance | **PASS** |
| `TEST-2A` | Proportional N/A Normalization | 51/65 × 100 = 78.46; Band = "Strong Performance" | Score: 78.46, Band: Strong Performance | **PASS** |
| `TEST-2B` | Proportional N/A Prompt Case | 46/65 × 100 = 70.77; Band = "Needs Improvement" | Score: 70.77, Band: Needs Improvement | **PASS** |
| `TEST-3` | Attendee Passing Rubric | 35+25+15+10 = 85/100; Certificate Eligible = true | Score: 85, Eligible: true | **PASS** |
| `TEST-3B` | Attendee Ineligible Rubric | 30+20+15+9 = 74/100; Certificate Eligible = false | Score: 74, Eligible: false | **PASS** |
| `TEST-4` | Instructor Evaluation Rubric | 20+22+24+12+9 = 87/100 | Score: 87 | **PASS** |
| `TEST-5` | Net-Point Boundaries | -10,-6: Red \| -5,-1: Warning \| 0,9: Normal \| 10,15: Green | Exact zone mapping verified | **PASS** |
| `TEST-6` | Points Ledger Independence | Net points = +3.0 pts; Evaluation score remains 100.00 | Monthly Score: 100, Net Ledger: +3 | **PASS** |
| `TEST-7` | Duplicate Deduction Prevention | Reject duplicate deduction matching same evidence URL | Duplicate flagged = true; new allowed | **PASS** |
| `TEST-8` | 7 Egyptian Working Days Calendar | Thu Oct 15 -> Mon Oct 26 (skipping 2 Egyptian weekends) | Mon Oct 26, 2 weekends skipped | **PASS** |
| `TEST-9` | RBAC Route Protection | Member denied `/audit-log`, `/policy`, `/hr-kpis`; Admin allowed | Member blocked: true; Admin allowed | **PASS** |
| `TEST-10` | Immutability & Audit Trail | Original record preserved; amendment appended to audit log | Full audit trail logged | **PASS** |

---

## 4. End-to-End User Journey Matrix

* **JOURNEY-A:** Task lifecycle (`assigned` ➔ `in_progress` ➔ `submitted` ➔ `completed`) — **PASS**
* **JOURNEY-B:** Positive point reward with evidence URL & monthly cap enforcement — **PASS**
* **JOURNEY-C:** Negative point deduction with 7-working-day appeal & neutral review — **PASS**
* **JOURNEY-D:** Monthly performance evaluation rating & finalization — **PASS**
* **JOURNEY-E:** Progressive escalation ladder (Level 2 PIP) — **PASS**
* **JOURNEY-F:** Role-based access control route and data isolation — **PASS**
