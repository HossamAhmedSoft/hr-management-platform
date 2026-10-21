-- ============================================================
-- GDG NCTU HR Management Platform — Registration & Admin Approval Workflow
-- Migration 006: Registration Requests, File Attachments,
-- Audit Events, Schema-Driven Dynamic Fields, and Global Settings
-- ============================================================

-- 1. Registration Requests Table
CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_no VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_email_verification',
  email VARCHAR(255) NOT NULL,
  email_verified_at TIMESTAMPTZ,
  email_verification_token VARCHAR(255),
  email_verification_expires_at TIMESTAMPTZ,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  submitted_data JSONB NOT NULL DEFAULT '{}',
  schema_version INT NOT NULL DEFAULT 1,
  locale VARCHAR(10) NOT NULL DEFAULT 'ar',
  ip_address VARCHAR(50),
  user_agent TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  decision_reason TEXT,
  reason_visible_to_applicant BOOLEAN NOT NULL DEFAULT TRUE,
  reapply_cooldown_until TIMESTAMPTZ,
  info_requested_fields JSONB,
  info_request_message TEXT,
  info_request_token VARCHAR(255),
  info_request_token_expires_at TIMESTAMPTZ,
  assigned_role VARCHAR(50) NOT NULL DEFAULT 'member',
  assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  promoted_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_registration_status CHECK (
    status IN (
      'pending_email_verification',
      'pending_approval',
      'needs_info',
      'approved',
      'rejected',
      'expired',
      'cancelled'
    )
  )
);

-- 2. Registration Request Files (Private KYC & Documents)
CREATE TABLE IF NOT EXISTS registration_request_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES registration_requests(id) ON DELETE CASCADE,
  file_key VARCHAR(100) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Registration Request Events (Immutable Audit Timeline)
CREATE TABLE IF NOT EXISTS registration_request_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES registration_requests(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  comment TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Dynamic Registration Fields Definition (Admin-Manageable Schema)
CREATE TABLE IF NOT EXISTS registration_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_key VARCHAR(100) NOT NULL UNIQUE,
  label_en VARCHAR(255) NOT NULL,
  label_ar VARCHAR(255) NOT NULL,
  help_text_en TEXT,
  help_text_ar TEXT,
  field_type VARCHAR(50) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  validation_rules JSONB NOT NULL DEFAULT '{}',
  options JSONB NOT NULL DEFAULT '[]',
  step_index INT NOT NULL DEFAULT 1,
  order_index INT NOT NULL DEFAULT 0,
  visibility_condition JSONB,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  maps_to VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Registration Global Settings
CREATE TABLE IF NOT EXISTS registration_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INDEXES FOR HIGH QUERY SPEED AND STRICT UNIQUENESS
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reg_requests_email ON registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_reg_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_reg_requests_ref ON registration_requests(reference_no);
CREATE INDEX IF NOT EXISTS idx_reg_requests_submitted ON registration_requests(submitted_at);
CREATE INDEX IF NOT EXISTS idx_reg_files_request ON registration_request_files(request_id);
CREATE INDEX IF NOT EXISTS idx_reg_events_request ON registration_request_events(request_id);
CREATE INDEX IF NOT EXISTS idx_reg_fields_active ON registration_fields(is_active, order_index);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_request_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_settings ENABLE ROW LEVEL SECURITY;

-- Reviewers & Admins can access all registration requests
CREATE POLICY "Admins can view and manage registration requests"
  ON registration_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = auth.uid()
      AND role IN ('super_admin', 'hr_admin', 'hr_reviewer')
    )
  );

-- Admins can view and manage registration files
CREATE POLICY "Admins can view registration files"
  ON registration_request_files FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = auth.uid()
      AND role IN ('super_admin', 'hr_admin', 'hr_reviewer')
    )
  );

-- Admins can view registration events
CREATE POLICY "Admins can view registration events"
  ON registration_request_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = auth.uid()
      AND role IN ('super_admin', 'hr_admin', 'hr_reviewer')
    )
  );

-- Active registration fields are viewable publicly to build the registration form
CREATE POLICY "Public can view active registration fields"
  ON registration_fields FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Admins can manage registration fields
