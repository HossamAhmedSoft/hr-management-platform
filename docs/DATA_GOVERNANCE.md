# GDG NCTU HR PLATFORM — PRIVACY, RETENTION & DATA GOVERNANCE POLICY

**Document Reference:** `GOV-DATA-2026-V1`  
**Classification:** Confidential — Internal Operational Policy  
**Effective Date:** Season 2026/2027 Launch  
**Jurisdiction Baseline:** GDG Global Community Guidelines & Egyptian Personal Data Protection Principles  

---

## 1. Governance Principles & Data Privacy Architecture

The GDG NCTU HR Platform manages sensitive personal, academic, and performance data. The platform adheres strictly to the **Data Minimization**, **Purpose Limitation**, and **Strict Need-to-Know Access** principles:

1. **Member-Visible Feedback vs. Confidential HR Notes:**
   * Performance reviews, task scores, development goals, and approved points are transparently visible to the member.
   * Internal deliberation notes, grievance investigator notes, peer dispute logs, and background checks are classified as **Confidential HR Notes** and are strictly hidden from general members and Team Leads.
2. **Investigation Isolation:**
   * Incident investigations (`/incidents`), harassment claims, and serious conduct breach evidence are accessible solely by `super_admin` and designated `hr_admin`. Team Leads have zero visibility into incidents involving other members or committees.
3. **Notification Privacy Guard:**
   * Email and in-app notification payloads **never** expose confidential disciplinary evidence or dispute transcripts. Notifications contain only neutral administrative triggers (e.g. *"You have a new evaluation update awaiting your review"*).

---

## 2. Data Classification & Access Control Matrix

| Data Category | Specific Data Elements | Purpose of Collection | Authorized Viewers | Export Permissions | Retention Schedule |
|---|---|---|---|---|---|
| **Member Identity** | Full Name, Arabic Name, Email, University Track, Profile Avatar | Member directory, authentication, role assignment | Public to Chapter Members (Directory) | Admin Only | Season Duration + 1 Year Archive |
| **Operational Tasks** | Task Title, Acceptance Criteria, Deadlines, Status, Deliverables | Operational project delivery & teamwork | Assignee, Committee Team Lead, Admins | Admin / Team Lead | 2 Years |
| **Points Ledger** | Event Points, Category, Approved Balance, Public Evidence URL | Transparent objective recognition & deduction | Member (Own ledger), Team Lead, HR Reviewer, Admins | Admin Only | Season Duration + 2 Years |
| **Evaluations & Feedback** | Category Scores, Total Score, Performance Band, Growth Notes | Competency assessment & certificate eligibility | Member (Own record), Team Lead (Committee), Admins | Admin Only | 3 Years (For recommendations & alumni verification) |
| **Confidential HR Incidents** | Disciplinary claims, PIP milestones, witness statements, evidence links | Formal dispute resolution & escalation ladder | Super Admin, HR Lead, Assigned HR Reviewer | Strictly Super Admin | 3 Years from case closure |
| **Grievance Appeals** | Member appeal claim, counter-evidence, reviewer findings, verdict | Due process and appellate review | Member (Own case), Assigned Neutral Reviewer, Chapter Lead | Admin Only | 3 Years |
| **System Audit Trails** | User ID, Action, Timestamp, IP Address, Pre/Post Mutation Values | Cybersecurity, non-repudiation, fraud prevention | Super Admin Only | Super Admin Only | Permanent Immutable Log |

---

## 3. Data Retention, Archiving & Disposal Schedule

### A. Active Season Retention
During the active academic season (September to June), all operational tables remain in live query status.

### B. Post-Season Archival (End-of-Season)
* At the conclusion of the season (July 1):
  * Committee rosters and task boards are frozen into read-only archive status.
  * Point caps reset for the incoming season.
  * Alumni members transition from `status = active` to `status = alumni`.

### C. Right to Rectification & Record Correction
* If a member identifies an factual error in their personal record (e.g. misspelled name, incorrect committee), they may submit a correction request to HR.
* Corrections to performance evaluations or point events must be executed via the formal amendment workflow with a documented audit rationale.

### D. Secure Data Erasure Protocol
* When an account is purged or past retention expiry:
  * Profile email and personal identifiers are scrubbed.
  * Historical audit logs preserve anonymous identifiers (`deleted_user_xyz`) to maintain aggregate statistical accuracy without preserving identifiable personal data.

---

## 4. Pending Organizational Legal Policy Decisions
> [!NOTE]  
> While the above schedules reflect industry best practices for student technical communities, GDG NCTU Chapter Leadership and university legal advisors should formally approve the following parameter:
> * **DEC-DATA-001:** Formal approval of the 3-year alumni recommendation retention period vs. complete end-of-academic-cycle record erasure.
