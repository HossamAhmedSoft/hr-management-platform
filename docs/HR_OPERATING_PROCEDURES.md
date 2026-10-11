# GDG NCTU HR PLATFORM — STANDARD OPERATING PROCEDURES (SOP)

**Document Code:** `SOP-HR-2026-V1`  
**Applicability:** GDG NCTU Executive Board, HR Team, Team Leads, and Chapter Members  
**System Baseline:** GDG NCTU HR Management Platform (`https://hr-platform-cyan.vercel.app`)  
**Effective Date:** Season 2026/2027 Pilot Launch  

---

## 1. Scope and Guiding Philosophy

This standard operating procedures manual outlines the step-by-step responsibilities of human actors using the platform.

The system is designed around **fairness, objective evidence, transparent accountability, and member growth**. Technology automates calculations, reminders, and access controls, but **never replaces human empathy, mentorship, and sound leadership judgment**.

---

## 2. Standard Workflows

### SOP-A: Member Onboarding Workflow
**Objective:** Seamlessly integrate new recruits and existing members into their respective committees with zero ambiguity regarding expectations and privacy.

1. **Member Record Creation:**
   * HR Administrator navigates to `/members` and clicks **"Add Member"** or uses the bulk CSV upload tool.
   * Required minimum fields: Full Name, Academic Email, Committee, Assigned Role (`member`), and Active Status (`active`).
   * *Privacy Rule:* No excessive personal identifiers (national IDs, home addresses, sensitive demographic data) are ever collected.
2. **Team & Lead Assignment:**
   * Assign the member to their specific committee (e.g., Web, PR, HR, Media).
   * Designate the primary Team Lead responsible for task allocation and monthly mentoring.
3. **Role-Based Portal Access:**
   * System creates account credentials. An invitation/temporary password is provided securely.
   * Member logs in at `/login` and is greeted with member-scoped dashboard views (seeing only their tasks, their personal points balance, and their evaluations).
4. **Policy Orientation & Acknowledgment:**
   * Within the first 48 hours of onboarding, the member must review the published policy at `/policy`.
   * The Team Lead hosts an introductory orientation session explaining the points system, deliverables, 7-day appeal rights, and support channels.
5. **Onboarding Status Completion:**
   * HR marks `onboarding_status = completed` in the member directory.

---

### SOP-B: Monthly Task Planning Workflow
**Objective:** Establish unambiguous, achievable monthly deliverables before work begins.

1. **Cycle Confirmation (Day 1 of Each Month):**
   * HR Admin verifies the active evaluation cycle at `/evaluations` (e.g., October 2026 Cycle).
   * HR verifies roster changes, active leaves of absence, or committee transfers.
2. **Task Creation & Specification:**
   * Team Leads navigate to `/tasks` and click **"Create Task"**.
   * Team Leads must document:
     * **Title & Description:** Clear operational scope.
     * **Acceptance Criteria:** Measurable indicators of done (e.g., GitHub PR merged, Figma deck reviewed, sponsor packet delivered).
     * **Official Deadline:** Specific date and time in local Cairo time (UTC+2 / UTC+3).
     * **Assignees:** Designated members accountable for delivery.
3. **Advance Communication Principle:**
   * *Crucial Rule:* Tasks and performance criteria must be communicated to the member **before** the work begins. Retrospective task assignments or surprise expectations are strictly prohibited.
4. **Unavailable / On-Leave Members:**
   * Members requesting academic or personal leave must notify HR at least 5 days in advance.
   * On-leave members are marked as `on_leave` in the directory, preventing task assignments and ensuring monthly evaluations reflect excused absence without penalty.

---

### SOP-C: Task Follow-up & Progress Monitoring
**Objective:** Proactively support members during task execution, resolving blockers before deadlines lapse.

1. **Mid-Week Progress Check:**
   * Team Leads monitor task status columns (`assigned`, `in_progress`, `submitted`, `completed`) on the Kanban board at `/tasks`.
2. **Blocker & Delay Notification:**
   * If a member encounters a technical blocker or academic schedule conflict, they must notify their Lead and request a deadline adjustment via the platform task comments/messaging.
   * *Fairness Rule:* A missed deadline must **never** be treated as an automatic disciplinary violation without examining the root cause and whether assistance was requested.
3. **Deliverable Review & Quality Verification:**
   * When the member submits work, the task transitions to `submitted`.
   * Team Lead reviews the deliverable against the stated acceptance criteria:
     * If satisfactory: Lead marks task as `completed` and considers submitting a positive point recommendation.
     * If minor revisions required: Lead returns task with constructive feedback to `in_progress`.
     * If abandoned without explanation: Lead initiates Point Management or Escalation procedures.

---

### SOP-D: Point-Event Management Workflow
**Objective:** Maintain an accurate, objective, and fair ledger of positive contributions and disciplinary deductions.

1. **Positive Point Submission:**
   * Team Lead or HR Admin navigates to `/points` and clicks **"Record Point Event"**.
   * Selects member, selects recognized category (e.g. `core_task`, `initiative_innovation`, `documentation`), enters evidence URL or description.
   * Point balance updates immediately; cap usage is tracked against the member's monthly cap limit.
2. **Negative Deduction Recommendation:**
   * *Requirement:* Negative deductions require documented evidence of a communicated rule violation (e.g., unexcused meeting absence, unexplained deadline failure after reminder).
   * Recommending Lead submits event with `direction = negative`, reason, and evidence link.
   * The event enters status `pending_review`.
