# GDG on Campus NCTU — HR Policy Traceability & Rule Mapping

**Document:** Complete Cross-Reference from Policy PDF to Code Implementation  
**Source Policy Baseline:** *GDG NCTU — Team Rules & Points System: Work Guidelines & Member Performance Evaluation* (Official Governance PDF)  
**System Target:** Production Codebase (`src/`)  

---

## 1. Overview of the Traceability Model

This document provides a line-by-line mapping from the clauses of the official GDG NCTU governance document to the exact TypeScript files, database tables, and verification test suites implementing them.

---

## 2. Policy-to-Code Mapping Registry

### Rule Area 1: Positive Points System (Policy Section 4.D)
| Policy Clause / Rule | Defined Value | System Implementation Location | Verification Test Evidence |
|---|:---:|---|---|
| Core task delivered on time with quality | **+5.0 pts** | `src/lib/policy-catalog.ts:POLICY_POINT_CATEGORIES` (`id: "core_task"`) | `audit-verification-runner.mjs:TEST-6` & `JOURNEY-B` |
| Initiative or creative innovation | **+3.0 pts** | `src/lib/policy-catalog.ts:POLICY_POINT_CATEGORIES` (`id: "initiative_innovation"`) | Verified in policy catalog |
| Peer support or knowledge sharing | **+2.0 pts** | `src/lib/policy-catalog.ts:POLICY_POINT_CATEGORIES` (`id: "peer_support"`) | Verified in policy catalog |
| Documentation or archiving | **+2.0 pts** | `src/lib/policy-catalog.ts:POLICY_POINT_CATEGORIES` (`id: "documentation"`) | Verified in policy catalog |
| Additional contribution with lead | **+1.0 to +3.0 pts** | `src/lib/policy-catalog.ts:POLICY_POINT_CATEGORIES` (`id: "additional_contrib"`) | Verified in policy catalog |

---

### Rule Area 2: Negative Points & Disciplinary Deductions (Policy Section 4.D)
| Policy Clause / Rule | Defined Value | System Implementation Location | Verification Test Evidence |
|---|:---:|---|---|
| Failure to update status after reminder | **-1.0 pt** | `src/lib/policy-catalog.ts` (`id: "status_update_failure"`) | Verified in policy catalog |
| Unjustified missed deadline | **-2.0 pts** | `src/lib/policy-catalog.ts` (`id: "unjustified_delay"`) | `JOURNEY-C` |
| Unexcused essential meeting absence | **-2.0 pts** | `src/lib/policy-catalog.ts` (`id: "unexcused_meeting"`) | Verified in policy catalog |
| Repeated unresponsiveness disrupting work | **-3.0 pts** | `src/lib/policy-catalog.ts` (`id: "repeated_unresponsiveness"`) | Verified in policy catalog |
| Materially incomplete delivery | **-3.0 pts** | `src/lib/policy-catalog.ts` (`id: "incomplete_delivery"`) | Verified in policy catalog |
| Missing assigned event responsibility | **-5.0 pts** | `src/lib/policy-catalog.ts` (`id: "event_duty_failure"`) | Verified in policy catalog |
| Inappropriate conduct (neutral review) | **-5.0 to -10.0 pts** | `src/lib/policy-catalog.ts` (`id: "inappropriate_conduct"`) | Verified in policy catalog |
| Serious misconduct (plagiarism, leaks) | **0.0 pts (Referral)** | `src/lib/policy-catalog.ts` (`is_investigation_referral: true`) | Verified in catalog (No numeric penalty invented) |

---

### Rule Area 3: Monthly Positive Caps (Policy Section 4.E)
| Cap Category | Defined Monthly Cap | System Implementation Location | Verification Test Evidence |
|---|:---:|---|---|
| Attendance & Commitment | **+6.0 pts/mo** | `POLICY_POINT_CAP_CATEGORIES` (`id: "cap-attendance"`) | Verified in policy catalog |
| Task Execution | **+9.0 pts/mo** | `POLICY_POINT_CAP_CATEGORIES` (`id: "cap-task-exec"`) | `JOURNEY-B` |
| Work Quality Added | **+3.0 pts/mo** | `POLICY_POINT_CAP_CATEGORIES` (`id: "cap-quality"`) | Verified in policy catalog |
| Reliability & Transparency | **+4.0 pts/mo** | `POLICY_POINT_CAP_CATEGORIES` (`id: "cap-reliability"`) | Verified in policy catalog |
| Collaboration & Helping | **+6.0 pts/mo** | `POLICY_POINT_CAP_CATEGORIES` (`id: "cap-collaboration"`) | Verified in policy catalog |
| Initiative & Innovation | **+4.0 pts/mo** | `POLICY_POINT_CAP_CATEGORIES` (`id: "cap-initiative"`) | Verified in policy catalog |
| Ownership & Leadership | **+6.0 pts/mo** | `POLICY_POINT_CAP_CATEGORIES` (`id: "cap-ownership"`) | Verified in policy catalog |

