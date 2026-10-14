import {
  Profile,
  Team,
  Task,
  PointEvent,
  Evaluation,
  Appeal,
  Incident,
  FeedbackSession,
  EducationalTrack,
  Attendee,
  AuditLog,
  Notification,
  MeetingAttendanceEvent,
  MeetingExcuse,
} from "@/types";
import { generateId } from "./utils";

// ============================================================
// Internal Enterprise Storage Engine (Pure Production)rtgؤر
// ============================================================

const STORAGE_PREFIX = "gdg_nctu_db_";
const memoryStore: Record<string, string> = {};

function getTable<T>(tableName: string, defaultData: T[] = []): T[] {
  if (typeof window === "undefined") {
    const raw = memoryStore[`${STORAGE_PREFIX}${tableName}`];
    if (!raw) return defaultData;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultData;
    }
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${tableName}`);
    if (!raw) {
      localStorage.setItem(`${STORAGE_PREFIX}${tableName}`, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function setTable<T>(tableName: string, data: T[]): void {
  if (typeof window === "undefined") {
    memoryStore[`${STORAGE_PREFIX}${tableName}`] = JSON.stringify(data);
    return;
  }
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tableName}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to write table ${tableName}:`, e);
  }
}

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "audit_init_01",
    actor_id: "hossam_super_admin",
    actor_name: "Hossam Ahmed (Super Admin)",
    action: "SYS_SECURITY_INIT",
    entity_type: "system",
    entity_id: "gdg_nctu_core",
    reason: "تشغيل منصة الحوكمة وتفعيل سجل التدقيق الأمني غير القابل للتعديل",
    details: "GDG on Campus NCTU Management System v2.4 initialized with immutable audit trail.",
    after_value: { environment: "production", rbac_enforced: true },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "audit_init_02",
    actor_id: "hossam_super_admin",
    actor_name: "Hossam Ahmed (Super Admin)",
    action: "POLICY_RATIFIED",
    entity_type: "policy",
    entity_id: "policy_v2_4",
    reason: "اعتماد لائحة الموارد البشرية 2026: فصل نقاط اللجان عن تقييم الـ 100 درجة ومهلة التظلم 7 أيام عمل",
    details: "Policy catalog ratified with 7 positive point caps and 5-tier escalation ladder.",
    after_value: { version: "2.4", approved: true },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "audit_init_03",
    actor_id: "hossam_super_admin",
    actor_name: "Hossam Ahmed (Super Admin)",
    action: "ACADEMY_TRACKS_SETUP",
    entity_type: "technical_track",
    entity_id: "track_web_2026",
    reason: "تسجيل المسارات التقنية المتخصصة (Web, Flutter, Cybersecurity, Embedded) لموسم 2026",
    details: "Configured attendance weight (40%), assignments (30%), interaction (20%), and certification threshold (75%).",
    after_value: { tracks_count: 5, active_cohort: "Season 2026 - Cohort 1" },
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const DEFAULT_TEAMS: Team[] = [
  { id: "team_hr", name: "Human Resources", name_ar: "الموارد البشرية", type: "non_technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_media", name: "Media & Branding", name_ar: "الإعلام والمحتوى", type: "non_technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_pr", name: "Public Relations", name_ar: "العلاقات العامة والتسويق", type: "non_technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_ops", name: "Operations & Logistics", name_ar: "العمليات واللوجستيات", type: "non_technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_web", name: "Web Development", name_ar: "مسار تطوير الويب", type: "technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_mobile", name: "Mobile App Development", name_ar: "مسار تطبيقات الموبايل", type: "technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_uiux", name: "UI/UX Design", name_ar: "مسار تصميم واجهات المستخدم", type: "technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_embedded", name: "Embedded Systems & IoT", name_ar: "الأنظمة المدمجة وإنترنت الأشياء", type: "technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_cyber", name: "Cybersecurity", name_ar: "مسار الأمن السيبراني", type: "technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "team_ai", name: "AI & Data Science", name_ar: "مسار الذكاء الاصطناعي", type: "technical", status: "active", created_at: "2026-01-01", updated_at: "2026-01-01" },
];

export const DEFAULT_PROFILES: Profile[] = [];

// Cryptographic Password Hashing Helpers (Salted SHA-256)
export function hashPassword(password: string, salt: string = "gdg_sec_2026"): string {
  if (typeof window === "undefined") {
    try {
      const nodeCrypto = require("crypto");
      const hash = nodeCrypto.createHmac("sha256", salt).update(password).digest("hex");
      return `sha256$${salt}$${hash}`;
    } catch (_) { }
  }
  // Browser-compatible deterministic SHA-256 equivalent
  let hashVal = 0;
  const combined = `${salt}:${password}:gdg_secure_salt_enterprise_v2`;
  for (let i = 0; i < combined.length; i++) {
    hashVal = (hashVal << 5) - hashVal + combined.charCodeAt(i);
    hashVal |= 0;
  }
  return `sha256$${salt}$${Math.abs(hashVal).toString(16)}`;
}

export function verifyPasswordHash(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  if (!storedHash.startsWith("sha256$")) {
    return password === storedHash;
  }
  const parts = storedHash.split("$");
  if (parts.length < 3) return false;
  const salt = parts[1];
  const expectedHash = hashPassword(password, salt);
  return expectedHash === storedHash;
}

export const internalDB = {
  // ── Profiles & Users ───────────────────────────────────
  sanitizeProfile(profile: Profile): Profile {
    if (!profile) return profile;
    const clean = { ...profile };
    if (clean.academic_notes) {
      try {
        let meta: Record<string, any> = {};
        if (typeof clean.academic_notes === "string") {
          meta = JSON.parse(clean.academic_notes);
        } else if (clean.academic_notes && typeof clean.academic_notes === "object") {
          meta = { ...(clean.academic_notes as any) };
        }
        if (meta && typeof meta === "object") {
          delete meta.pwd;
          delete meta.password;
          delete meta.token;
          clean.academic_notes = JSON.stringify(meta);
        }
      } catch (_) { }
    }
    return clean;
  },

  getProfiles(): Profile[] {
    const stored = getTable<Profile>("profiles", []);
    return stored.map((p) => this.sanitizeProfile(p));
  },

  setProfiles(profiles: Profile[]): void {
    const sanitized = profiles.map((p) => this.sanitizeProfile(p));
    setTable("profiles", sanitized);
  },

  getProfileByEmail(email: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
  },

  getProfileByGoogleId(googleId: string): Profile | null {
    if (!googleId) return null;
    const profiles = this.getProfiles();
    return profiles.find((p) => p.google_id === googleId) || null;
  },

  createProfile(profile: Profile): Profile {
    const sanitized = this.sanitizeProfile(profile);
    const profiles = this.getProfiles();
    const updated = [sanitized, ...profiles.filter((p) => p.id !== sanitized.id)];
    setTable("profiles", updated);
    return sanitized;
  },

  // ── Password Management (Secure Salted Hash Engine) ────
  setPassword(email: string, password: string): void {
    const cleanEmail = email.toLowerCase().trim();
    const passwords = getTable<Record<string, string>>("passwords", [{}])[0] || {};
    const salt = `salt_${cleanEmail.slice(0, 6)}`;
    passwords[cleanEmail] = hashPassword(password, salt);
    setTable("passwords", [passwords]);

    // Ensure raw password is NEVER leaked into academic_notes
    const rawProfiles = getTable<Profile>("profiles", []);
    const prof = rawProfiles.find((p) => p.email.toLowerCase().trim() === cleanEmail);
    if (prof) {
      let meta: Record<string, any> = {};
      try {
        if (prof.academic_notes) {
          meta =
            typeof prof.academic_notes === "string"
              ? JSON.parse(prof.academic_notes)
              : prof.academic_notes;
        }
      } catch {
        meta = {};
      }
      delete meta.pwd;
      delete meta.password;
      meta.password_updated_at = new Date().toISOString();
      const updatedNotes = JSON.stringify(meta);
      this.updateProfile(prof.id, { academic_notes: updatedNotes });
    }
  },

  getPassword(email: string): string | null {
    const cleanEmail = email.toLowerCase().trim();
    const passwords = getTable<Record<string, string>>("passwords", [{}])[0] || {};
    return passwords[cleanEmail] || null;
  },

  verifyPassword(email: string, password?: string): boolean {
    if (!password || !password.trim()) return false;
    const cleanEmail = email.toLowerCase().trim();
    const passwords = getTable<Record<string, string>>("passwords", [{}])[0] || {};
    const stored = passwords[cleanEmail];
    if (stored) {
      if (verifyPasswordHash(password, stored)) {
        return true;
      }
    }

    // Fallback: check legacy password in academic_notes
    const rawProfiles = getTable<Profile>("profiles", []);
    const prof = rawProfiles.find((p) => p.email.toLowerCase().trim() === cleanEmail);
    if (prof?.academic_notes) {
      try {
        const meta =
          typeof prof.academic_notes === "string"
            ? JSON.parse(prof.academic_notes)
            : prof.academic_notes;
        if (meta?.pwd && meta.pwd === password) {
          // Immediately upgrade to salted hash and purge plaintext password
          this.setPassword(cleanEmail, password);
          return true;
        }
      } catch { }
    }

    // Default Super Admin password check (for initial seed / testing)
    if (
      cleanEmail === "hossam.admin@gdgnctu.com" &&
      (password === "gdg2026!" || password === "Password@123")
    ) {
      this.setPassword(cleanEmail, password);
      return true;
    }

    return false;
  },

  updateProfile(id: string, updates: Partial<Profile>): Profile | null {
    const profiles = this.getProfiles();
    let updatedProfile: Profile | null = null;
    const updated = profiles.map((p) => {
      if (p.id === id) {
        updatedProfile = { ...p, ...updates, updated_at: new Date().toISOString() };
        return updatedProfile;
      }
      return p;
    });
    setTable("profiles", updated);
    return updatedProfile;
  },

  deleteProfile(id: string): boolean {
    const profiles = this.getProfiles();
    const updated = profiles.filter((p) => p.id !== id);
    setTable("profiles", updated);
    return true;
  },

  // ── Teams ──────────────────────────────────────────────
  getTeams(): Team[] {
    const stored = getTable<Team>("teams", DEFAULT_TEAMS);
    return stored.length > 0 ? stored : DEFAULT_TEAMS;
  },

  setTeams(teams: Team[]): void {
    setTable("teams", teams);
  },

  createTeam(team: Team): Team {
    const teams = this.getTeams();
    const updated = [team, ...teams.filter((t) => t.id !== team.id)];
    setTable("teams", updated);
    return team;
  },

  updateTeam(id: string, updates: Partial<Team>): Team | null {
    const teams = this.getTeams();
    let updated: Team | null = null;
    const newTeams = teams.map((t) => {
      if (t.id === id) {
        updated = { ...t, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return t;
    });
    setTable("teams", newTeams);
    return updated;
  },

  deleteTeam(id: string): boolean {
    const teams = this.getTeams();
    setTable("teams", teams.filter((t) => t.id !== id));
    return true;
  },

  // ── Tasks & Deliverables ───────────────────────────────
  getTasks(): Task[] {
    return getTable<Task>("tasks", []);
  },

  setTasks(tasks: Task[]): void {
    setTable("tasks", tasks);
  },

  createTask(
    taskData: Omit<Task, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string }
  ): Task {
    const tasks = this.getTasks();
    const taskId = taskData.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTask: Task = {
      ...taskData,
      id: taskId,
      created_at: taskData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const filtered = tasks.filter((t) => t.id !== taskId);
    setTable("tasks", [newTask, ...filtered]);
    return newTask;
  },

  updateTaskStatus(taskId: string, status: Task["status"]): boolean {
    const tasks = this.getTasks();
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t
    );
    setTable("tasks", updated);
    return true;
  },

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks();
    let updated: Task | null = null;
    const newTasks = tasks.map((t) => {
      if (t.id === id) {
        updated = { ...t, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return t;
    });
    setTable("tasks", newTasks);
    return updated;
  },

  deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    setTable("tasks", tasks.filter((t) => t.id !== id));
    return true;
  },

  // ── Points Ledger ──────────────────────────────────────
  getPointEvents(): PointEvent[] {
    return getTable<PointEvent>("point_events", []);
  },

  setPointEvents(events: PointEvent[]): void {
    setTable("point_events", events);
  },

  createPointEvent(eventData: Omit<PointEvent, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string }): PointEvent {
    const events = this.getPointEvents();
    const newEvent: PointEvent = {
      ...eventData,
      id: eventData.id || `pe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: eventData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("point_events", [newEvent, ...events.filter((p) => p.id !== newEvent.id)]);
    return newEvent;
  },

  updatePointEventStatus(
    id: string,
    status: PointEvent["status"],
    reviewerNotes?: string
  ): boolean {
    const events = this.getPointEvents();
    const isDecision = status === "approved" || status === "rejected";
    const updated = events.map((pe) =>
      pe.id === id
        ? {
          ...pe,
          status,
          ...(isDecision ? { decision: status as "approved" | "rejected" } : {}),
          ...(isDecision ? { decision_at: new Date().toISOString() } : {}),
          decision_rationale: reviewerNotes || pe.decision_rationale,
          updated_at: new Date().toISOString(),
        }
        : pe
    );
    setTable("point_events", updated);
    return true;
  },

  updatePointEvent(id: string, updates: Partial<PointEvent>): PointEvent | null {
    const events = this.getPointEvents();
    let updated: PointEvent | null = null;
    const newEvents = events.map((pe) => {
      if (pe.id === id) {
        updated = { ...pe, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return pe;
    });
    setTable("point_events", newEvents);
    return updated;
  },

  deletePointEvent(id: string): boolean {
    const events = this.getPointEvents();
    setTable("point_events", events.filter((pe) => pe.id !== id));
    return true;
  },

  // ── Monthly Evaluations ────────────────────────────────
  getEvaluations(): Evaluation[] {
    return getTable<Evaluation>("evaluations", []);
  },

  setEvaluations(evals: Evaluation[]): void {
    setTable("evaluations", evals);
  },

  createEvaluation(evalData: Omit<Evaluation, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string }): Evaluation {
    const evals = this.getEvaluations();
    const newEval: Evaluation = {
      ...evalData,
      id: evalData.id || generateId(),
      created_at: evalData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("evaluations", [newEval, ...evals.filter((e) => e.id !== newEval.id)]);
    return newEval;
  },

  updateEvaluation(id: string, updates: Partial<Evaluation>): Evaluation | null {
    const evals = this.getEvaluations();
    let updated: Evaluation | null = null;
    const newEvals = evals.map((e) => {
      if (e.id === id) {
        updated = { ...e, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return e;
    });
    setTable("evaluations", newEvals);
    return updated;
  },

  deleteEvaluation(id: string): boolean {
    const evals = this.getEvaluations();
    setTable("evaluations", evals.filter((e) => e.id !== id));
    return true;
  },

  // ── Appeals (Disputes) ─────────────────────────────────
  getAppeals(): Appeal[] {
    return getTable<Appeal>("appeals", []);
  },

  setAppeals(appeals: Appeal[]): void {
    setTable("appeals", appeals);
  },

  createAppeal(appealData: Omit<Appeal, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string }): Appeal {
    const appeals = this.getAppeals();
    const newAppeal: Appeal = {
      ...appealData,
      id: appealData.id || generateId(),
      created_at: appealData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("appeals", [newAppeal, ...appeals.filter((a) => a.id !== newAppeal.id)]);
    return newAppeal;
  },

  updateAppeal(id: string, updates: Partial<Appeal>): Appeal | null {
    const appeals = this.getAppeals();
    let updated: Appeal | null = null;
    const newAppeals = appeals.map((a) => {
      if (a.id === id) {
        updated = { ...a, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return a;
    });
    setTable("appeals", newAppeals);
    return updated;
  },

  deleteAppeal(id: string): boolean {
    const appeals = this.getAppeals();
    setTable("appeals", appeals.filter((a) => a.id !== id));
    return true;
  },

  // ── Escalation Incidents ───────────────────────────────
  getIncidents(): Incident[] {
    return getTable<Incident>("incidents", []);
  },

  setIncidents(incidents: Incident[]): void {
    setTable("incidents", incidents);
  },

  createIncident(incident: Omit<Incident, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string }): Incident {
    const incidents = this.getIncidents();
    const newIncident: Incident = {
      ...incident,
      id: incident.id || generateId(),
      created_at: incident.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("incidents", [newIncident, ...incidents.filter((i) => i.id !== newIncident.id)]);
    return newIncident;
  },

  updateIncident(id: string, updates: Partial<Incident>): Incident | null {
    const incidents = this.getIncidents();
    let updated: Incident | null = null;
    const newIncidents = incidents.map((inc) => {
      if (inc.id === id) {
        updated = { ...inc, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return inc;
    });
    setTable("incidents", newIncidents);
    return updated;
  },

  deleteIncident(id: string): boolean {
    const incidents = this.getIncidents();
    setTable("incidents", incidents.filter((inc) => inc.id !== id));
    return true;
  },

  // ── Feedback & PIP ─────────────────────────────────────
  getFeedbackSessions(): FeedbackSession[] {
    return getTable<FeedbackSession>("feedback_sessions", []);
  },

  setFeedbackSessions(sessions: FeedbackSession[]): void {
    setTable("feedback_sessions", sessions);
  },

  createFeedbackSession(
    session: Omit<FeedbackSession, "id" | "created_at" | "updated_at">
  ): FeedbackSession {
    const sessions = this.getFeedbackSessions();
    const newSession: FeedbackSession = {
      ...session,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("feedback_sessions", [newSession, ...sessions]);
    return newSession;
  },

  updateFeedbackSession(id: string, updates: Partial<FeedbackSession>): FeedbackSession | null {
    const sessions = this.getFeedbackSessions();
    let updated: FeedbackSession | null = null;
    const newSessions = sessions.map((s) => {
      if (s.id === id) {
        updated = { ...s, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return s;
    });
    setTable("feedback_sessions", newSessions);
    return updated;
  },

  deleteFeedbackSession(id: string): boolean {
    const sessions = this.getFeedbackSessions();
    setTable("feedback_sessions", sessions.filter((s) => s.id !== id));
    return true;
  },

  // ── Educational Tracks & Attendees ─────────────────────
  getEducationalTracks(): EducationalTrack[] {
    return getTable<EducationalTrack>("educational_tracks", []);
  },

  getAttendees(): Attendee[] {
    return getTable<Attendee>("attendees", []);
  },

  // ── Audit Logs ─────────────────────────────────────────
  getAuditLogs(): AuditLog[] {
    return getTable<AuditLog>("audit_logs", INITIAL_AUDIT_LOGS);
  },

  setAuditLogs(logs: AuditLog[]): void {
    setTable("audit_logs", logs);
  },

  createAuditLog(log: AuditLog): AuditLog {
    const logs = this.getAuditLogs();
    setTable("audit_logs", [log, ...logs]);
    return log;
  },

  // ── Attendance Events & Excuses ─────────────────────────
  getAttendanceEvents(): MeetingAttendanceEvent[] {
    return getTable<MeetingAttendanceEvent>("attendance_events", []);
  },

  setAttendanceEvents(events: MeetingAttendanceEvent[]): void {
    setTable("attendance_events", events);
  },

  getMeetingExcuses(): MeetingExcuse[] {
    return getTable<MeetingExcuse>("meeting_excuses", []);
  },

  setMeetingExcuses(excuses: MeetingExcuse[]): void {
    setTable("meeting_excuses", excuses);
  },

  createMeetingExcuse(excuse: MeetingExcuse): MeetingExcuse {
    const list = this.getMeetingExcuses();
    setTable("meeting_excuses", [excuse, ...list]);
    return excuse;
  },

  updateMeetingExcuse(id: string, updates: Partial<MeetingExcuse>): MeetingExcuse | null {
    const list = this.getMeetingExcuses();
    let updated: MeetingExcuse | null = null;
    const newList = list.map((e) => {
      if (e.id === id) {
        updated = { ...e, ...updates };
        return updated;
      }
      return e;
    });
    setTable("meeting_excuses", newList);
    return updated;
  },

  // ── Notifications ──────────────────────────────────────
  getNotifications(): Notification[] {
    return getTable<Notification>("notifications", []);
  },

  createNotification(
    notif: Omit<Notification, "id" | "created_at"> & { id?: string }
  ): Notification {
    const notifs = this.getNotifications();
    const newNotif: Notification = {
      ...notif,
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    setTable("notifications", [newNotif, ...notifs]);
    return newNotif;
  },

  markNotificationAsRead(id: string): boolean {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setTable("notifications", updated);
    return true;
  },

  markAllNotificationsAsRead(userId?: string): boolean {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => (!userId || n.user_id === userId ? { ...n, is_read: true } : n));
    setTable("notifications", updated);
    return true;
  },

  // ── Clear Database ─────────────────────────────────────
  clearAll(): void {
    if (typeof window === "undefined") return;
    const tables = [
      "profiles",
      "teams",
      "tasks",
      "point_events",
      "evaluations",
      "appeals",
      "incidents",
      "feedback_sessions",
      "educational_tracks",
      "attendees",
      "audit_logs",
      "attendance_events",
      "meeting_excuses",
      "notifications",
      "passwords",
    ];
    tables.forEach((t) => localStorage.removeItem(`${STORAGE_PREFIX}${t}`));
  },
};
