# GDG on Campus NCTU — Spreadsheet Import & Migration Guide

**Document Reference:** `docs/IMPORT_MIGRATION_GUIDE.md` (See also [EXCEL_MIGRATION_GUIDE.md](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/EXCEL_MIGRATION_GUIDE.md))  
**Supported Formats:** `.csv` (UTF-8 Encoded)  
**Authorized Operators:** `super_admin`, `hr_admin`  

---

## 1. Ethical Guidelines & Migration Principles

1. **Zero Fabrication:** Never invent missing historical reviewers, dates, or evidence. Flag uncertain records explicitly as `historical_approval_verified = false`.
2. **Pre-Import Backup Requirement:** Always execute a PostgreSQL snapshot (`pg_dump`) before running bulk imports.
3. **Template Conformance:** Source data must adhere to the 4 validated templates located in [`docs/templates/`](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates):
   * [member_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/member_import_template.csv)
   * [task_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/task_import_template.csv)
   * [points_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/points_import_template.csv)
   * [evaluation_import_template.csv](file:///c:/Users/Hossam%20Ahmed/Documents/HR%20Managment/hr-platform/docs/templates/evaluation_import_template.csv)

---

## 2. Ingestion Pipeline Summary

* **Step 1:** UTF-8 File Validation (Arabic text integrity).
* **Step 2:** Column Header Mapping.
* **Step 3:** Data Type & Constraint Checks.
* **Step 4:** Duplicate Detection (Email / Incident URL matching).
* **Step 5:** Interactive Preview & Error Exception Logging.
* **Step 6:** Operator Confirmation & Transactional Database Ingestion.
* **Step 7:** Post-Migration Reconciliation & Sign-off.
