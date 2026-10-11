import { createClient } from "./supabase/client";
import {
  Profile,
  Team,
  Task,
  PointEvent,
  Evaluation,
  Appeal,
  Incident,
  FeedbackSession,
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
} from "./mock-data";
import { isSupabaseConfigured } from "./auth-service";

// ============================================================
// Real Database Service (Supabase PostgreSQL + Fallback Seed)
// ============================================================

export const dbService = {
  // ── Profiles & Members ──────────────────────────────────
  async getProfiles(): Promise<Profile[]> {
    if (!isSupabaseConfigured()) return MOCK_PROFILES;
    const supabase = createClient();
    if (!supabase) return MOCK_PROFILES;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) return MOCK_PROFILES;
    return data as Profile[];
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const supabase = createClient();
    if (!supabase) return true;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);
    return !error;
  },

  // ── Teams ───────────────────────────────────────────────
  async getTeams(): Promise<Team[]> {
    if (!isSupabaseConfigured()) return MOCK_TEAMS;
    const supabase = createClient();
    if (!supabase) return MOCK_TEAMS;

    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) return MOCK_TEAMS;
    return data as Team[];
  },

  // ── Tasks ───────────────────────────────────────────────
  async getTasks(): Promise<Task[]> {
    if (!isSupabaseConfigured()) return MOCK_TASKS;
    const supabase = createClient();
    if (!supabase) return MOCK_TASKS;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("deadline", { ascending: true });

    if (error || !data || data.length === 0) return MOCK_TASKS;
    return data as Task[];
  },

  async createTask(task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task | null> {
    if (!isSupabaseConfigured()) {
      return {
        ...task,
        id: `tsk_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("tasks")
      .insert([task])
      .select()
      .single();

    if (error) return null;
    return data as Task;
  },

  async updateTaskStatus(taskId: string, status: Task["status"]): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const supabase = createClient();
    if (!supabase) return true;

    const { error } = await supabase
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    return !error;
  },

  // ── Point Events (Ledger) ───────────────────────────────
  async getPointEvents(): Promise<PointEvent[]> {
    if (!isSupabaseConfigured()) return MOCK_POINT_EVENTS;
    const supabase = createClient();
    if (!supabase) return MOCK_POINT_EVENTS;

    const { data, error } = await supabase
      .from("point_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return MOCK_POINT_EVENTS;
    return data as PointEvent[];
  },

  async createPointEvent(
    event: Omit<PointEvent, "id" | "created_at" | "updated_at">
  ): Promise<PointEvent | null> {
    if (!isSupabaseConfigured()) {
      return {
        ...event,
        id: `pe_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("point_events")
      .insert([event])
      .select()
      .single();

    if (error) return null;
    return data as PointEvent;
  },

  async updatePointEventStatus(
    id: string,
    status: PointEvent["status"],
    reviewerNotes?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;
    const supabase = createClient();
    if (!supabase) return true;

    const { error } = await supabase
      .from("point_events")
      .update({
        status,
        reviewer_notes: reviewerNotes,
        decided_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    return !error;
  },

  // ── Monthly Evaluations ─────────────────────────────────
  async getEvaluations(): Promise<Evaluation[]> {
    if (!isSupabaseConfigured()) return MOCK_EVALUATIONS;
    const supabase = createClient();
    if (!supabase) return MOCK_EVALUATIONS;

    const { data, error } = await supabase
      .from("evaluations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return MOCK_EVALUATIONS;
    return data as Evaluation[];
  },

  // ── Appeals ─────────────────────────────────────────────
  async getAppeals(): Promise<Appeal[]> {
    if (!isSupabaseConfigured()) return MOCK_APPEALS;
    const supabase = createClient();
    if (!supabase) return MOCK_APPEALS;

    const { data, error } = await supabase
      .from("appeals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return MOCK_APPEALS;
    return data as Appeal[];
  },

  async createAppeal(appeal: Omit<Appeal, "id" | "created_at" | "updated_at">): Promise<Appeal | null> {
    if (!isSupabaseConfigured()) {
      return {
        ...appeal,
        id: `app_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("appeals")
      .insert([appeal])
      .select()
      .single();

    if (error) return null;
    return data as Appeal;
  },

  // ── Escalation Incidents ────────────────────────────────
  async getIncidents(): Promise<Incident[]> {
    if (!isSupabaseConfigured()) return MOCK_INCIDENTS;
    const supabase = createClient();
    if (!supabase) return MOCK_INCIDENTS;

    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return MOCK_INCIDENTS;
    return data as Incident[];
  },

  // ── Feedback Sessions & PIP ─────────────────────────────
  async getFeedbackSessions(): Promise<FeedbackSession[]> {
    if (!isSupabaseConfigured()) return MOCK_FEEDBACK_SESSIONS;
    const supabase = createClient();
    if (!supabase) return MOCK_FEEDBACK_SESSIONS;

    const { data, error } = await supabase
      .from("feedback_sessions")
      .select("*")
      .order("session_date", { ascending: false });

    if (error || !data || data.length === 0) return MOCK_FEEDBACK_SESSIONS;
    return data as FeedbackSession[];
  },
};
