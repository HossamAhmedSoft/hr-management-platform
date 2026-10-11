-- ============================================================
-- GDG NCTU HR Management Platform — RLS Policies & Seed Data
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ─────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS POLICIES
-- ─────────────────────────────────────────────────────────────

-- Profiles: Members can view directory, edit own contact info. Admins can edit all.
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "HR Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

-- Tasks: Viewable by team members; Editable by creators and Team Leads; Admin can manage all.
CREATE POLICY "Tasks viewable by team members or admins"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.auth_id = auth.uid()
      AND (
        p.role IN ('super_admin', 'hr_admin')
        OR p.team_id = tasks.team_id
        OR EXISTS (
          SELECT 1 FROM task_assignees ta
          WHERE ta.task_id = tasks.id AND ta.profile_id = p.id
        )
      )
    )
  );

-- Point Events: Members see their own. Team Leads see team. HR see all.
CREATE POLICY "Members view own point events"
  ON point_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.auth_id = auth.uid()
      AND (
        p.id = point_events.member_id
        OR p.role IN ('super_admin', 'hr_admin', 'hr_reviewer')
        OR (p.role = 'team_lead' AND p.team_id = point_events.team_id)
      )
    )
  );

-- Evaluations: Members can view finalized evaluations of themselves. Evaluators can view and edit their own drafts. HR sees all.
CREATE POLICY "Evaluations access policy"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.auth_id = auth.uid()
      AND (
        (p.id = evaluations.member_id AND evaluations.status = 'finalized')
        OR p.id = evaluations.evaluator_id
        OR p.role IN ('super_admin', 'hr_admin')
      )
    )
  );

-- Feedback Sessions: Member sees visible fields. Private notes protected.
CREATE POLICY "Feedback sessions access"
  ON feedback_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.auth_id = auth.uid()
      AND (
        p.id = feedback_sessions.member_id
        OR p.id = feedback_sessions.provider_id
        OR p.role IN ('super_admin', 'hr_admin')
      )
    )
  );

-- Incidents: STRICT ACCESS. Only target member (if non-confidential warning), reporter, and HR Admins.
CREATE POLICY "Incidents strict access"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.auth_id = auth.uid()
      AND (
        p.role IN ('super_admin', 'hr_admin')
        OR p.id = incidents.reported_by
        OR (p.id = incidents.target_member_id AND incidents.is_confidential = FALSE)
      )
    )
  );

-- Appeals: Submitter sees their appeal. Neutral reviewer and HR Admins can view/decide.
CREATE POLICY "Appeals access"
  ON appeals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.auth_id = auth.uid()
      AND (
        p.id = appeals.member_id
        OR p.id = appeals.neutral_reviewer_id
        OR p.role IN ('super_admin', 'hr_admin')
      )
    )
  );

-- Notifications: Strictly own notifications
CREATE POLICY "Own notifications only"
  ON notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.auth_id = auth.uid() AND p.id = notifications.recipient_id
    )
  );

