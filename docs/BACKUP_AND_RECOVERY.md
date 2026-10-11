# GDG NCTU HR PLATFORM — BACKUP & DISASTER RECOVERY PLAN (BCDR)

**Document Reference:** `BCDR-OPS-2026-V1`  
**Infrastructure Target:** PostgreSQL on Supabase (`qhrxjfluvmrzngjuycom.supabase.co`) & Vercel Edge Runtime  
**Lead Authority:** Deployment Engineer & Super Administrator  
**Tested Status:** Backup Script & Database Schema Dump Verified  

---

## 1. Resilience Architecture & Data Assets

The platform's business continuity architecture protects the integrity of all operational assets:
* **Primary Database:** Managed PostgreSQL database hosted on Supabase (Frankfurt/EU or London/EU region).
* **Core Tables Protected:**
  * `profiles` (User credentials, roles, committee affiliations)
  * `teams` & `educational_tracks`
  * `tasks` & `task_assignees`
  * `point_events` & `point_cap_categories`
  * `evaluations` & `evaluation_criteria`
  * `appeals` & `incidents`
  * `feedback_sessions` & `audit_logs`
* **Encryption Standards:**
  * **Data in Transit:** TLS 1.3 forced on all API endpoints and database connections.
  * **Data at Rest:** AES-256 volume encryption on Supabase managed block storage.

---

## 2. Recovery Objectives (RPO & RTO)

| Metric | Target SLA | Operational Description |
|---|---|---|
| **Recovery Point Objective (RPO)** | **< 24 Hours (Standard)**<br>**< 15 Minutes (Pre-Migration)** | Maximum acceptable data loss window. Supabase takes automatic daily snapshots. Before any administrative migration or schema upgrade, an immediate manual dump reduces RPO to zero. |
| **Recovery Time Objective (RTO)** | **< 30 Minutes** | Target duration required to restore database service into a clean standby environment in the event of primary database corruption. |

---

## 3. Backup Schedule & Procedures

### Layer 1: Supabase Managed Automated Daily Snapshots
* Supabase automatically takes full physical database snapshots every 24 hours.
* Snapshots are retained for 7 days (Free Tier) or 30 days (Pro Tier).
* Snapshots include all tables, indexes, triggers, and Row-Level Security policies.

### Layer 2: On-Demand Pre-Migration Logical Dumps (`pg_dump`)
Prior to executing bulk CSV migrations, major schema alters, or end-of-season rollbacks, the administrator executes a logical dump using PostgreSQL utilities:

```bash
# Export full transactional schema and data (Linux / Mac / Windows PowerShell)
pg_dump "postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" \
  --clean --if-exists --no-owner --no-privileges -F p -f "backup_gdg_nctu_$(date +%Y%m%d_%H%M%S).sql"
```

### Layer 3: Application State Export
* Super Administrators can export comprehensive JSON/CSV snapshots directly from `/audit-log` and `/reports` as an independent operational backup.

---

## 4. Disaster Recovery & Restoration Drill Procedure

> [!CAUTION]  
> **Golden Disaster Rule:** Never test database restoration by overwriting the live production database. Always restore into a clean, isolated staging/test instance.

### Non-Destructive Recovery Drill Steps:
1. **Provision Drill Environment:**
   * Create a temporary Supabase project or spin up a local PostgreSQL Docker container (`docker run --name pg-drill -p 5433:5432 -e POSTGRES_PASSWORD=drillpass -d postgres:16`).
2. **Apply Schema & Data Restoration:**
   ```bash
   psql -h localhost -p 5433 -U postgres -d postgres -f backup_gdg_nctu_sample.sql
   ```
3. **Restoration Verification Suite:**
   * Verify total record count matches production across `profiles`, `point_events`, and `evaluations`.
   * Verify password hashes and credentials function properly.
   * Run the deterministic audit runner against the drill instance:
     ```bash
     npx tsx src/lib/tests/audit-verification-runner.mjs
     ```
4. **Sign-off:** Document drill date, duration, and any encountered restoration anomalies.

---

## 5. Emergency Incident Response Protocol

In the event of a catastrophic hosting outage or data corruption:
1. **Triage & Communication (0–5 minutes):**
   * Super Admin activates maintenance banner on Vercel or points DNS to static maintenance landing page.
   * Notify Chapter Lead and HR Lead via emergency communication channel.
2. **Isolate Damage (5–10 minutes):**
   * Revoke write access to prevent further erroneous state mutations.
3. **Restore from Latest Verified Backup (10–25 minutes):**
   * Restore target database instance from most recent pre-incident snapshot.
4. **Sanity Verification (25–30 minutes):**
   * Validate key tables, verify latest transactions, and test login for admin and test member.
5. **Resume Normal Operations & Publish Post-Mortem:**
   * Remove maintenance mode and publish incident summary with root-cause analysis.
