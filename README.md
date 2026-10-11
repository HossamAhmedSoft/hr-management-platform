# 🚀 GDG on Campus — New Cairo Technological University (NCTU)
## Centralized HR Operations & Member Performance Management Platform

A modern, transparent, auditable web application designed to replace scattered spreadsheets and govern member performance, task delivery, points ledger, monthly evaluations, feedback, progressive escalations, and technical educational tracks for **Google Developer Groups (GDG) on Campus NCTU**.

---

## 🌟 Key Architecture & Non-Negotiable Policy Guardrails

Derived directly from the official GDG NCTU operations manual:

1. **Separation of Concerns:**  
   Positive/Negative point balances are **strictly independent** from the monthly performance evaluation score (rated out of 100). Points do NOT automatically deduct marks from monthly evaluation sheets.
2. **No Automatic Penalties from Numbers Alone:**  
   A low point balance or entry into the Warning/Red tier triggers mentoring, check-ins, or progressive reviews — **never** automatic expulsion or demotion.
3. **Mandatory Due Process & Explanation Window:**  
   No negative point or disciplinary record can be approved without:
   - Specific documented factual evidence (links, commits, chat logs)
   - Advance member notification with a **48-hour explanation window**
   - Independent review by an authorized HR Reviewer
4. **Investigation Referral for Serious Violations:**  
   Breaches of academic integrity or severe misconduct are routed directly to executive leadership and investigation boards rather than applying a fixed numeric deduction.
5. **Egyptian Business Calendar Adherence:**  
   Appeals and grievance windows guarantee a minimum of **7 official working days**, strictly excluding Friday and Saturday (Egyptian weekend) and public holidays.
6. **Immutable Audit Trails:**  
   Every state change, review decision, point event, and evaluation amendment generates a permanent, tamper-resistant record in `audit_logs`.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS v4 + Radix UI Primitives + Google Developer Groups Brand Identity (Blue `#4285F4`, Red `#EA4335`, Yellow `#FBBC04`, Green `#34A853`)
- **Internationalization:** `next-intl` (Full support for English LTR and Arabic RTL with automatic text orientation)
- **Database & Auth:** PostgreSQL & Supabase (50+ normalized relational tables, RLS security policies, and automatic audit triggers)
- **State & Flow:** React Context (`AppProvider`) with instant role switcher for testing across Super Admin, HR Admin, HR Reviewer, Team Lead, and Member personas.

---

## 📂 System Navigation & Core Modules

The platform features 15 comprehensive operational areas:

| # | Module | Route | Description |
|---|---|---|---|
| 1 | **Dashboard** | `/[locale]` | Executive overview, KPI cards, policy banners, active milestones |
| 2 | **Members Directory** | `/[locale]/members` | Filterable roster, detail drawer with multi-tab history, CSV import/export |
| 3 | **Teams & Committees** | `/[locale]/teams` | 8 technical and operations committees with leadership hierarchy |
| 4 | **Tasks & Deliverables** | `/[locale]/tasks` | Full task lifecycle, deliverable submission links, advance delay requests |
| 5 | **Points Ledger** | `/[locale]/points` | Positive & negative ledger with monthly 7-category caps and review queue |
| 6 | **Monthly Evaluations** | `/[locale]/evaluations` | Official 6 categories (30/25/15/10/10/10), real-time N/A proportional adjustments, performance tiers |
| 7 | **Feedback & PIP** | `/[locale]/feedback` | Structured coaching sessions, encrypted HR private notes, action items |
| 8 | **Incidents & Escalations** | `/[locale]/incidents` | 4-tier progressive ladder (Friendly Warning → PIP → Team Review → Leadership) |
| 9 | **Appeals & Grievances** | `/[locale]/appeals` | 7-working-day Egyptian calendar calculator and neutral reviewer decisions |
| 10 | **Educational Tracks** | `/[locale]/education` | Web, AI, Mobile cohorts, 100-pt student rubric, certificate eligibility (≥75%) |
| 11 | **Attendance & Sessions** | `/[locale]/attendance` | Meeting logs, check-ins, excused absence categories (academic/medical) |
| 12 | **Reports & Analytics** | `/[locale]/reports` | Aggregated performance benchmarks and CSV data exports |
| 13 | **HR KPIs** | `/[locale]/hr-kpis` | 4 quality benchmarks (Communication, Confidentiality, Integration, Fairness) |
| 14 | **Policy & Settings** | `/[locale]/policy` | Published immutable policy versioning, category tables, working-day settings |
| 15 | **Audit Log** | `/[locale]/audit-log` | Append-only security log tracking actor, operation, and state diffs |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### 2. Installation
```bash
# Clone and enter directory
cd hr-platform

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Database Setup (Supabase)
Run the migration scripts located in `supabase/migrations/`:
1. `supabase/migrations/001_initial_schema.sql` (Creates 50+ tables, enums, constraints, and indexes)
2. `supabase/migrations/002_rls_and_seed.sql` (Enables RLS policies, audit triggers, and loads initial GDG NCTU teams and members)

### 5. Running the Application
```bash
# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The platform will automatically route to `/en` or `/ar` based on your preference.

---

## 🧪 Testing & Verification
To run calculation rule and policy tests:
```bash
npm run test
```
Verifies:
- Evaluation score weighted formula (30/25/15/10/10/10)
- N/A proportional adjustments
- Egyptian working day calculator (skips Friday/Saturday)
- Net-point classification levels (Green/Normal/Warning/Red)
