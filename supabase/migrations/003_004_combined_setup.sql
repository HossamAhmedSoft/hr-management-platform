-- ============================================================
-- GDG NCTU HR Platform — Technical Tracks & Smart Features Complete Setup
-- Combines Migration 003 (Tracks Foundation) & Migration 004 (Smart Features)
-- Safe to run in Supabase SQL Editor (Uses CREATE TABLE IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- PART 1: TECHNICAL TRACKS FOUNDATION (From Migration 003)
-- ============================================================

-- 1. Participants Table
CREATE TABLE IF NOT EXISTS participants (
  id VARCHAR(100) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  university VARCHAR(255) DEFAULT 'New Cairo Technological University (NCTU)',
  faculty_department VARCHAR(255),
  academic_year VARCHAR(50),
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Technical Tracks Table
CREATE TABLE IF NOT EXISTS technical_tracks (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  cohort VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reg_open_date DATE,
  reg_close_date DATE,
  lead_id VARCHAR(100),
  lead_name VARCHAR(255),
  max_capacity INT NOT NULL DEFAULT 40,
  attendance_requirements NUMERIC(5,2) NOT NULL DEFAULT 75.0,
  attendance_weight NUMERIC(5,2) NOT NULL DEFAULT 40.0,
  assignment_weight NUMERIC(5,2) NOT NULL DEFAULT 30.0,
  participation_weight NUMERIC(5,2) NOT NULL DEFAULT 20.0,
  conduct_weight NUMERIC(5,2) NOT NULL DEFAULT 10.0,
  certificate_min_score NUMERIC(5,2) NOT NULL DEFAULT 75.0,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  syllabus JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Track Enrollments Table
CREATE TABLE IF NOT EXISTS track_enrollments (
  id VARCHAR(100) PRIMARY KEY,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  cohort VARCHAR(100) NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_progress NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  final_result NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  completion_status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
  withdrawal_date DATE,
  withdrawal_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_participant_track_cohort UNIQUE (participant_id, track_id, cohort)
);

-- 4. Track Sessions Table
CREATE TABLE IF NOT EXISTS track_sessions (
  id VARCHAR(100) PRIMARY KEY,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  cohort VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  instructor_id VARCHAR(100),
  instructor_name VARCHAR(255),
  location_or_link TEXT NOT NULL,
  materials_url TEXT,
  recording_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Track Attendance Records Table
CREATE TABLE IF NOT EXISTS track_attendance_records (
  id VARCHAR(100) PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL REFERENCES track_sessions(id) ON DELETE CASCADE,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  enrollment_id VARCHAR(100) NOT NULL REFERENCES track_enrollments(id) ON DELETE CASCADE,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'present',
  recorded_by VARCHAR(100),
  recorder_name VARCHAR(255),
  notes TEXT,
  excuse_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_session_participant UNIQUE (session_id, participant_id)
);

-- 6. Track Assignments Table
CREATE TABLE IF NOT EXISTS track_assignments (
  id VARCHAR(100) PRIMARY KEY,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  cohort VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  resources_url TEXT,
  publication_date DATE NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  max_score INT NOT NULL DEFAULT 100,
  weight_in_track NUMERIC(5,2),
  required_deliverables TEXT,
  submission_format VARCHAR(100) DEFAULT 'GitHub Repo URL',
  late_policy TEXT,
  revision_policy TEXT,
  reviewer_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Track Submissions Table
CREATE TABLE IF NOT EXISTS track_submissions (
  id VARCHAR(100) PRIMARY KEY,
  assignment_id VARCHAR(100) NOT NULL REFERENCES track_assignments(id) ON DELETE CASCADE,
  enrollment_id VARCHAR(100) NOT NULL REFERENCES track_enrollments(id) ON DELETE CASCADE,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  submission_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  score NUMERIC(5,2),
  reviewer_feedback TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  deadline_extension_date TIMESTAMPTZ,
  extended_by VARCHAR(255),
  extension_reason TEXT,
  revision_history JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assignment_participant UNIQUE (assignment_id, participant_id)
);

-- 8. Track Bonuses Table
CREATE TABLE IF NOT EXISTS track_bonuses (
  id VARCHAR(100) PRIMARY KEY,
  enrollment_id VARCHAR(100) NOT NULL REFERENCES track_enrollments(id) ON DELETE CASCADE,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  amount NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  evidence_url TEXT,
  recorded_by VARCHAR(255) NOT NULL,
  approval_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approval_reason TEXT,
  rejection_reason TEXT,
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Track Certificates Table
CREATE TABLE IF NOT EXISTS track_certificates (
  id VARCHAR(100) PRIMARY KEY,
  enrollment_id VARCHAR(100) NOT NULL REFERENCES track_enrollments(id) ON DELETE CASCADE,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  cohort VARCHAR(100) NOT NULL,
  certificate_code VARCHAR(100) NOT NULL UNIQUE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'issued',
  official_score NUMERIC(5,2) NOT NULL,
  issued_by VARCHAR(255) NOT NULL,
  verification_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 2: SMART REMINDERS, ATTEMPTS & AT-RISK (From Migration 004)
-- ============================================================

-- 10. Submission Attempts Table (Immutable attempt history)
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
  feedback JSONB,
  reviewer_id VARCHAR(100),
  reviewer_name VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  revision_requested_at TIMESTAMPTZ,
  resubmission_deadline TIMESTAMPTZ,
  resubmission_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assignment_participant_attempt UNIQUE (assignment_id, participant_id, attempt_number)
);

-- 11. Grade Corrections Audit Trail
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

-- 12. Reminder Rules Table
CREATE TABLE IF NOT EXISTS track_reminder_rules (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  reminder_type VARCHAR(100) NOT NULL,
  trigger_condition VARCHAR(100) NOT NULL,
  time_offset_hours INT NOT NULL,
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

-- 13. Reminder Execution Log
CREATE TABLE IF NOT EXISTS track_reminder_executions (
  id VARCHAR(100) PRIMARY KEY,
  rule_id VARCHAR(100) NOT NULL REFERENCES track_reminder_rules(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  event_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  recipient_id VARCHAR(100) NOT NULL,
  recipient_role VARCHAR(100) NOT NULL,
  delivery_channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
  status VARCHAR(50) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failure_reason TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE
);

-- 14. Track Notifications Table
CREATE TABLE IF NOT EXISTS track_notifications (
  id VARCHAR(100) PRIMARY KEY,
  recipient_id VARCHAR(100) NOT NULL,
  recipient_email VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  related_track_id VARCHAR(100),
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(100),
  link TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. At-Risk Rules Table
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

-- 16. At-Risk Follow-Up Cases Table
CREATE TABLE IF NOT EXISTS track_risk_follow_up_cases (
  id VARCHAR(100) PRIMARY KEY,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  participant_email VARCHAR(255) NOT NULL,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  track_name VARCHAR(255) NOT NULL,
  cohort VARCHAR(100) NOT NULL,
  risk_level VARCHAR(50) NOT NULL DEFAULT 'needs_follow_up',
  triggering_indicators JSONB NOT NULL,
  date_identified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_owner_id VARCHAR(100) NOT NULL,
  assigned_owner_name VARCHAR(255) NOT NULL,
  recommended_action TEXT NOT NULL,
  follow_up_deadline DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  next_action TEXT,
  resolution_notes TEXT,
  resolution_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Case Action History Logs Table
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
CREATE INDEX IF NOT EXISTS idx_track_enrollments_part ON track_enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_track_enrollments_track ON track_enrollments(track_id);
CREATE INDEX IF NOT EXISTS idx_track_sessions_track ON track_sessions(track_id);
CREATE INDEX IF NOT EXISTS idx_track_att_session ON track_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_track_sub_assignment ON track_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_assignment ON track_submission_attempts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_attempts_participant ON track_submission_attempts(participant_id);
CREATE INDEX IF NOT EXISTS idx_corrections_attempt ON track_grade_corrections(attempt_id);
CREATE INDEX IF NOT EXISTS idx_reminder_exec_key ON track_reminder_executions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON track_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_risk_cases_participant ON track_risk_follow_up_cases(participant_id);
CREATE INDEX IF NOT EXISTS idx_risk_cases_owner ON track_risk_follow_up_cases(assigned_owner_id);
CREATE INDEX IF NOT EXISTS idx_case_actions_case ON track_case_action_logs(case_id);
