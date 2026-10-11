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
} from "@/types";

// ============================================================
// Database Service (Purely Internal Embedded Project Architecture)
// ============================================================

export const dbService = {
  // Profiles
  async getProfiles(): Promise<Profile[]> {
    return internalDB.getProfiles();
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
    return !!internalDB.updateProfile(id, updates);
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    return internalDB.getTeams();
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    return internalDB.getTasks();
  },

  async createTask(task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task | null> {
    return internalDB.createTask(task);
  },

  async updateTaskStatus(taskId: string, status: Task["status"]): Promise<boolean> {
    return internalDB.updateTaskStatus(taskId, status);
  },

  // Point Events
  async getPointEvents(): Promise<PointEvent[]> {
    return internalDB.getPointEvents();
  },

  async createPointEvent(
    event: Omit<PointEvent, "id" | "created_at" | "updated_at">
  ): Promise<PointEvent | null> {
    return internalDB.createPointEvent(event);
  },

  async updatePointEventStatus(
    id: string,
    status: PointEvent["status"],
    reviewerNotes?: string
  ): Promise<boolean> {
    return internalDB.updatePointEventStatus(id, status, reviewerNotes);
  },

  // Evaluations
  async getEvaluations(): Promise<Evaluation[]> {
    return internalDB.getEvaluations();
  },

  // Appeals
  async getAppeals(): Promise<Appeal[]> {
    return internalDB.getAppeals();
  },

  async createAppeal(appeal: Omit<Appeal, "id" | "created_at" | "updated_at">): Promise<Appeal | null> {
    return internalDB.createAppeal(appeal);
  },

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    return internalDB.getIncidents();
  },

  // Feedback Sessions
  async getFeedbackSessions(): Promise<FeedbackSession[]> {
    return internalDB.getFeedbackSessions();
  },

  // Educational
  async getEducationalTracks(): Promise<EducationalTrack[]> {
    return internalDB.getEducationalTracks();
  },

  async getAttendees(): Promise<Attendee[]> {
    return internalDB.getAttendees();
  },
};
