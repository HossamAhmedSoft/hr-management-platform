# GDG NCTU HR PLATFORM — POLICY GOVERNANCE & DECISION REGISTER

**Document Version:** 1.0.0-PROD  
**Effective Baseline:** Season 2026/2027  
**Official Policy Reference:** *GDG NCTU — Team Rules & Points System: Work Guidelines & Member Performance Evaluation*  
**Custodian:** Senior HR Operations Consultant & Software Architect  
**Review Status:** Awaiting Formal Ratification by Chapter Leadership  

---

## 1. Governance Purpose & Operating Principles

This Policy Governance Register catalogs all regulatory ambiguities, mathematical reconciliation gaps, and operational authority decisions discovered during the implementation and technical audit of the GDG NCTU HR Platform.

To protect the fairness, legal integrity, and member trust of the community, the software adheres to three strict constitutional principles:
1. **Zero Silent Fabrication:** The system never invents missing numeric weights, penalties, or approval histories.
2. **Explicit Governance Status:** Ambiguities are implemented via conservative interim guardrails that are visibly flagged to administrators until formally ratified.
3. **Historical Immutability:** Any approved policy amendment applies strictly to future evaluation cycles; past finalized records, historical points, and closed appeals remain immutable.

---

## 2. Unresolved Policy Decisions Register

### Decision 1: Positive-Point Category Mapping vs. Monthly Category Caps
* **Decision ID:** `DEC-POL-001`
* **Source Reference:** Policy Section 4.D (*Positive Points Table*) & Section 4.E (*Monthly Positive Caps Table*)
* **The Ambiguity:**
  * Section 4.D defines discrete point event rewards:
    * *Core task completed:* **+5.0 pts** per event.
    * *Initiative and innovation:* **+3.0 pts** per event.
    * *Additional contribution:* **+1.0 to +3.0 pts** per event.
  * Section 4.E defines category caps with differing per-event rates and monthly limits:
    * *Task Execution:* Listed as **+3.0 pts/event**, with a monthly cap of **9.0 pts**.
    * *Initiative and Innovation:* Listed as **+2.0 pts/event**, with a monthly cap of **4.0 pts**.
    * *Ownership and Leadership:* Listed as **+3.0 pts/event**, with a monthly cap of **6.0 pts**.
  * A member completing a core task (+5 pts) immediately exceeds the +3 pts per-event rate listed in the Task Execution cap table.
* **Current System Behavior:**
  * The system registers the full policy value (+5.0 pts for core task) but subjects the monthly sum to the Task Execution monthly cap (9.0 pts).
  * A second core task in the same month will only be credited for the remaining +4.0 pts (up to 9.0 pts max). Excess points are recorded in the audit trail as "capped points."
* **Operational Risk:** If leadership intended the cap table's +3.0 pts/event to supersede the +5.0 pts table, members are temporarily over-credited on their first task. Conversely, if 5 pts was intentional, members reach their monthly cap in less than 2 tasks.
* **Recommended Resolution:**
  * **Option A (Recommended):** Ratify that Core Task remains +5.0 pts per task, with a revised Task Execution monthly cap of **10.0 pts** (allowing exactly 2 completed core tasks per month).
  * **Option B:** Unify the event value to +3.0 pts per core task, matching the 9.0 pts cap (allowing 3 tasks per month).
* **Required Approving Role:** GDG NCTU Chapter Lead & Lead Organizer (Authorized Community Leadership).
* **Current Status:** `PENDING FORMAL RATIFICATION (Interim Option A in effect)`.
* **Effective Date Once Approved:** 2026-11-01 (Start of Pilot Month 1).

---

### Decision 2: Team-Specific Specialized Evaluation Weights
* **Decision ID:** `DEC-POL-002`
* **Source Reference:** Policy Section 4.H (*Track and Committee Specializations*)
* **The Ambiguity:**
  * The policy provides rich qualitative rubrics for all 9 committees:
    1. Human Resources (HR)
    2. Public Relations (PR)
    3. Operations & Logistics (OR)
    4. Media & Branding
    5. Web Development
    6. Flutter Development
    7. UI/UX Design
    8. Embedded Systems & IoT
    9. Cybersecurity
  * However, the document does **not** provide numeric weight breakdowns (e.g. percentages or points out of 100) for these track-specific rubrics, unlike the general monthly template (30% Tasks, 25% Quality, 15% Reliability, 10% Sharing, 10% Docs, 10% Growth).
* **Current System Behavior:**
  * General members across all committees are evaluated using the official general template (`tpl-default`, totaling 100%).
  * All 9 specialized criteria sets are loaded into the database catalog with `is_official_weight_unassigned: true` and `official_weight: null`.
  * The UI presents specialized evaluation rubrics as qualitative performance review guidelines rather than applying unratified arithmetic weights.
* **Operational Risk:** If Team Leads apply their own arbitrary weights, evaluations across committees become inconsistent and vulnerable to grievances.
* **Recommended Resolution:**
  * Ratify an official track weighting addendum: Adopt a standardized split where 60% of the evaluation covers Core Foundation (Tasks, Quality, Reliability) and 40% covers Track-Specific Competencies (each sub-competency weighted at 10%).
* **Required Approving Role:** Chapter Board & HR Review Committee.
* **Current Status:** `PENDING LEADERSHIP ADDENDUM (Interim Qualitative Guideline)`.
* **Effective Date Once Approved:** 2026-11-01.

