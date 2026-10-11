# GDG NCTU HR PLATFORM — RECURRING MAINTENANCE & MONTHLY OPERATIONAL CYCLE

**Document Reference:** `OPS-CYCLE-2026-V1`  
**System Target:** Operational Rhythm & Success Indicators  
**Primary Operators:** HR Lead, Chapter Board, and Technical Administrators  

---

## 1. The Monthly Operational Calendar

```
[Day 1–3] ➔ Beginning-of-Month Planning & Task Allocation
[Day 4–24] ➔ Sprint Execution, Task Monitoring & Point Event Logging
[Day 20] ➔ Privileged Access Review & Roster Sweep
[Day 25–28] ➔ Monthly Performance Evaluation Drafting
[Day 29–30] ➔ HR Audit, Normalization & Evaluation Finalization
[Day 31] ➔ Month-End Closure, Backup Snapshot & Cap Rollover
[Following Day 1–5] ➔ 1-on-1 Feedback Sessions & Appeal Triage
```

### Phase 1: Days 1–3 (Beginning-of-Month Planning)
* **Actions:**
  * HR Admin opens the new monthly evaluation cycle at `/evaluations`.
  * Team Leads define monthly deliverables and set clear acceptance criteria at `/tasks`.
  * Verify members on approved academic/medical leave.

### Phase 2: Days 4–24 (Active Execution & Follow-up)
* **Actions:**
  * Team Leads monitor the Kanban board and assist members with blockers.
  * Positive point events recorded as achievements occur.
  * Disciplinary deductions submitted to HR Review queue where documented violations occur.

### Phase 3: Day 20 (Security & Access Sweep)
* **Actions:**
  * Super Admin reviews active administrative roles, verifies dormant accounts (>45 days), and updates committee transfers.

### Phase 4: Days 25–28 (Evaluation Drafting)
* **Actions:**
  * Team Leads evaluate assigned committee members across the 6 standard criteria.
  * Proportional N/A toggled for criteria not applicable during the sprint.

### Phase 5: Days 29–30 (HR Quality Audit & Finalization)
* **Actions:**
  * HR Reviewers inspect draft evaluations for grading equity across tracks.
  * Evaluations finalized (`status = finalized`); members notified.

### Phase 6: Day 31 (Cycle Closure & Database Snapshot)
* **Actions:**
  * Complete pending point queues.
  * Take a manual `pg_dump` snapshot of the database.
  * Monthly point caps reset to 0 for the upcoming month; season points preserved.

### Phase 7: Following Days 1–5 (Mentorship & Due Process)
* **Actions:**
  * Conduct 15-minute 1-on-1 feedback sessions, recorded at `/feedback`.
  * Triage and adjudicate any submitted appeals within the 7 working days window.

---

## 2. End-of-Season Annual Review (July)

At the conclusion of the academic year:
1. **Annual Recognition & Awards:** Compute season cumulative net points to identify top chapter contributors, most improved members, and outstanding leads.
2. **Certification Eligibility:** Verify educational track attendees who completed ≥75% attendance and final project benchmarks (`/education`).
3. **Policy Version Audit:** Convene Chapter Leadership to review the Policy Governance Register, ratify ambiguous points, and publish `v2.0.0` for the upcoming season.
4. **Alumni Transition:** Archive departing members to `alumni` status; rotate incoming leadership credentials.

---

## 3. Measurable Success Indicators & Data Sources

The health and effectiveness of the platform are tracked via five key indicators:

| Success Indicator | Definition & Calculation Formula | Data Source in System | Caveats & Integrity Safeguards |
|---|---|---|---|
| **On-Time Delivery Rate** | `(Completed on/before deadline / Total tasks) * 100` | `tasks` table (`deadline` vs `updated_at`) | Excludes tasks with approved postponement extensions. |
| **Important Message Acknowledgement** | Percentage of critical notices confirmed within 24h | `audit_logs` & in-app alerts | Tracked **only** where reliable data exists. Missing external data is never assumed as misconduct. |
| **Escalation & Warning Trends** | Monthly count of Level 1, 2, and 3 incident records | `incidents` table | A drop in warnings does **not** automatically indicate improvement; it must be correlated with feedback sentiment. |
| **Member Growth & Improvement** | Month-over-month score progression of evaluated members | `evaluations` table | Measures actual skill growth and milestone quality. |
| **Community Satisfaction & Trust** | Post-evaluation feedback survey score & appeal resolution satisfaction | `/feedback` surveys | High appeal volume may indicate lead grading inconsistency rather than member defiance. |

---

## 4. Technical Maintenance & Security Routine

* **Weekly:** Inspect Vercel runtime logs and Supabase connection pool health.
* **Monthly:** Review dependency security alerts (`npm audit`) and apply patch updates.
* **Quarterly:** Execute a non-destructive disaster recovery restoration drill in a test database instance.
