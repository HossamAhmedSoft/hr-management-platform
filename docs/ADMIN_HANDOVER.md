# GDG NCTU HR PLATFORM — SYSTEM ADMINISTRATOR HANDOVER MANUAL

**Document Reference:** `OPS-HANDOVER-2026-V1`  
**Classification:** Confidential Technical Operations Guide  
**System Target:** Production Environment (`https://hr-platform-cyan.vercel.app`)  
**Audience:** Incoming Lead Software Engineer, DevOps Engineer & Super Administrator  

---

## 1. System Architecture & Tech Stack

* **Frontend & Web Framework:** Next.js 16.4.0 (App Router, Turbopack, React 19).
* **Styling & Design System:** Tailwind CSS v4, Lucide Icons, Radix UI Primitives, Next-Themes (Light/Dark mode), Next-Intl (Bilingual English/Arabic RTL).
* **Backend & Database:** PostgreSQL hosted on Supabase (`qhrxjfluvmrzngjuycom.supabase.co`).
* **Hosting Platform:** Vercel Edge & Serverless Deployment (`hr-platform-cyan.vercel.app`).
* **Testing & Verification:** TypeScript 5, Deterministic Calculation Suites (`audit-verification-runner.mjs`), E2E Journey Runner (`e2e-journey-runner.mjs`).

---

## 2. Environment Variables & Secret Configuration

Configure the following environment variables in `.env.local` for local development or within the **Vercel Project Dashboard ➔ Settings ➔ Environment Variables**:

| Variable Name | Required | Description | Safe Example Format |
|---|:---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project API Endpoint | `https://[PROJECT_ID].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Public Anonymous Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (Server) | Supabase Admin Service Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `RESEND_API_KEY` | Optional | Transactional Email API Key | `re_1234567890abcdef...` |
| `EMAIL_FROM_ADDRESS` | Optional | Outgoing Sender Email Address | `GDG NCTU HR <notifications@gdgnctu.com>` |
| `NEXT_PUBLIC_APP_URL` | Yes | Base Application URL | `https://hr-platform-cyan.vercel.app` |

> [!CAUTION]  
> Never commit `.env.local` or secret keys to GitHub. The repository includes `.env.example` as a template.

---

## 3. Database Management & Schema Migrations

### Database Schema Architecture:
The core database tables and Row-Level Security policies are structured under `supabase/migrations/` and consolidated in `supabase_setup.sql`.

### Applying Database Updates:
1. **Via Supabase SQL Editor:**
   * Open the Supabase Web Console ➔ SQL Editor.
   * Paste the migration script and click **Run**.
2. **Via Supabase CLI (Recommended for CI/CD):**
   ```bash
   npx supabase link --project-ref qhrxjfluvmrzngjuycom
   npx supabase db push
   ```

---

## 4. Disaster Recovery & Backup Routine

* **Automated Daily Backups:** Managed by Supabase (Retained for 7 days on free tier, 30 days on pro tier).
* **Manual Snapshot Before Major Releases:**
  ```bash
  pg_dump "postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" \
    --clean --if-exists -F p -f "backup_release_$(date +%Y%m%d).sql"
  ```
* Detailed restoration drills and RPO/RTO SLAs are documented in [BACKUP_AND_RECOVERY.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/BACKUP_AND_RECOVERY.md).

---

## 5. Account & Super Admin Management

1. **Initial Setup:**
   * The system features an automated setup flow (`/login` ➔ setup super admin) when zero administrator accounts exist in the database.
   * Once created, subsequent admin promotions can **only** be performed by an existing `super_admin` via `/members`.
2. **Revoking Administrator Access:**
   * If an administrator resigns, navigate to `/members`, edit their record, and change their role to `member` or `alumni`.

---

## 6. Verification & Test Execution Suite

Before deploying any future code change to production, run the automated verification suite:

```bash
# 1. Verify TypeScript types and production Next.js build
npm run build

# 2. Run deterministic calculation and policy tests (12 tests)
npx tsx src/lib/tests/audit-verification-runner.mjs

# 3. Run end-to-end user journeys (6 journeys)
npx tsx src/lib/tests/e2e-journey-runner.mjs
```

---

## 7. Known Limitations & Unresolved Items

1. **External Email / WhatsApp:** Transactional email and WhatsApp APIs are architected but require production API keys from leadership. In-app feeds are currently 100% active.
2. **Policy Ambiguities:** Refer to [POLICY_GOVERNANCE_REGISTER.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/POLICY_GOVERNANCE_REGISTER.md) for 5 pending decisions requiring chapter leadership sign-off (e.g. Core Task cap reconciliation).
