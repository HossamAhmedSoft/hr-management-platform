# GDG on Campus NCTU — Design System & Brand Identity Specification

**System:** GDG NCTU HR Management Platform  
**Design Standard:** Google Workspace & Admin Console SaaS Dashboard Aesthetic  
**Document Reference:** `DS-TOKENS-2026-V2`  

---

## 1. Brand Color Palette & Design Tokens

The platform preserves the official Google Developer Groups on Campus brand identity with precision:

### Core Brand Tokens:
| Token Name | HEX Code | CSS Variable | Semantic Usage |
|---|---|---|---|
| **Google Blue (Primary)** | `#1a73e8` / `#4285F4` | `--primary` | Primary actions, navigation highlights, active states |
| **Google Red (Destructive)** | `#ea4335` | `--destructive` | Disciplinary alerts, Level 4 escalations, weekend days |
| **Google Yellow (Warning)** | `#fbbc04` | `--warning` | Pending reviews, Warning Zone (-1 to -5), PIP notices |
| **Google Green (Success)** | `#34a853` | `--success` | Approved events, completed tasks, certificate eligibility |

### The Signature 4-Color Google Accent Bar:
Applied to the top navigation header and executive dashboard cards:
```css
.google-accent-strip {
  height: 4px;
  background: linear-gradient(
    to right,
    #1a73e8 0%,
    #1a73e8 25%,
    #ea4335 25%,
    #ea4335 50%,
    #fbbc04 50%,
    #fbbc04 75%,
    #34a853 75%,
    #34a853 100%
  );
}
```

---

## 2. Typography & Bilingual Font Scales

The platform dynamically adjusts typography and layout direction based on locale:
* **English (LTR):** `font-sans` utilizing Inter / Roboto with clear geometric sans-serif legibility.
* **Arabic (RTL):** `dir="rtl"` utilizing Cairo / Tajawal with optimized Arabic glyph rendering and adjusted line-heights.

### Typography Hierarchy:
* `h1` (Page Title): `24px` (`text-xl md:text-2xl`), font-black, tight tracking.
* `h2` (Card / Section Header): `18px` (`text-base md:text-lg`), font-bold.
* `h3` (Component Subheading): `14px` (`text-sm`), font-semibold.
* `body` (Standard Text): `13px` (`text-xs md:text-sm`), text-foreground.
* `caption` / `metadata`: `11px` (`text-[11px]`), text-muted-foreground.

---

## 3. Light & Dark Mode Tokens (Tailwind CSS v4)

Configured via `@custom-variant dark (&:where(.dark, .dark *));`:

| Semantic Element | Light Mode Surface | Dark Mode Surface | Contrast Ratio |
|---|---|---|---|
| **Page Background** | `#f8f9fa` (`bg-slate-50`) | `#0f172a` (`bg-slate-950`) | ≥ 7:1 (AAA) |
| **Card Background** | `#ffffff` (`bg-white`) | `#1e293b` (`bg-slate-900`) | ≥ 4.5:1 (AA) |
| **Border Tokens** | `#e2e8f0` (`border-slate-200`) | `#334155` (`border-slate-700`) | Crisp delineation |
| **Text Primary** | `#0f172a` (`text-slate-900`) | `#f8fafc` (`text-slate-50`) | Maximum contrast |
| **Text Muted** | `#64748b` (`text-slate-500`) | `#94a3b8` (`text-slate-400`) | High readability |

---

## 4. UI Components & UX Guardrails

1. **Anti-Shame Board Guarantee:**
   * The design strictly prohibits public negative-point leaderboards or shame cards. Members view only their personal disciplinary standing; peer directories show only general contributions.
2. **Dense Data Tables:**
   * HR and task tables utilize compact vertical padding (`py-2.5 px-3`) with zebra striping and subtle hover highlights (`hover:bg-muted/20`) for effortless scanning.
3. **Status Badges (`StatusBadge`):**
   * Standardized pill badges with subtle 10% opacity tinted backgrounds and matching high-contrast text:
     * `completed` / `approved`: Emerald (`bg-emerald-500/10 text-emerald-600`)
     * `in_progress` / `under_review`: Blue (`bg-blue-500/10 text-blue-600`)
     * `pending_review` / `warning`: Amber (`bg-amber-500/10 text-amber-600`)
     * `blocked` / `red`: Rose (`bg-rose-500/10 text-rose-600`)
4. **Empty, Loading & Error States:**
   * Thoughtful empty states with contextual icons and actionable guidance (e.g. *"No tasks created yet — click Create Task to begin"*).
   * Skeletons match exact card and row geometries to eliminate layout shift (CLS < 0.1).
