# Enterprise Information Architecture (IA) Specification
**Project:** GDG on Campus NCTU Management Platform  
**Specification Version:** 2.0  
**Status:** Approved & Implemented

---

## 1. Architectural Philosophy & Navigation Model

The information architecture of the GDG on Campus NCTU platform is structured around three core principles:
1. **Task-Oriented Grouping:** Features are categorized according to user frequency and intent rather than database schema or raw CRUD entities.
2. **Role-Tailored Scoping:** Routes, pages, and interactive components adapt dynamically according to the user's authenticated role, minimizing cognitive clutter for non-administrative roles.
3. **Progressive Disclosure:** Complex multi-dimensional views (e.g., points ledger, monthly caps, evaluation criteria) use segmented tabs and collapsible containers rather than endless monolithic vertical stacking.

---

## 2. Navigation Taxonomy & Structural Hierarchy

```
Global Application Root (/[locale])
│
├── 1. Daily Workspace (العمل اليومي والمهام)
│   ├── /dashboard (لوحة القيادة) ───────────── Real-time overview, assigned tasks, and quick actions
│   ├── /tasks (إدارة المهام والتكليفات) ───── Task lifecycle, deliverables, delay requests, card/table views
│   └── /attendance (الحضور والاجتماعات) ───── Meeting schedules, QR/live attendance, excuse workflows
│
├── 2. Performance & Standing (الحوكمة والتقييم)
│   ├── /points (سجل وقواعد النقاط) ────────── 3-Tab Architecture:
│   │   ├── Tab 1: سجل الحركات (Ledger & Filtered Entries)
│   │   ├── Tab 2: أرصدة الأعضاء / تفاصيل رصيدي (Member Balances / Personal Standing)
│   │   └── Tab 3: اللوائح والأسقف (Official Caps & Policy Guardrails)
│   ├── /evaluations (التقييم الشهري) ──────── 100-pt evaluation engine, collapsible criteria weights guide
│   ├── /appeals (التظلمات والطعون) ────────── Appeal submission & dispute arbitration committee
│   ├── /education (المسارات الأكاديمية) ───── Academy tracks, student rosters, assignment scoring
│   └── /incidents (سلم التصعيد والمتابعة) ──── Formal notices, warnings, and PIP escalations
│
└── 3. Admin & Governance (الإدارة والتقارير) [Protected]
    ├── /members (دليل الأعضاء) ────────────── Master member directory, role assignment, track alignment
    ├── /teams (اللجان والفرق) ────────────── Committee charters, leadership assignment, track settings
    ├── /reports (التقارير والتحليلات) ─────── Chapter performance analytics, exportable CSV/PDF metrics
    ├── /hr-kpis (مؤشرات كفاءة HR) ────────── HR committee response times and SLA monitoring
    ├── /feedback (جلسات المتابعة وPIP) ───── 1-on-1 feedback notes and performance improvement plans
    ├── /audit-log (سجل التدقيق الأمني) ────── Immutable cryptographically verified administrative audit trail
    └── /policy (اللائحة والسياسات) ────────── Master chapter bylaws, evaluation weights, and point catalogs
```

---

## 3. Role-Based Navigation & Access Control Matrix

The platform enforces strict role-based route visibility via `canAccessRoute(userRole, path)` and server-side middleware validation:

| Route / Module | Super Admin | HR Admin | HR Reviewer | Team Lead | Member | Track Lead / Instructor | Attendee |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`/` (Dashboard)** | Full Org | Full Org | Review View | Team View | Personal View | Track View | Track View |
| **`/tasks`** | Manage/Assign | Manage/Assign | Read/Review | Manage Team | Personal Only | Track Only | Personal Only |
| **`/attendance`** | Full Roster | Full Roster | Review Excuses | Team Roster | Excuse/Personal | Track Roster | Personal View |
| **`/points`** | Full Org | Full Org | Approve/Reject | Team Ledger | Personal Only | Track Only | Personal Only |
| **`/evaluations`** | Conduct/Edit | Conduct/Edit | Review Scores | Team Eval | Personal View | Track Eval | Hidden |
| **`/appeals`** | Arbitrate | Arbitrate | Arbitrate | Team Inquiries | Submit/Track | Track Inquiries | Submit/Track |
| **`/education`** | Full Access | Full Access | Full Access | View Linked | My Enrolled | Manage Track | Student View |
| **`/incidents`** | Full Access | Full Access | Review | Team Escalate | My Notices | Track Escalate | Hidden |
| **`/members`** | Full Access | Full Access | Read-Only | Read-Only | Directory (Lite) | Directory (Lite) | Hidden |
| **`/teams`** | Full Access | Full Access | Read-Only | Read-Only | Read-Only | Read-Only | Hidden |
| **`/reports`** | Full Access | Full Access | Read-Only | Team Reports | Hidden | Track Reports | Hidden |
| **`/hr-kpis`** | Full Access | Full Access | Review | Hidden | Hidden | Hidden | Hidden |
| **`/audit-log`** | Full Access | Read-Only | Hidden | Hidden | Hidden | Hidden | Hidden |
| **`/policy`** | Edit/Publish | Edit/Publish | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only |

---

## 4. Contextual Wayfinding: Dynamic Breadcrumbs Specification

The new `Breadcrumb` component (`src/components/common/breadcrumb.tsx`) is seamlessly embedded into `PageHeader`, ensuring users always know where they are in the deep tree:

### Standard Hierarchies:
- **Dashboard:** `Home`
- **Tasks Page:** `Home` > `Tasks & Milestones`
- **Individual Task Filtering:** `Home` > `Tasks & Milestones` > `Member: Hossam Ahmed`
- **Points Page:** `Home` > `Points Ledger`
- **Individual Member Ledger:** `Home` > `Points Ledger` > `Member: Omar Hassan`
- **Attendance Page:** `Home` > `Attendance & Sessions`
- **Evaluations Page:** `Home` > `Monthly Evaluations`
- **Education Tracks:** `Home` > `Academy Tracks` > `Web Development`

### Bidirectional Layout Compliance:
- Chevron separation icons rotate dynamically:
  - LTR: `rotate-0` (points right)
  - RTL: `rtl:rotate-180` (points left, honoring Arabic reading order)
- Active terminal item is highlighted with `text-foreground font-semibold` and `aria-current="page"`.
