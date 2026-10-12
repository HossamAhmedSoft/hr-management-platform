# Database Changes & Schema Migration Documentation
**Project:** GDG on Campus NCTU HR Management Platform  
**Migration File:** `supabase/migrations/004_smart_reminders_feedback_at_risk.sql`  
**Applied At:** October 2026  

---

## 1. Summary of Database Schema Changes
To support the three integrated features (Smart Reminders & Notifications, Assignment Feedback & Resubmission Attempts, At-Risk Students Monitoring & Follow-Up), 9 new tables and several column extensions to existing educational entities were introduced with proper foreign key cascades, unique idempotency constraints, and query indexes.

---

## 2. Table Specifications

### 2.1 Smart Reminders & Notifications

#### `track_reminder_rules`
Stores configurable reminder policies for tracks and cohorts.
- `id` (VARCHAR(64), PK): Unique rule identifier.
- `name` (VARCHAR(128)), `name_ar` (VARCHAR(128)): Bilingual rule titles.
- `reminder_type` (VARCHAR(64)): Rule trigger classification (`upcoming_deadline`, `overdue_assignment`, `upcoming_session`, `feedback_resubmission_requested`, `resubmission_deadline_approaching`, `assignment_awaiting_review`, `at_risk_follow_up_due`).
- `trigger_condition` (VARCHAR(64)): Metric condition string.
- `time_offset_hours` (INT): Offset relative to event (-72, -24, -3, +1, +48).
- `recipient_role` (VARCHAR(32)): Target audience (`participant`, `assigned_instructor`, `follow_up_owner`).
- `delivery_channel` (VARCHAR(32)): Delivery method (`in_app`, `email`, `webhook`).
- `message_template` (TEXT), `message_template_ar` (TEXT): Template string with dynamic placeholders (`{title}`, `{deadline}`, `{participant_name}`).
- `enabled` (BOOLEAN): Policy active state.
- `track_id` (VARCHAR(64)): Target track or `'all'`.
- `quiet_hours_start` (TIME), `quiet_hours_end` (TIME): Non-intrusive dispatch window.
- `max_reminders_per_event` (INT): Rate-limiting cap per event.

#### `track_reminder_logs`
Audit log recording every reminder evaluation and delivery attempt.
- `id` (VARCHAR(64), PK): Execution log entry ID.
- `rule_id` (VARCHAR(64), FK): References `track_reminder_rules(id)`.
- `event_id` (VARCHAR(64)): Associated assignment ID, session ID, or case ID.
- `recipient_id` (VARCHAR(64)): User receiving notification.
- `status` (VARCHAR(32)): `sent`, `delivered`, `failed`, `suppressed_completed`, `suppressed_cancelled`, `suppressed_duplicate`.
- `scheduled_at` (TIMESTAMPTZ), `processed_at` (TIMESTAMPTZ): Telemetry timestamps.
- `idempotency_key` (VARCHAR(128), UNIQUE): Deduplication key preventing concurrent/repeated sends.

#### `track_notification_items`
Persistent In-App notification feed entries.
- `id` (VARCHAR(64), PK): Notification entry ID.
- `recipient_id` (VARCHAR(64), INDEX): Target user profile/participant ID.
- `title` (VARCHAR(128)), `title_ar` (VARCHAR(128)): Bilingual notification headline.
- `message` (TEXT), `message_ar` (TEXT): Body text.
- `category` (VARCHAR(32)): `assignments`, `sessions`, `feedback`, `follow_ups`, `admin`.
- `link` (VARCHAR(256)): Resource deep-link.
- `is_read` (BOOLEAN DEFAULT FALSE): Read/unread flag.

---

### 2.2 Assignment Attempts, Feedback & Grade Audit

#### `track_submission_attempts`
Immutable attempt history preserving all versions submitted by participants.
- `id` (VARCHAR(64), PK): Unique attempt record ID.
- `submission_id` (VARCHAR(64), FK): References parent `track_submissions(id)`.
- `assignment_id` (VARCHAR(64), FK): References `track_assignments(id)`.
- `participant_id` (VARCHAR(64), FK): References `participants(id)`.
- `attempt_number` (INT NOT NULL): Sequential attempt counter (1, 2, 3...).
- `submission_url` (TEXT NOT NULL): Deliverable code URL.
- `submitted_at` (TIMESTAMPTZ NOT NULL): Submission timestamp.
- `applicable_deadline` (TIMESTAMPTZ NOT NULL): Original deadline or granted resubmission deadline.
- `is_late` (BOOLEAN DEFAULT FALSE): Late indicator.
- `status` (VARCHAR(32)): `submitted`, `submitted_late`, `revision_requested`, `resubmitted`, `accepted`, `graded`.
- `score` (NUMERIC(5,2)): Attempt score.
- `feedback` (JSONB): Structured feedback object (`what_went_well`, `needs_improvement`, `specific_corrections`, `required_changes_for_acceptance`).
- `reviewer_id` (VARCHAR(64)), `reviewer_name` (VARCHAR(128)): Grader identity.
- `resubmission_deadline` (TIMESTAMPTZ): Deadline for revision if requested.
- `resubmission_notes` (TEXT): Specific instructions for the revised attempt.
- **Unique Constraint:** `(assignment_id, participant_id, attempt_number)` guarantees attempt immutability.

