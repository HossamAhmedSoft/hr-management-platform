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
} from "@/types";
import { generateId } from "./utils";

// ============================================================
// Internal Enterprise Storage Engine (Pure Production)
// ============================================================

const STORAGE_PREFIX = "gdg_nctu_db_";

function getTable<T>(tableName: string, defaultData: T[] = []): T[] {
  if (typeof window === "undefined") return defaultData;
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
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tableName}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to write table ${tableName}:`, e);
  }
}

export const internalDB = {
  // ── Profiles & Users ───────────────────────────────────
  getProfiles(): Profile[] {
    return getTable<Profile>("profiles", []);
  },

  getProfileByEmail(email: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null;
  },

  createProfile(profile: Profile): Profile {
    const profiles = this.getProfiles();
    const updated = [profile, ...profiles.filter((p) => p.id !== profile.id)];
    setTable("profiles", updated);
    return profile;
  },

  // ── Password Management ────────────────────────────────
  setPassword(email: string, password: string): void {
    const passwords = getTable<Record<string, string>>("passwords", [{}])[0] || {};
    passwords[email.toLowerCase().trim()] = password;
    setTable("passwords", [passwords]);
  },

  getPassword(email: string): string | null {
    const passwords = getTable<Record<string, string>>("passwords", [{}])[0] || {};
    return passwords[email.toLowerCase().trim()] || null;
  },

  verifyPassword(email: string, password?: string): boolean {
    const stored = this.getPassword(email);
    if (!stored) return true; // if no password set yet, allow
    return stored === password;
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

  // ── Teams ──────────────────────────────────────────────
  getTeams(): Team[] {
    return getTable<Team>("teams", []);
  },

  setTeams(teams: Team[]): void {
    setTable("teams", teams);
  },

  // ── Tasks & Deliverables ───────────────────────────────
  getTasks(): Task[] {
    return getTable<Task>("tasks", []);
  },

  createTask(taskData: Omit<Task, "id" | "created_at" | "updated_at">): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("tasks", [newTask, ...tasks]);
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

  // ── Points Ledger ──────────────────────────────────────
  getPointEvents(): PointEvent[] {
    return getTable<PointEvent>("point_events", []);
  },

  createPointEvent(eventData: Omit<PointEvent, "id" | "created_at" | "updated_at">): PointEvent {
    const events = this.getPointEvents();
    const newEvent: PointEvent = {
      ...eventData,
      id: `pe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("point_events", [newEvent, ...events]);
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

  // ── Monthly Evaluations ────────────────────────────────
  getEvaluations(): Evaluation[] {
    return getTable<Evaluation>("evaluations", []);
  },

  createEvaluation(evalData: Omit<Evaluation, "id" | "created_at" | "updated_at">): Evaluation {
    const evals = this.getEvaluations();
    const newEval: Evaluation = {
      ...evalData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("evaluations", [newEval, ...evals]);
    return newEval;
  },

  // ── Appeals (Disputes) ─────────────────────────────────
  getAppeals(): Appeal[] {
    return getTable<Appeal>("appeals", []);
  },

  createAppeal(appealData: Omit<Appeal, "id" | "created_at" | "updated_at">): Appeal {
    const appeals = this.getAppeals();
    const newAppeal: Appeal = {
      ...appealData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("appeals", [newAppeal, ...appeals]);
    return newAppeal;
  },

  // ── Escalation Incidents ───────────────────────────────
  getIncidents(): Incident[] {
    return getTable<Incident>("incidents", []);
  },

  createIncident(incident: Omit<Incident, "id" | "created_at" | "updated_at">): Incident {
    const incidents = this.getIncidents();
    const newIncident: Incident = {
      ...incident,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("incidents", [newIncident, ...incidents]);
    return newIncident;
  },

  // ── Feedback & PIP ─────────────────────────────────────
  getFeedbackSessions(): FeedbackSession[] {
    return getTable<FeedbackSession>("feedback_sessions", []);
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

  // ── Educational Tracks & Attendees ─────────────────────
  getEducationalTracks(): EducationalTrack[] {
    return getTable<EducationalTrack>("educational_tracks", []);
  },

  getAttendees(): Attendee[] {
    return getTable<Attendee>("attendees", []);
  },

  // ── Audit Logs ─────────────────────────────────────────
  getAuditLogs(): AuditLog[] {
    return getTable<AuditLog>("audit_logs", []);
  },

  createAuditLog(log: AuditLog): AuditLog {
    const logs = this.getAuditLogs();
    setTable("audit_logs", [log, ...logs]);
    return log;
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
      "passwords",
    ];
    tables.forEach((t) => localStorage.removeItem(`${STORAGE_PREFIX}${t}`));
  },
};