3. **Member Notification & Opportunity to Explain:**
   * System notifies member of pending recommendation.
   * Member has an opportunity to provide context to HR before final determination.
4. **Independent HR Approval:**
   * An authorized `hr_reviewer`, `hr_admin`, or `super_admin` reviews the recommendation.
   * *Rule:* Team Leads cannot approve negative deductions for their own members.
   * HR Reviewer either approves, rejects, or returns the request for further evidence.
   * Only upon approval are points deducted from the member's net ledger.
5. **Serious Incident Routing:**
   * Suspected code of conduct breaches or interpersonal harassment must be selected under `serious_violation` (0 numeric deduction) and routed directly to the Confidential Incident Investigation workflow.

---

### SOP-E: Monthly Performance Review Workflow
**Objective:** Provide structured, constructive 360° feedback and evaluate overall competency.

1. **Cycle Opening (25th of Each Month):**
   * HR opens the monthly evaluation window at `/evaluations`.
2. **Self-Assessment (Optional / Recommended):**
   * Member submits personal reflections on tasks achieved and areas for growth.
3. **Team Lead Scoring & Evidence:**
   * Team Lead accesses `/evaluations` and grades assigned committee members across the 6 standard criteria:
     * Task Completion (30%)
     * Quality & Standards (25%)
     * Reliability & Commitment (15%)
     * Knowledge Sharing (10%)
     * Documentation (10%)
     * Growth & Initiative (10%)
   * *Proportional N/A Rule:* If a category does not apply (e.g. member was assigned solo research with no opportunity for Knowledge Sharing), Lead toggles **N/A**. The system automatically normalizes remaining weights to 100%.
4. **HR Review & Finalization:**
   * HR Reviewer audits evaluations for grading consistency across tracks.
   * HR finalizes the review (`status = finalized`).
5. **Feedback Delivery & 1-on-1 Sessions:**
   * Member views finalized score and performance band (Exemplary, Strong, Needs Improvement, Critical).
   * Team Lead or HR Officer conducts a 15-minute 1-on-1 feedback session to discuss development opportunities, recorded at `/feedback`.

---

### SOP-F: Progressive Escalation & PIP Workflow
**Objective:** Support struggling members through structured intervention before any punitive action is taken.

The organization operates a strict 4-level progressive escalation ladder:
1. **Level 1 — Friendly Informal Warning:**
   * Trigger: Minor attendance dip or first missed update.
   * Action: Private conversational check-in by Team Lead. Focus is purely on offering help and adjusting workload. No permanent disciplinary record.
2. **Level 2 — Official Warning & Performance Improvement Plan (PIP):**
   * Trigger: Repeated missed deadlines or net point balance dipping into Warning Zone (-1 to -5 pts).
   * Action: HR convenes a PIP alignment meeting. Formal 3-week plan documented at `/incidents` with specific deliverables, assigned mentor, and review checkpoint.
3. **Level 3 — Team Review & Leadership Consultation:**
   * Trigger: Failure to meet PIP milestones or net balance reaching Red Zone (-6 to -10 pts).
   * Action: Multi-party review with Track Lead, HR Lead, and Member. Options include committee transfer, role restructuring, or sabbatical.
4. **Level 4 — Separation / Revocation of Membership:**
   * Trigger: Unresolved Level 3 review or unrectified severe conduct violation.
   * Action: Requires unanimous approval from Chapter Lead and HR Lead with complete documented evidentiary trail.

---

### SOP-G: Grievance & Appeal Workflow
**Objective:** Provide an impartial judicial mechanism for members to challenge deductions or evaluations.

1. **Filing an Appeal:**
   * Member navigates to `/appeals` and selects the disputed point event or evaluation.
   * Member enters their detailed reasoning, counter-evidence (e.g., chat screenshots, medical excuses, commit logs), and submits.
2. **7 Working Days Calculation:**
   * The platform calculates the deadline: exactly 7 working days from formal notification, skipping Egyptian weekends (Fridays and Saturdays).
3. **Neutral Reviewer Assignment:**
   * The appeal is assigned to an HR Reviewer who was **not** involved in the original decision or grading.
4. **Investigation & Decision:**
   * Reviewer examines evidence, interviews the parties if necessary, and records a written rationale.
   * Outcome options: **Upheld (Deduction cancelled)**, **Adjusted (Modified value)**, or **Dismissed (Upheld original decision)**.
5. **Member Notification & Audit Preservation:**
   * Member is notified. The ledger automatically adjusts if points were refunded. The original record and full appeal decision trail are permanently archived.
   * *Protection Rule:* Good-faith appeals can **never** result in retaliatory deductions or adverse consequences.

---

### SOP-H: End-of-Month Closure & Rollover Workflow
**Objective:** Cleanly finalize monthly accounts, reconcile records, and prepare for the next cycle.

1. **Pending Queue Audit (Last Day of Month, 23:59 Cairo Time):**
   * HR Admin verifies that:
     * All pending point events have been approved or rejected.
     * All submitted tasks have been reviewed.
     * All monthly evaluations have been finalized.
     * Open appeals are actively triaged.
2. **Reconciliation & Unresolved Records:**
   * *Rule:* Never automatically finalize incomplete evaluations with missing scores.
   * Any member with missing ratings must be reviewed by the HR Lead.
3. **Archive & Roll Over:**
   * The monthly cycle is marked `closed`.
   * Monthly point caps reset to 0 for the new month; cumulative season points are preserved in the historical ledger.
4. **Leadership Reporting:**
   * HR generates the Monthly Chapter Performance Summary from `/reports` and presents key operational indicators to the Executive Board.
