# 📋 GDG NCTU HR Management Platform — QA & Security Test Strategy (Phase 0)

**Document Version:** 1.0  
**Date:** October 2026  
**Auditor / Role:** Principal QA Engineer & Application Security Auditor  
**Environment:** Local Test & Staging Environment (`http://localhost:3000`) with Local-First Resilient Data Layer (`internalDB` / Supabase Test Instance)  
**Execution Mode:** READ-ONLY AUDIT (Strict Non-Destructive Testing)

---

## 1. System Map & Architecture Overview

### 1.1 Technology Stack
- **Framework & Runtime:** Next.js 16.4.0 (Turbopack, App Router) running on Node.js 20+
- **Frontend Core:** React 19.3.0, TypeScript 5.x, Tailwind CSS v4, Lucide Icons, Recharts 3.x, Radix UI Primitives
- **Persistence & Data Layer:**
  - Supabase PostgreSQL (5 Migration scripts: `001_initial_schema.sql` through `005_forms_module.sql`) with Row-Level Security (RLS)
  - `internalDB` in-memory / localStorage enterprise engine (`src/lib/internal-db.ts`) with cryptographic password isolation
  - Dual-tier resilience service (`src/lib/db-service.ts`) with background sync and timeout guards
- **Authentication & Authorization:**
  - Google Identity Services (GIS) / OpenID Connect with PKCE (`src/lib/google-auth.ts`, `/api/auth/google/*`)
  - Cryptographically signed sessions using HMAC-SHA256 (`gdg_session_sig`, `gdg_session_user`, `gdg_session_role`)
  - Edge Proxy Middleware (`src/proxy.ts`) enforcing route-level RBAC (`canAccessRoute`) and defense headers
- **Internationalization (i18n):**
  - `next-intl` supporting English (`en`, LTR) and Arabic (`ar`, RTL) with Cairo / Inter typography

### 1.2 System Modules & Core Entities
| Module | Core Entities | Primary Functionality | Business Criticality |
| :--- | :--- | :--- | :--- |
| **Auth & Identity** | `profiles`, `passwords`, `sessions`, `google_accounts` | Login, Google SSO PKCE, session signature, idle timeout | 🔴 Critical |
| **Audit & Compliance** | `audit_logs` | Immutable audit trail, administrative action verification | 🔴 Critical |
| **Forms & Surveys** | `forms`, `form_versions`, `form_responses`, `automations` | Native Google Forms equivalent, logic branching, quizzes, HMAC webhooks | 🔴 Critical |
| **Evaluations & Scoring** | `evaluations`, `evaluation_ratings`, `improvement_plans` | 100-point scale appraisal, performance reviews | 🟠 High |
| **Points & Gamification** | `point_events`, `point_categories`, `point_cap_categories` | Disciplinary deductions, positive rewards, monthly caps | 🟠 High |
| **Appeals & Disciplinary**| `appeals`, `incidents` | 7-day statute of limitations, 5-tier escalation ladder | 🟠 High |
| **Tasks & Deliverables** | `tasks`, `task_assignees` | Sprint tasks, assignees, deadlines, progress tracking | 🟡 Medium |
| **Technical Tracks** | `educational_tracks`, `participants`, `track_enrollments` | Academy cohorts, attendance, sessions, certificates | 🟡 Medium |
| **Attendance & Excuses** | `attendance_events`, `meeting_excuses` | Meeting attendance verification, medical/academic excuses | 🟡 Medium |
| **HR KPIs & Reports** | HR KPI aggregates, Member analytics | At-risk member detection, retention metrics, team health | 🟡 Medium |
| **Teams & Committees** | `teams`, `team_memberships` | Organizational hierarchy, committee leads | 🟢 Low |
| **Reminders & Cron** | Smart reminders, Background alerts | Automated notifications, deadline warnings | 🟢 Low |

---

## 2. Roles & Permissions Model (RBAC Matrix)

The system defines 9 distinct roles with granular route-level and action-level authorization boundaries:

```
[ super_admin ] ── Universal system clearance & security configuration
      │
[ hr_admin ]    ── HR management, evaluations, incidents, appeals, roster
      │
[ hr_reviewer ] ── Disciplinary reviews, performance appraisal evaluations
      │
[ team_lead ]   ── Committee management, task assignment, team evaluations
      │
[ track_lead ]  ── Educational track administration, attendee progress
      │
[ lead_instructor / ta_mentor ] ── Session teaching, mentoring, grading
      │
[ member ]      ── Self-service dashboard, tasks, appeals, point history
      │
[ attendee ]    ── Track student participant, quiz taker
```

---

## 3. Existing Tooling & Test Baseline

- **Linters & Type Checkers:**
  - `eslint` (ESLint 9 with `eslint-config-next`)
  - `tsc --noEmit` (TypeScript 5 strict compilation via `npm run build`)
- **Existing Test Scripts (`src/lib/tests/`):**
  - 19 test runners built with standard Node/ESM executing via `npx tsx`
  - Areas previously covered: Forms lifecycle, Google Auth security, Admin-member sync, Points isolation, Attendance excuses, CRUD password isolation
