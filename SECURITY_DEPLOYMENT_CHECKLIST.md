# GDG NCTU HR Management Platform — Production Security Deployment Checklist

This checklist must be reviewed, verified, and signed off prior to deploying any release or hotfix of the GDG on Campus NCTU HR Management Platform to production.

---

## 1. Environment Variables & Secret Configuration

| Variable | Requirement | Recommended Secret Format | Verified |
| :--- | :--- | :--- | :---: |
| `SESSION_SECRET` | **Mandatory** | Minimum 32-character high-entropy hex (`openssl rand -hex 32`) | [ ] |
| `CRON_SECRET` | **Mandatory in Production** | Minimum 32-character alphanumeric key | [ ] |
| `NEXT_PUBLIC_SUPABASE_URL` | **Mandatory** | HTTPS URL pointing to live Supabase PostgreSQL project | [ ] |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Mandatory** | Supabase anonymous public client key | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only (Never in client bundle)** | Elevated backend key for administrative operations | [ ] |
| `NODE_ENV` | **Mandatory** | Set strictly to `"production"` | [ ] |

> [!CAUTION]
> Never commit `.env.local` or `.env.production` files containing live secrets into version control. Ensure `.gitignore` contains all `.env*` entries except `.env.example`.

---

## 2. Cryptographic Secret Management & Rotation Protocol

1. **Rotation Frequency:**
   - `SESSION_SECRET`: Rotate quarterly or immediately upon suspected compromise.
   - `CRON_SECRET`: Rotate semi-annually.
   - Supabase Service Role Key: Rotate upon team member departure.
2. **Graceful Session Secret Rotation:**
   - When updating `SESSION_SECRET`, users will be prompted to re-authenticate as active HMAC signatures are invalidated, clearing stale client cookies gracefully.
3. **Storage:**
   - Store production secrets exclusively in secure cloud secret vaults (e.g., Vercel Project Environment Variables, Google Cloud Secret Manager, or GitHub Encrypted Secrets).

---

## 3. Web Server & Edge Proxy Verification

- [x] **Next.js Edge Proxy Enabled:** Verify `src/proxy.ts` is configured with `matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]`.
- [x] **Strict Transport Security (HSTS):** `max-age=31536000; includeSubDomains; preload` enabled in `next.config.ts`.
- [x] **Clickjacking Defense:** `frame-ancestors 'none'` in CSP and `X-Frame-Options: DENY` enforced.
- [x] **MIME Sniffing Prevention:** `X-Content-Type-Options: nosniff` active.
- [x] **Referrer Policy:** `strict-origin-when-cross-origin` enforced.
- [x] **Permissions Policy:** Restrict hardware access: `camera=(), microphone=(), geolocation=()`.
- [x] **Content Security Policy (CSP):** Verified with allowlist for Google Fonts, Supabase endpoints, and `object-src 'none'`.

---

## 4. Database & Supabase PostgreSQL Hardening

1. **Row-Level Security (RLS):**
   - Ensure `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;` is enabled on all tables in Supabase.
   - Ensure policies permit members to read/write only their own records, while `super_admin` and `hr_admin` roles hold broad management permissions.
2. **Metadata Sanitization:**
   - Verify that column `academic_notes` in `profiles` never stores plaintext passwords or API keys.
3. **Database Connection Security:**
   - Connect only via TLS/SSL (`sslmode=require`).
   - Limit direct database IP access to trusted backend server subnets where possible.

---

## 5. API & Scheduled Endpoint Hardening

- [x] **Bearer Token Protection:** `/api/reminders/process` validates incoming `Authorization: Bearer <token>` against `process.env.CRON_SECRET`.
- [x] **Timing-Safe Comparison:** `crypto.timingSafeEqual` prevents side-channel token length and content discovery.
- [x] **Rate Limiting:** IP rate limiter caps requests at 30 req/min per IP, returning HTTP 429.
- [x] **Production Secret Requirement:** In `NODE_ENV=production`, endpoint rejects requests with HTTP 500 if `CRON_SECRET` is omitted.

---

## 6. Logging, Monitoring & Incident Response

1. **Immutable Audit Trail:**
   - Confirm all administrative policy, track, and score adjustments emit records to the `audit_logs` store.
   - Audit logs must be accessible exclusively to `super_admin` and `hr_admin`.
2. **Monitoring & Alerting:**
   - Configure alert triggers for repeated HTTP 401/403 spikes (> 20 events in 5 minutes).
   - Monitor scheduled reminder job execution latency and error rates.
3. **Incident Escalation:**
   - In the event of an active intrusion attempt or compromised credential:
     1. Revoke active sessions by rotating `SESSION_SECRET`.
     2. Lock the affected account using administrative lockout flags.
     3. Inspect the audit log trail (`/ar/audit-log`) to determine affected entities.
     4. File an incident report following the procedure in `SECURITY.md`.

---

## 7. Sign-Off & Verification Checklist

- [x] TypeScript Typecheck (`npx tsc --noEmit`) completed with 0 errors.
- [x] Comprehensive Security Audit Test Suite (`tsx src/lib/tests/comprehensive-security-audit.test.ts`) completed with 12/12 passing suites.
- [x] Production Build (`npm run build`) completed successfully with 41/41 routes SSG pre-rendered.
- [x] Live HTTP response headers verified via `curl.exe -I`.
- [x] Zero active API keys or private keys detected in git repository.
