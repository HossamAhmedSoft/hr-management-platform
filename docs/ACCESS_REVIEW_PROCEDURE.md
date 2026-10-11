# GDG NCTU HR PLATFORM — ACCESS REVIEW & PRIVILEGE AUDIT PROCEDURE

**Document Reference:** `SEC-ACCESS-2026-V1`  
**Classification:** Internal Security Standard  
**Cadence:** Monthly (Team Level) / Bi-Monthly (Privileged Admin Level)  
**Responsible Officer:** Super Administrator & HR Lead  

---

## 1. Objectives and Access Governance Principles

This procedure guarantees that platform access rights strictly align with active real-world GDG NCTU organizational roles, preventing privilege creep, rogue admin escalation, and unauthorized access by departing leaders.

### Principles:
1. **Principle of Least Privilege (PoLP):** Users are granted only the minimum permissions necessary to carry out their immediate seasonal duties.
2. **Self-Escalation Prohibition:** No user can assign themselves an administrative role or alter their own permissions. Role mutations are guarded by server-side role verification.
3. **Mandatory Offboarding & Deprovisioning:** When a Lead steps down or a member leaves the community, access rights must be downgraded or revoked within **48 hours**.

---

## 2. Access Lifecycle Procedures

### Procedure 1: Granting Initial Access
* Trigger: New recruit joins a committee or team.
* Flow:
  1. HR Administrator verifies acceptance from the official recruitment selection log.
  2. HR creates user account with baseline role `member`.
  3. Action is logged in the system audit trail with the authorizer ID.

### Procedure 2: Role Elevation & Team Lead Appointment
* Trigger: Member promoted to Team Lead, Track Lead, or HR Reviewer.
* Flow:
  1. Requires explicit written confirmation from Chapter Lead or HR Lead.
  2. `super_admin` navigates to `/members`, opens user record, and modifies role to `team_lead` or `hr_reviewer`.
  3. The system requires an elevation rationale note, recorded in the audit trail.

### Procedure 3: Inter-Committee Transfers
* Trigger: Member transfers from Web to Flutter, or PR to OR.
* Flow:
  1. HR updates the `committee` field in `/members`.
  2. Previous committee Team Lead automatically loses access to grade or assign tasks to the transferred member.
  3. New committee Team Lead gains assignment and evaluation privileges.
  4. Historical point events and completed evaluations remain permanently linked to the member's profile.

### Procedure 4: Offboarding & Privilege Revocation
* Trigger: Graduation, resignation, termination, or transition to alumni.
* Flow:
  1. If user held a privileged role (`team_lead`, `hr_admin`, `super_admin`), role is immediately downgraded to `alumni` or account set to `status = inactive`.
  2. Active sessions are invalidated.
  3. User is prevented from logging in; existing assigned tasks are reassigned to the committee lead.

---

## 3. Recurring Access Review Protocol

### Frequency:
* **Privileged Account Review:** Conducted on the **1st of every month** by the Chapter Lead.
* **General Member Roster Review:** Conducted prior to every monthly evaluation cycle (the **20th of every month**).

### Privileged Account Checklist:
1. **Super Admin Roster:** Review all users with `role = super_admin`. Ensure count is strictly limited to authorized technical administrators (recommended: maximum 2 accounts).
2. **HR Admin & Reviewer Roster:** Confirm that every HR Reviewer is currently active in the HR Committee.
3. **Team Lead Alignment:** Ensure each Team Lead maps to an active, assigned committee. Remove lead privileges for past leads who have resumed general member roles.
4. **Dormant Account Sweep:**
   * Accounts with zero login activity for > 45 days are flagged.
   * HR contacts the member to ascertain status. If unresponsive within 7 working days, account status is set to `inactive`.
5. **Former Admin Verification:**
   * Explicitly verify that no graduated past leads retain database credentials, Supabase dashboard access, or Vercel deployment permissions.

---

## 4. Access Audit Logging & Verification

Every role mutation generates an immutable record in `/audit-log`:
* `timestamp`: Precise UTC timestamp.
* `actor_id`: User ID of the administrator making the change.
* `target_user_id`: User ID whose role was modified.
* `previous_role`: e.g. `member`.
* `new_role`: e.g. `team_lead`.
* `action`: `ROLE_UPDATE` or `USER_STATUS_CHANGE`.
