# 🚀 Production Deployment Security & Verification Checklist

## 1. Secrets & Environment Isolation
- [x] **No Secrets in Git:** `.env.local` is ignored via `.gitignore` (`.env*`).
- [x] **Client Secret Protection:** `GOOGLE_CLIENT_SECRET` is never exposed via `NEXT_PUBLIC_*` or sent to the browser.
- [x] **High-Entropy HMAC Secret:** `SESSION_SECRET` is at least 32 characters of high cryptographic entropy.
- [x] **Production Domain Binding:** `NEXT_PUBLIC_APP_URL` and `GOOGLE_REDIRECT_URI` use production `https://` URLs in production.

---

## 2. OAuth 2.0 & OpenID Connect Controls
- [x] **PKCE Enforced:** Authorization code flow uses S256 code challenge with 32-byte code verifiers.
- [x] **Nonce Binding:** ID tokens are verified against the initiating transaction nonce.
- [x] **State Replay Defense:** OAuth states are signed with HMAC-SHA256, expired after 15 minutes, and consumed single-use.
- [x] **Open Redirect Defense:** Post-login destinations are strictly validated by `sanitizeRedirectPath()`.
- [x] **Issuer & Audience Validation:** Tokens must be issued by `accounts.google.com` with matching Client ID.

---

## 3. Account Linking & Authorization
- [x] **Privileged Account Defense:** Unlinked `super_admin` and `hr_admin` accounts cannot be auto-claimed via Google Sign-In.
- [x] **Zero Privilege Escalation:** New Google registrations strictly receive the safe default `member` role.
- [x] **Status Enforcement:** Suspended, archived, and inactive accounts are blocked from authentication.
- [x] **Immutable External Key:** User identities map to Google's immutable `sub` claim.

---

## 4. Application Sessions & Cookies
- [x] **HttpOnly Flags:** Sensitive cookies (`gdg_auth_token`, `gdg_session_sig`, `gdg_oauth_verifier`, `gdg_oauth_state`, `gdg_oauth_nonce`) are `HttpOnly: true`.
- [x] **SameSite & Secure:** Cookies use `SameSite: Lax` and `Secure: true` in production.
- [x] **Session Signatures:** Sessions are signed and verified against unauthorized role alteration.
- [x] **Clean Logout:** Logging out purges both browser storage and all cookies.

---

## 5. Rollback & Emergency Plan
- In the event of a Google Cloud outage, standard email/password authentication remains fully operational.
- If Google credentials need emergency revocation, regenerate `GOOGLE_CLIENT_SECRET` in Google Cloud Console and redeploy.
