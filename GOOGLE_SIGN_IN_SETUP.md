# 🌐 Production Google Cloud Setup & Google Sign-In Integration Guide

## 1. Executive Summary
This document provides complete, step-by-step instructions for configuring **Google Identity Services (GIS)** and **OpenID Connect / OAuth 2.0 with PKCE** for the **GDG on Campus NCTU HR Management Platform**.

The application uses an enterprise-grade dual authentication flow:
1. **Google Identity Services (GIS) / One-Tap & Credential API:** Direct browser-based ID token delivery verified cryptographically on the server via `POST /api/auth/google/verify`.
2. **Server-Side Authorization Code Flow with PKCE & CSRF State:** Standard OpenID Connect redirect flow via `/api/auth/google/oauth` and `/api/auth/google/callback` with cryptographically signed state cookies and S256 code challenge.

---

## 2. Google Cloud Console Configuration Steps

### Step 1: Create or Select Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, click the project dropdown and select **New Project**.
3. Set **Project Name** to: `GDG-NCTU-HR-Platform`.
4. Select your Organization or Billing Account (if applicable) and click **Create**.

### Step 2: Configure the OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **User Type**:
   - **Internal:** Recommended if restricted exclusively to your Google Workspace organization (`@gdgnctu.com`). Users outside the domain cannot log in.
   - **External:** Required if allowing students, community attendees, or external contributors to sign in.
3. Click **Create** and complete App Information:
   - **App name:** `GDG on Campus NCTU Portal`
   - **User support email:** Select your administrator email (e.g., `admin@gdgnctu.com`).
   - **App logo:** Upload the official GDG on Campus NCTU logo (120x120px PNG).
   - **Application home page:** `https://your-production-domain.com` (or `http://localhost:3000` for development).
   - **Privacy Policy link:** `https://your-production-domain.com/ar/policy`.
   - **Authorized domains:** Add `gdgnctu.com` (and your production domain).
   - **Developer contact information:** `admin@gdgnctu.com`.
4. Click **Save and Continue**.

### Step 3: Define Minimal Scopes (Principle of Least Privilege)
Click **Add or Remove Scopes** and select strictly the basic OpenID Connect identity scopes:
- `openid` (Authenticate user identity)
- `.../auth/userinfo.email` (View email address and verification status)
- `.../auth/userinfo.profile` (View basic profile: name and avatar picture)

> ⚠️ **Security Mandate:** Do **NOT** request Gmail, Google Drive, or Calendar scopes on the login consent screen. Keep basic sign-in clean and fast. Additional Google APIs must be requested incrementally only when specific features require them.

### Step 4: Configure Test Users (If in External 'Testing' status)
If your app status is **Testing**, add the Google emails of developers and HR leads:
- `hossam.admin@gdgnctu.com`
- `your-email@gmail.com`

### Step 5: Create OAuth 2.0 Client ID Credentials
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Choose **Application type**: `Web application`.
4. Name: `GDG NCTU HR Web Client`.
5. Configure **Authorized JavaScript origins**:
   - Development: `http://localhost:3000`
   - Production: `https://your-production-domain.com`
6. Configure **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://your-production-domain.com/api/auth/google/callback`
7. Click **Create**.
8. A modal will display your **Client ID** and **Client Secret**. Copy both values securely.

---

## 3. Environment Configuration

Add the generated credentials to `.env.local` (for development) and your production secrets manager (Vercel, Railway, AWS):

```bash
# Google Cloud OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

# Cryptographic Session HMAC Secret (Min 32 characters)
SESSION_SECRET=gdg_nctu_session_hmac_secret_2026_enterprise_ultra_secure
```

> [!CAUTION]
> Never expose `GOOGLE_CLIENT_SECRET` in public repository files, client-side bundles, or browser cookies. Only `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is exposed to the frontend.

---

## 4. Architectural Verification Matrix

| Flow | Entry Point | Protocol | Server Validation | Session Established |
| :--- | :--- | :--- | :--- | :--- |
| **GIS Credential** | Login Page Button / One-Tap | ID Token (JWT) | Cryptographic signature via Google JWKS, audience check, exp check, email verification | Signed HTTP cookies + Client state |
| **Server OAuth PKCE** | `/api/auth/google/oauth` | OIDC Authorization Code + PKCE | S256 code challenge, HMAC state token validation, server-to-server token exchange | Signed HTTP cookies + Redirect |

---

## 5. Development Demo Mode
When `GOOGLE_CLIENT_ID` is empty during initial setup:
1. The login screen displays an **Info Modal** with copy-paste environment variables.
2. An instant **Simulate Google Auth Now** button allows executing the full token verification, account linking, and session issuance pipeline using a test token.
