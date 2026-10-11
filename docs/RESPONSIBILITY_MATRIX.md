# GDG NCTU HR PLATFORM — RESPONSIBILITY & APPROVAL MATRIX (RACI)

**Document Reference:** `RACI-HR-2026-V1`  
**System Baseline:** GDG NCTU HR Management Platform  
**Scope:** Governance Authorities, Operational Roles, and Server-Side Authorization Boundaries  

---

## 1. Governance Roles Definition

The platform defines eight distinct stakeholder roles across community leadership, administration, operations, educational tracks, and general membership:

1. **Community Leadership (Lead / Executive Board):** Chapter Lead and Faculty Advisor with ultimate organizational accountability, constitutional authority, and disciplinary appellate jurisdiction.
2. **HR Admin (`super_admin` / `hr_admin`):** Technical and operational administrators managing platform configuration, member lifecycle, system security, and data governance.
3. **HR Reviewer (`hr_reviewer`):** Dedicated neutral HR officers responsible for approving disciplinary points, auditing monthly evaluation consistency, and mediating appeals.
4. **Team Lead (`team_lead`):** Functional heads of committees (Web, Mobile, PR, OR, Media, etc.) responsible for task creation, day-to-day mentoring, deliverable acceptance, and performance grading.
5. **Track Lead (`team_lead` - Educational Specialization):** Heads of educational workshops (AI, Flutter, Cloud, etc.) supervising curriculum execution, instructors, and student attendees.
6. **Instructor (`instructor`):** Subject-matter experts delivering technical workshops and evaluating participant projects and attendance.
7. **Teaching Assistant (`ta`):** Supporting technical staff tracking session attendance, grading homework, and assisting workshop attendees.
8. **Member (`member`):** Active committee members and contributors executing assigned tasks, participating in chapter events, and engaging in continuous learning.

---

## 2. RACI Responsibility Matrix

### RACI Definitions:
* **R — Responsible:** The role that performs the activity to achieve the deliverable.
* **A — Accountable:** The sole role with final approval power and veto authority.
* **C — Consulted:** Roles whose input, feedback, and specialized opinions are sought.
* **I — Informed:** Roles that are kept updated on progress and outcomes.

| Workflow / Activity | Community Leadership | HR Admin | HR Reviewer | Team Lead | Track Lead | Instructor | TA | Member | Technical Enforcement in System |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Member Onboarding** | I | **A / R** | C | C | C | I | I | I | Restricted to `super_admin` & `hr_admin` (`/members`) |
| **Task Creation & Allocation** | I | I | I | **A / R** | **A / R** | R | I | I | Restricted to `team_lead`, `hr_admin`, `super_admin` |
| **Task Deliverable Review & Acceptance** | I | I | I | **A / R** | **A / R** | R | C | I | Team Leads transition task status to `completed` |
| **Positive Point Recommendation** | I | A | R | **R** | **R** | R | C | I | Recommender submits point event with evidence URL |
| **Negative Point Recommendation** | I | A | R | **R** | **R** | R | C | I | Enters `pending_review` status; member notified |
| **Disciplinary Point Approval** | I | **A** | **R** | I | I | I | I | I | Enforced: Recommending lead blocked from self-approving |
| **Monthly Member Evaluation Draft** | I | I | C | **A / R** | C | I | I | C | Lead evaluates only assigned committee members |
| **Evaluation Finalization** | I | **A** | **R** | C | C | I | I | I | Restricted to `hr_reviewer`, `hr_admin`, `super_admin` |
| **Post-Finalization Score Amendment** | **A** | **R** | C | C | I | I | I | I | Requires Super Admin role + mandatory audit log reason |
| **1-on-1 Feedback Session** | I | C | C | **A / R** | **R** | I | I | R | Documented at `/feedback` with agreed action plans |
| **PIP Initiation (Level 2 Escalation)** | C | **A** | **R** | R | R | I | I | I | Incident record created at `/incidents` with milestones |
| **Level 4 Membership Revocation** | **A** | R | C | C | C | I | I | I | Unanimous approval required offline; executed by Admin |
| **Grievance Appeal Investigation** | C | A | **R** | C | C | I | I | R | Neutral HR Reviewer assigned; original lead recused |
| **Final Appeal Adjudication** | **A** | R | R | I | I | I | I | I | Executive Board review if contested past HR Reviewer |
| **Policy Catalog & Weight Amendments** | **A** | R | C | C | C | I | I | I | Restricted to `super_admin`; version snapshot recorded |
| **Confidential HR Data Export** | **A** | **R** | I | I | I | I | I | I | Bulk export button hidden from members and leads |
| **Privileged User Role Modification** | **A** | **R** | I | I | I | I | I | I | Only `super_admin` can promote users to admin roles |

---

## 3. Server-Side Enforcement vs. Procedural Governance

To prevent unauthorized bypass of governance, the application enforces the matrix at both the application layer and database layer:

1. **Role Guard in Navigation & UI:**
   * Ordinary members are prohibited from accessing administrative routes (`/audit-log`, `/policy`, `/hr-kpis`, `/evaluations` review forms). Unauthorized attempts trigger immediate 403 Forbidden redirects.
2. **Data Scoping (Row-Level Security & State Queries):**
   * Ordinary members query only their own profile, tasks assigned to their user ID, point events credited to their member ID, and finalized evaluations where `member_id === currentUser.id`.
   * Team Leads query only members assigned to their specific committee track.
3. **Impartial Disciplinary Approval Constraint:**
   * The point approval button is conditionally rendered only for users possessing `hr_reviewer`, `hr_admin`, or `super_admin` credentials. Team Leads cannot self-approve negative point deductions for their own subordinates.
4. **Permanent Audit Trail:**
   * Every privileged action (role update, point decision, evaluation finalization, score amendment) automatically logs the actor ID, timestamp, IP/session context, and previous vs. new values to the immutable audit ledger.
