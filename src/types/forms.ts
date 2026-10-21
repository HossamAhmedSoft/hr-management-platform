// ============================================================
// GDG NCTU HR Management Platform — Native Forms Module Types
// ============================================================

import { UserRole, Profile } from "./index";

export type FormStatus = "draft" | "published" | "closed" | "archived";

export type FormAccessMode = "public" | "authenticated" | "roles" | "specific_users";

export type FormCollaboratorRole = "owner" | "editor" | "viewer" | "response_viewer";

export interface FormThemeConfig {
  primaryColor: string; // e.g. #1a73e8 (Google Blue)
  accentColor: string; // e.g. #4285F4
  backgroundColor: string; // e.g. #f8f9fa
  coverImageUrl?: string;
  headerLogoUrl?: string;
  font?: string; // 'Inter' | 'Cairo' | 'Roboto'
  rounded?: "rounded-md" | "rounded-xl" | "rounded-2xl";
}

export interface FormSettings {
  limit_one_response: boolean;
  allow_edit: boolean;
  response_cap?: number | null;
  open_date?: string | null;
  close_date?: string | null;
  confirmation_message: string;
  confirmation_message_ar: string;
  redirect_url?: string | null;
  show_progress_bar: boolean;
  shuffle_questions: boolean;
  collect_email: boolean;
  auto_collect_user_profile: boolean;
}

export interface QuizSettings {
  is_quiz: boolean;
  total_points: number;
  show_score_immediate: boolean;
  show_correct_answers: boolean;
  passing_score_percentage?: number;
}

export interface Form {
  id: string;
  slug: string;
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  status: FormStatus;
  access_mode: FormAccessMode;
  allowed_roles?: UserRole[];
  allowed_user_ids?: string[];
  current_version_id?: string;
  current_version_number?: number;
  theme_config: FormThemeConfig;
  settings: FormSettings;
  quiz_settings: QuizSettings;
  is_template?: boolean;
  template_category?: string;
  created_by: string;
  creator?: Profile;
  sections?: FormSection[];
  questions?: FormQuestion[];
  logic_rules?: FormLogicRule[];
  collaborators?: FormCollaborator[];
  response_count?: number;
  created_at: string;
  updated_at: string;
}

export interface FormVersion {
  id: string;
  form_id: string;
  version_number: number;
  schema_snapshot: FormVersionSnapshot;
  published_by: string;
  published_at: string;
  changelog?: string;
}

export interface FormVersionSnapshot {
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  theme_config: FormThemeConfig;
  settings: FormSettings;
  quiz_settings: QuizSettings;
  sections: FormSection[];
  questions: FormQuestion[];
  logic_rules: FormLogicRule[];
}

export interface FormSection {
  id: string;
  form_id: string;
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  order_index: number;
  created_at?: string;
}

export type QuestionType =
  | "short_text"
  | "paragraph"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "linear_scale"
  | "rating"
  | "date"
  | "time"
  | "number"
  | "email"
  | "phone"
  | "url"
  | "file_upload"
  | "matrix_radio"
  | "matrix_checkbox"
  | "ranking";

export interface QuestionOption {
  id: string;
  label: string;
  label_ar?: string;
  value: string;
  points?: number;
  is_correct?: boolean;
}

export interface QuestionValidation {
  min?: number;
  max?: number;
  regex?: string;
  regex_error_message?: string;
  regex_error_message_ar?: string;
  min_length?: number;
  max_length?: number;
  allowed_file_types?: string[]; // e.g. ['pdf', 'png', 'jpg', 'docx', 'zip']
  max_file_size_mb?: number;
}

export interface QuestionScoring {
  points: number;
  correct_answers?: string[]; // option ids or exact text
  feedback?: string;
  feedback_ar?: string;
}

export interface QuestionSettings {
  allow_other?: boolean;
  shuffle_options?: boolean;
  scale_min?: number; // default 1
  scale_max?: number; // default 5 or 10
  scale_min_label?: string;
  scale_min_label_ar?: string;
  scale_max_label?: string;
  scale_max_label_ar?: string;
  max_rating?: number; // default 5
  matrix_rows?: Array<{ id: string; label: string; label_ar?: string }>;
  matrix_columns?: Array<{ id: string; label: string; label_ar?: string }>;
  ranking_items?: Array<{ id: string; label: string; label_ar?: string }>;
}

export interface FormQuestion {
  id: string;
  form_id: string;
  section_id: string;
  type: QuestionType;
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  placeholder?: string;
  placeholder_ar?: string;
  is_required: boolean;
  order_index: number;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  scoring?: QuestionScoring;
  settings?: QuestionSettings;
  created_at?: string;
}

export type LogicOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty";

export interface LogicCondition {
  question_id: string;
  operator: LogicOperator;
  value: any;
  combinator?: "AND" | "OR";
}

export type LogicAction =
  | "jump_to_section"
  | "submit_form"
  | "show_question"
  | "hide_question";

