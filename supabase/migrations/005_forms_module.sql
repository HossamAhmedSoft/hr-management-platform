-- ============================================================
-- GDG NCTU HR Management Platform — Native Forms Module
-- Migration 005: Full Google Forms Equivalent
-- Immutable Versioning, Builder Schema, Dynamic Logic,
-- Automations, Webhooks, Entity Links, and Responses
-- ============================================================

-- 1. Forms Master Table
CREATE TABLE IF NOT EXISTS forms (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description TEXT,
  description_ar TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'closed', 'archived'
  access_mode VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public', 'authenticated', 'roles', 'specific_users'
  allowed_roles TEXT[], -- e.g. ARRAY['member', 'team_lead']
  allowed_user_ids TEXT[],
  current_version_id VARCHAR(100),
  theme_config JSONB DEFAULT '{"primaryColor": "#1a73e8", "accentColor": "#4285F4", "backgroundColor": "#f8f9fa", "font": "Inter", "rounded": "rounded-xl"}'::jsonb,
  settings JSONB DEFAULT '{"limit_one_response": false, "allow_edit": false, "response_cap": null, "open_date": null, "close_date": null, "confirmation_message": "Your response has been recorded.", "confirmation_message_ar": "تم تسجيل ردك بنجاح.", "redirect_url": null, "show_progress_bar": true, "shuffle_questions": false, "collect_email": true}'::jsonb,
  quiz_settings JSONB DEFAULT '{"is_quiz": false, "total_points": 0, "show_score_immediate": true, "show_correct_answers": false}'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  logic_rules JSONB DEFAULT '[]'::jsonb,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  template_category VARCHAR(100),
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for slugs and status
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON forms(created_by);

-- 2. Immutable Form Versions
-- Crucial: Editing a form after publication creates a new immutable version snapshot.
-- Responses are tied to the exact version submitted against.
CREATE TABLE IF NOT EXISTS form_versions (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  schema_snapshot JSONB NOT NULL, -- frozen snapshot: { sections, questions, logic_rules, settings, quiz_settings }
  published_by VARCHAR(100) NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changelog TEXT,
  CONSTRAINT uq_form_version UNIQUE (form_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON form_versions(form_id);

-- Add Foreign Key for forms.current_version_id
ALTER TABLE forms DROP CONSTRAINT IF EXISTS fk_forms_current_version;
ALTER TABLE forms ADD CONSTRAINT fk_forms_current_version FOREIGN KEY (current_version_id) REFERENCES form_versions(id) ON DELETE SET NULL;

-- 3. Form Sections / Pages
CREATE TABLE IF NOT EXISTS form_sections (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description TEXT,
  description_ar TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_sections_form ON form_sections(form_id, order_index);

-- 4. Form Questions
CREATE TABLE IF NOT EXISTS form_questions (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  section_id VARCHAR(100) NOT NULL REFERENCES form_sections(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- short_text, paragraph, multiple_choice, checkboxes, dropdown, linear_scale, rating, date, time, number, email, phone, url, file_upload, matrix_radio, matrix_checkbox, ranking
  title VARCHAR(500) NOT NULL,
  title_ar VARCHAR(500) NOT NULL,
  description TEXT,
  description_ar TEXT,
  placeholder VARCHAR(255),
  placeholder_ar VARCHAR(255),
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INT NOT NULL DEFAULT 0,
  options JSONB DEFAULT '[]'::jsonb, -- array of { id, label, label_ar, value, points, is_correct }
  validation JSONB DEFAULT '{}'::jsonb, -- min, max, regex, min_length, max_length, allowed_file_types, max_file_size_mb
  scoring JSONB DEFAULT '{}'::jsonb, -- points, correct_answers, feedback, feedback_ar
  settings JSONB DEFAULT '{}'::jsonb, -- allow_other, shuffle_options, scale_min, scale_max, matrix_rows, matrix_columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_questions_form_section ON form_questions(form_id, section_id, order_index);

-- 5. Conditional Logic Rules
CREATE TABLE IF NOT EXISTS form_logic_rules (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  source_question_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'jump_to_section', 'submit_form', 'show_question', 'hide_question'
  target_id VARCHAR(100) NOT NULL, -- section_id or question_id
  conditions JSONB NOT NULL, -- array of { question_id, operator, value, combinator: 'AND'|'OR' }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_logic_rules_form ON form_logic_rules(form_id);

-- 6. Form Collaborators (RBAC Integration)
CREATE TABLE IF NOT EXISTS form_collaborators (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  profile_id VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'viewer', 'response_viewer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_form_collaborator UNIQUE (form_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_form_collaborators_profile ON form_collaborators(profile_id);

-- 7. Form Responses Master
CREATE TABLE IF NOT EXISTS form_responses (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  form_version_id VARCHAR(100) NOT NULL REFERENCES form_versions(id) ON DELETE CASCADE,
  respondent_id VARCHAR(100), -- nullable for anonymous submissions
  respondent_email VARCHAR(255),
  respondent_name VARCHAR(255),
  ip_hash VARCHAR(64),
  session_token VARCHAR(100),
  is_draft BOOLEAN NOT NULL DEFAULT FALSE,
  score NUMERIC(6,2),
  total_points_possible NUMERIC(6,2),
  percentage NUMERIC(5,2),
  completion_time_seconds INT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_responses_form ON form_responses(form_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_responses_version ON form_responses(form_version_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_respondent ON form_responses(respondent_id);

-- 8. Form Response Answers (One row per answered question)
CREATE TABLE IF NOT EXISTS form_answers (
  id VARCHAR(100) PRIMARY KEY,
  response_id VARCHAR(100) NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id VARCHAR(100) NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  answer_value JSONB NOT NULL, -- primitive string, number, array of strings, or object
  score_awarded NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_answers_response ON form_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_form_answers_question ON form_answers(question_id);

-- 9. Form Response Uploaded Files
CREATE TABLE IF NOT EXISTS form_response_files (
  id VARCHAR(100) PRIMARY KEY,
  response_id VARCHAR(100) NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_response_files_response ON form_response_files(response_id);

-- 10. Deep System Entity Links
CREATE TABLE IF NOT EXISTS form_entity_links (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'task', 'profile', 'team', 'track', 'incident', 'evaluation', 'appeal'
  entity_id VARCHAR(100), -- specific entity ID, or null for all entities of that type
  link_mode VARCHAR(50) NOT NULL DEFAULT 'tab', -- 'tab', 'intake', 'mandatory_milestone'
  field_mappings JSONB DEFAULT '{}'::jsonb, -- maps question_id to entity column name
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_entity_links_entity ON form_entity_links(entity_type, entity_id);

-- 11. Form Automations & Workflow Triggers
CREATE TABLE IF NOT EXISTS form_automations (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(50) NOT NULL, -- 'response_submitted', 'score_threshold', 'specific_answer'
  trigger_config JSONB DEFAULT '{}'::jsonb, -- e.g. { "min_score": 80, "question_id": "q1", "equals": "yes" }
  action_type VARCHAR(50) NOT NULL, -- 'create_task', 'award_points', 'create_incident', 'send_notification', 'webhook', 'update_field'
  action_config JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_automations_form ON form_automations(form_id);

-- 12. Outgoing Webhooks & Delivery Logs
CREATE TABLE IF NOT EXISTS form_webhooks (
  id VARCHAR(100) PRIMARY KEY,
  form_id VARCHAR(100) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret_key VARCHAR(255) NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['response.submitted'],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  custom_headers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_webhook_deliveries (
  id VARCHAR(100) PRIMARY KEY,
  webhook_id VARCHAR(100) NOT NULL REFERENCES form_webhooks(id) ON DELETE CASCADE,
  event_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
  status_code INT,
  request_payload JSONB NOT NULL,
  response_body TEXT,
  error_message TEXT,
  duration_ms INT,
  retry_count INT NOT NULL DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries ON form_webhook_deliveries(webhook_id, created_at DESC);

-- 13. System Template Library
CREATE TABLE IF NOT EXISTS form_templates (
  id VARCHAR(100) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'FileText',
  schema_snapshot JSONB NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_logic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_webhooks ENABLE ROW LEVEL SECURITY;

-- Forms: Published forms are readable by all (anon & authenticated); drafts by authenticated
CREATE POLICY "Public and users can view published forms"
  ON forms FOR SELECT
  USING (status = 'published' OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create forms"
  ON forms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update forms"
  ON forms FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete forms"
  ON forms FOR DELETE
  TO authenticated
  USING (true);

-- Form Versions: readable by everyone
CREATE POLICY "Form versions viewable by all"
  ON form_versions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create form versions"
  ON form_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Form Responses: Anyone can submit responses; authenticated can view responses
CREATE POLICY "Anyone can submit form responses"
  ON form_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view responses"
  ON form_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete responses"
  ON form_responses FOR DELETE
  TO authenticated
  USING (true);

-- Templates: viewable by all
CREATE POLICY "Form templates viewable by all"
  ON form_templates FOR SELECT
  USING (true);

