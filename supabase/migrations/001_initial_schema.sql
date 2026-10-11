-- ============================================================
-- GDG NCTU HR Management Platform — Complete Database Schema
-- 50+ Tables with Foreign Keys, Enums, Indexes, and Constraints
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. USER & AUTH DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'hr_admin',
  'hr_reviewer',
  'team_lead',
  'member',
  'track_lead',
  'lead_instructor',
  'ta_mentor',
  'attendee'
);

CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended', 'archived');

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  team_id UUID,
  status member_status NOT NULL DEFAULT 'active',
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  phone VARCHAR(50),
  academic_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  UNIQUE(role, resource, action)
);

-- ─────────────────────────────────────────────────────────────
-- 2. ORGANIZATION DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'technical', -- 'technical' | 'non_technical'
  lead_id UUID REFERENCES profiles(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Circular FK link from profiles to teams
ALTER TABLE profiles ADD CONSTRAINT fk_profile_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS team_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'member',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'joined', 'left', 'promoted', 'transferred'
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. TASKS DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TYPE task_status AS ENUM (
  'draft',
  'assigned',
  'in_progress',
  'blocked',
  'submitted',
  'under_review',
  'revision_required',
  'completed',
  'cancelled'
);

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  status task_status NOT NULL DEFAULT 'draft',
  priority task_priority NOT NULL DEFAULT 'medium',
  start_date DATE,
  deadline TIMESTAMPTZ NOT NULL,
  delivery_date TIMESTAMPTZ,
  deliverables TEXT,
  acceptance_criteria TEXT,
  reference_links TEXT[],
  review_status VARCHAR(50) DEFAULT 'pending',
  reviewer_comments TEXT,
  evidence_links TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(task_id, profile_id)
);

CREATE TABLE IF NOT EXISTS task_deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  file_url TEXT,
  description TEXT,
  version INT NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  from_status task_status,
  to_status task_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_delay_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  proposed_deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. POINTS LEDGER DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TYPE point_direction AS ENUM ('positive', 'negative');
CREATE TYPE point_event_status AS ENUM ('draft', 'submitted', 'pending_review', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS point_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  direction point_direction NOT NULL,
  default_value NUMERIC(6,2) NOT NULL,
  description TEXT,
  description_ar TEXT,
  is_investigation_referral BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_cap_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  points_per_event NUMERIC(6,2) NOT NULL,
  monthly_cap NUMERIC(6,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_cap_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  point_category_id UUID NOT NULL REFERENCES point_categories(id) ON DELETE CASCADE,
  cap_category_id UUID NOT NULL REFERENCES point_cap_categories(id) ON DELETE CASCADE,
  is_ambiguous BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  UNIQUE(point_category_id, cap_category_id)
);

CREATE TABLE IF NOT EXISTS point_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID NOT NULL REFERENCES point_categories(id),
  cap_category_id UUID REFERENCES point_cap_categories(id),
  direction point_direction NOT NULL,
  value NUMERIC(6,2) NOT NULL,
  explanation TEXT NOT NULL,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  evidence_url TEXT,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  status point_event_status NOT NULL DEFAULT 'draft',
  member_notified_at TIMESTAMPTZ,
  member_explanation TEXT,
  reviewer_id UUID REFERENCES profiles(id),
  decision VARCHAR(20), -- 'approved' | 'rejected'
  decision_at TIMESTAMPTZ,
  decision_rationale TEXT,
  duplicate_ref_id UUID REFERENCES point_events(id),
  policy_version_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_event_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  point_event_id UUID NOT NULL REFERENCES point_events(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_event_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  point_event_id UUID NOT NULL REFERENCES point_events(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  decision VARCHAR(20) NOT NULL, -- 'approved' | 'rejected'
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 5. EVALUATIONS DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TYPE evaluation_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'finalized',
  'reopened'
);

CREATE TABLE IF NOT EXISTS evaluation_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open' | 'closed' | 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES evaluation_templates(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS evaluation_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES evaluation_templates(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  weight NUMERIC(5,2) NOT NULL, -- standard: 30, 25, 15, 10, 10, 10
  order_index INT NOT NULL DEFAULT 0,
  description TEXT
);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  period_id UUID NOT NULL REFERENCES evaluation_periods(id),
  template_id UUID NOT NULL REFERENCES evaluation_templates(id),
  status evaluation_status NOT NULL DEFAULT 'draft',
  total_score NUMERIC(5,2),
  performance_band VARCHAR(100),
  self_assessment_notes TEXT,
  hr_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, period_id)
);

CREATE TABLE IF NOT EXISTS evaluation_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES evaluation_categories(id) ON DELETE CASCADE,
  rating NUMERIC(3,1), -- 1.0 to 5.0, or NULL for N/A
  na_reason TEXT,
  evidence TEXT,
  UNIQUE(evaluation_id, category_id)
);

