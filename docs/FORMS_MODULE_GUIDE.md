# GDG NCTU HR Management Platform — Native Forms Module Specification & Developer Guide

**Module:** Native Forms & Surveys System (Self-Hosted Google Forms Equivalent)  
**Standard:** Google Workspace & Admin Console SaaS Design Standard  
**Document Reference:** `DOC-FORMS-2026-V1`  

---

## 1. Executive Summary & Architecture

The **Native Forms Module** provides an in-house, self-hosted equivalent to Google Forms deeply embedded into the GDG NCTU HR Management Platform. It allows creating, publishing, and distributing interactive forms, graded assessments, and surveys directly inside the system without relying on external SaaS or third-party iframes.

### Core Architecture Pillars:
1. **Self-Hosted & Native:** Built on Next.js 16 App Router, TypeScript 5, Supabase PostgreSQL, and Tailwind CSS v4.
2. **Immutable Versioning:** Editing a form after receiving submissions never corrupts existing records. Each response binds to a permanent `form_version_id`.
3. **Deep System Integration:** Forms can be linked to any platform entity (`Task`, `Profile`, `Team`, `TechnicalTrack`, `Incident`, `MeetingAttendance`), with two-way field mappings, automated trigger actions, and signed HMAC-SHA256 outgoing webhooks.
4. **Bilingual by Design:** Complete English (LTR) and Arabic (RTL) support across the Form Builder, Respondent UI, and Analytics Dashboard.
5. **AI Agent Tool Registry:** Exposes standardized callable tools for autonomous agents (`create_form_from_description`, `list_system_forms`, `get_form_summary_and_responses`).

---

## 2. Relational Database Schema (`005_forms_module.sql`)

The database architecture is defined in [supabase/migrations/005_forms_module.sql](file:///c:/Users/Hossam%20Ahmed/Documents/Project/hr-management-platform/supabase/migrations/005_forms_module.sql):

* `forms`: Master table for form metadata, access mode, settings, theme, and current version.
* `form_versions`: Immutable frozen JSON snapshots (`schema_snapshot`) of sections, questions, and logic rules.
* `form_sections`: Multi-page section navigation order and descriptions.
* `form_questions`: All 15+ supported question types, validation rules, option lists, and scoring criteria.
* `form_logic_rules`: Conditional branching rules (`jump_to_section`, `show_question`, `hide_question`, `submit_form`) with `AND`/`OR` combinators.
* `form_collaborators`: RBAC integration (`owner`, `editor`, `viewer`, `response_viewer`).
* `form_responses`: Immutable submission records with completion times, IP hash, and quiz scores.
* `form_answers`: Granular answer values stored per question.
* `form_response_files`: Attached documents and uploaded evidence.
* `form_entity_links`: Deep connections to Tasks, Tracks, Members, and Committees.
* `form_automations`: Triggers on submit or score threshold to execute system actions.
* `form_webhooks` & `form_webhook_deliveries`: HMAC-SHA256 signed webhook dispatch logs.
* `form_templates`: Pre-built template library.

---

## 3. Supported Question Types & Validation

| Question Type | Value Type | Supported Validations |
|---|---|---|
| `short_text` | String | Min length, Max length, Custom Regex pattern |
| `paragraph` | String | Min length, Max length, Custom Regex pattern |
| `multiple_choice` | String | Required, Option Shuffling, "Other" write-in option |
| `checkboxes` | Array of Strings | Required, Min selections, Max selections, "Other" |
| `dropdown` | String | Required |
| `linear_scale` | Number | Min (e.g. 1) to Max (e.g. 5, 10), Min/Max labels |
| `rating` | Number | 1 to 5 Stars |
| `date` | YYYY-MM-DD | Required |
| `time` | HH:MM | Required |
| `number` | Number | Min value, Max value |
| `email` | String | RFC 5322 Email regex verification |
| `phone` | String | International & Egyptian phone format validation |
| `url` | String | Valid `http://` or `https://` web address |
| `file_upload` | File Object | Allowed file extensions (`pdf`, `png`, `jpg`, `docx`, `zip`), Max size MB |
| `matrix_radio` | Object | Grid of rows × columns with single-select per row |
| `matrix_checkbox` | Object | Grid of rows × columns with multi-select per row |
| `ranking` | Array of Strings | Priority ordering |

---

## 4. API Surface

| Endpoint | Method | Description | Auth / Access |
|---|---|---|---|
| `/api/forms` | GET | List forms with pagination, status filter, and search | Authenticated Session |
| `/api/forms` | POST | Create new form from scratch or template | Authenticated Session |
| `/api/forms/[id]` | GET | Fetch complete form schema and draft state | Authenticated Session |
| `/api/forms/[id]` | PUT | Autosave / update form draft | Form Owner / Editor |
| `/api/forms/[id]` | DELETE | Soft-delete / archive form | Form Owner / Admin |
| `/api/forms/[id]/publish` | POST | Create immutable version snapshot & publish | Form Owner / Editor |
| `/api/forms/[id]/duplicate` | POST | Clone form with questions and logic rules | Authenticated Session |
| `/api/forms/public/[slug]` | GET | Public schema resolver with date & cap checks | Public / Role Check |
| `/api/forms/public/[slug]` | POST | Submit response with honeypot & automations | Rate-limited Public |
| `/api/forms/[id]/responses` | GET | Paginated responses list with search & filter | Form Owner / Editor |
| `/api/forms/[id]/responses` | DELETE | Delete single response or bulk-clear | Admin / Owner |
| `/api/forms/[id]/analytics` | GET | Aggregated completion metrics and chart data | Form Owner / Editor |
| `/api/forms/[id]/export` | GET | Download responses as UTF-8 BOM CSV (Excel) | Form Owner / Editor |
| `/api/forms/templates` | GET / POST | Manage system and custom template library | Authenticated Session |

---

## 5. Automated Verification & Testing

Execute the comprehensive end-to-end forms test suite:

```bash
npx tsx src/lib/tests/forms-journey-runner.mjs
```

### Verified Test Cases:
1. `FORMS-01`: Form Creation & Version Immutability.
2. `FORMS-02`: Field Validation Engine (Required, Length, Regex, Number, Email).
3. `FORMS-03`: Dynamic Logic & Branching Engine (Hide/Show questions based on answers).
4. `FORMS-04`: Quiz Auto-Grading & Pass Logic (Answer keys, score calculation).
5. `FORMS-05`: HMAC Webhook Cryptographic Signatures (SHA256 signature verification).
6. `FORMS-06`: AI Agent Forms Tool Calling (Autonomous creation and analysis).
