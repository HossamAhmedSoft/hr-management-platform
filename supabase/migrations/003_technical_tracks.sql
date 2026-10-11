-- ============================================================
-- GDG NCTU HR Platform — Technical Tracks & Participants Domain
-- Migration 003: Tracks, Participants, Enrollments, Sessions,
-- Attendance, Assignments, Submissions, Bonus, Certificates
-- ============================================================

-- 1. Participants Table (Separate from core HR profiles)
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
  category VARCHAR(50) NOT NULL, -- 'web', 'mobile', 'cybersecurity', 'embedded', 'uiux'
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
  status VARCHAR(50) NOT NULL DEFAULT 'present', -- 'present', 'late', 'excused', 'absent'
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

-- 8. Dedicated Track Bonus Table (Separated from Core HR Points)
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

-- 10. Follow-Up / At-Risk Table
CREATE TABLE IF NOT EXISTS track_follow_ups (
  id VARCHAR(100) PRIMARY KEY,
  enrollment_id VARCHAR(100) NOT NULL REFERENCES track_enrollments(id) ON DELETE CASCADE,
  participant_id VARCHAR(100) NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  track_id VARCHAR(100) NOT NULL REFERENCES technical_tracks(id) ON DELETE CASCADE,
  risk_factors JSONB,
  responsible_person_id VARCHAR(100),
  responsible_person_name VARCHAR(255),
  action_plan TEXT NOT NULL,
  due_date DATE NOT NULL,
  outcome TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_track_enrollments_part ON track_enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_track_enrollments_track ON track_enrollments(track_id);
CREATE INDEX IF NOT EXISTS idx_track_sessions_track ON track_sessions(track_id);
CREATE INDEX IF NOT EXISTS idx_track_att_session ON track_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_track_sub_assignment ON track_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_track_bonus_enrollment ON track_bonuses(enrollment_id);
