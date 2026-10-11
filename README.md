# 🚀 GDG on Campus — New Cairo Technological University (NCTU)
## Centralized HR Operations & Member Performance Management Platform

**Production Application URL:** [https://hr-platform-cyan.vercel.app](https://hr-platform-cyan.vercel.app)  
**Database:** PostgreSQL on Supabase (`qhrxjfluvmrzngjuycom.supabase.co`)  
**Official Policy Reference:** *GDG NCTU — Team Rules & Points System: Work Guidelines & Member Performance Evaluation* (Official Governance PDF)  

A modern, transparent, auditable web application designed to replace scattered spreadsheets and govern member performance, task delivery, points ledger, monthly evaluations, feedback, progressive escalations, and technical educational tracks for **Google Developer Groups (GDG) on Campus NCTU**.

---

## 🌟 Key Architecture & Non-Negotiable Policy Guardrails

Derived directly from the official GDG NCTU operations manual:

1. **Separation of Concerns:**  
   Positive/Negative point balances are **strictly independent** from the monthly performance evaluation score (rated out of 100). Points do NOT automatically deduct marks from monthly evaluation sheets.
2. **No Automatic Penalties from Numbers Alone:**  
   A low point balance or entry into the Warning/Red tier triggers mentoring, check-ins, or progressive reviews — **never** automatic expulsion or demotion.
3. **Mandatory Due Process & Explanation Window:**  
   No negative point or disciplinary record can be approved without:
   - Specific documented factual evidence (links, commits, chat logs)
   - Advance member notification with a **48-hour explanation window**
   - Independent review by an authorized HR Reviewer
4. **Investigation Referral for Serious Violations:**  
   Breaches of academic integrity or severe misconduct are routed directly to executive leadership and investigation boards with **0.0 numeric deduction** rather than applying an arbitrary penalty.
5. **Egyptian Business Calendar Adherence:**  
   Appeals and grievance windows guarantee a minimum of **7 official working days**, strictly excluding Friday and Saturday (Egyptian weekend) and public holidays.
6. **Immutable Audit Trails:**  
   Every state change, review decision, point event, and evaluation amendment generates a permanent, tamper-resistant record in `audit_logs`.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16.4.0 (Turbopack, App Router, React 19)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS v4 + Radix UI Primitives + Google Developer Groups Brand Identity (Blue `#1a73e8`, Red `#ea4335`, Yellow `#fbbc04`, Green `#34a853`)
- **Internationalization:** `next-intl` (Full support for English LTR and Arabic RTL with automatic text orientation)
- **Database & Auth:** PostgreSQL & Supabase (Normalized relational tables, RLS security policies, and automatic audit triggers)
- **State & Access Control:** React Context (`AppProvider`) with server-side role validation across Super Admin, HR Admin, HR Reviewer, Team Lead, and Member personas.

---

## 📂 System Navigation & Core Modules

The platform features 17 comprehensive operational areas:

| # | Module | Route | Description |
|---|---|---|---|
| 1 | **Dashboard** | `/[locale]` | Executive overview, KPI cards, policy banners, active milestones |
| 2 | **Members Directory** | `/[locale]/members` | Filterable roster, detail drawer with multi-tab history, CSV import/export |
| 3 | **Teams & Committees** | `/[locale]/teams` | 9 technical and operations committees with leadership hierarchy |
| 4 | **Tasks & Deliverables** | `/[locale]/tasks` | Full task lifecycle, deliverable submission links, advance delay requests |
| 5 | **Points Ledger** | `/[locale]/points` | Positive & negative ledger with monthly 7-category caps and review queue |
| 6 | **Monthly Evaluations** | `/[locale]/evaluations` | Official 6 categories (30/25/15/10/10/10), real-time N/A proportional adjustments, performance tiers |
| 7 | **Feedback & Coaching** | `/[locale]/feedback` | Structured 1-on-1 coaching sessions, encrypted HR private notes, action items |
| 8 | **Incidents & Escalations** | `/[locale]/incidents` | 4-tier progressive ladder (Friendly Warning → PIP → Team Review → Leadership) |
| 9 | **Appeals & Grievances** | `/[locale]/appeals` | 7-working-day Egyptian calendar calculator and neutral reviewer decisions |
| 10 | **Educational Tracks** | `/[locale]/education` | Technical workshop cohorts, 100-pt student rubric, certificate eligibility (≥75%) |
| 11 | **Attendance & Sessions** | `/[locale]/attendance` | Meeting logs, check-ins, excused absence categories (academic/medical) |
| 12 | **Reports & Analytics** | `/[locale]/reports` | Aggregated performance benchmarks, workload capacity, operational health, and CSV exports |
| 13 | **HR KPIs** | `/[locale]/hr-kpis` | 4 quality benchmarks (Communication, Confidentiality, Integration, Fairness) |
| 14 | **Policy & Simulator** | `/[locale]/policy` | Published immutable policy versioning, category tables, policy change simulator |
| 15 | **Audit Log** | `/[locale]/audit-log` | Append-only security log tracking actor, operation, and state diffs |

---

## 📚 Master Documentation Index

All operational, architecture, security, and user manuals are established under `docs/`:

1. 📋 [PRODUCT_REQUIREMENTS.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/PRODUCT_REQUIREMENTS.md) — Product Requirements Document (Functional & NFR).
2. 📖 [HR_POLICY_MAPPING.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/HR_POLICY_MAPPING.md) — Line-by-line cross-reference from Official Policy PDF to code and tests.
3. 🔐 [ROLES_AND_PERMISSIONS.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/ROLES_AND_PERMISSIONS.md) — Complete RBAC hierarchy and PostgreSQL RLS policies.
4. 🗄️ [DATA_MODEL.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/DATA_MODEL.md) — Relational schema definitions, Mermaid ER diagram, and constraints.
5. 🎨 [DESIGN_SYSTEM.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/DESIGN_SYSTEM.md) — Brand identity, Google signature palette, typography, and dark mode.
6. 📘 [USER_GUIDE_HR.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/USER_GUIDE_HR.md) — HR Administrator & Reviewer Operational Handbook.
7. 📗 [USER_GUIDE_TEAM_LEADS.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/USER_GUIDE_TEAM_LEADS.md) — Team Lead Sprint & Mentorship Handbook.
8. 📙 [USER_GUIDE_MEMBERS.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/USER_GUIDE_MEMBERS.md) — Member Portal & Rights Handbook.
9. 📊 [IMPORT_MIGRATION_GUIDE.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/IMPORT_MIGRATION_GUIDE.md) — Excel/CSV ingestion pipeline & templates.
10. 🛡️ [SECURITY_AND_DATA_GOVERNANCE.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/SECURITY_AND_DATA_GOVERNANCE.md) — Threat model, privacy, and retention schedules.
11. 💾 [BACKUP_AND_RECOVERY.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/BACKUP_AND_RECOVERY.md) — Disaster recovery, RPO/RTO SLAs, and backup routines.
12. 🧪 [TEST_PLAN.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/TEST_PLAN.md) — Deterministic suites, user journeys, and pilot validation.
13. 📑 [HR_PLATFORM_REQUIREMENTS_MATRIX.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/HR_PLATFORM_REQUIREMENTS_MATRIX.md) — Full requirements traceability matrix (47 requirements).
14. 🔍 [HR_PLATFORM_AUDIT_REPORT.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/HR_PLATFORM_AUDIT_REPORT.md) — Comprehensive technical audit and pilot certification.
15. 🚢 [DEPLOYMENT_AND_HANDOVER.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/DEPLOYMENT_AND_HANDOVER.md) — Deployment instructions, credentials, and DevOps handover.
16. ⚖️ [POLICY_GOVERNANCE_REGISTER.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/POLICY_GOVERNANCE_REGISTER.md) — 5 unresolved policy ambiguities and interim resolutions.

---

## 🧪 Testing & Verification

Execute the automated test suites using `npx tsx`:

```bash
# 1. Compile Next.js production build (Turbopack)
npm run build

# 2. Run deterministic calculation and policy rules suite (12 tests)
npx tsx src/lib/tests/audit-verification-runner.mjs

# 3. Run complete end-to-end user journeys (6 workflows)
npx tsx src/lib/tests/e2e-journey-runner.mjs
```