- **Gap Identified:**
  - No unified test runner in `package.json` (no `npm test` script configured)
  - No automated OWASP DAST scanner integrated
  - No formal E2E test suite running headlessly in CI (e.g. Playwright / Puppeteer)

---

## 4. Test Strategy & Audit Plan (Phases 1 — 8)

### Phase 1: Static & Baseline Checks
- Automated dependency vulnerability audit (`npm audit`, license checking)
- Secret scanning across source tree, git history, and client-exposed environment bundles
- Code complexity, dead code analysis, and lint/type-check baseline

### Phase 2: Functional Testing (Module-by-Module)
- Boundary value analysis (BVA), Unicode/Arabic/RTL text injection, very large payloads
- Business logic validation: 7-day appeal deadlines, 100-point evaluation limits, negative point deductions, monthly cap enforcement
- Concurrency testing: double submit on forms, concurrent task status changes, idempotency of retry requests

### Phase 3: API & Protocol Testing
- Complete black-box and grey-box testing of all 15+ API endpoints
- Authentication requirement, status codes, JSON schema validation, IP rate-limiting, and timing attack resistance on secret tokens

### Phase 4: UI, E2E & Accessibility Testing
- End-to-end user journeys for each persona (Super Admin, HR Admin, Team Lead, Member, Public Respondent)
- RTL Arabic layout fidelity, text overflow/truncation checks, responsive layouts (Mobile 375px, Tablet 768px, Desktop 1440px)
- Accessibility (a11y) audit for keyboard navigation and screen readers

### Phase 5: Security Testing (OWASP Top 10)
- **Broken Access Control (A01):** Horizontal and vertical privilege escalation (testing IDOR across Member -> Admin routes and API payloads)
- **Cryptographic Failures (A02):** Session signature tampering, token entropy, cookie security flags (`HttpOnly`, `SameSite`, `Secure`)
- **Injection (A03):** SQL/NoSQL injection, stored/reflected XSS in form inputs and rich text areas, CSV formula injection (`=cmd|...`)
- **Insecure Design & SSRF (A04 / A10):** Honeypot spam defense, outgoing webhook destination verification
- **Security Misconfiguration (A05):** Security response headers (`CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`)

### Phase 6: Performance, Concurrency & Reliability
- Stress testing form submissions and response analytics rendering
- Simulating database latency / network timeouts and measuring graceful degradation

### Phase 7: Data Integrity & Database Operations
- PostgreSQL migration reversibility check (`001` through `005`)
- Foreign key constraints, cascade behaviors, and orphan record detection

### Phase 8: Integrations & Webhooks
- HMAC-SHA256 signature verification for outgoing webhooks
- Google Identity Services token exchange validation

---

## 5. Test Accounts Matrix (One Persona Per Role)

All test scenarios will be executed against these pre-seeded test personas:

| Role | Test Email Account | Name | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `lead@gdgnctu.com` | Ahmed El-Sayed | Omnipotent administrative access |
| **HR Admin** | `hr.head@gdgnctu.com` | Sara Mahmoud | Full HR, appraisals, incidents, roster |
| **HR Reviewer** | `hr.reviewer@gdgnctu.com` | Omar Khaled | Neutral appraisal and appeal reviewer |
| **Team Lead (Web)** | `web.lead@gdgnctu.com` | Kareem Tarek | Web committee lead, task assigner |
| **Team Lead (AI)** | `ai.lead@gdgnctu.com` | Nourhan Adel | AI committee lead |
| **Member (Web)** | `youssef.ali@gdgnctu.com` | Youssef Ali | Standard committee member |
| **Member (Media)** | `mariam.fathy@gdgnctu.com` | Mariam Fathy | Standard committee member |
| **Track Lead** | `track.lead@gdgnctu.com` | Track Director | Education academy administrator |
| **Public / Anon** | *Unauthenticated Guest* | Respondent | Public form submitter |

---

## 6. Deliverables Structure in `/qa-audit/`

All test artifacts, evidence, and final reports will be organized inside `/qa-audit/`:
```
qa-audit/
├── reports/
│   ├── TEST_STRATEGY.md       <-- (This Document)
│   ├── REPORT.md              <-- (Comprehensive Arabic Audit Report with English technical terms)
│   ├── FINDINGS.json          <-- (Machine-readable findings list)
│   ├── FINDINGS.csv           <-- (Jira/GitHub importable spreadsheet)
│   └── REMEDIATION_PLAN.md    <-- (Prioritized Phase A/B/C remediation plan)
├── tests/
│   ├── static-audit.runner.mjs
│   ├── functional-modules.runner.mjs
│   ├── api-security.runner.mjs
│   ├── rbac-matrix.runner.mjs
│   └── run-all-audit-tests.mjs
├── fixtures/
│   └── audit-fixtures.json
└── evidence/
    └── [screenshots, raw logs, HTTP response dumps]
```

---

## 7. Immediate Next Steps & Safety Confirmation

1. **Environment Safety:** All audit scripts operate non-destructively against the local Next.js environment (`http://localhost:3000`) and the isolated test data layer.
2. **Phase 0 Status:** COMPLETED.
3. **Execution Gate:** Awaiting user approval ("go") to proceed with automated execution of **Phase 1 (Static & Baseline Checks)** and **Phase 2 (Functional Testing)**.