---

### Decision 3: Working-Day Calendar & Holiday Schedule for Grievance Appeals
* **Decision ID:** `DEC-POL-003`
* **Source Reference:** Policy Section 4.J (*Appeals and Grievance Process*)
* **The Ambiguity:**
  * The policy grants members an appeal window of **"Seven working days from formal notification"**.
  * The policy does not specify the official calendar jurisdiction, whether weekends are Friday/Saturday (standard Egyptian civic/academic calendar) or Saturday/Sunday (Western calendar), nor how national Egyptian holidays or university exam breaks are handled.
* **Current System Behavior:**
  * The platform's calculation engine (`src/lib/utils.ts:calculateWorkingDayDeadline`) applies the Egyptian institutional calendar:
    * **Working Days:** Sunday, Monday, Tuesday, Wednesday, Thursday.
    * **Non-Working Weekend Days:** Friday and Saturday.
  * National holidays and university recess periods are not automatically skipped unless explicitly listed in the platform holiday registry.
* **Operational Risk:** An appeal submitted on the 8th calendar day during an unconfigured national holiday could be erroneously rejected by the system as expired.
* **Recommended Resolution:**
  * Formally declare that GDG NCTU follows the Egyptian Arab Republic academic calendar (Friday/Saturday weekend).
  * Require HR Admins to import the annual academic/national holiday calendar before the beginning of each semester.
* **Required Approving Role:** HR Lead & Student Activities Advisor.
* **Current Status:** `INTERIM IMPLEMENTED (Egyptian Fri/Sat Weekend Active)`.
* **Effective Date Once Approved:** Immediate for Pilot.

---

### Decision 4: Authorization and Approval Hierarchy
* **Decision ID:** `DEC-POL-004`
* **Source Reference:** Policy Section 2 (*Roles and Governance*)
* **The Ambiguity:**
  * The policy references "HR Reviewer", "Team Lead", and "Management", but does not define an unambiguous authorization split for sensitive operational actions:
    * Can a Team Lead approve a negative deduction for their own member?
    * Who can finalize monthly evaluations?
    * Who possesses the authority to review appeals against HR decisions?
* **Current System Behavior:**
  * Separation of concerns enforced in code:
    1. **Point Recommendations:** Team Leads may recommend positive and negative points.
    2. **Point Approvals:** Negative deductions **must** be approved by `hr_reviewer`, `hr_admin`, or `super_admin`. Team Leads cannot approve negative deductions for their own members.
    3. **Monthly Evaluations:** Team Leads draft evaluations for their assigned committee members; `hr_admin` or `super_admin` finalizes them.
    4. **Appeals:** Must be reviewed by an HR Reviewer who did not submit the original deduction or evaluation.
* **Operational Risk:** Without leadership ratification, Team Leads may contest the requirement for secondary HR approval on disciplinary deductions.
* **Recommended Resolution:**
  * Formally approve the Separation of Duties Matrix detailed in [RESPONSIBILITY_MATRIX.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/RESPONSIBILITY_MATRIX.md).
* **Required Approving Role:** GDG NCTU Board & Chapter Lead.
* **Current Status:** `CODE ENFORCED (Pending Formal Bylaw Sign-off)`.
* **Effective Date Once Approved:** Immediate for Pilot.

---

### Decision 5: Policy Versioning & Immutability Rules
* **Decision ID:** `DEC-POL-005`
* **Source Reference:** Policy Section 1 (*Introduction & Scope*)
* **The Ambiguity:**
  * The policy does not specify the protocol for future mid-season amendments. If point caps or evaluation weights change in Month 3, how are Months 1 and 2 handled?
* **Current System Behavior:**
  * The platform stores `policy_version_id` and timestamped snapshots on every evaluation and point transaction.
  * Updates to policy constants are versioned (e.g. `v1.0.0`, `v1.1.0`) with explicit effective dates.
  * Past records are read-only and recalculations cannot be applied retroactively.
* **Operational Risk:** Retroactive recalculation would distort historical performance bands, invalidate completed PIPs, and damage member trust.
* **Recommended Resolution:**
  * Ratify the "Forward-Only Policy Amendment Rule": No policy change may retroactively alter scores or points in closed evaluation cycles.
* **Required Approving Role:** GDG NCTU Executive Board.
* **Current Status:** `CODE ENFORCED (Architectural Standard)`.
* **Effective Date Once Approved:** Immediate.

---

## 3. Summary Decision Status Table

| Decision ID | Domain | Current Interim Rule | Approving Authority | Target Date |
|---|---|---|---|---|
| `DEC-POL-001` | Positive Point Caps | Full value (+5) awarded subject to 9.0 pt monthly cap | Chapter Lead | 2026-11-01 |
| `DEC-POL-002` | Committee Weights | Qualitative guideline; default 100% template used | Chapter Board | 2026-11-01 |
| `DEC-POL-003` | Working Day Calendar | Sun–Thu working; Fri/Sat weekend skipped | HR Lead | 2026-10-15 |
| `DEC-POL-004` | Approval Duties | Team Lead submits; HR independently approves | Executive Board | 2026-10-15 |
| `DEC-POL-005` | Policy Versioning | Forward-only; historical immutability | Executive Board | 2026-10-15 |