#### `track_grade_corrections`
Formal audit trail for post-publication grade modifications.
- `id` (VARCHAR(64), PK): Audit entry ID.
- `attempt_id` (VARCHAR(64), FK): References `track_submission_attempts(id)`.
- `previous_score` (NUMERIC(5,2)), `new_score` (NUMERIC(5,2)): Score diff.
- `corrected_by` (VARCHAR(64)), `corrected_by_name` (VARCHAR(128)): Staff member.
- `reason` (TEXT NOT NULL): Required justification for grade modification.
- `corrected_at` (TIMESTAMPTZ DEFAULT NOW()): Audit timestamp.

---

### 2.3 At-Risk Students & Follow-Up Case Management

#### `track_risk_rules`
Configurable risk indicator thresholds.
- `id` (VARCHAR(64), PK): Unique rule identifier.
- `name` (VARCHAR(128)), `name_ar` (VARCHAR(128)): Bilingual titles.
- `trigger_type` (VARCHAR(64)): `attendance_threshold`, `consecutive_absences`, `missing_assignments`, `pending_resubmission_overdue`.
- `threshold_value` (NUMERIC(5,2)): Numeric cutoff boundary.
- `severity` (VARCHAR(32)): `monitor`, `needs_follow_up`, `urgent_support`, `resolved`.
- `enabled` (BOOLEAN DEFAULT TRUE): Active rule toggle.

#### `track_risk_follow_up_cases`
Deduplicated support cases assigned to mentors and HR members.
- `id` (VARCHAR(64), PK): Case ticket ID.
- `participant_id` (VARCHAR(64), FK): Target student.
- `track_id` (VARCHAR(64), FK): Academic track.
- `risk_level` (VARCHAR(32)): `urgent_support`, `needs_follow_up`, `monitor`, `resolved`.
- `triggering_indicators` (JSONB): Transparent evidence list with dates and calculations.
- `assigned_owner_id` (VARCHAR(64)), `assigned_owner_name` (VARCHAR(128)): Responsible mentor/HR.
- `follow_up_deadline` (DATE): Deadline for intervention.
- `status` (VARCHAR(32)): `new`, `assigned`, `contact_attempted`, `awaiting_participant_response`, `support_plan_active`, `monitoring`, `resolved`, `closed`.
- `resolution_notes` (TEXT), `resolution_date` (TIMESTAMPTZ): Closure details.

#### `track_case_action_logs`
Chronological action log tracking every supportive contact attempt on a case.
- `id` (VARCHAR(64), PK): Action log ID.
- `case_id` (VARCHAR(64), FK): References `track_risk_follow_up_cases(id)`.
- `action_type` (VARCHAR(64)): `office_hours_mentor`, `clarify_requirements`, `supportive_reminder`, `workload_extension`, `technical_blocker`.
- `description` (TEXT): Meeting notes or discussion summary.
- `performed_by_id` (VARCHAR(64)), `performed_by_name` (VARCHAR(128)): Actor.
- `participant_response` (TEXT): Student feedback.
- `agreed_next_steps` (TEXT): Action plan.
- `created_at` (TIMESTAMPTZ DEFAULT NOW()): Log timestamp.

---

## 3. Alterations to Existing Tables

```sql
-- Extend track_assignments with policy controls
ALTER TABLE track_assignments
  ADD COLUMN IF NOT EXISTS final_grade_policy VARCHAR(32) DEFAULT 'highest_approved',
  ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS allow_resubmission_after_deadline BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS rubric_criteria JSONB DEFAULT '[]'::jsonb;

-- Extend track_submissions with structured feedback link
ALTER TABLE track_submissions
  ADD COLUMN IF NOT EXISTS structured_feedback JSONB,
  ADD COLUMN IF NOT EXISTS current_attempt_number INT DEFAULT 1;
```
