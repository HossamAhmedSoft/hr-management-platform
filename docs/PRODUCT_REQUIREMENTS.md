# GDG on Campus NCTU — Product Requirements Document (PRD)

**System:** Centralized HR Operations, Governance & Performance Management Platform  
**Target Organization:** Google Developer Groups on Campus — New Cairo Technological University (NCTU)  
**Document Version:** 2.0.0-PROD  
**Author:** Senior Full-Stack Engineer, Product Designer & Software Architect  
**Baseline Policy:** *GDG NCTU — Team Rules & Points System: Work Guidelines & Member Performance Evaluation*  

---

## 1. Executive Summary & Product Vision

The GDG on Campus NCTU HR Management Platform is a production-grade web application built to operationalize the community's official governance, performance evaluation, and member development guidelines.

### Core Mission:
* Replace error-prone, fragmented spreadsheets and chat message tracking with a centralized, auditable, and transparent system.
* Foster a healthy, supportive, and growth-oriented student tech community grounded in objective evidence, transparent accountability, and respectful mentorship.
* Eliminate arbitrary penalties, public shaming, or automatic punishments based on raw numbers alone.

---

## 2. Personas & Target Users

1. **Super Admin / Platform Owner:** Full system configuration, user provisioning, security, and policy administration.
2. **Head / Vice Head (Chapter Leadership):** Chapter-wide oversight, executive KPI monitoring, final appellate review, and Level 4 escalation sign-off.
3. **HR Administrator & HR Reviewer:** Day-to-day operations, member onboarding, point approval queues, evaluation audits, and neutral appeal adjudication.
4. **Team Lead (Technical & Non-Technical Committees):** Task allocation, milestone review, positive point recommendations, monthly performance evaluations, and 1-on-1 coaching.
5. **Member (Committee Member / Contributor):** Personal task execution, deliverable submissions, points tracking, evaluation review, and grievance submissions.
6. **Educational Track Instructor & Teaching Assistant (TA):** Workshop delivery, attendance logging, project evaluations, and certificate verification.

---

## 3. Comprehensive Functional Requirements

### 3.1. Role-Scoped Dashboards (Section 5)
* **HR Dashboard:** Aggregated chapter metrics (active members, pending point reviews, open appeals, active PIPs, 4-tier warning counts, workload distribution, and data quality health score).
* **Team Lead Dashboard:** Scoped to committee members (active tasks, milestone deadlines, completion rates, pending reviews, evaluation drafting status, and overloaded members).
* **Member Dashboard:** Scoped to the individual (assigned tasks, personal net points, monthly evaluation score and band, active development goals, and appeal status).
* **Guiding Principle:** Performance scores and points balances never trigger automated disciplinary actions.

### 3.2. Member & Team Management (Section 6)
* **9 Official Committees:**
  * Technical: Web Development, Flutter Development, Cybersecurity, Embedded Systems & IoT, UI/UX Design.
  * Non-Technical: Human Resources (HR), Public Relations (PR), Operations & Logistics (OR), Media & Branding.
* Dynamic committee administration without hardcoded logic in application routes.
* Search, multi-criteria filtering, sorting, member profile drawers, and role management.
* Bulk CSV import pipeline with pre-validation and duplicate detection.
* Role elevation and team transfer workflows that preserve historical performance records.

### 3.3. Task & Deadline Lifecycle (Section 7)
* Kanban board with states: `Draft`, `Assigned`, `In Progress`, `Blocked`, `Submitted`, `Needs Revision`, `Completed`, `Cancelled`.
* Fields: Title, detailed description, acceptance criteria, priority, assignees, deadlines, and deliverable submission URLs.
* Member advance delay and blocker reporting mechanism.
* Audit trail of deadline modifications and assignees.
* **Strict Rule:** Deadlines passing never trigger automated negative points; human committee review is mandatory.

### 3.4. Points Ledger & Governance (Section 8)
* Append-only, immutable transaction ledger.
* **Positive Points:**
  * Core task completed: **+5.0 pts**
  * Initiative & innovation: **+3.0 pts**
  * Peer support & knowledge sharing: **+2.0 pts**
  * Documentation & archiving: **+2.0 pts**
  * Additional agreed contribution: **+1.0 to +3.0 pts**
