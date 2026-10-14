# 🛡️ Google OAuth 2.0 & OpenID Connect — Comprehensive Security Audit Report

## 1. Executive Summary & Audit Context
A full code-level application security audit and hardening was performed on the Google authentication subsystem of the **GDG on Campus NCTU HR Management Platform**.

The audit traced authentication flows end-to-end:
1. **OpenID Connect / OAuth 2.0 Authorization Code Flow with PKCE (`S256`) and Nonce**:
   - `GET /api/auth/google/oauth` -> Google Consent -> `GET /api/auth/google/callback`
2. **Google Identity Services (GIS) / One-Tap Credential Flow**:
   - Browser GIS SDK -> `POST /api/auth/google/verify` -> Session Issuance
3. **Account Linking, Privilege Protection & Session Management**:
   - RBAC integrity, unique provider identity mapping, and edge proxy HMAC cookie signatures.

---

## 2. Identified Vulnerabilities, Exploitation Scenarios & Applied Remediations

### Finding 1: Open Redirect Vulnerability via User-Controlled Post-Login Destination (SEC-OAUTH-01)
* **Severity:** High (CVSS 7.4)
* **Affected File:** [`src/app/api/auth/google/callback/route.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/app/api/auth/google/callback/route.ts), [`src/lib/google-auth.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/lib/google-auth.ts)
* **Vulnerability Description:** The callback route previously checked `destination = nextUrl.startsWith("/") ? nextUrl : ...`. In web browsers, protocol-relative URLs (such as `//attacker.com` or `/\attacker.com`) start with a slash `/` but are resolved by browsers as external absolute redirects (`http://attacker.com`), enabling credential-theft phishing.
* **Exploitation Scenario:** An attacker could craft a link:
  `http://localhost:3000/api/auth/google/oauth?next=%2F%2Fphishing-portal.com`
  After completing legitimate Google login, the victim would be redirected to `//phishing-portal.com` with session parameters.
