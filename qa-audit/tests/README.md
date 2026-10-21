# GDG NCTU HR Management Platform — QA Audit Test Suite

Automated evidence-based testing suite developed during the comprehensive QA and Application Security Audit.

## Hard Constraint Adherence
- **Audit-Only**: Tests inside this directory execute non-destructive checks against local memory and mocked structures.
- **Zero Production Modifications**: No application source code has been altered.

## Test Suites Overview

| Suite | Script | Focus Area |
| :--- | :--- | :--- |
| **Phase 1** | `phase1-static-baseline.runner.mjs` | ESLint rules, production build validation, npm dependency audit |
| **Phase 2** | `phase2-functional-and-api.runner.mjs` | Functional validation engine, quiz grading, RBAC 9-role matrix |
| **Phase 3 & 5** | `phase3-api-security-deepdive.runner.mjs` | API key backdoor, client-side validation bypass, weak session hash |
| **Phase 4 & 6** | `phase4-phase6-perf-and-ui.runner.mjs` | Batch load (500 submissions), schema scale (100 Qs), RTL & UI checks |

## How to Run All Suites (Single Command)

```bash
npx tsx qa-audit/tests/run-all-audit-tests.mjs
```

## Running Individual Suites

```bash
# Phase 1: Static & Build
npx tsx qa-audit/tests/phase1-static-baseline.runner.mjs

# Phase 2: Functional & RBAC Matrix
npx tsx qa-audit/tests/phase2-functional-and-api.runner.mjs

# Phase 3 & 5: API Security & Logic
npx tsx qa-audit/tests/phase3-api-security-deepdive.runner.mjs

# Phase 4 & 6: Performance & UI
npx tsx qa-audit/tests/phase4-phase6-perf-and-ui.runner.mjs
```

## Evidence Outputs
All suites output structured JSON evidence to:
- `qa-audit/evidence/phase1_findings.json`
- `qa-audit/evidence/phase2_findings.json`
- `qa-audit/evidence/deepdive_findings.json`
- `qa-audit/evidence/phase4_6_findings.json`
