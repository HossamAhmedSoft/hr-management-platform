// ============================================================
// GDG NCTU HR Management Platform — Core TypeScript Types
// ============================================================

// ── User & Auth ──────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "hr_admin"
  | "hr_reviewer"
  | "team_lead"
  | "member"
  | "track_lead"
  | "lead_instructor"
  | "ta_mentor"
  | "attendee";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  team_id?: string;
  committee?: string;
  status: MemberStatus;
  join_date: string;
  phone?: string;
  bio?: string;
  academic_notes?: string;
  google_id?: string;
  created_at: string;
  updated_at: string;
}

export type MemberStatus = "active" | "inactive" | "suspended" | "archived" | "on_leave";

// ── Organization ─────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  type: "technical" | "non_technical";
  lead_id?: string;
  lead?: Profile;
  status: "active" | "archived";
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMembership {
  id: string;
  profile_id: string;
  team_id: string;
  role: UserRole;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  created_at: string;
}

// ── Tasks ────────────────────────────────────────────────────

export type TaskStatus =
  | "draft"
  | "assigned"
  | "in_progress"
  | "blocked"
  | "submitted"
  | "under_review"
  | "revision_required"
  | "completed"
  | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description: string;
  team_id: string;
  team?: Team;
  created_by: string;
  creator?: Profile;
  status: TaskStatus;
  priority: TaskPriority;
  start_date?: string;
  deadline: string;
  delivery_date?: string;
  deliverables?: string;
  acceptance_criteria?: string;
  reference_links?: string[];
  review_status?: "pending" | "approved" | "revision_required";
  reviewer_comments?: string;
  evidence_links?: string[];
  assignees?: TaskAssignee[];
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  profile_id: string;
  profile?: Profile;
  assigned_at: string;
  assigned_by: string;
}

export interface TaskStatusHistory {
  id: string;
  task_id: string;
  from_status: TaskStatus | null;
  to_status: TaskStatus;
  changed_by: string;
  changer?: Profile;
  reason?: string;
  created_at: string;
}

