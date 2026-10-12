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
import {
  generateId,
  isValidUUID,
  ensureUUID,
  normalizeTeamUUID,
} from "./utils";

// ============================================================
// Real Production Database Service (Live Supabase PostgreSQL Engine)
// ============================================================

export const dbService = {
  // ── Profiles & Members ──────────────────────────────────
  async getProfiles(): Promise<Profile[]> {
    const local = internalDB.getProfiles();
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data)) {
        const merged = [...(data as Profile[])];
        local.forEach((lp) => {
          if (!merged.some((m) => m.id === lp.id)) {
            merged.push(lp);
          }
        });
        internalDB.setProfiles(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Supabase profiles query error, falling back to local:", e);
    }
    return local;
  },

  async createProfile(profile: Profile): Promise<Profile> {
    const profileId = ensureUUID(profile.id);
    const newProfile: Profile = {
      ...profile,
      id: profileId,
      team_id: profile.team_id ? normalizeTeamUUID(profile.team_id) : profile.team_id,
    };
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (!error && data) {
        internalDB.createProfile(data as Profile);
        return data as Profile;
      }
    } catch (e) {
      console.warn("Supabase createProfile error:", e);
    }
    return internalDB.createProfile(newProfile);
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

  async deleteProfile(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      await supabase.from("profiles").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteProfile error:", e);
    }
    return internalDB.deleteProfile(id);
  },

  async setPassword(email: string, password: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    internalDB.setPassword(cleanEmail, password);

    try {
      const supabase = createClient();
      const { data: remoteProf, error: findErr } = await supabase
        .from("profiles")
        .select("id, academic_notes")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (!findErr && remoteProf) {
        let meta: Record<string, any> = {};
        try {
          if (remoteProf.academic_notes) {
            meta =
              typeof remoteProf.academic_notes === "string"
                ? JSON.parse(remoteProf.academic_notes)
                : remoteProf.academic_notes;
          }
        } catch {
          meta = {};
        }
        meta.pwd = password;
        meta.updated_at = new Date().toISOString();

        await supabase
          .from("profiles")
          .update({
            academic_notes: JSON.stringify(meta),
            updated_at: new Date().toISOString(),
          })
          .eq("id", remoteProf.id);
      }
    } catch (e) {
      console.warn("Supabase setPassword error:", e);
    }
  },

  async getPassword(email: string): Promise<string | null> {
    return internalDB.getPassword(email);
  },

  async verifyPassword(email: string, password?: string): Promise<boolean> {
    return internalDB.verifyPassword(email, password);
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

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | null> {
    try {
      const supabase = createClient();
      await supabase.from("teams").update(updates).eq("id", id);
    } catch (e) {
      console.warn("Supabase updateTeam error:", e);
    }
    return internalDB.updateTeam(id, updates);
  },

  async deleteTeam(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      await supabase.from("teams").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteTeam error:", e);
    }
    return internalDB.deleteTeam(id);
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
        const local = internalDB.getTasks();
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
            const cached = local.find((ct) => ct.id === d.id);
            if (cached && Array.isArray(cached.assignees)) {
              assigneesList = cached.assignees;
            }
          }

          return {
            ...d,
            assignees: assigneesList,
          } as Task;
        });

        const merged = [...enrichedTasks];
        local.forEach((lt) => {
          if (!merged.some((m) => m.id === lt.id)) {
            merged.push(lt);
          }
        });

        internalDB.setTasks(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Supabase tasks query error:", e);
    }
    return internalDB.getTasks();
  },

  async createTask(task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task | null> {
    const taskId = ensureUUID((task as any).id);
    const newTask: Task = {
      ...task,
      id: taskId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const { assignees, creator_id, ...dbTaskRecord } = newTask as any;
      if (!dbTaskRecord.created_by && creator_id) {
        dbTaskRecord.created_by = creator_id;
      }

      // Safely serialize assignees into deliverables JSON column so Supabase accepts insert
      dbTaskRecord.deliverables = JSON.stringify({
        assignees: assignees || [],
        text: task.deliverables || "",
      });

      // Normalize UUID fields for Supabase PostgreSQL schema constraints
      if (!isValidUUID(dbTaskRecord.id)) {
        dbTaskRecord.id = generateId();
      }
      dbTaskRecord.team_id = normalizeTeamUUID(dbTaskRecord.team_id);
      if (!isValidUUID(dbTaskRecord.created_by)) {
        dbTaskRecord.created_by = "072de080-6298-4af0-b37a-f3580bb4916e";
      }
      if (!dbTaskRecord.deadline) {
        dbTaskRecord.deadline = new Date(Date.now() + 86400000 * 7).toISOString();
      }

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

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const supabase = createClient();
      const { assignees, ...dbUpdates } = updates as any;
      if (assignees !== undefined) {
        dbUpdates.deliverables = JSON.stringify({
          assignees: assignees || [],
          text: updates.deliverables || "",
        });
      }
      await supabase
        .from("tasks")
        .update({ ...dbUpdates, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase updateTask error:", e);
    }
    return internalDB.updateTask(id, updates);
  },

  async deleteTask(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      await supabase.from("tasks").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteTask error:", e);
    }
    return internalDB.deleteTask(id);
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

  async updatePointEvent(id: string, updates: Partial<PointEvent>): Promise<PointEvent | null> {
    const updated = internalDB.updatePointEvent(id, updates);
    try {
      const supabase = createClient();
      const { data: profiles } = await supabase.from("profiles").select("id, academic_notes");
      if (Array.isArray(profiles)) {
        for (const p of profiles) {
          if (p.academic_notes) {
            try {
              const parsed = JSON.parse(p.academic_notes);
              if (Array.isArray(parsed.pointEvents) && parsed.pointEvents.some((pe: any) => pe.id === id)) {
                parsed.pointEvents = parsed.pointEvents.map((pe: any) =>
                  pe.id === id ? { ...pe, ...updates, updated_at: new Date().toISOString() } : pe
                );
                await supabase
                  .from("profiles")
                  .update({ academic_notes: JSON.stringify(parsed), updated_at: new Date().toISOString() })
                  .eq("id", p.id);
                break;
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.warn("Supabase updatePointEvent error:", e);
    }
    return updated;
  },

  async deletePointEvent(id: string): Promise<boolean> {
    const res = internalDB.deletePointEvent(id);
    try {
      const supabase = createClient();
      const { data: profiles } = await supabase.from("profiles").select("id, academic_notes");
      if (Array.isArray(profiles)) {
        for (const p of profiles) {
          if (p.academic_notes) {
            try {
              const parsed = JSON.parse(p.academic_notes);
              if (Array.isArray(parsed.pointEvents) && parsed.pointEvents.some((pe: any) => pe.id === id)) {
                parsed.pointEvents = parsed.pointEvents.filter((pe: any) => pe.id !== id);
                await supabase
                  .from("profiles")
                  .update({ academic_notes: JSON.stringify(parsed), updated_at: new Date().toISOString() })
                  .eq("id", p.id);
                break;
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.warn("Supabase deletePointEvent error:", e);
    }
    return res;
  },

  // ── Evaluations ─────────────────────────────────────────
  async getEvaluations(): Promise<Evaluation[]> {
    const local = internalDB.getEvaluations();
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const merged = [...(data as Evaluation[])];
        local.forEach((le) => {
          if (!merged.some((m) => m.id === le.id)) {
            merged.push(le);
          }
        });
        internalDB.setEvaluations(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Supabase evaluations error:", e);
    }
    return local;
  },

  async createEvaluation(evalData: Omit<Evaluation, "id" | "created_at" | "updated_at">): Promise<Evaluation | null> {
    const newEvalId = ensureUUID((evalData as any).id);
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
      if (!isValidUUID(dbEvalRecord.id)) {
        dbEvalRecord.id = generateId();
      }
      if (!isValidUUID(dbEvalRecord.member_id)) {
        dbEvalRecord.member_id = "072de080-6298-4af0-b37a-f3580bb4916e";
      }

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

  async updateEvaluation(id: string, updates: Partial<Evaluation>): Promise<Evaluation | null> {
    try {
      const supabase = createClient();
      const { ratings, ...dbEvalRecord } = updates as any;
      await supabase
        .from("evaluations")
        .update({ ...dbEvalRecord, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase updateEvaluation error:", e);
    }
    return internalDB.updateEvaluation(id, updates);
  },

  async deleteEvaluation(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      await supabase.from("evaluations").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteEvaluation error:", e);
    }
    return internalDB.deleteEvaluation(id);
  },

  // ── Appeals ─────────────────────────────────────────────
  async getAppeals(): Promise<Appeal[]> {
    const local = internalDB.getAppeals();
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appeals")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const merged = [...(data as Appeal[])];
        local.forEach((la) => {
          if (!merged.some((m) => m.id === la.id)) {
            merged.push(la);
          }
        });
        internalDB.setAppeals(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Supabase appeals error:", e);
    }
    return local;
  },

  async createAppeal(appeal: Omit<Appeal, "id" | "created_at" | "updated_at">): Promise<Appeal | null> {
    const appealId = ensureUUID((appeal as any).id);
    const newAppeal: Appeal = {
      ...appeal,
      id: appealId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const dbAppeal = { ...newAppeal };
      if (!isValidUUID(dbAppeal.id)) {
        dbAppeal.id = generateId();
      }
      if (!isValidUUID(dbAppeal.member_id)) {
        dbAppeal.member_id = "072de080-6298-4af0-b37a-f3580bb4916e";
      }
      if (!dbAppeal.entity_id) {
        dbAppeal.entity_id = "general";
      }
      if (!dbAppeal.deadline_date) {
        dbAppeal.deadline_date = new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0];
      }

      const { data, error } = await supabase
        .from("appeals")
        .insert([dbAppeal])
        .select()
        .single();

      if (!error && data) {
        internalDB.createAppeal(data as Appeal);
        return data as Appeal;
      }
    } catch (e) {
      console.warn("Supabase createAppeal error:", e);
    }
    return internalDB.createAppeal(newAppeal);
  },

  async updateAppeal(id: string, updates: Partial<Appeal>): Promise<boolean> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("appeals")
        .update(updates)
        .eq("id", id);

      if (!error) {
        internalDB.updateAppeal(id, updates);
        return true;
      }
    } catch (e) {
      console.warn("Supabase updateAppeal error:", e);
    }
    return !!internalDB.updateAppeal(id, updates);
  },

  async deleteAppeal(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      await supabase.from("appeals").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteAppeal error:", e);
    }
    return internalDB.deleteAppeal(id);
  },

  // ── Incidents ───────────────────────────────────────────
  async getIncidents(): Promise<Incident[]> {
    const local = internalDB.getIncidents();
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const merged = [...(data as Incident[])];
        local.forEach((li) => {
          if (!merged.some((m) => m.id === li.id)) {
            merged.push(li);
          }
        });
        internalDB.setIncidents(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Supabase incidents error:", e);
    }
    return local;
  },

  async createIncident(
    incident: Omit<Incident, "id" | "created_at" | "updated_at">
  ): Promise<Incident | null> {
    const incId = ensureUUID((incident as any).id);
    const newIncident: Incident = {
      ...incident,
      id: incId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const dbIncident = { ...newIncident };
      if (!isValidUUID(dbIncident.id)) {
        dbIncident.id = generateId();
      }
      if (!isValidUUID(dbIncident.member_id)) {
        dbIncident.member_id = "072de080-6298-4af0-b37a-f3580bb4916e";
      }

      const { data, error } = await supabase
        .from("incidents")
        .insert([dbIncident])
        .select()
        .single();

      if (!error && data) {
        internalDB.createIncident(data as Incident);
        return data as Incident;
      }
    } catch (e) {
      console.warn("Supabase createIncident error:", e);
    }
    return internalDB.createIncident(newIncident);
  },

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    try {
      const supabase = createClient();
      await supabase
        .from("incidents")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase updateIncident error:", e);
    }
    return internalDB.updateIncident(id, updates);
  },

  async deleteIncident(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      await supabase.from("incidents").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteIncident error:", e);
    }
    return internalDB.deleteIncident(id);
  },

  // ── Feedback Sessions ───────────────────────────────────
  async getFeedbackSessions(): Promise<FeedbackSession[]> {
    const local = internalDB.getFeedbackSessions();
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("feedback_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const merged = [...(data as FeedbackSession[])];
        local.forEach((lf) => {
          if (!merged.some((m) => m.id === lf.id)) {
            merged.push(lf);
          }
        });
        internalDB.setFeedbackSessions(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Supabase feedback error:", e);
    }
    return local;
  },

  async createFeedbackSession(
    session: Omit<FeedbackSession, "id" | "created_at" | "updated_at">
  ): Promise<FeedbackSession | null> {
    const sId = ensureUUID((session as any).id);
    const newSession: FeedbackSession = {
      ...session,
      id: sId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const dbSession = { ...newSession };
      if (!isValidUUID(dbSession.id)) {
        dbSession.id = generateId();
      }
      if (!isValidUUID(dbSession.member_id)) {
        dbSession.member_id = "072de080-6298-4af0-b37a-f3580bb4916e";
      }

      const { data, error } = await supabase
        .from("feedback_sessions")
        .insert([dbSession])
        .select()
        .single();

      if (!error && data) {
        internalDB.createFeedbackSession(data as FeedbackSession);
        return data as FeedbackSession;
      }
    } catch (e) {
      console.warn("Supabase createFeedbackSession error:", e);
    }
    return internalDB.createFeedbackSession(newSession);
  },

  async updateFeedbackSession(id: string, updates: Partial<FeedbackSession>): Promise<FeedbackSession | null> {
    try {
      const supabase = createClient();
      await supabase
        .from("feedback_sessions")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
    } catch (e) {
      console.warn("Supabase updateFeedbackSession error:", e);
    }
    return internalDB.updateFeedbackSession(id, updates);
  },

  async deleteFeedbackSession(id: string): Promise<boolean> {
    try {
      const supabase = createClient();
      await supabase.from("feedback_sessions").delete().eq("id", id);
    } catch (e) {
      console.warn("Supabase deleteFeedbackSession error:", e);
    }
    return internalDB.deleteFeedbackSession(id);
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
    const local = internalDB.getAuditLogs();
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        const merged = [...(data as AuditLog[])];
        local.forEach((la) => {
          if (!merged.some((m) => m.id === la.id)) {
            merged.push(la);
          }
        });
        internalDB.setAuditLogs(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Supabase audit_logs error:", e);
    }
    return local;
  },

  async createAuditLog(log: Omit<AuditLog, "id" | "created_at">): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: ensureUUID((log as any).id),
      created_at: new Date().toISOString(),
    };
    try {
      const supabase = createClient();
      const dbLog: any = { ...newLog };
      if (!isValidUUID(dbLog.id)) {
        dbLog.id = generateId();
      }
      if (dbLog.actor_id && !isValidUUID(dbLog.actor_id)) {
        dbLog.actor_id = "072de080-6298-4af0-b37a-f3580bb4916e";
      }
      if (dbLog.user_id && !isValidUUID(dbLog.user_id)) {
        dbLog.user_id = "072de080-6298-4af0-b37a-f3580bb4916e";
      }
      const { data, error } = await supabase
        .from("audit_logs")
        .insert([dbLog])
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