---

### Rule Area 4: Monthly Performance Evaluation (Policy Section 5.A)
| Evaluation Criterion | Official Weight | Calculation Formula | Implementation Location | Test Evidence |
|---|:---:|---|---|---|
| Task Completion | **30%** | $(\text{Rating} / 5) \times 30$ | `src/lib/utils.ts:calculateEvaluationScore` | `TEST-1` |
| Quality & Standards | **25%** | $(\text{Rating} / 5) \times 25$ | `src/lib/utils.ts:calculateEvaluationScore` | `TEST-1` |
| Reliability & Commitment | **15%** | $(\text{Rating} / 5) \times 15$ | `src/lib/utils.ts:calculateEvaluationScore` | `TEST-1` |
| Knowledge Sharing & Teamwork | **10%** | $(\text{Rating} / 5) \times 10$ | `src/lib/utils.ts:calculateEvaluationScore` | `TEST-1` |
| Documentation & Reporting | **10%** | $(\text{Rating} / 5) \times 10$ | `src/lib/utils.ts:calculateEvaluationScore` | `TEST-1` |
| Growth & Initiative | **10%** | $(\text{Rating} / 5) \times 10$ | `src/lib/utils.ts:calculateEvaluationScore` | `TEST-1` |
| **Proportional N/A Rule** | **Dynamic** | $\left(\frac{\sum_{\text{applicable}} \text{Pts}}{\sum_{\text{applicable}} \text{W}}\right) \times 100$ | `src/lib/utils.ts:calculateEvaluationScore` | `TEST-2A` & `TEST-2B` |

---

### Rule Area 5: Net Balance Classifications & Boundaries (Policy Section 4.F)
| Classification Band | Range | System Handling | Implementation Location | Test Evidence |
|---|:---:|---|---|---|
| **Green Zone** | $\ge +10\text{ pts}$ | Chapter recognition & honor | `src/lib/utils.ts:getPointClassification` | `TEST-5` |
| **Normal Zone** | $0 \dots +9\text{ pts}$ | Consistent participation | `src/lib/utils.ts:getPointClassification` | `TEST-5` |
| **Warning Zone** | $-1 \dots -5\text{ pts}$ | Friendly check-in trigger | `src/lib/utils.ts:getPointClassification` | `TEST-5` |
| **Red Zone** | $\le -6\text{ pts}$ | HR committee review | `src/lib/utils.ts:getPointClassification` | `TEST-5` |

---

### Rule Area 6: Educational Rubrics (Policy Section 6)
| Persona / Program | Criteria & Points | Certificate Passing Rule | Implementation Location | Test Evidence |
|---|---|:---:|---|---|
| **Workshop Attendee** | Attendance (40), Projects (30), Participation (20), Conduct (10) | $\ge 75\text{ pts}$ | `src/lib/utils.ts:calculateAttendeeEvaluation` | `TEST-3` & `TEST-3B` |
| **Track Instructor** | Punctuality (25), Prep (25), Interaction (25), Follow-up (15), Professionalism (10) | Evaluation Score | `src/lib/utils.ts:calculateInstructorEvaluation` | `TEST-4` |

---

### Rule Area 7: Appeals Due Process (Policy Section 8)
| Requirement | Official Rule | System Implementation Location | Test Evidence |
|---|---|---|---|
| **Submission Deadline** | Exactly 7 Egyptian working days | `src/lib/utils.ts:calculateWorkingDayDeadline` (Skips Fri & Sat) | `TEST-8` |
| **Neutrality Guarantee** | Reviewer independent of original decider | Server-side RBAC guard & UI check | `JOURNEY-C` |
| **Restoration on Upheld** | Full refund of disputed points | `src/lib/db-service.ts:updateAppealStatus` | `JOURNEY-C` |