export interface TaskDelayRequest {
  id: string;
  task_id: string;
  requested_by: string;
  requester?: Profile;
  reason: string;
  proposed_deadline: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  reviewer?: Profile;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Points ───────────────────────────────────────────────────

export type PointDirection = "positive" | "negative";
export type PointEventStatus = "draft" | "submitted" | "pending_review" | "approved" | "rejected";

export interface PointCategory {
  id: string;
  name: string;
  name_ar: string;
  direction: PointDirection;
  default_value: number;
  description: string;
  description_ar: string;
  is_investigation_referral: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PointCapCategory {
  id: string;
  name: string;
  name_ar: string;
  points_per_event: number;
  monthly_cap: number;
  is_active: boolean;
  created_at: string;
}

export interface PointEvent {
  id: string;
  member_id: string;
  member?: Profile;
  team_id: string;
  team?: Team;
  event_date: string;
  category_id: string;
  category?: PointCategory;
  direction: PointDirection;
  value: number;
  explanation: string;
  related_task_id?: string;
  related_task?: Task;
  evidence_url?: string;
  recorded_by: string;
  recorder?: Profile;
  status: PointEventStatus;
  member_notified_at?: string;
  member_explanation?: string;
  reviewer_id?: string;
  reviewer?: Profile;
  decision?: "approved" | "rejected";
  decision_at?: string;
  decision_rationale?: string;
  duplicate_ref_id?: string;
  policy_version_id?: string;
  cap_category_id?: string;
  created_at: string;
  updated_at: string;
}

// ── Evaluations ──────────────────────────────────────────────

export type EvaluationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "finalized"
  | "reopened";

export interface EvaluationPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "open" | "closed" | "archived";
  created_at: string;
}

export interface EvaluationTemplate {
  id: string;
  name: string;
  team_id?: string;
  team?: Team;
  is_default: boolean;
  categories: EvaluationCategory[];
  created_at: string;
  updated_at: string;
}

export interface EvaluationCategory {
  id: string;
  template_id: string;
  name: string;
  name_ar: string;
  weight: number;
  order: number;
  description?: string;
}

export interface Evaluation {
  id: string;
  member_id: string;
  member?: Profile;
  evaluator_id: string;
  evaluator?: Profile;
  period_id: string;
  period?: EvaluationPeriod;
  template_id: string;
  status: EvaluationStatus;
  total_score?: number;
  performance_band?: string;
  self_assessment_notes?: string;
  hr_notes?: string;
  ratings: EvaluationRating[];
  created_at: string;
  updated_at: string;
}

export interface EvaluationRating {
  id: string;
  evaluation_id: string;
  category_id: string;
  category?: EvaluationCategory;
  rating: number | null; // null = N/A
  na_reason?: string;
  evidence?: string;
}

// ── Feedback & PIP ───────────────────────────────────────────

export interface FeedbackSession {
  id: string;
  member_id: string;
  member?: Profile;
  provider_id: string;
  provider?: Profile;
  related_evaluation_id?: string;
  related_incident_id?: string;
  date: string;
  strengths: string;
  improvement_area: string;
  next_step: string;
  support_required: string;
  follow_up_date: string;
  member_comments?: string;
  hr_private_notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface ImprovementPlan {
  id: string;
  member_id: string;
  member?: Profile;
  created_by: string;
  creator?: Profile;
  concern: string;
  evidence: string;
  agreed_actions: string;
  support_required: string;
  responsible_person_id: string;
  start_date: string;
  target_date: string;
  follow_up_schedule: string;
  progress: PIPProgress;
  outcome?: string;
  closure_notes?: string;
  status: "active" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export type PIPProgress = "not_started" | "in_progress" | "on_track" | "at_risk" | "completed";

// ── Incidents & Escalations ──────────────────────────────────

export type IncidentLevel = 1 | 2 | 3 | 4;
export type IncidentStatus = "open" | "under_review" | "resolved" | "escalated" | "closed";

export interface Incident {
  id: string;
  member_id?: string;
  target_member_id?: string;
  member?: Profile;
  reported_by: string;
  reporter?: Profile;
  level?: IncidentLevel;
  escalation_level?: number;
  category?: string;
  title: string;
  description: string;
  is_confidential?: boolean;
  status: IncidentStatus;
  decision?: string;
  decision_notes?: string;
  decision_rationale?: string;
  created_at: string;
  updated_at: string;
}

// ── Appeals ──────────────────────────────────────────────────

export type AppealStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "info_requested"
  | "upheld"
  | "partially_upheld"
  | "overturned"
  | "closed"
  | "resolved"
  | "rejected";

export interface Appeal {
  id: string;
  member_id: string;
  member?: Profile;
  entity_type?: string;
  entity_id?: string;
  related_point_event_id?: string;
  related_evaluation_id?: string;
  notification_date?: string;
  deadline?: string;
  deadline_date?: string;
  grounds?: string;
  objection?: string;
  evidence_url?: string;
  evidence_urls?: string[];
  status: AppealStatus;
  reviewer_id?: string;
  neutral_reviewer_id?: string;
  reviewer?: Profile;
  findings?: string;
  decision?: string;
  decision_rationale?: string;
  original_decision_preserved?: boolean;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// ── Meeting Attendance & Excuses ─────────────────────────────

export type MeetingExcuseReasonType =
  | "academic_exam"
  | "medical_emergency"
  | "family_emergency"
  | "travel_work"
  | "other";

export type MeetingExcuseStatus = "pending" | "approved" | "rejected";

export interface MeetingExcuse {
  id: string;
  meeting_id: string;
  meeting_title: string;
  member_id: string;
  member_name: string;
  member_email: string;
  reason_type: MeetingExcuseReasonType;
  description: string;
  evidence_url?: string;
  status: MeetingExcuseStatus;
  reviewer_id?: string;
  reviewer_name?: string;
  review_notes?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export type MemberAttendanceStatus = "present" | "excused" | "absent" | "pending";

export interface MemberAttendanceRecord {
  member_id: string;
  member_name: string;
  member_email?: string;
  team_name?: string;
  status: MemberAttendanceStatus;
  notes?: string;
  excuse_id?: string;
  penalty_applied?: boolean;
}

export interface MeetingAttendanceEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  target_team_id?: string; // "all" for Public/All Members, or specific team_id (e.g. "team_hr", "team_web")
  target_team_name?: string;
  status: "scheduled" | "in_progress" | "completed";
  created_by?: string;
  attendance_taken?: boolean;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  records?: MemberAttendanceRecord[];
}

// ── Educational Tracks & Attendees ───────────────────────────

export interface Attendee {
  id: string;
  cohort_id: string;
  profile_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  is_certified: boolean;
  created_at: string;
}

export interface AttendeeEvaluation {
  id: string;
  attendee_id: string;
  cohort_id: string;
  evaluator_id: string;
  attendance_punctuality: number;
  assignments_projects: number;
  participation_interaction: number;
  conduct_collaboration: number;
  total_score: number;
  is_certified: boolean;
  feedback_notes?: string;
  created_at: string;
}


export interface EducationalTrack {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  lead_id?: string;
  lead?: Profile;
  status: "active" | "archived";
  created_at: string;
}

export interface EducationalCohort {
  id: string;
  track_id: string;
  track?: EducationalTrack;
  name: string;
  start_date: string;
  end_date: string;
  status: "upcoming" | "active" | "completed";
  created_at: string;
}

export interface EducationalSession {
  id: string;
  cohort_id: string;
  cohort?: EducationalCohort;
  title: string;
  date: string;
  instructor_id?: string;
  instructor?: Profile;
  recording_url?: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id?: string;
  event_id?: string;
  member_id: string;
  member?: Profile;
  status: "present" | "absent" | "excused" | "late";
  absence_reason?: string;
  created_at: string;
}

// ── Events ───────────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  type: "meeting" | "session" | "event" | "workshop";
  date: string;
  time?: string;
  is_mandatory: boolean;
  team_id?: string;
  team?: Team;
  description?: string;
  follow_up_actions?: string;
  created_at: string;
  updated_at: string;
}

// ── Notifications ────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  recipient_email?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export type NotificationType =
  | "task_assigned"
  | "task_deadline"
  | "task_review"
  | "point_submitted"
  | "point_decision"
  | "evaluation_submitted"
  | "evaluation_finalized"
  | "feedback_scheduled"
  | "pip_followup"
  | "appeal_deadline"
  | "appeal_decision"
  | "general";

// ── Audit Logs ───────────────────────────────────────────────

export interface AuditLog {
  id: string;
  actor_id: string;
  actor?: Profile;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  before_value?: Record<string, unknown>;
  after_value?: Record<string, unknown>;
  previous_state?: Record<string, unknown>;
  new_state?: Record<string, unknown>;
  reason?: string;
  ip_address?: string;
  created_at: string;
}

// ── Policy ───────────────────────────────────────────────────

export interface PolicyVersion {
  id: string;
  version: string;
  effective_date: string;
  description: string;
  is_current: boolean;
  content?: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

// ── Dashboard Stats ──────────────────────────────────────────

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalTeams: number;
  totalTasks: number;
  overdueTasks: number;
  pendingPoints: number;
  pendingEvaluations: number;
  openAppeals: number;
  openPIPs: number;
  upcomingDeadlines: number;
}

// ── Common ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterParams {
  search?: string;
  team_id?: string;
  status?: string;
  role?: string;
  period_id?: string;
  direction?: PointDirection;
  from_date?: string;
  to_date?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Technical Tracks & Participants Domain (Production) ───────

export type ParticipantStatus = "active" | "inactive" | "completed" | "withdrawn" | "suspended";

export interface Participant {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  university?: string;
  faculty_department?: string;
  academic_year?: string;
  registration_date: string;
  status: ParticipantStatus;
  notes?: string; // Restricted to instructors & HR
  created_at: string;
  updated_at: string;
}

export type TrackCategory =
  | "web"
  | "mobile"
  | "cybersecurity"
  | "embedded"
  | "uiux"
  | "ai_ml"
  | "other";

export type TechnicalTrackStatus =
  | "draft"
  | "registration_open"
  | "active"
  | "completed"
  | "archived";

export interface TechnicalTrack {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  category: TrackCategory;
  cohort: string;
  start_date: string;
  end_date: string;
  reg_open_date?: string;
  reg_close_date?: string;
  lead_id?: string;
  lead_name?: string;
  mentor_ids?: string[];
  max_capacity: number;
  attendance_requirements: number; // e.g., 75%
  assignment_weight: number; // default 30%
  attendance_weight: number; // default 40%
  participation_weight: number; // default 20%
  conduct_weight: number; // default 10%
  certificate_min_score: number; // default 75%
  status: TechnicalTrackStatus;
  syllabus?: string[];
  created_at: string;
  updated_at: string;
}

export type EnrollmentStatus = "pending" | "active" | "completed" | "withdrawn" | "rejected";
export type CompletionStatus = "in_progress" | "certified" | "failed" | "withdrawn";

export interface TrackEnrollment {
  id: string;
  participant_id: string;
  participant?: Participant;
  track_id: string;
  track?: TechnicalTrack;
  cohort: string;
  enrollment_date: string;
  status: EnrollmentStatus;
  current_progress: number; // 0 - 100%
  final_result: number; // calculated 100-pt score
  completion_status: CompletionStatus;
  withdrawal_date?: string;
  withdrawal_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface TrackSession {
  id: string;
  track_id: string;
  cohort: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  instructor_id?: string;
  instructor_name?: string;
  location_or_link: string;
  materials_url?: string;
  recording_url?: string;
  status: SessionStatus;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export type TrackAttendanceStatus = "present" | "absent" | "excused" | "late" | "pending";

export interface TrackAttendanceRecord {
  id: string;
  session_id: string;
  track_id: string;
  enrollment_id: string;
  participant_id: string;
  status: TrackAttendanceStatus;
  recorded_by: string;
  recorder_name?: string;
  notes?: string;
  excuse_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackAssignment {
  id: string;
  track_id: string;
  cohort: string;
  title: string;
  description: string;
  instructions: string;
  resources_url?: string;
  publication_date: string;
  deadline: string;
  max_score: number;
  weight_in_track?: number;
  required_deliverables: string;
  submission_format: string; // e.g. "GitHub Repo URL / Figma Link / Google Drive"
  late_policy: string;
  revision_policy: string;
  reviewer_id?: string;
  final_grade_policy?: FinalGradePolicy;
  rubric_criteria?: RubricCriterion[];
  max_attempts?: number;
  allow_resubmission_after_deadline?: boolean;
  created_at: string;
  updated_at: string;
}

export type FinalGradePolicy = "latest_reviewed" | "highest_approved" | "instructor_selected";

export interface RubricCriterion {
  id: string;
  title: string;
  title_ar?: string;
  max_score: number;
  description?: string;
}

export interface StructuredFeedback {
  what_went_well: string;
  needs_improvement: string;
  specific_corrections: string;
  required_changes_for_acceptance: string;
  required_changes?: string;
  learning_resources?: string;
  suggested_next_steps?: string;
  next_steps?: string;
  rubric_scores?: Record<string, number>;
}

export type TrackSubmissionStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "submitted_late"
  | "under_review"
  | "needs_revision"
  | "revision_requested"
  | "resubmitted"
  | "graded"
  | "accepted"
  | "missing"
  | "excused"
  | "cancelled";

export interface TrackSubmissionAttempt {
  id: string;
  submission_id: string;
  assignment_id: string;
  enrollment_id: string;
  participant_id: string;
  attempt_number: number;
  submission_url: string;
  submitted_at: string;
  applicable_deadline: string;
  is_late: boolean;
  late_penalty_applied?: number;
  status: TrackSubmissionStatus;
  score: number | null;
  feedback?: StructuredFeedback;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_feedback?: string;
  reviewed_at?: string;
  revision_requested_at?: string;
  resubmission_deadline?: string;
  resubmission_notes?: string;
  notes?: string;
  created_at: string;
}

export interface GradeCorrectionLog {
  id: string;
  attempt_id: string;
  submission_id: string;
  assignment_id: string;
  participant_id: string;
  previous_score: number | null;
  new_score: number;
  previous_feedback?: string;
  new_feedback?: string;
  corrected_by: string;
  corrected_by_name: string;
  corrected_at: string;
  reason: string;
}

export interface TrackSubmission {
  id: string;
  assignment_id: string;
  enrollment_id: string;
  participant_id: string;
  submission_url: string;
  submitted_at: string;
  status: TrackSubmissionStatus;
  score: number | null; // out of assignment.max_score
  reviewer_feedback?: string;
  structured_feedback?: StructuredFeedback;
  reviewed_by?: string;
  reviewed_at?: string;
  deadline_extension_date?: string;
  extended_by?: string;
  extension_reason?: string;
  current_attempt_number?: number;
  revision_history?: Array<{
    date: string;
    url: string;
    note: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type BonusCategory =
  | "exceptional_project"
  | "additional_effort"
  | "helping_peers"
  | "voluntary_contribution"
  | "competition"
  | "other";

export interface TrackBonus {
  id: string;
  enrollment_id: string;
  track_id: string;
  participant_id: string;
  amount: number;
  category: BonusCategory;
  description: string;
  evidence_url?: string;
  recorded_by: string;
  approval_status: "pending" | "approved" | "rejected";
  approval_reason?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackEvaluation {
  id: string;
  enrollment_id: string;
  participant_id: string;
  track_id: string;
  cohort: string;
  evaluator_id: string;
  evaluator_name?: string;
  attendance_score: number; // max 40
  assignment_score: number; // max 30
  participation_score: number; // max 20
  conduct_score: number; // max 10
  raw_total: number; // 0 - 100
  bonus_points: number; // bonus separate
  final_official_score: number; // capped at 100 unless approved policy
  is_certified: boolean; // >= 75% and attendance >= 75%
  feedback_notes?: string;
  private_instructor_notes?: string;
  version: string;
  created_at: string;
  updated_at: string;
}

export type CertificateStatus = "eligible" | "issued" | "revoked";

export interface TrackCertificate {
  id: string;
  enrollment_id: string;
  participant_id: string;
  track_id: string;
  cohort: string;
  certificate_code: string; // e.g. GDG-NCTU-2026-WEB-001
  issue_date: string;
  status: CertificateStatus;
  official_score: number;
  issued_by: string;
  verification_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackFollowUp {
  id: string;
  enrollment_id: string;
  participant_id: string;
  track_id: string;
  risk_factors: string[]; // ['low_attendance', 'missing_assignments', 'deadline_overdue']
  responsible_person_id: string;
  responsible_person_name?: string;
  action_plan: string;
  due_date: string;
  outcome?: string;
  status: "open" | "in_progress" | "resolved" | "escalated";
  created_at: string;
  updated_at: string;
}

// ── Smart Reminders & Notifications Types ─────────────────────

export type ReminderType =
  | "upcoming_session"
  | "upcoming_deadline"
  | "overdue_assignment"
  | "assignment_awaiting_review"
  | "feedback_resubmission_requested"
  | "resubmission_deadline_approaching"
  | "repeated_absences"
  | "pending_grading"
  | "at_risk_follow_up_due"
  | "general_announcement";

export type ReminderDeliveryChannel = "in_app" | "email" | "webhook";

export interface ReminderRule {
  id: string;
  name: string;
  name_ar: string;
  reminder_type: ReminderType;
  trigger_condition: string;
  time_offset_hours: number; // e.g., -72 for 72h before, +24 for 24h after
  recipient_role: UserRole | "participant" | "assigned_instructor" | "follow_up_owner";
  delivery_channel: ReminderDeliveryChannel;
  message_template: string;
  message_template_ar: string;
  enabled: boolean;
  track_id: string; // 'all' or specific track_id
  cohort?: string;
  quiet_hours_start?: string; // e.g., '22:00'
  quiet_hours_end?: string; // e.g., '08:00'
  max_reminders_per_event: number;
  frequency_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface ReminderExecutionLog {
  id: string;
  rule_id: string;
  rule_name: string;
  event_id: string;
  event_type: string;
  recipient_id: string;
  recipient_role: string;
  delivery_channel: ReminderDeliveryChannel;
  status:
    | "sent"
    | "delivered"
    | "failed"
    | "suppressed_cancelled"
    | "suppressed_completed"
    | "suppressed_duplicate";
  scheduled_at: string;
  processed_at: string;
  failure_reason?: string;
  retry_count: number;
  idempotency_key: string;
}

export interface TrackNotificationItem {
  id: string;
  recipient_id: string;
  recipient_email?: string;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  category: "assignments" | "sessions" | "feedback" | "follow_ups" | "admin";
  related_track_id?: string;
  related_entity_type?: "assignment" | "session" | "submission" | "follow_up";
  related_entity_id?: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  channel_in_app: boolean;
  channel_email: boolean;
  quiet_hours_enabled: boolean;
  categories: {
    assignments: boolean;
    sessions: boolean;
    feedback: boolean;
    follow_ups: boolean;
    admin: boolean;
  };
}

// ── At-Risk Students Monitoring & Follow-Up Types ─────────────

export type RiskSeverity = "monitor" | "needs_follow_up" | "urgent_support" | "resolved";

export type RiskTriggerType =
  | "attendance_threshold"
  | "consecutive_absences"
  | "missing_assignments"
  | "assignment_completion_threshold"
  | "pending_resubmission_overdue"
  | "multiple_revisions_unresolved";

export interface RiskRule {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  trigger_type: RiskTriggerType;
  threshold_value: number;
  target_metric?: string;
  severity: RiskSeverity;
  track_id: string; // 'all' or specific track_id
  cohort?: string;
  enabled: boolean;
  recommended_action: string;
  recommended_action_ar: string;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface RiskIndicatorEvidence {
  rule_id: string;
  rule_name: string;
  evidence: string;
  evidence_ar: string;
  date: string;
}

export interface RiskFollowUpCase {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_email: string;
  track_id: string;
  track_name: string;
  cohort: string;
  risk_level: RiskSeverity;
  triggering_indicators: RiskIndicatorEvidence[];
  date_identified: string;
  assigned_owner_id: string;
  assigned_owner_name: string;
  recommended_action: string;
  follow_up_deadline: string;
  status:
    | "new"
    | "assigned"
    | "contact_attempted"
    | "awaiting_response"
    | "awaiting_participant_response"
    | "support_plan_active"
    | "monitoring"
    | "resolved"
    | "closed";
  next_action?: string;
  resolution_notes?: string;
  resolution_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CaseActionLog {
  id: string;
  case_id: string;
  action_type: string;
  description?: string;
  notes?: string;
  actor_id?: string;
  actor_name?: string;
  performed_by_id?: string;
  performed_by_name?: string;
  participant_response?: string;
  agreed_next_steps?: string;
  next_deadline?: string;
  timestamp?: string;
  created_at?: string;
}

// ── Native Forms Module Types ────────────────────────────────
export * from "./forms";

// ── Registration & Admin Approval Workflow Types ─────────────
export * from "./registration";
