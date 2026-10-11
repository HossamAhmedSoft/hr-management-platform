# GDG on Campus NCTU — Roles, Permissions & Access Control (RBAC)

**System Target:** GDG NCTU HR Management Platform  
**Document Reference:** `SEC-RBAC-2026-V2`  
**Security Standard:** Role-Based Access Control (RBAC) & PostgreSQL Row-Level Security (RLS)  

---

## 1. Role Hierarchy & Personas

The system enforces 8 distinct operational roles arranged in a strict least-privilege hierarchy:

```
[Super Admin / Platform Owner]
       │
       ▼
[Head / Vice Head]
       │
       ▼
[HR Admin] ──────► [HR Reviewer]
       │
       ▼
[Team Lead] ─────► [Track Lead] ─────► [Instructor] ─────► [TA / Mentor]
       │
       ▼
[Committee Member]
```

---

## 2. Granular Route & UI Access Matrix

| Route | Route Purpose | Super Admin | Head / Vice Head | HR Admin | HR Reviewer | Team Lead | Member | Instructor / TA |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/[locale]` | Persona Dashboard | Full Org | Full Org | Full Org | Full Org | Team-Scoped | Personal | Track-Scoped |
| `/[locale]/members` | Member Directory | Full CRUD | View Only | Full CRUD | View Only | View Team | View Peers | View Track |
| `/[locale]/teams` | Committee Overviews | Full CRUD | View Only | Full CRUD | View Only | View Team | View Public | View Track |
| `/[locale]/tasks` | Task Kanban Board | Full CRUD | Full View | Full CRUD | Full View | Lead Team | View Assigned | Track Tasks |
| `/[locale]/points` | Points Ledger & Queue | Full + Approve | View Only | Full + Approve | Full + Approve | Recommend | View Own | Recommend |
| `/[locale]/evaluations` | Monthly Performance | Full + Amend | View Only | Full + Finalize | Full + Finalize | Rate Team | View Own | Rate Track |
| `/[locale]/feedback` | 1-on-1 Coaching & Notes | Full View | Full View | Full View | Full View | Own Members | View Action Items | Own Track |
| `/[locale]/incidents` | Progressive Escalations | Full CRUD | Full CRUD | Full CRUD | Review Only | View Team | View Own | No Access |
| `/[locale]/appeals` | Grievance Submissions | Full + Verdict | Full View | Full + Verdict | Full + Verdict | Disputed Cases | Submit Own | Submit Own |
| `/[locale]/education` | Workshops & Cohorts | Full CRUD | Full View | Full CRUD | Full View | View Only | View Enrolled | Grade Cohort |
| `/[locale]/attendance` | Sessions & Excuses | Full CRUD | Full View | Full CRUD | Full View | Team Sessions | View Own | Track Sessions |
| `/[locale]/reports` | Analytics & Exports | Full + Export | Full + Export | Full + Export | View Only | Team Exports | No Access | Track Exports |
| `/[locale]/audit-log` | Immutable System Audit | Full View | Full View | Full View | No Access | No Access | 403 Forbidden | 403 Forbidden |
| `/[locale]/policy` | Policy & Simulator | Full + Simulate | View Only | Full + Simulate | View Only | View Only | View Read-Only | View Read-Only |
| `/[locale]/hr-kpis` | HR Quality Benchmarks | Full View | Full View | Full View | Full View | View Only | 403 Forbidden | 403 Forbidden |

---

## 3. Server-Side Action & Authorization Rules

1. **Task Operations:**
   * Creation & Assignment: Strictly restricted to `team_lead`, `hr_admin`, `super_admin`. Members cannot create tasks.
   * Milestone Acceptance: Team Leads mark submitted tasks as `completed`.
2. **Points Ledger Operations:**
   * Recommendations: Team Leads and Instructors can submit positive contributions and recommend negative deductions with documented evidence links.
   * Disciplinary Approvals: Negative deductions **must** be approved by `hr_reviewer`, `hr_admin`, or `super_admin`. Team Leads cannot approve negative deductions for their own subordinates.
3. **Monthly Evaluations:**
   * Drafting: Team Leads can only grade members assigned to their own committee.
   * Finalization: Restricted to `hr_reviewer`, `hr_admin`, `super_admin`. Once finalized, evaluations lock permanently.
   * Post-Finalization Amendments: Only `super_admin` can amend a finalized evaluation, and the system strictly requires a mandatory rationale note written to the immutable audit trail.
4. **Appeals & Due Process:**
   * Conflict-of-Interest Enforcement: The neutral HR Reviewer assigned to an appeal case cannot be the person who submitted the disputed deduction.
5. **Role & Privilege Protection:**
   * Self-Escalation Prohibition: Ordinary users cannot alter their own role. Only `super_admin` can promote users or assign administrative privileges.

---

## 4. PostgreSQL Row-Level Security (RLS) Policies

The underlying Supabase PostgreSQL database enforces security at the storage layer:

```sql
-- Profiles: Members view public directory; write restricted to Admins
CREATE POLICY "Public profile view" ON profiles FOR SELECT USING (true);
CREATE POLICY "Admin profile update" ON profiles FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin', 'hr_admin'))
);

-- Point Events: Members view only their own ledger; Leads view committee; Admins view all
CREATE POLICY "Scoped points view" ON point_events FOR SELECT USING (
  auth.uid() = member_id OR 
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin', 'hr_admin', 'hr_reviewer', 'team_lead'))
);

-- Audit Log: Strictly restricted to Super Admin and HR Admin
CREATE POLICY "Restricted audit log" ON audit_logs FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin', 'hr_admin'))
);
```