* **Negative Points:**
  * Failure to update status after reminder: **-1.0 pt**
  * Unjustified deadline delay: **-2.0 pts**
  * Unexcused meeting absence: **-2.0 pts**
  * Repeated unresponsiveness disrupting collaboration: **-3.0 pts**
  * Materially incomplete delivery: **-3.0 pts**
  * Missing direct event duty: **-5.0 pts**
  * Inappropriate conduct (neutral review required): **-5.0 to -10.0 pts**
  * Serious misconduct: **0.0 numeric deduction** (Investigation referral only).
* **Monthly Positive-Point Caps:**
  * Attendance: +6 pts | Task Execution: +9 pts | Quality: +3 pts | Reliability: +4 pts | Collaboration: +6 pts | Initiative: +4 pts | Leadership: +6 pts.
* **Net Balance Classifications:**
  * Green: ≥ +10 pts | Normal: 0 to +9 pts | Warning: -1 to -5 pts | Red: ≤ -6 pts.
* **Independence Rule:** Net points ledger operates independently from the monthly evaluation score.

### 3.5. Monthly Performance Evaluations (Section 9 & 10)
* Official 6 weighted criteria (Total: 100%):
  * Task Completion: 30%
  * Quality & Standards: 25%
  * Reliability & Commitment: 15%
  * Knowledge Sharing & Teamwork: 10%
  * Documentation & Reporting: 10%
  * Growth & Initiative: 10%
* Scoring Formula: $\text{Category Points} = (\text{Rating} / 5) \times \text{Weight}$.
* **Proportional N/A Normalization:** $\text{Final Score} = \left(\frac{\sum_{\text{applicable}} \text{Points}}{\sum_{\text{applicable}} \text{Weights}}\right) \times 100$.
* Performance Bands: Outstanding (90–100), Strong (75–89), Needs Improvement (60–74), Coaching (<60).
* Team-Specific Qualitative Rubrics for HR, PR, OR, Media, and Technical tracks.

### 3.6. Educational Tracks & Workshops (Section 11)
* Dedicated module for cohorts, sessions, and attendance tracking.
* **Attendee Evaluation (100 pts):** Attendance (40), Assignments & Projects (30), Participation (20), Conduct (10). Certificate passing threshold: ≥ 75%.
* **Instructor Evaluation (100 pts):** Punctuality (25), Preparation & Material (25), Explanation & Interaction (25), Follow-up (15), Professionalism (10).

### 3.7. Warnings, Improvement Plans & Escalations (Section 12)
* 4-Level Progressive Escalation Ladder:
  * Level 1: Friendly Informal Warning.
  * Level 2: Performance Improvement Plan (PIP) with measurable goals and 3-week review.
  * Level 3: Team Review with Head/Vice Head and workload adjustment.
  * Level 4: Leadership Escalation requiring unanimous executive sign-off.
* No automatic escalations from numbers alone.

### 3.8. Appeals & Grievances (Section 13)
* 7 Egyptian working days submission window (skipping Friday and Saturday).
* Mandatory neutral HR Reviewer assignment.
* Conflict-of-interest check (original decision-maker cannot review own appeal).
* Full point restoration upon upheld appeal.
* Zero retaliation guarantee for good-faith appeals.

### 3.9. Workload, Development & Operational Health (Sections 14, 15, 21, 22)
* Workload capacity monitor and imbalance indicators.
* 1-on-1 Feedback documentation with private HR notes and agreed action items.
* Policy Change Simulator with impact previews.
* Data quality health monitor flagging incomplete records.
* Season transition and alumni archival workflow.

---

## 4. Non-Functional Requirements (NFR)

* **Security:** Row-Level Security (RLS) on PostgreSQL, server-side route guards, secure session cookies, PBKDF2/SHA-256 password hashing, zero credential exposure in client bundle.
* **Design & UX:** Google Workspace / Admin Console aesthetic, signature 4-color accent bar (`#1a73e8`, `#ea4335`, `#fbbc04`, `#34a853`), Tailwind CSS v4 Dark/Light modes, next-intl bilingual English/Arabic RTL.
* **Performance:** Next.js 16 App Router with Turbopack, static page generation where feasible, sub-500ms API response times.
* **Auditability:** Complete, immutable logging of consequential actions to `audit_logs`.
