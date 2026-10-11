# GDG NCTU HR PLATFORM — TEAM LEAD OPERATIONAL GUIDE

**Target Audience:** Committee Leads (Web, Flutter, UI/UX, Embedded, Cyber, PR, OR, Media) and Track Leads  
**Platform URL:** `https://hr-platform-cyan.vercel.app`  
**System Role:** `team_lead`  

---

## 1. Role Scope and Core Philosophy

As a Team Lead at GDG NCTU, your primary responsibility is to create an inspiring, fair, and growth-oriented environment for your committee members.

The platform provides you with tools to plan tasks clearly, recognize outstanding work transparently, provide constructive mentorship, and grade monthly progress with zero bias.

---

## 2. Managing Committee Tasks (`/tasks`)

### Creating Clear Tasks:
1. Navigate to **Tasks** from the sidebar.
2. Click **"Create Task"** in the top right corner.
3. Complete the task modal with clear specifications:
   * **Title:** Concise title (e.g., "Implement Event Registration Form").
   * **Description:** Operational goals and technical requirements.
   * **Acceptance Criteria:** Exact conditions for acceptance (e.g., "Figma tokens respected; PR passes CI with 0 lint errors").
   * **Committee:** Automatically locked or filtered to your committee track.
   * **Priority:** Low, Medium, High, or Urgent.
   * **Deadline:** Select realistic delivery date in Cairo time.
   * **Assignees:** Select the responsible member(s) from your committee.
4. Click **"Create Task"**. Your members are immediately notified in-app.

### Reviewing Submissions & Moving the Kanban Board:
* **Kanban Columns:** Tasks move left-to-right across:
  * `Assigned` ➔ `In Progress` ➔ `Submitted` ➔ `Completed`
* When a member submits work, review the deliverable link (GitHub PR, Figma file, Google Drive folder).
* **If work meets acceptance criteria:** Move task to **Completed**. Consider awarding a positive point event!
* **If revisions are needed:** Leave clear comments and move task back to **In Progress**. Do **not** penalize members for iterative revisions.

---

## 3. Recognizing Contributions & Recommending Points (`/points`)

### Awarding Positive Points:
1. Navigate to **Points Ledger** and click **"Record Point Event"**.
2. Select your committee member.
3. Choose the appropriate positive category:
   * **Core Task Completed (+5.0 pts):** For on-time, high-quality deliverables.
   * **Initiative & Innovation (+3.0 pts):** For proactive suggestions, new tooling, or creative problem-solving.
   * **Peer Support (+2.0 pts):** For mentoring peers or giving technical workshops.
   * **Documentation (+2.0 pts):** For organizing repos, writing guides, or clean documentation.
   * **Additional Contribution (+1.0 to +3.0 pts):** For volunteering beyond normal scope.
4. Attach evidence URL (GitHub PR link, meeting notes).
5. Points update immediately on the member's monthly ledger.

### Recommending Disciplinary Deductions (Negative Points):
* *Important Rule:* Disciplinary points are a last resort, never a first reaction. Always communicate privately with the member first.
* If a communicated rule is breached without justification (e.g. unexcused meeting absence, unexplained deadline failure after reminder):
  1. Click **"Record Point Event"**, select `direction = negative`.
  2. Select category and enter the factual evidence link.
  3. The request enters `pending_review` status. An independent HR Reviewer will examine the case and approve the deduction.

---

## 4. Conducting Monthly Member Evaluations (`/evaluations`)

1. **Cycle Window (25th to End of Month):**
   * Access **Evaluations** at the end of each month. You will see a list of members in your committee awaiting evaluation.
2. **Grading the 6 Core Categories:**
   * **Task Completion (30 pts):** Timeliness and milestone delivery.
   * **Quality & Standards (25 pts):** Quality of output, clean code, compliance with guidelines.
   * **Reliability & Commitment (15 pts):** Meeting attendance, communication responsiveness.
   * **Knowledge Sharing (10 pts):** Team collaboration and helping peers.
   * **Documentation (10 pts):** Transparent reporting and clear notes.
   * **Growth & Initiative (10 pts):** Self-learning and personal improvement.
3. **Using the Proportional N/A Feature:**
   * If a category is genuinely inapplicable to a member's assigned sprint (e.g., they had no opportunity to do Documentation), toggle **N/A**.
   * The platform will automatically normalize the remaining criteria to 100%, ensuring the member is not unfairly penalized.
4. **Submitting the Evaluation:**
   * Provide supportive, constructive feedback notes highlighting strengths and growth areas.
   * Submit the evaluation for HR review.

---

## 5. Conducting 1-on-1 Feedback Sessions (`/feedback`)

* Schedule a private 15-minute conversation with each evaluated member at the start of the following month.
* Review their score, celebrate achievements, listen to their challenges, and agree on 1–2 development goals.
* Document the session summary at `/feedback`.
