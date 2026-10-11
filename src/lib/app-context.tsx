"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import {
  saveSession,
  getSession,
  clearSession,
  canAccessRoute,
} from "@/lib/auth-service";
import { dbService } from "@/lib/db-service";

interface AppContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile) => void;
  availableUsers: Profile[];
  isAuthenticated: boolean;
  login: (user: Profile) => void;
  logout: () => void;
  locale: "en" | "ar";
  setLocale: (locale: "en" | "ar") => void;
  toggleLocale: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  teams: Team[];
  tasks: Task[];
  pointEvents: PointEvent[];
  evaluations: Evaluation[];
  appeals: Appeal[];
  incidents: Incident[];
  feedbackSessions: FeedbackSession[];
  educationalTracks: EducationalTrack[];
  attendees: Attendee[];
  auditLogs: AuditLog[];
  addTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => void;
  updateTaskStatus: (taskId: string, newStatus: Task["status"]) => void;
  addPointEvent: (event: Omit<PointEvent, "id" | "created_at" | "updated_at">) => void;
  approvePointEvent: (id: string, rationale?: string) => void;
  rejectPointEvent: (id: string, rationale?: string) => void;
  submitAppeal: (appeal: Omit<Appeal, "id" | "created_at" | "updated_at">) => void;
  addEvaluation: (evalData: Omit<Evaluation, "id" | "created_at" | "updated_at">) => void;
  addIncident: (incident: Omit<Incident, "id" | "created_at" | "updated_at">) => void;
  addFeedbackSession: (session: Omit<FeedbackSession, "id" | "created_at" | "updated_at">) => void;
  addAuditLog: (log: Omit<AuditLog, "id" | "created_at">) => void;
  unreadNotificationsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: "en" | "ar";
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState<Profile | null>(() => {
    const session = getSession();
    return session?.user || null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getSession();
  });

  const [locale, setLocale] = useState<"en" | "ar">(initialLocale);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pointEvents, setPointEvents] = useState<PointEvent[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>([]);
  const [educationalTracks] = useState<EducationalTrack[]>([]);
  const [attendees] = useState<Attendee[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [unreadNotificationsCount] = useState<number>(0);

  // Load saved theme on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gdg_theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
        if (saved === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
  }, []);

  // Sync theme with HTML class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Sync dir with locale
  useEffect(() => {
    document.documentElement.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", locale);
  }, [locale]);

  // Live synchronization from Supabase database
  useEffect(() => {
    let isMounted = true;
    async function syncDatabase() {
      try {
        const [
          liveProfiles,
          liveTeams,
          liveTasks,
          livePoints,
          liveEvaluations,
          liveAppeals,
          liveIncidents,
          liveFeedback,
          liveAuditLogs,
        ] = await Promise.all([
          dbService.getProfiles(),
          dbService.getTeams(),
          dbService.getTasks(),
          dbService.getPointEvents(),
          dbService.getEvaluations(),
          dbService.getAppeals(),
          dbService.getIncidents(),
          dbService.getFeedbackSessions(),
          dbService.getAuditLogs(),
        ]);

        if (!isMounted) return;
        if (liveProfiles) setAvailableUsers(liveProfiles);
        if (liveTeams) setTeams(liveTeams);
        if (liveTasks) setTasks(liveTasks);
        if (livePoints) setPointEvents(livePoints);
        if (liveEvaluations) setEvaluations(liveEvaluations);
        if (liveAppeals) setAppeals(liveAppeals);
        if (liveIncidents) setIncidents(liveIncidents);
        if (liveFeedback) setFeedbackSessions(liveFeedback);
        if (liveAuditLogs) setAuditLogs(liveAuditLogs);
      } catch (err) {
        console.warn("Error loading live database:", err);
      }
    }
    syncDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist session whenever user changes
  const handleSetCurrentUser = (user: Profile) => {
    setCurrentUser(user);
    saveSession(user);
    setIsAuthenticated(true);
  };

  const login = (user: Profile) => {
    handleSetCurrentUser(user);
    router.push(`/${locale}`);
  };

  const logout = () => {
    clearSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    router.push(`/${locale}/login`);
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem("gdg_theme", next);
      }
      return next;
    });
  };

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "ar" : "en";
    setLocale(nextLocale);
    if (pathname) {
      const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
      router.push(newPath);
    }
  };

  const addTask = async (newTask: Omit<Task, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createTask(newTask);
    if (created) {
      setTasks((prev) => [created, ...prev]);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    await dbService.updateTaskStatus(taskId, newStatus);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, updated_at: new Date().toISOString() }
          : t
      )
    );
  };

  const addPointEvent = async (newEvent: Omit<PointEvent, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createPointEvent(newEvent);
    if (created) {
      setPointEvents((prev) => [created, ...prev]);
    }
  };

  const approvePointEvent = async (id: string, rationale?: string) => {
    await dbService.updatePointEventStatus(id, "approved", rationale);
    setPointEvents((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "approved",
              decision: "approved",
              decision_at: new Date().toISOString(),
              decision_rationale: rationale || "Approved by HR reviewer",
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const rejectPointEvent = async (id: string, rationale?: string) => {
    await dbService.updatePointEventStatus(id, "rejected", rationale);
    setPointEvents((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "rejected",
              decision: "rejected",
              decision_at: new Date().toISOString(),
              decision_rationale: rationale || "Rejected during review",
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const submitAppeal = async (newAppeal: Omit<Appeal, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createAppeal(newAppeal);
    if (created) {
      setAppeals((prev) => [created, ...prev]);
    }
  };

  const addEvaluation = async (evalData: Omit<Evaluation, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createEvaluation(evalData);
    if (created) {
      setEvaluations((prev) => [created, ...prev]);
    }
  };

  const addIncident = async (incident: Omit<Incident, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createIncident(incident);
    if (created) {
      setIncidents((prev) => [created, ...prev]);
    }
  };

  const addFeedbackSession = async (session: Omit<FeedbackSession, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createFeedbackSession(session);
    if (created) {
      setFeedbackSessions((prev) => [created, ...prev]);
    }
  };

  const addAuditLog = async (log: Omit<AuditLog, "id" | "created_at">) => {
    const created = await dbService.createAuditLog(log);
    if (created) {
      setAuditLogs((prev) => [created, ...prev]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        availableUsers,
        isAuthenticated,
        login,
        logout,
        locale,
        setLocale,
        toggleLocale,
        theme,
        toggleTheme,
        teams,
        tasks,
        pointEvents,
        evaluations,
        appeals,
        incidents,
        feedbackSessions,
        educationalTracks,
        attendees,
        auditLogs,
        addTask,
        updateTaskStatus,
        addPointEvent,
        approvePointEvent,
        rejectPointEvent,
        submitAppeal,
        addEvaluation,
        addIncident,
        addFeedbackSession,
        addAuditLog,
        unreadNotificationsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
