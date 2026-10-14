# ⚙️ Google Cloud OAuth 2.0 & OpenID Connect — Setup & Credential Management

## 1. Google Cloud Console Client Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project: `GDG-NCTU-HR-Platform`.
3. Navigate to **APIs & Services** > **Credentials**.
4. Create an **OAuth 2.0 Client ID** of type **Web Application**.
5. Set the authorized origins and redirect URIs exactly as follows:

### Authorized JavaScript Origins
* **Local Development:**
  ```
  http://localhost:3000
  ```
* **Production Deployment:**
  ```
  https://your-production-domain.com
  ```

### Authorized Redirect URIs
* **Local Development:**
  ```
  http://localhost:3000/api/auth/google/callback
  ```
* **Production Deployment:**
  ```
  https://your-production-domain.com/api/auth/google/callback
  ```

---

## 2. Environment Variables Configuration

In `.env.local` (local) or production secrets manager (Vercel, Railway, AWS):

```env
# Google Cloud OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Core Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=gdg_nctu_session_hmac_secret_2026_enterprise_ultra_secure
```

---

## 3. Credential Rotation Procedures

If `GOOGLE_CLIENT_SECRET` is ever exposed or needs scheduled rotation:
1. Go to Google Cloud Console > **APIs & Services** > **Credentials**.
2. Click your OAuth 2.0 Web Client.
3. Under **Client Secret**, click **Add secret** to generate a secondary client secret.
4. Update `GOOGLE_CLIENT_SECRET` in your production environment settings and redeploy.
5. Verify successful sign-in with the new secret.
6. Return to Google Cloud Console and delete the old compromised client secret.
