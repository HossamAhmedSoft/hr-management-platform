# GDG on Campus NCTU — Security & Data Governance Specification

**Document Reference:** `docs/SECURITY_AND_DATA_GOVERNANCE.md` (See also [DATA_GOVERNANCE.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/DATA_GOVERNANCE.md) & [ACCESS_REVIEW_PROCEDURE.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/ACCESS_REVIEW_PROCEDURE.md))  
**Classification:** Confidential Technical Architecture & Privacy Standard  

---

## 1. Security Architecture & Threat Mitigation

### Application & Network Security:
1. **Transport Layer Security:** TLS 1.3 enforced across all API endpoints, web traffic, and PostgreSQL pooler connections.
2. **Secrets Protection:** Supabase Service Role keys and database credentials reside exclusively in server-side environment variables (`.env.local`), never bundled into client-side JavaScript.
3. **Password Security:** Direct database authentication uses PBKDF2/SHA-256 password hashing with salt.
4. **Input Sanitization & Injection Prevention:** All SQL queries are mediated through parameterized PostgREST ORM calls. Form inputs are validated via typed schemas.
5. **Session Management:** Secure HTTP-only cookies and cryptographically signed session tokens.

---

## 2. PostgreSQL Row-Level Security (RLS)

Database access policies guarantee multi-tenant and role-scoped isolation at the SQL engine level:
* `profiles`: Public view for directory; updates restricted to Admins.
* `point_events`: Scoped so general members query strictly their own ledger.
* `evaluations`: Finalized evaluations visible to evaluated member; drafts restricted to Leads and Admins.
* `audit_logs`: Strictly restricted to Super Admin and HR Admin.

---

## 3. Data Governance & Retention Schedules

* **Operational Season Retention:** Live transactional querying active throughout the season (September–June).
* **Alumni Archival:** Graduating leaders transition to `alumni` status; credentials deprovisioned; historical records preserved read-only.
* **Right to Rectification:** Factual profile corrections handled via HR; score corrections require Super Admin amendment with mandatory audit rationale.
* **Incident Data Isolation:** Confidential investigation notes separated from member-visible evaluation feedback.
