# GDG NCTU HR PLATFORM — HR USER GUIDE & OPERATIONAL HANDBOOK

**Target Audience:** HR Administrators, HR Reviewers, and Talent Management Officers  
**Platform URL:** `https://hr-platform-cyan.vercel.app`  
**System Roles Covered:** `super_admin`, `hr_admin`, `hr_reviewer`  

---

## 1. Getting Started & Authentication

1. **Accessing the Portal:**
   * Open your browser and navigate to `https://hr-platform-cyan.vercel.app/en/login` (or `/ar/login` for the Arabic interface).
   * Enter your authorized HR email address (e.g. `mariam.hassan@gdgnctu.com`) and your secure password.
2. **Dashboard Overview:**
   * Upon successful authentication, your executive dashboard displays chapter-wide operational KPIs:
     * Active Members Roster
     * Ongoing Tasks & Completion Rate
     * Pending Points Awaiting HR Review
     * Active PIPs & Grievance Appeals
   * The top navigation bar includes quick theme toggling (Light/Dark mode), language selection (English/العربية), and an active notification bell with live approval counters.

---

## 2. Managing Members & Committees (`/members`)

1. **Adding a New Member:**
   * Navigate to **Members** from the sidebar.
   * Click the **"Add Member"** button in the top right.
   * Fill in the mandatory fields:
     * Full Name (English)
     * Full Name (Arabic)
     * Academic/Chapter Email
     * Committee (Select from: Web, Flutter, UI/UX, Embedded, Cyber, PR, OR, Media, HR)
     * Assigned Role (Select `member`, `team_lead`, `hr_reviewer`, etc.)
   * Click **"Save Member"**. The profile is immediately created in the Supabase database.
2. **Editing or Transferring Members:**
   * Locate the member in the directory table using the search bar or committee filter.
   * Click on the member row to open their profile drawer.
   * Update their committee or role if transferring, and click **"Save Changes"**.
3. **Bulk Ingestion via CSV:**
   * Click **"Import CSV"** to upload member rosters. Ensure the file adheres to the schema documented in [member_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/member_import_template.csv).

---

## 3. Reviewing & Approving Point Events (`/points`)

1. **The Points Approval Queue:**
   * Navigate to **Points Ledger**.
   * Disciplinary deductions submitted by Team Leads automatically land in the **Pending Review** filter tab (`status = pending_review`).
2. **Evaluating Evidence:**
   * Click on the pending point event.
   * Inspect the provided evidence URL (e.g. meeting recording link, chat screenshot, GitHub PR).
   * Verify whether the member was notified and given an opportunity to explain their circumstances.
3. **Issuing an Approval Decision:**
   * Click **"Approve Event"** to confirm the deduction. The points will officially decrement the member's net balance and log an entry in the audit trail.
   * Click **"Reject Event"** if the evidence is insufficient or if the delay was justified. Enter a brief rationale.

---

## 4. Monthly Performance Evaluations (`/evaluations`)

1. **Opening the Evaluation Cycle:**
   * On the 25th of each month, verify the active period in the evaluation cycle selector.
2. **Auditing Team Lead Ratings:**
   * Review submitted draft evaluations from Team Leads across committees.
   * Ensure grading consistency and check that toggled **N/A** criteria have appropriate explanations.
3. **Finalizing Evaluations:**
   * Click **"Finalize Evaluation"**.
   * Once finalized, the score locks permanently and the member is notified of their final score and performance band (Exemplary, Strong, Needs Improvement, Critical).
4. **Authorizing Score Amendments:**
   * If an objective mathematical error is detected post-finalization, only an authorized HR Admin can amend the record. The amendment requires a mandatory justification note, which is permanently appended to the audit log.

---

## 5. Managing Escalations, PIPs & Incidents (`/incidents`)

1. **Initiating a Performance Improvement Plan (PIP):**
   * If a member enters the Warning Zone or exhibits persistent attendance issues, navigate to **Incidents & Escalations**.
   * Click **"Log Incident"** and select **Level 2: Performance Improvement Plan (PIP)**.
   * Record the specific improvement milestones, target delivery date (typically 3 weeks), and assigned HR mentor.
2. **Monitoring & Closing PIPs:**
   * Conduct weekly milestone check-ins with the member and their Team Lead.
   * Document check-in outcomes. At the end of the 3 weeks, update the status to **Resolved (Successful PIP)** or escalate to **Level 3: Team Review**.

---

## 6. Grievance Appeals Adjudication (`/appeals`)

1. **Reviewing Lodged Appeals:**
   * Navigate to **Appeals**.
   * Members have exactly 7 Egyptian working days from formal notification to challenge a deduction or evaluation.
2. **Assigning an Impartial Reviewer:**
   * The assigned HR Reviewer must be completely independent (i.e., not the person who submitted or previously approved the disputed deduction).
3. **Issuing a Verdict:**
   * Click on the appeal case, examine the counter-evidence provided by the member, and record a written verdict:
     * **Upheld (Deduction Revoked):** The system automatically refunds the deducted points to the member's ledger.
     * **Adjusted:** Modifies the point value to a lesser penalty.
     * **Dismissed:** Upholds the original disciplinary decision with detailed feedback.

---

## 7. Generating Executive Reports & Analytics (`/reports`)

1. **Monthly Chapter Summary:**
   * Navigate to **Reports & Analytics**.
   * Review monthly task delivery percentages, committee health distributions, and net points histograms.
2. **Exporting Confidential Data:**
   * Click **"Export CSV"** to download comprehensive spreadsheets for leadership board meetings.
