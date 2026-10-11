# GDG NCTU HR PLATFORM — EXCEL & CSV DATA MIGRATION GUIDE

**Document Reference:** `MIG-DATA-2026-V1`  
**System Target:** GDG NCTU HR Management Platform  
**Supported Ingestion Formats:** UTF-8 Comma-Separated Values (`.csv`), Microsoft Excel (`.xlsx` converted to `.csv`)  
**Authorized Operators:** `super_admin` and `hr_admin` only  

---

## 1. Migration Protocol & Ethical Safeguards

Migrating historical spreadsheets into an official HR operational platform requires rigorous controls to protect data accuracy, member rights, and organizational integrity.

### Golden Rules of HR Data Migration:
1. **Zero Fabrication:** If an Excel sheet from last season contains a point deduction without a reviewer name or evidence link, do **not** invent a reviewer identity. Preserve that uncertainty explicitly using `historical_approval_verified = false`.
2. **No Retroactive Recalculations:** Do not apply new caps or revised evaluation formulas retroactively to past cycles without explicit written authorization from Chapter Leadership.
3. **Environment Isolation:** **Never** import real member data into public demo environments or unencrypted local machines.
4. **Pre-Import Backup Mandate:** A verified database snapshot must be created before executing any bulk write operation.
5. **Human Operator Accountability:** Every migration run must be logged with the operator's user ID, timestamp, source hash, and reconciliation report.

---

## 2. The 10-Step Ingestion & Reconciliation Pipeline

```
[1. Source Validation] ➔ [2. Column Mapping] ➔ [3. Format & Type Checks] ➔
[4. Duplicate Detection] ➔ [5. Interactive Preview] ➔ [6. Error Exception Log] ➔
[7. Operator Confirmation] ➔ [8. Transactional Write] ➔ [9. Import Summary] ➔ [10. Post-Import Audit]
```

### Step 1: Source File Validation
* Ensure files are saved in **UTF-8 encoding** (to preserve Arabic names: `أحمد`, `مريم`, etc.).
* Remove empty trailing rows, merged cells, formulas (`#REF!`, `=SUM(...)`), and password protection.

### Step 2: Column Mapping
* Map source headers against the official platform schemas provided in `docs/templates/`:
  * Member Directory: `docs/templates/member_import_template.csv`
  * Tasks: `docs/templates/task_import_template.csv`
  * Point Transactions: `docs/templates/points_import_template.csv`
  * Monthly Evaluations: `docs/templates/evaluation_import_template.csv`

### Step 3: Data Type & Format Validation
* **Emails:** Must be valid RFC 5322 format (e.g. `user@gdgnctu.com`).
* **Roles:** Allowed enums: `member`, `team_lead`, `hr_reviewer`, `hr_admin`, `super_admin`, `ta`, `instructor`.
* **Committees:** Allowed enums: `web`, `flutter`, `uiux`, `embedded`, `cyber`, `pr`, `or`, `media`, `hr`.
* **Timestamps:** ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`) or valid date format (`YYYY-MM-DD`).

### Step 4: Duplicate Detection
* **Members:** Duplicate email checks against existing database records. Existing members are flagged for update rather than duplicate record creation.
* **Points:** Deduction uniqueness checks: reject duplicate deductions matching the same `member_email`, `recorded_date`, and `evidence_url`.
* **Evaluations:** Uniqueness constraint on `(member_email, period_name)`.

### Step 5: Interactive Preview
* The system displays a 10-row visual table preview showing mapped fields, highlighting valid rows in green and suspicious/invalid fields in amber/red.

### Step 6: Error Exception Log
* Any malformed rows are exported to an `import_errors_<timestamp>.csv` file detailing:
  * Row Number
  * Invalid Field
  * Input Value
  * Error Reason (e.g. `Invalid committee 'marketing' - must be one of: web, flutter, uiux, embedded, cyber, pr, or, media, hr`)

### Step 7: Authorized Import Confirmation
* The UI prompts the operator:
  * *"You are about to insert X records and update Y records into the Production Database. A snapshot has been created. Type 'CONFIRM MIGRATION' to proceed."*

### Step 8: Transactional Database Ingestion
* Records are written in batch transactions. If a fatal database constraint violation occurs mid-batch, the entire transaction rolls back to preserve database consistency.

### Step 9: Import Result Summary
* Upon completion, the system generates an audit record displaying:
  * Total rows processed
  * Successful insertions
  * Updated records
  * Skipped duplicates
  * Execution time in seconds

### Step 10: Post-Import Reconciliation & Audit
* Operator performs sample spot checks:
  1. Verify total active member count matches the source roster.
  2. Verify committee breakdown totals.
  3. Validate cumulative point balances for 5 randomly selected members.
  4. Operator signs off on the reconciliation report.

---

## 3. CSV Templates Directory Reference

All standardized templates are located under `docs/templates/`:
* [member_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/member_import_template.csv)
* [task_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/task_import_template.csv)
* [points_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/points_import_template.csv)
* [evaluation_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/evaluation_import_template.csv)
