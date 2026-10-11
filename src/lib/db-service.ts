import { createClient } from "./supabase/client";
import { internalDB } from "./internal-db";
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
// Real Production Database Service (Live Supabase PostgreSQL Engine)
// ============================================================

export const dbService = {
  // ── Profiles & Members ──────────────────────────────────
  async getProfiles(): Promise<Profile[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data)) {
        return data as Profile[];
      }
    } catch (e) {
      console.warn("Supabase profiles query error, falling back to local:", e);
    }
    return internalDB.getProfiles();
  },

  async createProfile(profile: Profile): Promise<Profile> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .insert([profile])
        .select()
        .single();

      if (!error && data) {
        internalDB.createProfile(data as Profile);
        return data as Profile;
      }
    } catch (e) {
      console.warn("Supabase createProfile error:", e);
    }
    return internalDB.createProfile(profile);
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);

      if (!error) {
        internalDB.updateProfile(id, updates);
        return true;
      }
    } catch (e) {
      console.warn("Supabase updateProfile error:", e);
    }
    return !!internalDB.updateProfile(id, updates);
  },

  // ── Teams ───────────────────────────────────────────────
  async getTeams(): Promise<Team[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data)) {
        return data as Team[];
      }
    } catch (e) {
      console.warn("Supabase teams query error:", e);
    }
    return internalDB.getTeams();
  },

  async createTeam(teamData: Omit<Team, "id" | "created_at" | "updated_at">): Promise<Team> {
    const newTeam: Team = {
      ...teamData,
      id: `team_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("teams")
        .insert([newTeam])
        .select()
        .single();

      if (!error && data) {
        return data as Team;
      }
    } catch (e) {
      console.warn("Supabase createTeam error:", e);
    }
    return newTeam;
  },

  // ── Tasks ───────────────────────────────────────────────
  async getTasks(): Promise<Task[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("deadline", { ascending: true });

      if (!error && Array.isArray(data)) {
        return data as Task[];
      }
    } catch (e) {
      console.warn("Supabase tasks query error:", e);
    }
    return internalDB.getTasks();
  },

  async createTask(task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task | null> {
    const newTask: Task = {
      ...task,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .insert([newTask])
        .select()
        .single();

      if (!error && data) {
        internalDB.createTask(data as Task);
        return data as Task;
      }
    } catch (e) {
      console.warn("Supabase createTask error:", e);
    }
    return internalDB.createTask(task);
  },

  async updateTaskStatus(taskId: string, status: Task["status"]): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", taskId);

      if (!error) {
        internalDB.updateTaskStatus(taskId, status);
        return true;
      }
    } catch (e) {
      console.warn("Supabase updateTaskStatus error:", e);
    }
    return internalDB.updateTaskStatus(taskId, status);
  },

  // ── Point Events (Ledger) ───────────────────────────────
  async getPointEvents(): Promise<PointEvent[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("point_events")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as PointEvent[];
      }
    } catch (e) {
      console.warn("Supabase pointEvents query error:", e);
    }
    return internalDB.getPointEvents();
  },

  async createPointEvent(
    event: Omit<PointEvent, "id" | "created_at" | "updated_at">
  ): Promise<PointEvent | null> {
    const newEvent: PointEvent = {
      ...event,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("point_events")
        .insert([newEvent])
        .select()
        .single();

      if (!error && data) {
        internalDB.createPointEvent(data as PointEvent);
        return data as PointEvent;
      }
    } catch (e) {
      console.warn("Supabase createPointEvent error:", e);
    }
    return internalDB.createPointEvent(event);
  },

  async updatePointEventStatus(
    id: string,
    status: PointEvent["status"],
    reviewerNotes?: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const isDecision = status === "approved" || status === "rejected";
      const { error } = await supabase
        .from("point_events")
        .update({
          status,
          ...(isDecision ? { decision: status } : {}),
          ...(isDecision ? { decision_at: new Date().toISOString() } : {}),
          ...(reviewerNotes ? { decision_rationale: reviewerNotes } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (!error) {
        internalDB.updatePointEventStatus(id, status, reviewerNotes);
        return true;
      }
    } catch (e) {
      console.warn("Supabase updatePointEventStatus error:", e);
    }
    return internalDB.updatePointEventStatus(id, status, reviewerNotes);
  },

  // ── Evaluations ─────────────────────────────────────────
  async getEvaluations(): Promise<Evaluation[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as Evaluation[];
      }
    } catch (e) {
      console.warn("Supabase evaluations error:", e);
    }
    return internalDB.getEvaluations();
  },

  async createEvaluation(evalData: Omit<Evaluation, "id" | "created_at" | "updated_at">): Promise<Evaluation | null> {
    const newEvalId = generateId();
    const newEval: Evaluation = {
      ...evalData,
      id: newEvalId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      // Destructure ratings so Supabase doesn't reject column not existing
      const { ratings, ...dbEvalRecord } = newEval;
      const { data, error } = await supabase
        .from("evaluations")
        .insert([dbEvalRecord])
        .select()
        .single();

      if (!error && data) {
        if (ratings && ratings.length > 0) {
          try {
            await supabase.from("evaluation_ratings").insert(
              ratings.map((r) => ({
                id: generateId(),
                evaluation_id: data.id,
                category_id: r.category_id,
                rating: r.rating,
              }))
            );
          } catch (err) {
            console.warn("evaluation_ratings insert error:", err);
          }
        }
        const fullEval = { ...(data as Evaluation), ratings: ratings || [] };
        internalDB.createEvaluation(fullEval);
        return fullEval;
      }
    } catch (e) {
      console.warn("Supabase createEvaluation error:", e);
    }
    return internalDB.createEvaluation(newEval);
  },

  // ── Appeals ─────────────────────────────────────────────
  async getAppeals(): Promise<Appeal[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appeals")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as Appeal[];
      }
    } catch (e) {
      console.warn("Supabase appeals error:", e);
    }
    return internalDB.getAppeals();
  },

  async createAppeal(appeal: Omit<Appeal, "id" | "created_at" | "updated_at">): Promise<Appeal | null> {
    const newAppeal: Appeal = {
      ...appeal,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appeals")
        .insert([newAppeal])
        .select()
        .single();

      if (!error && data) {
        internalDB.createAppeal(data as Appeal);
        return data as Appeal;
      }
    } catch (e) {
      console.warn("Supabase createAppeal error:", e);
    }
    return internalDB.createAppeal(appeal);
  },

  // ── Incidents ───────────────────────────────────────────
  async getIncidents(): Promise<Incident[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as Incident[];
      }
    } catch (e) {
      console.warn("Supabase incidents error:", e);
    }
    return internalDB.getIncidents();
  },

  async createIncident(
    incident: Omit<Incident, "id" | "created_at" | "updated_at">
  ): Promise<Incident | null> {
    const newIncident: Incident = {
      ...incident,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("incidents")
        .insert([newIncident])
        .select()
        .single();

      if (!error && data) {
        internalDB.createIncident(data as Incident);
        return data as Incident;
      }
    } catch (e) {
      console.warn("Supabase createIncident error:", e);
    }
    return internalDB.createIncident(incident);
  },

  // ── Feedback Sessions ───────────────────────────────────
  async getFeedbackSessions(): Promise<FeedbackSession[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("feedback_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as FeedbackSession[];
      }
    } catch (e) {
      console.warn("Supabase feedback error:", e);
    }
    return internalDB.getFeedbackSessions();
  },

  async createFeedbackSession(
    session: Omit<FeedbackSession, "id" | "created_at" | "updated_at">
  ): Promise<FeedbackSession | null> {
    const newSession: FeedbackSession = {
      ...session,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("feedback_sessions")
        .insert([newSession])
        .select()
        .single();

      if (!error && data) {
        internalDB.createFeedbackSession(data as FeedbackSession);
        return data as FeedbackSession;
      }
    } catch (e) {
      console.warn("Supabase createFeedbackSession error:", e);
    }
    return internalDB.createFeedbackSession(session);
  },

  // ── Educational Tracks & Attendees ─────────────────────
  async getEducationalTracks(): Promise<EducationalTrack[]> {
    return internalDB.getEducationalTracks();
  },

  async getAttendees(): Promise<Attendee[]> {
    return internalDB.getAttendees();
  },

  // ── Audit Logs ─────────────────────────────────────────
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data as AuditLog[];
      }
    } catch (e) {
      console.warn("Supabase audit_logs error:", e);
    }
    return internalDB.getAuditLogs();
  },

  async createAuditLog(log: Omit<AuditLog, "id" | "created_at">): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .insert([newLog])
        .select()
        .single();

      if (!error && data) {
        internalDB.createAuditLog(data as AuditLog);
        return data as AuditLog;
      }
    } catch (e) {
      console.warn("Supabase createAuditLog error:", e);
    }
    return internalDB.createAuditLog(newLog);
  },
};

