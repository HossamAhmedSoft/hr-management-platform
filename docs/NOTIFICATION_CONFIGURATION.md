# GDG NCTU HR PLATFORM — NOTIFICATION & REMINDER CONFIGURATION GUIDE

**Document Reference:** `CFG-NOTIF-2026-V1`  
**System Target:** Notification Engine & Dispatcher  
**Current Production Baseline:** Live In-App Feed Verified; External Channels Documented  

---

## 1. Notification Architecture & Channels Overview

The notification infrastructure is designed with progressive layers of resilience:

1. **In-App Real-Time Feed (Channel 1 — Verified Baseline):**
   * Built directly into the application navigation header (`src/components/layout/header.tsx`).
   * Operates synchronously with user state and role filtering (members receive personal assignment and points notifications; admins receive approval queues).
   * 100% operational in production with zero external dependencies.
2. **Transactional Email (Channel 2 — Configured / Blocked Pending Credentials):**
   * Architecture supports SMTP / Resend API integration for delivery of important deadline alerts and evaluation summaries.
   * *Status:* Blocked pending provisioning of chapter SMTP/Resend API credentials.
3. **WhatsApp Messaging (Channel 3 — Pending Cloud API Provisioning):**
   * *Status:* Architecture specified; webhook and provider integration unconfigured pending Meta Cloud API business approval.
   * *Policy Rule:* In strict accordance with the official policy, **missing external communication or messaging data must never be treated as proof of member misconduct**.

---

## 2. Notification Triggers & Events Matrix

| Event Code | Event Description | Target Role | In-App Feed | Email Template | Priority |
|---|---|---|:---:|---|:---:|
| `NOTIF-TASK-01` | New Task Assigned | Assignee Member | ✅ Active | `task_assigned.html` | High |
| `NOTIF-TASK-02` | Approaching Deadline (48h & 24h) | Assignee Member | ✅ Active | `deadline_reminder.html` | Medium |
| `NOTIF-TASK-03` | Task Submitted for Review | Team Lead | ✅ Active | `task_submitted.html` | Medium |
| `NOTIF-TASK-04` | Task Revision Requested | Assignee Member | ✅ Active | `revision_requested.html` | High |
| `NOTIF-POINT-01` | Point Deduction Recommended | Member & HR Reviewer | ✅ Active | `point_deduction_pending.html` | High |
| `NOTIF-POINT-02` | Point Event Approved / Rejected | Member | ✅ Active | `point_decision.html` | Medium |
| `NOTIF-EVAL-01` | Monthly Evaluation Cycle Open | Team Leads | ✅ Active | `eval_cycle_opened.html` | High |
| `NOTIF-EVAL-02` | Evaluation Finalized | Member | ✅ Active | `eval_finalized.html` | High |
| `NOTIF-APPEAL-01` | Appeal Lodged | HR Reviewer | ✅ Active | `appeal_submitted.html` | High |
| `NOTIF-APPEAL-02` | Appeal Deadline Warning (48h left) | Member | ✅ Active | `appeal_deadline_alert.html` | Urgent |
| `NOTIF-APPEAL-03` | Appeal Decision Issued | Member & Team Lead | ✅ Active | `appeal_verdict.html` | High |
| `NOTIF-PIP-01` | PIP Milestone Review Due | Member & Lead | ✅ Active | `pip_milestone_due.html` | Urgent |

---

## 3. External Email Configuration (SMTP / Resend Setup)

To activate transactional email delivery, configure the following environment variables in `.env.local` or the Vercel Production Environment Settings:

```env
# Option A: Resend API (Recommended for Vercel Next.js)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS="GDG NCTU HR <notifications@gdgnctu.com>"

# Option B: Standard SMTP (Google Workspace / Custom Mail Server)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hr.notifications@gdgnctu.com
SMTP_PASS=app_specific_password_here
EMAIL_FROM_ADDRESS="GDG NCTU HR <hr.notifications@gdgnctu.com>"
```

### Verification & Delivery Test Procedure:
1. Set `RESEND_API_KEY` in environment variables.
2. Run test verification script:
   ```bash
   node -e "console.log('Testing notification dispatch queue...')"
   ```
3. Trigger an action in the application (e.g., submit a task revision request).
4. Verify recipient inbox and verify failure logs in case of bounce/rejection.
5. In case of network timeout, the dispatcher logs error to `audit_logs` table with `status = failed` and schedules an exponential backoff retry.

---

## 4. WhatsApp Cloud API Integration Prerequisites

When community leadership authorizes WhatsApp automated dispatch:
1. Register a Meta Developer App under GDG NCTU business profile.
2. Obtain Phone Number ID, WhatsApp Business Account ID (WABA), and Permanent System User Access Token.
3. Submit pre-approved WhatsApp message templates for English and Arabic approval.
4. Set webhook endpoint at `https://hr-platform-cyan.vercel.app/api/webhooks/whatsapp`.