* **Remediation Implemented:**
  - Implemented [`sanitizeRedirectPath()`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/lib/google-auth.ts#L84-L135).
  - Strictly rejects `//`, `/\`, `\/`, `\\`, CRLF injection, and URL schemes with colons (`:`).
  - Validates internal path structure against `^/[a-zA-Z0-9_\-\/\?=&%#]*$`.
  - Enforces locale prefixing (`/ar` or `/en`).

---

### Finding 2: Replay of OAuth State Tokens Across Sessions (SEC-OAUTH-02)
* **Severity:** Medium (CVSS 6.1)
* **Affected File:** [`src/lib/google-auth.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/lib/google-auth.ts), [`src/app/api/auth/google/callback/route.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/app/api/auth/google/callback/route.ts)
* **Vulnerability Description:** Although OAuth `state` was signed with HMAC-SHA256 and contained an expiration timestamp, it was stateless and not tracked as consumed. Within its 15-minute window, a state token could potentially be re-submitted or replayed.
* **Remediation Implemented:**
  - Implemented an in-memory TTL-bounded `consumedStates` store with automated cleanup.
  - Added [`verifyAndConsumeOAuthState()`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/lib/google-auth.ts#L484-L545), which atomically marks each `stateId` as consumed upon first verification and immediately rejects duplicate callback attempts with `REPLAYED_STATE`.

---

### Finding 3: Missing OpenID Connect Nonce Transaction Binding (SEC-OAUTH-03)
* **Severity:** Medium (CVSS 5.9)
* **Affected File:** [`src/lib/google-auth.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/lib/google-auth.ts), [`src/app/api/auth/google/oauth/route.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/app/api/auth/google/oauth/route.ts)
* **Vulnerability Description:** The authorization code flow did not transmit a cryptographic `nonce` to Google during authorization, meaning ID tokens were not bound to the specific client session.
* **Remediation Implemented:**
  - Added cryptographic `nonce` generation (16 random bytes hex) inside [`generateOAuthTransaction()`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/lib/google-auth.ts#L450-L482).
  - Nonce is embedded in the signed state token, saved in an HttpOnly cookie (`gdg_oauth_nonce`), and forwarded to Google in the authorization URL.
  - [`verifyGoogleIdToken()`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/lib/google-auth.ts#L137-L251) enforces that `payload.nonce === expectedNonce`, strictly rejecting mismatched or injected tokens.

---

### Finding 4: Silent Takeover Risk on Pre-Existing Privileged Accounts (SEC-OAUTH-04)
* **Severity:** High (CVSS 7.8)
* **Affected File:** [`src/lib/google-auth.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/lib/google-auth.ts#L330-L350)
* **Vulnerability Description:** If an existing administrative profile (`super_admin` or `hr_admin`) existed with an email address but had not yet linked Google, an external Google login with that email would automatically link the Google identity and gain immediate administrative access.
* **Remediation Implemented:**
  - Enforced strict Privileged Account Linking Policy:
    Unlinked administrative accounts (`super_admin`, `hr_admin`) **cannot be claimed automatically** through external Google Sign-In.
    Attempts return `ADMIN_LINK_REQUIRES_AUTH`: the administrator must first sign in with their password and link Google from within their authenticated session.
  - Standard `member` accounts with verified Google emails continue to link smoothly.

---

### Finding 5: Missing Origin & CSRF Checks on ID Token Verification Route (SEC-OAUTH-05)
* **Severity:** Medium (CVSS 5.3)
* **Affected File:** [`src/app/api/auth/google/verify/route.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/app/api/auth/google/verify/route.ts)
* **Vulnerability Description:** The `POST /api/auth/google/verify` endpoint lacked Cross-Origin Request checking, payload size enforcement, and rate limiting.
* **Remediation Implemented:**
  - **Origin / Host Validation:** Verifies that incoming `Origin` and `Host` headers match.
  - **Sec-Fetch-Site Enforcement:** Automatically rejects `sec-fetch-site: cross-site` requests with 403 Forbidden.
  - **IP Rate Limiting:** Enforced max 15 verification attempts per minute per IP.
  - **Payload Size Capping:** Strict 10KB request body size limit to prevent Denial-of-Service.
  - **ID Token Replay Protection:** Enforces SHA-256 single-use hashing for submitted ID tokens.

---

### Finding 6: Missing HttpOnly Flag on Sensitive Application Session Cookies (SEC-OAUTH-06)
* **Severity:** Medium (CVSS 5.4)
* **Affected File:** [`src/app/api/auth/google/callback/route.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/app/api/auth/google/callback/route.ts), [`src/app/api/auth/google/verify/route.ts`](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/src/app/api/auth/google/verify/route.ts)
* **Vulnerability Description:** `gdg_auth_token` and `gdg_session_sig` were previously set without the `HttpOnly` flag, making them readable by browser JavaScript.
* **Remediation Implemented:**
  - `gdg_auth_token` and `gdg_session_sig` are now set strictly with `httpOnly: true`, `sameSite: "lax"`, and `secure: isProd`.
  - Ephemeral OAuth transaction cookies (`gdg_oauth_verifier`, `gdg_oauth_state`, `gdg_oauth_nonce`) are also strictly `httpOnly: true`.

---

## 3. Verification & Compliance Matrix

| Vulnerability ID | Description | Severity | Status | Automated Test Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-OAUTH-01** | Open Redirect via `next` parameter | **High** | ✅ Fixed | Test Suite 1 (7 tests passed) |
| **SEC-OAUTH-02** | Replay of OAuth state tokens | **Medium** | ✅ Fixed | Test Suite 2 (Test 4 passed) |
| **SEC-OAUTH-03** | Missing OpenID Connect Nonce | **Medium** | ✅ Fixed | Test Suite 3 (Test 1 & 2 passed) |
| **SEC-OAUTH-04** | Privileged Account Silent Takeover | **High** | ✅ Fixed | Test Suite 4 (Test 1 passed) |
| **SEC-OAUTH-05** | CSRF / Origin lack on GIS verify | **Medium** | ✅ Fixed | Test Suite 3 (Test 4 passed) & Route checks |
| **SEC-OAUTH-06** | Missing HttpOnly on session cookies | **Medium** | ✅ Fixed | Test Suite 5 (Test 1 passed) & Route cookies |