-- Audit Logs: Read-only for Super Admin and HR Admin. Never modifiable or deletable by anyone.
CREATE POLICY "Audit logs super read"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.auth_id = auth.uid() AND p.role IN ('super_admin', 'hr_admin')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. AUDIT TRIGGER AUTOMATION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    previous_state,
    new_state
  ) VALUES (
    (SELECT id FROM profiles WHERE auth_id = auth.uid() LIMIT 1),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_point_events
  AFTER INSERT OR UPDATE OR DELETE ON point_events
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_evaluations
  AFTER INSERT OR UPDATE OR DELETE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_incidents
  AFTER INSERT OR UPDATE OR DELETE ON incidents
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_appeals
  AFTER INSERT OR UPDATE OR DELETE ON appeals
  FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 4. SEED DATA (GDG NCTU PLATFORM)
-- ─────────────────────────────────────────────────────────────

-- Teams
INSERT INTO teams (id, name, name_ar, description, type, status) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Human Resources', 'الموارد البشرية', 'Manages recruitment, performance, member growth and community harmony', 'non_technical', 'active'),
  ('11111111-1111-1111-1111-111111111102', 'Public Relations & Marketing', 'العلاقات العامة والتسويق', 'External outreach, sponsor relations, and event promotion', 'non_technical', 'active'),
  ('11111111-1111-1111-1111-111111111103', 'Operations & Logistics', 'العمليات واللوجستيات', 'Venue organization, equipment handling, and day-of-event operations', 'non_technical', 'active'),
  ('11111111-1111-1111-1111-111111111104', 'Media & Content', 'الإعلام والمحتوى', 'Visual design, video coverage, branding and digital media', 'non_technical', 'active'),
  ('11111111-1111-1111-1111-111111111105', 'Web Development Track', 'مسار تطوير الويب', 'Full-stack modern web technologies (Next.js, Node, Cloud)', 'technical', 'active'),
  ('11111111-1111-1111-1111-111111111106', 'Mobile Development Track', 'مسار تطوير الموبايل', 'Cross-platform mobile apps with Flutter and Kotlin', 'technical', 'active'),
  ('11111111-1111-1111-1111-111111111107', 'AI & Machine Learning Track', 'مسار الذكاء الاصطناعي', 'Deep learning, LLMs, and Python data science', 'technical', 'active'),
  ('11111111-1111-1111-1111-111111111108', 'Cyber Security Track', 'مسار الأمن السيبراني', 'Ethical hacking, defense mechanisms, and secure architectures', 'technical', 'active')
ON CONFLICT (id) DO NOTHING;

-- Initial Profiles (Admins, Team Leads, Members)
INSERT INTO profiles (id, email, full_name, role, team_id, status, join_date) VALUES
  ('22222222-2222-2222-2222-222222222201', 'lead@gdgnctu.com', 'Ahmed El-Sayed (GDG Lead)', 'super_admin', '11111111-1111-1111-1111-111111111101', 'active', '2025-09-01'),
  ('22222222-2222-2222-2222-222222222202', 'hr.head@gdgnctu.com', 'Sara Mahmoud (HR Lead)', 'hr_admin', '11111111-1111-1111-1111-111111111101', 'active', '2025-09-01'),
  ('22222222-2222-2222-2222-222222222203', 'hr.reviewer@gdgnctu.com', 'Omar Khaled (HR Reviewer)', 'hr_reviewer', '11111111-1111-1111-1111-111111111101', 'active', '2025-09-10'),
  ('22222222-2222-2222-2222-222222222204', 'web.lead@gdgnctu.com', 'Kareem Tarek (Web Lead)', 'team_lead', '11111111-1111-1111-1111-111111111105', 'active', '2025-09-05'),
  ('22222222-2222-2222-2222-222222222205', 'ai.lead@gdgnctu.com', 'Nourhan Adel (AI Lead)', 'team_lead', '11111111-1111-1111-1111-111111111107', 'active', '2025-09-05'),
  ('22222222-2222-2222-2222-222222222206', 'pr.lead@gdgnctu.com', 'Mostafa Hassan (PR Lead)', 'team_lead', '11111111-1111-1111-1111-111111111102', 'active', '2025-09-05'),
  ('22222222-2222-2222-2222-222222222207', 'youssef.ali@gdgnctu.com', 'Youssef Ali (Web Member)', 'member', '11111111-1111-1111-1111-111111111105', 'active', '2025-10-01'),
  ('22222222-2222-2222-2222-222222222208', 'mariam.fathy@gdgnctu.com', 'Mariam Fathy (Media Member)', 'member', '11111111-1111-1111-1111-111111111104', 'active', '2025-10-01'),
  ('22222222-2222-2222-2222-222222222209', 'ziad.ibrahim@gdgnctu.com', 'Ziad Ibrahim (AI Member)', 'member', '11111111-1111-1111-1111-111111111107', 'active', '2025-10-01')
ON CONFLICT (id) DO NOTHING;

-- Point Categories (Policy Table)
INSERT INTO point_categories (id, name, name_ar, direction, default_value, description, description_ar, is_investigation_referral) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Delivering high-priority task before deadline', 'تسليم مهمة ذات أولوية قبل الموعد', 'positive', 3.0, 'Task finished ahead of schedule with top quality', 'إنهاء المهمة قبل الموعد بجودة عالية', false),
  ('33333333-3333-3333-3333-333333333302', 'Outstanding initiative or innovative idea implemented', 'مبادرة متميزة أو فكرة مبتكرة مطبقة', 'positive', 3.0, 'Proposed and executed impactful enhancement', 'اقتراح وتنفيذ فكرة إيجابية مؤثرة', false),
  ('33333333-3333-3333-3333-333333333303', 'Voluntary support to another team', 'مساعدة تطوعية لفريق آخر', 'positive', 2.0, 'Helped another committee in critical milestone', 'مساعدة لجنة أخرى خلال حدث هام', false),
  ('33333333-3333-3333-3333-333333333304', 'Exceptional attendance and active engagement', 'التزام استثنائي وتفاعل فعال بالاجتماعات', 'positive', 2.0, '100% attendance with constructive input', 'حضور كامل وتفاعل مثمر بالنقاشات', false),
  ('33333333-3333-3333-3333-333333333305', 'Knowledge sharing workshop / Tech article', 'مشاركة المعرفة أو كتابة مقال تقني', 'positive', 2.0, 'Conducted peer session or published guide', 'تقديم ورشة عمل أو توثيق تقني', false),
  ('33333333-3333-3333-3333-333333333306', 'High-speed emergency task execution', 'تنفيذ مهمة طارئة سريعة', 'positive', 2.0, 'Executed urgent task with high speed', 'سرعة استثنائية في تنفيذ مهمة عاجلة', false),
  ('33333333-3333-3333-3333-333333333307', 'Special commendation from Team Lead', 'إشادة خاصة من قائد الفريق', 'positive', 1.0, 'Official commendation with documented reason', 'إشادة رسمية موثقة بسبب أداء متميز', false),
  ('33333333-3333-3333-3333-333333333311', 'Unexcused absence from mandatory meeting', 'غياب بدون عذر عن اجتماع رسمي', 'negative', -2.0, 'Missed mandatory meeting without notice', 'الغياب دون إخطار مسبق', false),
  ('33333333-3333-3333-3333-333333333312', 'Unexcused task delay (>24 hours)', 'تأخر غير مبرر في تسليم مهمة (>24 ساعة)', 'negative', -3.0, 'Exceeded deadline without approved delay request', 'تجاوز موعد التسليم دون طلب تأجيل مسبق', false),
  ('33333333-3333-3333-3333-333333333313', 'Poor quality requiring complete re-work', 'جودة ضعيفة تتطلب إعادة العمل كلياً', 'negative', -2.0, 'Deliverable failed acceptance criteria', 'المخرجات دون المعايير المطلوبة', false),
  ('33333333-3333-3333-3333-333333333314', 'Lack of communication / ghosting for 48h', 'انقطاع التواصل لأكثر من 48 ساعة دون عذر', 'negative', -3.0, 'Unresponsive during active milestone', 'عدم الرد أثناء مراحل العمل الحرجة', false),
  ('33333333-3333-3333-3333-333333333315', 'Serious violation (Academic integrity / Misconduct)', 'مخالفة جسيمة (نزاهة / سلوك مهني)', 'negative', 0.0, 'Referred immediately to investigation, NO fixed numeric penalty', 'إحالة فورية للتحقيق دون خصم رقمي مباشر', true)
ON CONFLICT (id) DO NOTHING;

-- Monthly 7 Cap Categories
INSERT INTO point_cap_categories (id, name, name_ar, points_per_event, monthly_cap) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Delivering high-priority task before deadline', 'تسليم مهمة ذات أولوية قبل الموعد', 3.0, 6.0),
  ('44444444-4444-4444-4444-444444444402', 'Outstanding initiative or innovative idea', 'مبادرة متميزة أو فكرة مبتكرة', 3.0, 6.0),
  ('44444444-4444-4444-4444-444444444403', 'Voluntary support to another team', 'مساعدة تطوعية لفريق آخر', 2.0, 4.0),
  ('44444444-4444-4444-4444-444444444404', 'Active engagement & attendance', 'التزام استثنائي وتفاعل فعال', 2.0, 4.0),
  ('44444444-4444-4444-4444-444444444405', 'Knowledge sharing workshop / documentation', 'مشاركة المعرفة أو توثيق مميز', 2.0, 4.0),
  ('44444444-4444-4444-4444-444444444406', 'High-speed emergency task execution', 'تنفيذ مهمة طارئة سريعة', 2.0, 4.0),
  ('44444444-4444-4444-4444-444444444407', 'Special commendation from Team Lead', 'إشادة خاصة من قائد الفريق', 1.0, 2.0)
ON CONFLICT (id) DO NOTHING;

-- Default Evaluation Template (Official 6 Categories with 30/25/15/10/10/10 weights)
INSERT INTO evaluation_templates (id, name, is_default) VALUES
  ('55555555-5555-5555-5555-555555555501', 'GDG NCTU General Member Evaluation (100 pts)', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO evaluation_categories (id, template_id, name, name_ar, weight, order_index, description) VALUES
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'Task Completion', 'إنجاز المهام والتسليمات', 30.0, 1, 'Timeliness, adherence to specifications, and milestone completion'),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 'Quality & Standards', 'جودة المخرجات والمعايير', 25.0, 2, 'Adherence to team quality guidelines, minimal rework required'),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555501', 'Reliability & Commitment', 'الاعتمادية والالتزام', 15.0, 3, 'Responsiveness, attendance at syncs, honoring commitments'),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555501', 'Knowledge Sharing & Teamwork', 'مشاركة المعرفة والعمل الجماعي', 10.0, 4, 'Assisting peers, positive collaboration, constructive input'),
  ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555501', 'Documentation & Reporting', 'التوثيق والتقارير', 10.0, 5, 'Clean documentation, status updates, reproducible deliverable records'),
  ('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555501', 'Growth & Initiative', 'التطور الشخصي والمبادرة', 10.0, 6, 'Proactivity, taking ownership, learning new technologies/skills')
ON CONFLICT (id) DO NOTHING;

-- Application Settings
INSERT INTO application_settings (id, organization_name, organization_name_ar) VALUES
  ('77777777-7777-7777-7777-777777777701', 'GDG on Campus New Cairo Technological University', 'GDG جامعة القاهرة التكنولوجية الجديدة')
ON CONFLICT (id) DO NOTHING;
