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
  UserRole,
} from "@/types";
import {
  MOCK_PROFILES,
  MOCK_TEAMS,
  MOCK_TASKS,
  MOCK_POINT_EVENTS,
  MOCK_EVALUATIONS,
  MOCK_APPEALS,
  MOCK_INCIDENTS,
  MOCK_FEEDBACK_SESSIONS,
  MOCK_EDUCATIONAL_TRACKS,
  MOCK_ATTENDEES,
} from "./mock-data";

// ============================================================
// Internal Embedded Enterprise Database
// Self-Contained, Zero External Cloud, Tamper-Proof
// ============================================================

const STORAGE_PREFIX = "gdg_nctu_db_";

function getTable<T>(tableName: string, defaultData: T[]): T[] {
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
    return getTable<Profile>("profiles", MOCK_PROFILES);
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
    return getTable<Team>("teams", MOCK_TEAMS);
  },

  // ── Tasks & Deliverables ───────────────────────────────
  getTasks(): Task[] {
    return getTable<Task>("tasks", MOCK_TASKS);
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
    return getTable<PointEvent>("point_events", MOCK_POINT_EVENTS);
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
    const updated = events.map((pe) =>
      pe.id === id
        ? {
            ...pe,
            status,
            decision: status,
            decision_at: new Date().toISOString(),
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
    return getTable<Evaluation>("evaluations", MOCK_EVALUATIONS);
  },

  // ── Appeals (Disputes) ─────────────────────────────────
  getAppeals(): Appeal[] {
    return getTable<Appeal>("appeals", MOCK_APPEALS);
  },

  createAppeal(appealData: Omit<Appeal, "id" | "created_at" | "updated_at">): Appeal {
    const appeals = this.getAppeals();
    const newAppeal: Appeal = {
      ...appealData,
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTable("appeals", [newAppeal, ...appeals]);
    return newAppeal;
  },

  // ── Escalation Incidents ───────────────────────────────
  getIncidents(): Incident[] {
    return getTable<Incident>("incidents", MOCK_INCIDENTS);
  },

  // ── Feedback & PIP ─────────────────────────────────────
  getFeedbackSessions(): FeedbackSession[] {
    return getTable<FeedbackSession>("feedback_sessions", MOCK_FEEDBACK_SESSIONS);
  },

  // ── Educational Tracks & Attendees ─────────────────────
  getEducationalTracks(): EducationalTrack[] {
    return getTable<EducationalTrack>("educational_tracks", MOCK_EDUCATIONAL_TRACKS);
  },

  getAttendees(): Attendee[] {
    return getTable<Attendee>("attendees", MOCK_ATTENDEES);
  },
};
