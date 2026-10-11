# GDG on Campus NCTU — Deployment & Technical Handover Manual

**Document Reference:** `docs/DEPLOYMENT_AND_HANDOVER.md` (See also [ADMIN_HANDOVER.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/ADMIN_HANDOVER.md))  
**Target Environments:** Production (`https://hr-platform-cyan.vercel.app`), Local Development  
**Audience:** Lead DevOps Engineer, Incoming Technical Administrator  

---

## 1. Hosting & Infrastructure Architecture

* **Frontend & Edge Runtime:** Vercel Serverless & Edge Network.
* **Database & Auth:** PostgreSQL hosted on Supabase (`qhrxjfluvmrzngjuycom.supabase.co`).
* **Framework:** Next.js 16.4.0 (Turbopack, React 19).
* **Domain & HTTPS:** Enforced TLS 1.3 across custom domain and Vercel edge endpoints.

---

## 2. Environment Variables & Credentials Setup

Set these environment variables in your local `.env.local` or the **Vercel Project Dashboard ➔ Settings ➔ Environment Variables**:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://qhrxjfluvmrzngjuycom.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Base App URL
NEXT_PUBLIC_APP_URL="https://hr-platform-cyan.vercel.app"

# Optional External Email (Resend API)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM_ADDRESS="GDG NCTU HR <notifications@gdgnctu.com>"
```

---

## 3. Database Deployment & Schema Setup

1. **Schema Initialization:**
   * Execute `supabase_setup.sql` in the Supabase SQL Editor.
   * Verify all core tables, foreign keys, triggers, and RLS policies are active.
2. **First-Time Super Admin Bootstrap:**
   * When zero users exist, navigate to `/login`.
   * The platform auto-detects the empty database and provides the Super Admin Creation form.
   * Provide the authorized email (e.g. `hossam.admin@gdgnctu.com`) and secure password.

---

## 4. Production Deployment & Verification Routine

```bash
# 1. Clean local build
npm run build

# 2. Run verification test suite
npx tsx src/lib/tests/audit-verification-runner.mjs
npx tsx src/lib/tests/e2e-journey-runner.mjs

# 3. Deploy to Vercel
npx vercel --prod
```