CREATE POLICY "Admins can manage registration fields"
  ON registration_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

-- Registration settings read/write for admins
CREATE POLICY "Admins can manage registration settings"
  ON registration_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = auth.uid()
      AND role IN ('super_admin', 'hr_admin')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- SEED INITIAL REGISTRATION FIELDS (From Phase 0 Inventory)
-- ─────────────────────────────────────────────────────────────
INSERT INTO registration_fields (
  field_key, label_en, label_ar, help_text_en, help_text_ar,
  field_type, is_required, validation_rules, options,
  step_index, order_index, visibility_condition, is_sensitive, maps_to
) VALUES
  -- Step 1: Personal & Account
  ('full_name', 'Full Name (as in National ID)', 'الاسم الرباعي (طبقاً لبطاقة الرقم القومي)', 'Enter your official full name in Arabic or English', 'يرجى كتابة الاسم الرسمي كاملاً باللغة العربية أو الإنجليزية', 'text', TRUE, '{"min_length": 3, "max_length": 100}', '[]', 1, 1, NULL, FALSE, 'profiles.full_name'),
  ('email', 'Email Address', 'البريد الإلكتروني الرسمي', 'We will send a verification code to this email', 'سيتم إرسال رمز التحقق ومتابعة حالة الطلب إلى هذا البريد', 'email', TRUE, '{"regex": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"}', '[]', 1, 2, NULL, TRUE, 'profiles.email'),
  ('password', 'Account Password', 'كلمة مرور الحساب', 'At least 8 characters with letters and numbers', 'يجب ألا تقل عن 8 خانات وتحتوي على أحرف وأرقام', 'password', TRUE, '{"min_length": 8}', '[]', 1, 3, NULL, TRUE, 'registration_requests.password_hash'),
  ('phone', 'Phone Number (WhatsApp)', 'رقم الهاتف (واتساب)', 'Primary phone for communication and urgent announcements', 'رقم الهاتف الأساسي للتواصل وإعلانات الأنشطة العاجلة', 'phone', TRUE, '{"regex": "^(\\+?20|0)?1[0125][0-9]{8}$"}', '[]', 1, 4, NULL, TRUE, 'profiles.phone'),
  ('gender', 'Gender', 'النوع', 'Select your gender', 'يرجى تحديد النوع', 'select', TRUE, '{}', '[{"value": "male", "label_en": "Male", "label_ar": "ذكر"}, {"value": "female", "label_en": "Female", "label_ar": "أنثى"}]', 1, 5, NULL, TRUE, 'profiles.academic_notes.personal.gender'),
  ('date_of_birth', 'Date of Birth', 'تاريخ الميلاد', 'Must be between 16 and 35 years old', 'يجب أن يكون العمر بين 16 و 35 عاماً', 'date', TRUE, '{"min_age": 16, "max_age": 35}', '[]', 1, 6, NULL, TRUE, 'profiles.academic_notes.personal.dob'),

  -- Step 2: Academic & KYC Details
  ('national_id', 'National ID / Passport Number', 'الرقم القومي / رقم جواز السفر', '14 digits for Egyptian National ID or Passport Number', '14 رقماً للرقم القومي المصري أو رقم جواز السفر للوافدين', 'national_id', TRUE, '{"regex": "^[0-9]{14}$|^[A-Z0-9]{7,12}$"}', '[]', 2, 1, NULL, TRUE, 'profiles.academic_notes.kyc.national_id'),
  ('university', 'University / Institution', 'الجامعة / المؤسسة التعليمية', 'Select your university or college', 'اختر جامعتك أو مؤسستك التعليمية', 'select', TRUE, '{}', '[{"value": "nctu", "label_en": "New Cairo Technological University (NCTU)", "label_ar": "جامعة القاهرة التكنولوجية الجديدة (NCTU)"}, {"value": "other", "label_en": "Other University", "label_ar": "جامعة أخرى"}]', 2, 2, NULL, FALSE, 'profiles.academic_notes.academic.university'),
  ('faculty_department', 'Faculty / Specialization', 'الكلية / التخصص الدراسي', 'e.g. Information Technology, Autotronics, Mechatronics, Energy', 'مثل: تكنولوجيا المعلومات، الأوتوترونكس، الميكاترونكس، الطاقة', 'text', TRUE, '{"min_length": 2, "max_length": 150}', '[]', 2, 3, NULL, FALSE, 'profiles.academic_notes.academic.faculty'),
  ('academic_year', 'Academic Year', 'الفرقة الدراسية', 'Select your current academic stage', 'حدد مرحلتك الدراسية الحالية', 'select', TRUE, '{}', '[{"value": "year_1", "label_en": "Year 1 (Freshman)", "label_ar": "الفرقة الأولى"}, {"value": "year_2", "label_en": "Year 2 (Sophomore)", "label_ar": "الفرقة الثانية"}, {"value": "year_3", "label_en": "Year 3 (Junior)", "label_ar": "الفرقة الثالثة"}, {"value": "year_4", "label_en": "Year 4 (Senior)", "label_ar": "الفرقة الرابعة"}, {"value": "graduate", "label_en": "Recent Graduate", "label_ar": "خريج حديث"}]', 2, 4, NULL, FALSE, 'profiles.academic_notes.academic.year'),
  ('student_id_number', 'University Academic ID', 'الرقم الأكاديمي الجامعي (كارنيه الكلية)', 'Your official university seat or enrollment number', 'رقم القيد الجامعي المطبوع على البطاقة الجامعية إن وجد', 'text', FALSE, '{"max_length": 50}', '[]', 2, 5, NULL, TRUE, 'profiles.academic_notes.academic.student_id'),

  -- Step 3: Track & Experience
  ('preferred_track', 'Preferred Committee / Technical Track', 'اللجنة أو المسار التقني المطلوب الانضمام إليه', 'Select the track or team you are applying to join', 'حدد اللجنة أو المسار التقني الراغب في الانضمام له', 'select', TRUE, '{}', '[{"value": "team_web", "label_en": "Web Development Track", "label_ar": "مسار تطوير الويب"}, {"value": "team_mobile", "label_en": "Mobile App Development Track", "label_ar": "مسار تطبيقات الموبايل"}, {"value": "team_ai", "label_en": "AI & Machine Learning Track", "label_ar": "مسار الذكاء الاصطناعي"}, {"value": "team_cyber", "label_en": "Cybersecurity Track", "label_ar": "مسار الأمن السيبراني"}, {"value": "team_embedded", "label_en": "Embedded Systems & IoT", "label_ar": "الأنظمة المدمجة وإنترنت الأشياء"}, {"value": "team_uiux", "label_en": "UI/UX Design Track", "label_ar": "مسار تصميم واجهات المستخدم"}, {"value": "team_hr", "label_en": "Human Resources Committee", "label_ar": "لجنة الموارد البشرية"}, {"value": "team_media", "label_en": "Media & Content Creation", "label_ar": "لجنة الميديا وصناعة المحتوى"}, {"value": "team_pr", "label_en": "Public Relations & Marketing", "label_ar": "لجنة العلاقات العامة والتسويق"}, {"value": "team_ops", "label_en": "Operations & Logistics", "label_ar": "لجنة العمليات واللوجستيات"}]', 3, 1, NULL, FALSE, 'registration_requests.assigned_team_id'),
  ('experience_level', 'Experience Level', 'مستوى الخبرة في المجال المطلوب', 'Rate your technical/practical experience in this field', 'تقييم مستواك التقني أو العملي في المسار المختار', 'select', TRUE, '{}', '[{"value": "beginner", "label_en": "Beginner / Enthusiast", "label_ar": "مبتدئ / شغوف بالتعلم"}, {"value": "intermediate", "label_en": "Intermediate (Built Projects)", "label_ar": "متوسط (قمت بإنجاز مشاريع)"}, {"value": "advanced", "label_en": "Advanced / Production-ready", "label_ar": "متقدم / خبرة عملية"}]', 3, 2, NULL, FALSE, 'profiles.academic_notes.experience.level'),
  ('github_url', 'GitHub Profile URL', 'رابط حساب GitHub', 'Recommended for technical tracks to review code projects', 'يُوصى به للمسارات التقنية لمعاينة مشاريعك البرمجية', 'url', FALSE, '{"regex": "^https?:\\/\\/(www\\.)?github\\.com\\/.+"}', '[]', 3, 3, '{"field": "preferred_track", "operator": "in", "value": ["team_web", "team_mobile", "team_ai", "team_cyber", "team_embedded"]}', FALSE, 'profiles.academic_notes.social.github'),
  ('linkedin_url', 'LinkedIn Profile URL', 'رابط حساب LinkedIn', 'Professional profile link', 'رابط ملفك الشخصي المهني', 'url', FALSE, '{"regex": "^https?:\\/\\/(www\\.)?linkedin\\.com\\/in\\/.+"}', '[]', 3, 4, NULL, FALSE, 'profiles.academic_notes.social.linkedin'),
  ('bio_or_motivation', 'Why do you want to join GDG NCTU?', 'لماذا ترغب في الانضمام إلى مجتمع GDG NCTU؟', 'Briefly describe your goals, motivation, and what you will add to the chapter', 'اكتب بإيجاز عن دوافعك، أهدافك، وماذا ستضيف لمجتمعنا الطلابي', 'textarea', TRUE, '{"min_length": 30, "max_length": 1000}', '[]', 3, 5, NULL, FALSE, 'profiles.bio'),

  -- Step 4: Verification Documents & Consent
  ('id_card_doc', 'National ID / Student ID Photo', 'صورة بطاقة الرقم القومي أو الكارنيه الجامعي', 'Upload a clear image or PDF (Max 5MB) for verification', 'ارفع صورة واضحة لبطاقة الرقم القومي أو الكارنيه الجامعي (أقصى حجم 5 ميجابايت)', 'file_upload', TRUE, '{"allowed_file_types": ["jpg", "jpeg", "png", "pdf"], "max_file_size_mb": 5}', '[]', 4, 1, NULL, TRUE, 'registration_request_files.id_card_doc'),
  ('cv_resume_doc', 'CV / Resume (Optional)', 'السيرة الذاتية (اختياري)', 'Upload your CV in PDF format (Max 10MB)', 'ارفع سيرتك الذاتية بصيغة PDF إن توفرت (أقصى حجم 10 ميجابايت)', 'file_upload', FALSE, '{"allowed_file_types": ["pdf"], "max_file_size_mb": 10}', '[]', 4, 2, NULL, FALSE, 'registration_request_files.cv_resume_doc'),
  ('terms_accepted', 'Accept Code of Conduct & Platform Policy', 'الموافقة على ميثاق السلوك ولائحة المجتمع', 'I agree to abide by GDG community guidelines and attendance policies', 'أوافق على الالتزام بميثاق أخلاقيات وسلوكيات GDG وقواعد الحضور والأداء الرسمية', 'checkbox', TRUE, '{}', '[]', 4, 3, NULL, FALSE, 'profiles.academic_notes.consent.terms_accepted')
ON CONFLICT (field_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SEED INITIAL REGISTRATION SETTINGS
-- ─────────────────────────────────────────────────────────────
INSERT INTO registration_settings (key, value, description) VALUES
  ('registration_mode', '"OPEN_WITH_APPROVAL"', 'Registration mode: OPEN_WITH_APPROVAL, INVITE_ONLY, DOMAIN_RESTRICTED, or CLOSED'),
  ('allowed_domains', '[]', 'Allowed email domains for DOMAIN_RESTRICTED mode, e.g. ["nctu.edu.eg"]'),
  ('auto_approve_enabled', 'false', 'Automatically approve requests matching specific rules (default: false)'),
  ('expiry_days', '30', 'Days before unverified or abandoned requests expire automatically'),
  ('reject_cooldown_days', '14', 'Days an applicant must wait before re-applying after rejection'),
  ('sla_warning_hours', '48', 'Hours before a pending request triggers an SLA review warning'),
  ('default_assigned_role', '"member"', 'Default UserRole assigned upon approval unless changed by admin'),
  ('schema_version', '1', 'Current active schema version number')
ON CONFLICT (key) DO NOTHING;
