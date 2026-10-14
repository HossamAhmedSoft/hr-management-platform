# GDG NCTU HR Management Platform — Security Testing & Verification Guide

This document provides exhaustive, repeatable instructions for executing the security verification suites, running automated penetration testing checks, and conducting manual validation of all hardened controls.

---

## 1. Quick Automated Test Execution

### 1.1 Complete Security & Hardening Suite (12 Suites, 100% Pass)
Executes the comprehensive automated security test suite covering RBAC, password hashing, session lifecycle, 2FA token engine, brute-force lockout, CSV sanitization, URL protocol neutralization, and timing-safe authentication:

```bash
npx -y tsx src/lib/tests/comprehensive-security-audit.test.ts
```

**Expected Result:**
```
=================================================================
🛡️ ALL 12 ENTERPRISE SECURITY & HARDENING SUITES PASSED (100%)!
=================================================================
```

### 1.2 Multi-Role Sync & Data Isolation Suite
Validates peer isolation, cross-lookup synchronization, unread counters, and points ledger calculations:

```bash
node src/lib/tests/admin-member-sync-runner.mjs
```

**Expected Result:**
```
=================================================
TOTAL PASSED: 7 / 7
=================================================
```

### 1.3 Static Type & Code Integrity Check
Ensures zero type safety regressions or invalid spreads across all TypeScript modules:

```bash
npx tsc --noEmit
```

**Expected Result:** Exit code 0, 0 errors.

### 1.4 Production Build Verification
Verifies that Turbopack and Next.js successfully bundle and prerender all static routes with active proxy middleware:

```bash
npm run build
```

**Expected Result:** Exit code 0, 41/41 routes prerendered, proxy middleware compiled.

### 1.5 Google Identity & OpenID Connect Security Test Suite (11 Tests, 100% Pass)
Executes the Google OAuth 2.0 & GIS token verification suite covering cryptographic signature validation, audience check, expiration check, unverified email rejection, account linking, privilege escalation defense, CSRF state HMAC, and PKCE entropy:

```bash
npx tsx src/lib/tests/google-auth-security.test.ts
```

**Expected Result:**
```
============================================================
🏁 TEST EXECUTION COMPLETE: 11/11 TESTS PASSED
============================================================
```

---

## 2. Manual Penetration Testing & Evidence Reproduction

### 2.1 Test Case: Broken Access Control (BAC) Route Protection
- **Target Route:** `/ar/audit-log` (Restricted to Super Admin & HR Admin)
- **Attack Scenario:** An authenticated regular member attempts to view the immutable security audit log.

**Reproduction Command:**
```bash
curl.exe -I --cookie "gdg_session_user=usr_member_1; gdg_session_role=member" http://localhost:3000/ar/audit-log
```

**Expected vs Actual Response:**
```http
HTTP/1.1 307 Temporary Redirect
location: /ar/forbidden
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```
- **Evaluation:** PASS. The proxy middleware detects that `canAccessRoute('member', '/audit-log')` is false and redirects the attacker to the 403 Forbidden page.

---

### 2.2 Test Case: Session Role Tampering (SEC-08)
- **Target Route:** `/ar/members`
- **Attack Scenario:** An attacker manually edits their client cookie `gdg_session_role` from `member` to `super_admin` in browser devtools.

**Reproduction Command:**
```bash
# Legitimate user 'usr_member_1' presents forged 'super_admin' role with illegitimate or missing signature
curl.exe -I --cookie "gdg_session_user=usr_member_1; gdg_session_role=super_admin; gdg_auth_token=tok_test; gdg_session_sig=invalid_sig" http://localhost:3000/ar/members
```

**Expected vs Actual Response:**
```http
HTTP/1.1 307 Temporary Redirect
location: /ar/login?reason=tampered
set-cookie: gdg_session_user=; Max-Age=0
set-cookie: gdg_session_role=; Max-Age=0
set-cookie: gdg_session_sig=; Max-Age=0
```
- **Evaluation:** PASS. HMAC-SHA256 signature verification fails; the tampered cookies are deleted, and the user is redirected to login.

---

### 2.3 Test Case: Scheduled Cron Authentication & Timing Attacks (SEC-03)
- **Target Route:** `/api/reminders/process`
- **Attack Scenario 1:** Unauthenticated external invocation in production mode.

**Reproduction Command:**
```bash
curl.exe -i http://localhost:3000/api/reminders/process
```

**Response:**
```json
HTTP/1.1 500 Internal Server Error
{"error":"Server misconfiguration: CRON_SECRET is required in production mode."}
```

- **Attack Scenario 2:** Invocation with incorrect bearer token.

**Reproduction Command:**
```bash
curl.exe -i -H "Authorization: Bearer wrong_token" http://localhost:3000/api/reminders/process
```

**Response:**
```json
HTTP/1.1 401 Unauthorized
{"error":"Unauthorized: Invalid or missing bearer token."}
```
- **Evaluation:** PASS. Constant-time byte buffer comparison (`crypto.timingSafeEqual`) ensures resilience against side-channel timing attacks.

---

### 2.4 Test Case: HTTP Security Headers & Content Security Policy (SEC-04)
- **Target Route:** `http://localhost:3000/ar`

**Reproduction Command:**
```bash
curl.exe -I http://localhost:3000/ar
```

**Verified Response Headers:**
```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- **Evaluation:** PASS. All critical modern web defense headers are present on every route.

---

### 2.5 Test Case: CSV Formula Injection Defense (SEC-05)
- **Target Utility:** `sanitizeCSVCell()`

**Test Matrix:**
| Input String | Sanitized Output | Protection Reason |
| :--- | :--- | :--- |
| `=cmd\|' /C calc'!A0` | `'=cmd\|' /C calc'!A0` | Prefix `'` forces spreadsheet text mode |
| `+12345` | `'+12345` | Prevents arithmetic evaluation |
| `-2+5` | `'-2+5` | Prevents arithmetic evaluation |
| `@SUM(1,2)` | `'@SUM(1,2)` | Prevents formula execution |
| `\tDDE(...)` | `'\tDDE(...)` | Neutralizes tab-prefixed DDE execution |
| `%USERPROFILE%` | `'%USERPROFILE%` | Neutralizes environment variable expansion |
| `Hossam Ahmed` | `Hossam Ahmed` | Safe strings preserved without `'` prefix |
| `John "Lead" Doe` | `John ""Lead"" Doe` | Internal double quotes escaped |

---

### 2.6 Test Case: Malicious URL Protocol Neutralization (SEC-06)
- **Target Utility:** `sanitizeUrl()`

**Test Matrix:**
| Input URL | Output | Status |
| :--- | :--- | :--- |
| `javascript:alert(document.cookie)` | `""` | Neutralized |
| `JAVASCRIPT:alert(1)` | `""` | Neutralized (Case-insensitive) |
| `data:text/html,<script>alert(1)</script>` | `""` | Neutralized |
| `vbscript:msgbox(1)` | `""` | Neutralized |
| `//evil-phishing.com/login` | `""` | Protocol-relative domain redirect blocked |
| `https://drive.google.com/doc.pdf` | `https://drive.google.com/doc.pdf` | Allowed (HTTPS) |
| `/dashboard/tasks` | `/dashboard/tasks` | Allowed (Safe relative path) |
