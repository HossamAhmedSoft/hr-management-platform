# 🧩 Google Ecosystem Integrations — Modular Services Architecture

## 1. Overview & Integration Philosophy
In addition to Google Sign-In, several Google Workspace and Cloud APIs provide valuable extensions for the **GDG on Campus NCTU HR Management Platform**.

In accordance with the **Principle of Least Privilege**, these integrations are designed to be **modular and decoupled from core sign-in**:
- Core login only requests `openid`, `email`, and `profile`.
- Workspace APIs use incremental authorization, service accounts, or dedicated webhooks.
- No access to private personal mailboxes or drives is ever required.

---

## 2. Recommended Modular Integrations

### 1. Google Calendar API (HR Events, Committee Meetings & Evaluations)
- **Use Case:** Automatically sync committee meetings, evaluation cycles, workshop schedules, and appeal hearings into members' Google Calendars.
- **Enabling API:** Enable **Google Calendar API** in Google Cloud Console.
- **Required Scopes:** `https://www.googleapis.com/auth/calendar.events` (Manage events only, not full calendar deletion).
- **Architecture:** 
  - Option A: Service Account with domain-wide delegation for official community calendars (`gdg-calendar@gdgnctu.com`).
  - Option B: Incremental OAuth consent triggered when a member clicks "Add Evaluation to Google Calendar".
- **Security Implications:** Never request `https://www.googleapis.com/auth/calendar` (full read/write access). Restrict strictly to event creation.

---

### 2. Google Sheets API (HR KPI Roster & Scorecard Export)
- **Use Case:** Export dynamic, real-time KPI scorecards, attendance rosters, and point evaluation sheets to Google Drive for faculty sponsors and leadership review.
- **Enabling API:** Enable **Google Sheets API** in Google Cloud Console.
- **Required Scopes:** `https://www.googleapis.com/auth/spreadsheets`
- **Architecture:** 
  - Server-side execution using a Google Cloud Service Account (`hr-exporter@gdg-nctu.iam.gserviceaccount.com`).
  - Generated Google Sheets are stored inside an official Shared Drive folder with restricted access.
- **Security Implications:** Prevents student data from being saved on unmonitored personal drives. All export events are logged in the immutable platform Audit Log (`AUTH_AUDIT_EXPORT`).

---

### 3. Google Drive API (Official Policy Documents & Certificate Templates)
- **Use Case:** Host and distribute read-only community HR policies, code of conduct PDF handbooks, and certificate asset templates.
- **Enabling API:** Enable **Google Drive API** in Google Cloud Console.
- **Required Scopes:** `https://www.googleapis.com/auth/drive.file` (Per-file access: allows managing only files created by the application itself).
- **Security Implications:** Guarantees the application cannot read, modify, or inspect any existing user files on Google Drive.

---

### 4. Google reCAPTCHA Enterprise / v3 (Abuse & Credential Stuffing Defense)
- **Use Case:** Protect `/api/auth/google/verify` and standard password endpoints against automated bot attacks, brute-force enumeration, and credential stuffing.
- **Enabling API:** Enable **reCAPTCHA Enterprise API** in Google Cloud Console.
- **Configuration:**
  - Create reCAPTCHA Key (Score-based, invisible).
  - Environment variable: `RECAPTCHA_SECRET_KEY` on backend, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` on frontend.
- **Execution:** Generates a risk score from 0.0 (bot) to 1.0 (human). Scores below 0.5 trigger progressive challenge or temporary lockout.

---

## 3. Summary of API Scopes Matrix

| Service | Target Workflow | Required Scope | Auth Method |
| :--- | :--- | :--- | :--- |
| **Google Sign-In** | User Authentication | `openid`, `email`, `profile` | OpenID Connect / GIS |
| **Calendar API** | HR Events & Meetings | `calendar.events` | Incremental OAuth / Service Account |
| **Sheets API** | KPI & Attendance Export | `spreadsheets` | Service Account |
| **Drive API** | Official Policy PDFs | `drive.file` | Service Account |
| **reCAPTCHA** | Bot & Stuffing Defense | N/A (Server assessment API) | API Key / Assessment |
