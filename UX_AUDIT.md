# Enterprise UX Audit & Usability Analysis
**Project:** GDG on Campus NCTU Management Platform  
**Role:** Principal UX Architect & Senior Product Designer  
**Date:** October 2026  
**Status:** Audit Completed & Remediated

---

## 1. Executive Summary

A comprehensive user experience and cognitive ergonomics audit was conducted on the GDG on Campus NCTU platform following user feedback regarding interface clutter, sensory overload, and navigational friction:
> *"انا حاسس ان الويب سايت زحمه وان انا مش عارف استخدمه كويس حاسه مليان ودوشه ومش مسهل الدنياا"*  
> *(Translation: "I feel the website is overcrowded, difficult to navigate, noisy, and doesn't make things easy.")*

The investigation identified critical friction points across the application lifecycle:
1. **Vertical Stacking Sensory Overload:** High-traffic pages (such as Points and Tasks) stacked 6 to 8 disparate data tables, KPI strips, guideline boxes, and rosters sequentially down a single viewport, forcing excessive scrolling and disorientation.
2. **Missing Hierarchical Wayfinding:** The absence of breadcrumbs and contextual navigational cues made it difficult for users to track their current location within deep flows (e.g., viewing an individual member's points or drilling down into an assigned task).
3. **Monolithic Data Presentation:** Dense lists of tasks and events were presented solely as large cards, causing visual noise and preventing rapid scanning.
4. **Cognitive Role Interference:** Ordinary members were frequently exposed to administrative overhead, wide member rosters, and multi-committee selectors.

---

## 2. Detailed Findings & Usability Friction Matrix

| Issue ID | Area / Page | Usability Problem | Severity | User Impact | Remediated Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UX-01** | `points/page.tsx` | **Monolithic Vertical Stacking:** Page stacked Top Header + Admin Filter Strip + Policy Box + 3 KPI Cards + 12-Card Member Roster Grid + 7 Point Caps Cards + Filter Tabs + Ledger List in a single endless scroll (>2,500px). | **Critical** | Extreme cognitive overload, disorientation, and scroll fatigue. | **Fixed** (3-tab segmented layout: Ledger, Member Balances, and Caps & Policy). |
| **UX-02** | Global Navigation | **Missing Breadcrumb Navigation:** No breadcrumb trail across the app; users relied solely on the browser back button and sidebar. | **High** | Lack of hierarchical wayfinding, especially when filtering by member or deep routing. | **Fixed** (`Breadcrumb` component integrated into `PageHeader`). |
| **UX-03** | `tasks/page.tsx` | **Card-Only Presentation Without Density Control:** Tasks could only be viewed as large multi-button cards; viewing 20+ tasks required endless scrolling. | **High** | Inability to quickly scan statuses, deadlines, and assignees. | **Fixed** (Added Cards vs Compact Table switcher + instant search). |
| **UX-04** | `evaluations/page.tsx` | **Redundant Above-The-Fold Real Estate:** 6 static category cards (30%, 25%, 15%, 10%, 10%, 10%) permanently consumed 30% of vertical space. | **Medium** | Finalized evaluations pushed below fold; repetitive noise for returning evaluators. | **Fixed** (Converted into an expandable accordion guide). |
| **UX-05** | `points/page.tsx` & `tasks/page.tsx` | **Role Distinction Inconsistency:** Members saw empty rosters or redundant administrative guidance when viewing their personal standing. | **High** | Confusion between personal performance and chapter-wide administration. | **Fixed** (Role-adaptive views: personal standing cards for members, roster ledger for leads/admins). |
| **UX-06** | Mobile & RTL Viewports | **Chevron & Indicator Directionality:** Directional icons and active sidebar indicators were previously hardcoded for LTR. | **Medium** | Arabic layout dissonance; reversed navigation queues in RTL. | **Fixed** (RTL-aware CSS classes, mirror chevrons, and dynamic margins). |

---

## 3. Deep Dive into Remediated Issues

### 3.1 Points Page Architecture Overhaul (`points/page.tsx`)
- **Before:**
  Users opened `/points` and were greeted by an immediate vertical sequence of:
  1. Administrative member selector bar
  2. Large Amber policy guardrail box
  3. 3 KPI summary cards
  4. 12+ individual member balance cards
  5. 7 monthly positive points cap cards
  6. Directional filter tabs
  7. Detailed event ledger cards
- **After:**
  Restructured into a task-focused, progressive disclosure pattern with 3 segmented views:
  1. **سجل الحركات (Events Ledger):** Immediate access to point history, status filters, admin member scoping, and an expandable policy guide.
  2. **أرصدة وقوائم الأعضاء (Member Balances):** High-density, searchable member directory with balance previews and 1-click drill-down to a member's dedicated ledger. For regular members, this presents their personal standing card with performance tier badge.
  3. **اللوائح والأسقف (Caps & Policy Rules):** Houses all 7 monthly positive point caps and formal policy guardrails without cluttering the daily operational view.

### 3.2 Task Lifecycle Density & Search (`tasks/page.tsx`)
- **Before:**
  Only large 3-column cards existed. No search functionality was provided. Users had to manually scan all cards to locate a specific task or team member.
- **After:**
  1. **Dual View Modes:** Instant toggle between visual Card Grid and high-density Table View.
  2. **Live Instant Search:** Search bar filtering across Task Title, Description, Assignee Name, and Committee.
  3. **Streamlined Milestone Banner:** Replaced heavy alert with a compact, actionable escalation bar with a 1-click critical task filter.

### 3.3 Evaluations Page Space Optimization (`evaluations/page.tsx`)
- **Before:**
  The 6 criteria weight cards (100-pt system) occupied permanent screen space above the finalized evaluations list.
- **After:**
  Encapsulated inside a collapsible accordion (`showCriteriaGuide`). Users can review official weights on demand with a single click, keeping the evaluation table prominently above the fold.

### 3.4 Hierarchical Wayfinding (`src/components/common/breadcrumb.tsx`)
- Created an RTL-aware, accessible Breadcrumb component.
- Automatically derives labels from route segments or accepts custom breadcrumb trails.
- Integrated into `PageHeader` across all routes:
  - Home (`/`) > Tasks (`/tasks`)
  - Home (`/`) > Points Ledger (`/points`) > Member Inspection
  - Home (`/`) > Attendance (`/attendance`)
  - Home (`/`) > Evaluations (`/evaluations`)
- Preserves Arabic RTL chevron orientation (`rtl:rotate-180`).

---

## 4. Verification & Testing

1. **TypeScript Static Analysis:** `npx tsc --noEmit` verified with 0 errors.
2. **Production Build Validation:** Next.js build compilation confirmed clean.
3. **Responsive Breakpoints:** Tested across 360px (mobile), 768px (tablet), 1024px (desktop), and 1440px (wide).
4. **Bilingual Bi-Directional Layout:** Verified in Arabic RTL (`dir="rtl"`) and English LTR (`dir="ltr"`).
