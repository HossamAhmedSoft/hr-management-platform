// ============================================================
// GDG NCTU HR Management Platform — Registration & Approval Workflow Types
// ============================================================

import { UserRole, Profile } from "./index";

export type RegistrationStatus =
  | "pending_email_verification"
  | "pending_approval"
  | "needs_info"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type RegistrationMode =
  | "OPEN_WITH_APPROVAL"
  | "INVITE_ONLY"
  | "DOMAIN_RESTRICTED"
  | "CLOSED";

export type RegistrationFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "password"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  | "radio"
  | "checkbox"
  | "national_id"
  | "url"
  | "file_upload";

export interface FieldOption {
  value: string;
  label_en: string;
  label_ar: string;
}

export interface FieldValidationRules {
  min_length?: number;
  max_length?: number;
  regex?: string;
  min_age?: number;
  max_age?: number;
  allowed_file_types?: string[];
  max_file_size_mb?: number;
}

export interface FieldVisibilityCondition {
  field: string;
  operator: "equals" | "not_equals" | "in" | "not_in";
  value: any;
}

export interface RegistrationField {
  id: string;
  field_key: string;
  label_en: string;
  label_ar: string;
  help_text_en?: string;
  help_text_ar?: string;
  field_type: RegistrationFieldType;
  is_required: boolean;
  validation_rules: FieldValidationRules;
  options: FieldOption[];
  step_index: number;
  order_index: number;
  visibility_condition?: FieldVisibilityCondition | null;
  is_sensitive: boolean;
  maps_to: string; // e.g. "profiles.full_name", "profiles.academic_notes.kyc.national_id"
  is_active: boolean;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface RegistrationRequestFile {
  id: string;
  request_id: string;
  file_key: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  is_verified: boolean;
  created_at: string;
}

export interface RegistrationRequestEvent {
  id: string;
  request_id: string;
  from_status?: RegistrationStatus | null;
  to_status: RegistrationStatus;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  comment?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface RegistrationRequest {
  id: string;
  reference_no: string;
  status: RegistrationStatus;
  email: string;
  email_verified_at?: string | null;
  email_verification_token?: string | null;
  email_verification_expires_at?: string | null;
  password_hash: string;
  full_name: string;
  phone?: string | null;
  submitted_data: Record<string, any>;
  schema_version: number;
  locale: "ar" | "en";
  ip_address?: string | null;
  user_agent?: string | null;
  submitted_at: string;
  reviewed_by?: string | null;
  reviewer?: Profile | null;
  reviewed_at?: string | null;
  decision_reason?: string | null;
  reason_visible_to_applicant: boolean;
  reapply_cooldown_until?: string | null;
  info_requested_fields?: string[] | null;
  info_request_message?: string | null;
  info_request_token?: string | null;
  info_request_token_expires_at?: string | null;
  assigned_role: UserRole;
  assigned_team_id?: string | null;
  promoted_profile_id?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  files?: RegistrationRequestFile[];
  events?: RegistrationRequestEvent[];
}

export interface RegistrationSettings {
  registration_mode: RegistrationMode;
  allowed_domains: string[];
  auto_approve_enabled: boolean;
  expiry_days: number;
  reject_cooldown_days: number;
  sla_warning_hours: number;
  default_assigned_role: UserRole;
  schema_version: number;
}

export interface RegistrationStep {
  index: number;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  icon?: string;
  fields: RegistrationField[];
}
