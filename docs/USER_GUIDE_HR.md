# GDG on Campus NCTU — HR Administrator & Reviewer User Guide

**Target Roles:** `super_admin`, `hr_admin`, `hr_reviewer`  
**Application Endpoint:** `https://hr-platform-cyan.vercel.app`  
**Reference Document:** `docs/USER_GUIDE_HR.md` (See also [HR_USER_GUIDE.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/HR_USER_GUIDE.md))  

---

## 1. Executive Operations & Daily Workflow

As an HR Officer or Reviewer for GDG NCTU, you oversee community health, ensure policy compliance, and facilitate member growth.

### Daily / Weekly Cadence:
1. **Login:** Navigate to `/login` with your authorized credentials.
2. **Review Notification Bell:** Inspect pending approvals (disciplinary deduction recommendations, submitted tasks, open appeals).
3. **Points Queue (`/points`):** Review evidence submitted by Team Leads. Verify that members received prior communication before approving deductions.
4. **Member Directory (`/members`):** Process recruit onboarding, update committee assignments, or handle inter-team transfers.
5. **Incidents & Escalations (`/incidents`):** Monitor Level 2 PIP progress and track follow-up dates.

---

## 2. Monthly Review & Finalization Workflow

1. **Cycle Window (25th to End of Month):**
   * Review submitted draft evaluations from Team Leads across all 9 committees at `/evaluations`.
   * Check that proportional N/A toggles have valid explanatory notes.
2. **Finalization:**
   * Click **"Finalize Evaluation"**. Once finalized, records lock and are immediately made available to the member.
3. **Score Amendments:**
   * Consequential post-finalization corrections require Super Admin authority and an explicit audit justification note.

---

## 3. Due Process & Appeals Handling (`/appeals`)

* Members have **7 Egyptian working days** to submit a written appeal.
* Assign an independent HR Reviewer who was **not** involved in the original decision.
* Verdict choices:
  * **Upheld:** Disputed deduction is revoked and points are refunded automatically to the member's balance.
  * **Adjusted:** Penalty modified to an appropriate lesser deduction.
  * **Dismissed:** Original decision upheld with detailed constructive feedback.
