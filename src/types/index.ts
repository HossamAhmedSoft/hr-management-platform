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
  status: MemberStatus;
  join_date: string;
  phone?: string;
  academic_notes?: string;
  created_at: string;
  updated_at: string;
}

export type MemberStatus = "active" | "inactive" | "suspended" | "archived";

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
  | "closed";

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
  created_at: string;
  updated_at: string;
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
  action: string;
  entity_type: string;
  entity_id: string;
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
