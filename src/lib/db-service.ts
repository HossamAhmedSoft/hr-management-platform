import { createClient } from "./supabase/client";
import { internalDB } from "./internal-db";
import {
  Profile,
  Team,
  Task,
  TaskAssignee,
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
        const enrichedTasks: Task[] = data.map((d: any) => {
          let assigneesList: TaskAssignee[] = [];

          if (d.deliverables && typeof d.deliverables === "string" && d.deliverables.startsWith("{")) {
            try {
              const meta = JSON.parse(d.deliverables);
              if (Array.isArray(meta.assignees)) {
                assigneesList = meta.assignees;
              }
            } catch (_) { }
          }

          if (assigneesList.length === 0) {
            const cached = internalDB.getTasks().find((ct) => ct.id === d.id);
            if (cached && Array.isArray(cached.assignees)) {
              assigneesList = cached.assignees;
            }
          }

          return {
            ...d,
            assignees: assigneesList,
          } as Task;
        });

        internalDB.setTasks(enrichedTasks);
        return enrichedTasks;
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
      const { assignees, ...dbTaskRecord } = newTask;

      // Safely serialize assignees into deliverables JSON column so Supabase accepts insert
      dbTaskRecord.deliverables = JSON.stringify({
        assignees: assignees || [],
        text: task.deliverables || "",
      });

      const { data, error } = await supabase
        .from("tasks")
        .insert([dbTaskRecord])
        .select()
        .single();

      if (!error && data) {
        const fullTask: Task = {
          ...(data as Task),
          assignees: assignees || [],
        };
        internalDB.createTask(fullTask);
        return fullTask;
      } else if (error) {
        console.warn("Supabase createTask error:", error);
      }
    } catch (e) {
      console.warn("Supabase createTask error:", e);
    }
    return internalDB.createTask(newTask);
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
    const local = internalDB.getPointEvents();
    try {
      const supabase = createClient();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, academic_notes");

      if (Array.isArray(profiles)) {
        const remoteEvents: PointEvent[] = [];
        profiles.forEach((p) => {
          if (p.academic_notes) {
            try {
              const parsed = JSON.parse(p.academic_notes);
              if (Array.isArray(parsed.pointEvents)) {
                remoteEvents.push(...parsed.pointEvents);
              }
            } catch (_) { }
          }
        });

        if (remoteEvents.length > 0) {
          const merged = [...remoteEvents];
          local.forEach((l) => {
            if (!merged.some((m) => m.id === l.id)) merged.push(l);
          });
          internalDB.setPointEvents(merged);
          return merged;
        }
      }
    } catch (e) {
      console.warn("Supabase getPointEvents error:", e);
    }
    return local;
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

    // Save locally
    internalDB.createPointEvent(newEvent);

    // Sync to Supabase in target member profile's academic_notes
    try {
      const supabase = createClient();
      const { data: pData } = await supabase
        .from("profiles")
        .select("id, academic_notes")
        .eq("id", event.member_id)
        .single();

      if (pData) {
        let notesData: any = {};
        try { notesData = JSON.parse(pData.academic_notes || "{}"); } catch (_) { }
        const curEvents = Array.isArray(notesData.pointEvents) ? notesData.pointEvents : [];
        notesData.pointEvents = [newEvent, ...curEvents.filter((ce: any) => ce.id !== newEvent.id)];
        await supabase
          .from("profiles")
          .update({ academic_notes: JSON.stringify(notesData), updated_at: new Date().toISOString() })
          .eq("id", event.member_id);
      }
    } catch (e) {
      console.warn("Supabase pointEvent profile sync error:", e);
    }

    return newEvent;
  },

  async updatePointEventStatus(
    id: string,
    status: PointEvent["status"],
    reviewerNotes?: string
  ): Promise<boolean> {
    internalDB.updatePointEventStatus(id, status, reviewerNotes);
    try {
      const supabase = createClient();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, academic_notes");

      if (Array.isArray(profiles)) {
        for (const p of profiles) {
          if (p.academic_notes) {
            try {
              const parsed = JSON.parse(p.academic_notes);
              if (Array.isArray(parsed.pointEvents) && parsed.pointEvents.some((pe: any) => pe.id === id)) {
                parsed.pointEvents = parsed.pointEvents.map((pe: any) =>
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
                await supabase
                  .from("profiles")
                  .update({ academic_notes: JSON.stringify(parsed), updated_at: new Date().toISOString() })
                  .eq("id", p.id);
                break;
              }
            } catch (_) { }
          }
        }
      }
    } catch (e) {
      console.warn("Supabase updatePointEventStatus error:", e);
    }
    return true;
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

  // ── Notifications ───────────────────────────────────────
  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const supabase = createClient();
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("recipient_id", userId);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data.map((d: any) => ({
          ...d,
          user_id: d.recipient_id || d.user_id,
        })) as Notification[];
      }
    } catch (e) {
      console.warn("Supabase notifications query error:", e);
    }

    const local = internalDB.getNotifications();
    return userId ? local.filter((n) => n.user_id === userId) : local;
  },

  async createNotification(
    notif: Omit<Notification, "id" | "created_at">
  ): Promise<Notification> {
    const newNotif: Notification = {
      ...notif,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notifications")
        .insert([
          {
            id: newNotif.id,
            recipient_id: newNotif.user_id,
            title: newNotif.title,
            message: newNotif.message,
            type: newNotif.type,
            is_read: newNotif.is_read,
            created_at: newNotif.created_at,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        internalDB.createNotification(newNotif);
        return newNotif;
      }
    } catch (e) {
      console.warn("Supabase createNotification error:", e);
    }
    return internalDB.createNotification(newNotif);
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase markNotificationAsRead error:", e);
    }
    return internalDB.markNotificationAsRead(id);
  },

  async markAllNotificationsAsRead(userId?: string): Promise<boolean> {
    try {
      const supabase = createClient();
      if (userId) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("recipient_id", userId);
      }
    } catch (e) {
      console.warn("Supabase markAllNotificationsAsRead error:", e);
    }
    return internalDB.markAllNotificationsAsRead(userId);
  },

  // ── Meeting Attendance & Excuses ──────────────────────────
  async getAttendanceEvents(): Promise<MeetingAttendanceEvent[]> {
    return internalDB.getAttendanceEvents();
  },

  async setAttendanceEvents(events: MeetingAttendanceEvent[]): Promise<void> {
    internalDB.setAttendanceEvents(events);
  },

  async getMeetingExcuses(): Promise<MeetingExcuse[]> {
    return internalDB.getMeetingExcuses();
  },

  async createMeetingExcuse(excuse: MeetingExcuse): Promise<MeetingExcuse> {
    return internalDB.createMeetingExcuse(excuse);
  },

  async updateMeetingExcuse(id: string, updates: Partial<MeetingExcuse>): Promise<MeetingExcuse | null> {
    return internalDB.updateMeetingExcuse(id, updates);
  },
};