export interface FormLogicRule {
  id: string;
  form_id: string;
  source_question_id: string;
  action: LogicAction;
  target_id: string; // section_id or question_id
  conditions: LogicCondition[];
  created_at?: string;
}

export interface FormCollaborator {
  id: string;
  form_id: string;
  profile_id: string;
  profile?: Profile;
  role: FormCollaboratorRole;
  created_at: string;
}

// ── Responses & Answers ──────────────────────────────────────

export interface FormResponse {
  id: string;
  form_id: string;
  form_version_id: string;
  form?: Form;
  respondent_id?: string;
  respondent?: Profile;
  respondent_email?: string;
  respondent_name?: string;
  ip_hash?: string;
  session_token?: string;
  is_draft: boolean;
  score?: number | null;
  total_points_possible?: number | null;
  percentage?: number | null;
  completion_time_seconds?: number;
  answers: FormAnswer[];
  files?: FormResponseFile[];
  submitted_at: string;
  updated_at: string;
}

export interface FormAnswer {
  id: string;
  response_id: string;
  question_id: string;
  question_type: QuestionType;
  question_title?: string;
  question_title_ar?: string;
  answer_value: any; // string, string[], number, Record<string, string>
  score_awarded?: number;
  created_at?: string;
}

export interface FormResponseFile {
  id: string;
  response_id: string;
  question_id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  public_url: string;
  created_at: string;
}

// ── Deep System Entity Links ─────────────────────────────────

export type FormEntityType =
  | "task"
  | "profile"
  | "team"
  | "track"
  | "incident"
  | "evaluation"
  | "appeal"
  | "attendance";

export type FormLinkMode = "tab" | "intake" | "mandatory_milestone";

export interface FormEntityLink {
  id: string;
  form_id: string;
  form?: Form;
  entity_type: FormEntityType;
  entity_id?: string; // specific entity or null for all
  entity_name?: string;
  link_mode: FormLinkMode;
  field_mappings: Record<string, string>; // { [question_id]: entity_field_key }
  created_at: string;
}

// ── Automations & Triggers ───────────────────────────────────

export type AutomationTriggerEvent =
  | "response_submitted"
  | "score_threshold"
  | "specific_answer";

export type AutomationActionType =
  | "create_task"
  | "award_points"
  | "create_incident"
  | "send_notification"
  | "webhook"
  | "update_field";

export interface FormAutomation {
  id: string;
  form_id: string;
  name: string;
  trigger_event: AutomationTriggerEvent;
  trigger_config: {
    min_score?: number;
    max_score?: number;
    question_id?: string;
    expected_value?: any;
    operator?: LogicOperator;
  };
  action_type: AutomationActionType;
  action_config: {
    task_title?: string;
    task_priority?: "low" | "medium" | "high" | "urgent";
    task_team_id?: string;
    points_amount?: number;
    points_direction?: "positive" | "negative";
    points_category_id?: string;
    incident_title?: string;
    incident_level?: 1 | 2 | 3 | 4;
    notification_title?: string;
    notification_message?: string;
    notification_recipient_role?: UserRole | "form_creator" | "respondent";
    webhook_url?: string;
    field_to_update?: string;
    update_value?: any;
  };
  enabled: boolean;
  created_at: string;
}

// ── Webhooks ─────────────────────────────────────────────────

export interface FormWebhook {
  id: string;
  form_id: string;
  url: string;
  secret_key: string;
  events: string[]; // ['response.submitted', 'form.published']
  is_active: boolean;
  custom_headers?: Record<string, string>;
  created_at: string;
}

export interface FormWebhookDelivery {
  id: string;
  webhook_id: string;
  event_name: string;
  status: "pending" | "delivered" | "failed";
  status_code?: number;
  request_payload: Record<string, any>;
  response_body?: string;
  error_message?: string;
  duration_ms?: number;
  retry_count: number;
  delivered_at?: string;
  created_at: string;
}

// ── Templates ────────────────────────────────────────────────

export interface FormTemplate {
  id: string;
  category: "hr" | "academy" | "feedback" | "operations" | "quiz";
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  icon: string;
  schema_snapshot: FormVersionSnapshot;
  is_system: boolean;
  created_at: string;
}

// ── Analytics & Summaries ────────────────────────────────────

export interface FormAnalytics {
  form_id: string;
  total_views: number;
  total_starts: number;
  total_submissions: number;
  completion_rate: number; // percentage 0 - 100
  average_completion_time_seconds: number;
  question_stats: Record<string, QuestionAnalytics>;
  average_quiz_score?: number;
  quiz_score_distribution?: Array<{ range: string; count: number }>;
}

export interface QuestionAnalytics {
  question_id: string;
  question_type: QuestionType;
  title: string;
  title_ar: string;
  total_answers: number;
  drop_off_count?: number;
  average_value?: number; // for ratings, linear scales, numbers
  option_counts?: Record<string, number>; // for multiple_choice, checkboxes, dropdown
  text_samples?: string[]; // for short_text, paragraph
}