CREATE TABLE IF NOT EXISTS evaluation_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_review_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  from_status evaluation_status,
  to_status evaluation_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 6. FEEDBACK & PIP DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedback_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES profiles(id),
  related_evaluation_id UUID REFERENCES evaluations(id) ON DELETE SET NULL,
  related_incident_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  strengths TEXT NOT NULL,
  improvement_area TEXT NOT NULL,
  next_step TEXT NOT NULL,
  support_required TEXT NOT NULL,
  follow_up_date DATE NOT NULL,
  member_comments TEXT,
  hr_private_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'completed' | 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_action_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES feedback_sessions(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  target_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS improvement_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  concern TEXT NOT NULL,
  evidence TEXT NOT NULL,
  agreed_actions TEXT NOT NULL,
  support_required TEXT NOT NULL,
  responsible_person_id UUID NOT NULL REFERENCES profiles(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE NOT NULL,
  follow_up_schedule TEXT NOT NULL,
  progress_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'failed' | 'escalated'
  closure_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 7. INCIDENTS & ESCALATIONS DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  target_member_id UUID NOT NULL REFERENCES profiles(id),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  evidence_url TEXT,
  escalation_level INT NOT NULL DEFAULT 1, -- 1: Friendly Warning, 2: PIP, 3: Team Review, 4: Leadership Escalation
  status VARCHAR(30) NOT NULL DEFAULT 'open', -- 'open' | 'investigating' | 'resolved' | 'closed'
  decision_notes TEXT,
  is_confidential BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feedback_sessions ADD CONSTRAINT fk_feedback_incident FOREIGN KEY (related_incident_id) REFERENCES incidents(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS incident_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  findings TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escalation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  from_level INT,
  to_level INT NOT NULL,
  escalated_by UUID NOT NULL REFERENCES profiles(id),
  rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 8. APPEALS & GRIEVANCES DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'point_event' | 'evaluation' | 'incident'
  entity_id UUID NOT NULL,
  grounds TEXT NOT NULL,
  evidence_url TEXT,
  deadline_date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted', -- 'draft' | 'submitted' | 'under_review' | 'upheld' | 'rejected' | 'closed'
  neutral_reviewer_id UUID REFERENCES profiles(id),
  decision VARCHAR(30),
  decision_rationale TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appeal_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appeal_id UUID NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  finding_notes TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 9. EDUCATIONAL TRACKS DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS educational_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  name_ar VARCHAR(150) NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES profiles(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS educational_cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES educational_tracks(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS educational_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES educational_cohorts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  instructor_id UUID REFERENCES profiles(id),
  session_date TIMESTAMPTZ NOT NULL,
  recording_url TEXT,
  slides_url TEXT,
  attendance_code VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES educational_cohorts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  is_certified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendee_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES educational_cohorts(id),
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  attendance_punctuality NUMERIC(5,2) NOT NULL DEFAULT 0, -- max 40
  assignments_projects NUMERIC(5,2) NOT NULL DEFAULT 0,   -- max 30
  participation_interaction NUMERIC(5,2) NOT NULL DEFAULT 0, -- max 20
  conduct_collaboration NUMERIC(5,2) NOT NULL DEFAULT 0,  -- max 10
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,           -- sum out of 100
  is_certified BOOLEAN NOT NULL DEFAULT FALSE,           -- >= 75%
  feedback_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructor_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  cohort_id UUID NOT NULL REFERENCES educational_cohorts(id),
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  punctuality NUMERIC(5,2) NOT NULL DEFAULT 0,             -- max 25
  preparation_quality NUMERIC(5,2) NOT NULL DEFAULT 0,     -- max 25
  explanation_interaction NUMERIC(5,2) NOT NULL DEFAULT 0, -- max 25
  student_followup NUMERIC(5,2) NOT NULL DEFAULT 0,        -- max 15
  professionalism NUMERIC(5,2) NOT NULL DEFAULT 0,         -- max 10
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,             -- sum out of 100
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID NOT NULL REFERENCES profiles(id),
  cohort_id UUID NOT NULL REFERENCES educational_cohorts(id),
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 10. EVENTS & ATTENDANCE DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'meeting', 'workshop', 'general_assembly'
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES educational_sessions(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'excused', 'late'
  reason_for_absence TEXT,
  absence_category VARCHAR(50), -- 'academic', 'medical', 'emergency', 'other'
  recorded_by UUID REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_event_or_session CHECK (event_id IS NOT NULL OR session_id IS NOT NULL),
  CONSTRAINT check_member_or_attendee CHECK (member_id IS NOT NULL OR attendee_id IS NOT NULL)
);

-- ─────────────────────────────────────────────────────────────
-- 11. NOTIFICATIONS & PREFERENCES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'point_alert', 'task_deadline', 'evaluation_ready', 'appeal_update'
  entity_type VARCHAR(50),
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  task_updates BOOLEAN NOT NULL DEFAULT TRUE,
  point_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  evaluations_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  UNIQUE(profile_id)
);

-- ─────────────────────────────────────────────────────────────
-- 12. POLICY & SETTINGS DOMAIN
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  effective_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  published_by UUID REFERENCES profiles(id),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 13. SYSTEM AUDIT LOGS & IMPORTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  previous_state JSONB,
  new_state JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(50) NOT NULL, -- 'members', 'tasks', 'historical_points'
  file_name VARCHAR(255) NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  successful_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  error_log JSONB,
  initiated_by UUID NOT NULL REFERENCES profiles(id),
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS application_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name VARCHAR(255) NOT NULL DEFAULT 'GDG on Campus New Cairo Technological University',
  organization_name_ar VARCHAR(255) NOT NULL DEFAULT 'GDG جامعة القاهرة التكنولوجية الجديدة',
  working_days INT[] NOT NULL DEFAULT '{0,1,2,3,4}', -- Sun to Thu (Egypt)
  weekend_days INT[] NOT NULL DEFAULT '{5,6}',       -- Fri, Sat
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_point_events_member ON point_events(member_id);
CREATE INDEX IF NOT EXISTS idx_point_events_status ON point_events(status);
CREATE INDEX IF NOT EXISTS idx_point_events_date ON point_events(event_date);
CREATE INDEX IF NOT EXISTS idx_evaluations_member ON evaluations(member_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON evaluations(period_id);
CREATE INDEX IF NOT EXISTS idx_feedback_member ON feedback_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_incidents_member ON incidents(target_member_id);
CREATE INDEX IF NOT EXISTS idx_appeals_member ON appeals(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
