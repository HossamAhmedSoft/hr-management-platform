-- ============================================================
-- GDG NCTU HR Platform — Technical Tracks & Operations
-- Migration 004: Smart Reminders, Structured Feedback,
-- Submission Attempts & At-Risk Monitoring System
-- ============================================================

-- 1. Submission Attempts Table (Immutable attempt history)
CREATE TABLE IF NOT EXISTS track_submission_attempts (
  id VARCHAR(100) PRIMARY KEY,
  submission_id VARCHAR(100) NOT NULL REFERENCES track_submissions(id) ON DELETE CASCADE,
  assignment_id VARCHAR(100) NOT NULL REFERENCES track_assignments(id) ON DELETE CASCADE,
  enrollment_id VARCHAR(100) NOT NULL REFERENCES track_enrollments(id) ON DELETE CASCADE,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1,
  submission_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applicable_deadline TIMESTAMPTZ NOT NULL,
  is_late BOOLEAN NOT NULL DEFAULT FALSE,
  late_penalty_applied NUMERIC(5,2) DEFAULT 0.0,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  score NUMERIC(5,2),
  feedback JSONB, -- structured feedback fields
  reviewer_id VARCHAR(100),
  reviewer_name VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  revision_requested_at TIMESTAMPTZ,
  resubmission_deadline TIMESTAMPTZ,
  resubmission_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assignment_participant_attempt UNIQUE (assignment_id, participant_id, attempt_number)
);

-- 2. Grade Corrections Audit Trail (Post-publication alterations)
CREATE TABLE IF NOT EXISTS track_grade_corrections (
  id VARCHAR(100) PRIMARY KEY,
  attempt_id VARCHAR(100) NOT NULL REFERENCES track_submission_attempts(id) ON DELETE CASCADE,
  submission_id VARCHAR(100) NOT NULL REFERENCES track_submissions(id) ON DELETE CASCADE,
  assignment_id VARCHAR(100) NOT NULL REFERENCES track_assignments(id) ON DELETE CASCADE,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  previous_score NUMERIC(5,2),
  new_score NUMERIC(5,2) NOT NULL,
  previous_feedback TEXT,
  new_feedback TEXT,
  corrected_by VARCHAR(100) NOT NULL,
  corrected_by_name VARCHAR(255) NOT NULL,
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT NOT NULL
);

-- 3. Reminder Rules Table (Configurable reminder policies)
CREATE TABLE IF NOT EXISTS track_reminder_rules (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  reminder_type VARCHAR(100) NOT NULL,
  trigger_condition VARCHAR(100) NOT NULL,
  time_offset_hours INT NOT NULL, -- negative = before, positive = after
  recipient_role VARCHAR(100) NOT NULL,
  delivery_channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
  message_template TEXT NOT NULL,
  message_template_ar TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  track_id VARCHAR(100) NOT NULL DEFAULT 'all',
  cohort VARCHAR(100),
  quiet_hours_start VARCHAR(10) DEFAULT '22:00',
  quiet_hours_end VARCHAR(10) DEFAULT '08:00',
  max_reminders_per_event INT NOT NULL DEFAULT 2,
  frequency_hours INT DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Reminder Execution Log (Idempotent delivery tracking)
CREATE TABLE IF NOT EXISTS track_reminder_executions (
  id VARCHAR(100) PRIMARY KEY,
  rule_id VARCHAR(100) NOT NULL REFERENCES track_reminder_rules(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  event_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  recipient_id VARCHAR(100) NOT NULL,
  recipient_role VARCHAR(100) NOT NULL,
  delivery_channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
  status VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'failed', 'suppressed_cancelled', 'suppressed_completed', 'suppressed_duplicate'
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failure_reason TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE
);

-- 5. Track Notifications Table (In-app notification items)
CREATE TABLE IF NOT EXISTS track_notifications (
  id VARCHAR(100) PRIMARY KEY,
  recipient_id VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'assignments', 'sessions', 'feedback', 'follow_ups', 'admin'
  related_track_id VARCHAR(100),
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(100),
  link TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. At-Risk Rules Table (Configurable early support criteria)
CREATE TABLE IF NOT EXISTS track_risk_rules (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  trigger_type VARCHAR(100) NOT NULL,
  threshold_value NUMERIC(5,2) NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'needs_follow_up',
  track_id VARCHAR(100) NOT NULL DEFAULT 'all',
  cohort VARCHAR(100),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  recommended_action TEXT NOT NULL,
  recommended_action_ar TEXT NOT NULL,
  version VARCHAR(50) NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. At-Risk Follow-Up Cases Table
CREATE TABLE IF NOT EXISTS track_risk_follow_up_cases (
  id VARCHAR(100) PRIMARY KEY,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  participant_email VARCHAR(255) NOT NULL,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  track_name VARCHAR(255) NOT NULL,
  cohort VARCHAR(100) NOT NULL,
  risk_level VARCHAR(50) NOT NULL DEFAULT 'needs_follow_up', -- 'monitor', 'needs_follow_up', 'urgent_support', 'resolved'
  triggering_indicators JSONB NOT NULL,
  date_identified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_owner_id VARCHAR(100) NOT NULL,
  assigned_owner_name VARCHAR(255) NOT NULL,
  recommended_action TEXT NOT NULL,
  follow_up_deadline DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'assigned', 'contact_attempted', 'awaiting_response', 'support_plan_active', 'monitoring', 'resolved', 'closed'
  next_action TEXT,
  resolution_notes TEXT,
  resolution_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Case Action History Logs Table
CREATE TABLE IF NOT EXISTS track_case_action_logs (
  id VARCHAR(100) PRIMARY KEY,
  case_id VARCHAR(100) NOT NULL REFERENCES track_risk_follow_up_cases(id) ON DELETE CASCADE,
  actor_id VARCHAR(100) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  notes TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_assignment ON track_submission_attempts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_participant ON track_submission_attempts(participant_id);
CREATE INDEX IF NOT EXISTS idx_corrections_attempt ON track_grade_corrections(attempt_id);
CREATE INDEX IF NOT EXISTS idx_reminder_exec_key ON track_reminder_executions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON track_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_risk_cases_participant ON track_risk_follow_up_cases(participant_id);
CREATE INDEX IF NOT EXISTS idx_risk_cases_owner ON track_risk_follow_up_cases(assigned_owner_id);
CREATE INDEX IF NOT EXISTS idx_case_actions_case ON track_case_action_logs(case_id);
