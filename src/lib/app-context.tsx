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
} from "@/lib/mock-data";
import {
  saveSession,
  getSession,
  clearSession,
  canAccessRoute,
} from "@/lib/auth-service";
import { dbService } from "@/lib/db-service";

interface AppContextType {
  currentUser: Profile;
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
  addTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => void;
  updateTaskStatus: (taskId: string, newStatus: Task["status"]) => void;
  addPointEvent: (event: Omit<PointEvent, "id" | "created_at" | "updated_at">) => void;
  approvePointEvent: (id: string, rationale?: string) => void;
  rejectPointEvent: (id: string, rationale?: string) => void;
  submitAppeal: (appeal: Omit<Appeal, "id" | "created_at" | "updated_at">) => void;
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

  const [currentUser, setCurrentUser] = useState<Profile>(() => {
    const session = getSession();
    return session?.user || MOCK_PROFILES[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getSession();
  });

  const [locale, setLocale] = useState<"en" | "ar">(initialLocale);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [pointEvents, setPointEvents] = useState<PointEvent[]>(MOCK_POINT_EVENTS);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(MOCK_EVALUATIONS);
  const [appeals, setAppeals] = useState<Appeal[]>(MOCK_APPEALS);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>(MOCK_FEEDBACK_SESSIONS);
  const [educationalTracks] = useState<EducationalTrack[]>(MOCK_EDUCATIONAL_TRACKS);
  const [attendees] = useState<Attendee[]>(MOCK_ATTENDEES);
  const [unreadNotificationsCount] = useState<number>(3);

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

  // Initial live synchronization from Supabase database
  useEffect(() => {
    let isMounted = true;
    async function syncDatabase() {
      try {
        const [liveTeams, liveTasks, livePoints, liveEvaluations, liveAppeals, liveIncidents, liveFeedback] =
          await Promise.all([
            dbService.getTeams(),
            dbService.getTasks(),
            dbService.getPointEvents(),
            dbService.getEvaluations(),
            dbService.getAppeals(),
            dbService.getIncidents(),
            dbService.getFeedbackSessions(),
          ]);

        if (!isMounted) return;
        if (liveTeams && liveTeams.length > 0) setTeams(liveTeams);
        if (liveTasks && liveTasks.length > 0) setTasks(liveTasks);
        if (livePoints && livePoints.length > 0) setPointEvents(livePoints);
        if (liveEvaluations && liveEvaluations.length > 0) setEvaluations(liveEvaluations);
        if (liveAppeals && liveAppeals.length > 0) setAppeals(liveAppeals);
        if (liveIncidents && liveIncidents.length > 0) setIncidents(liveIncidents);
        if (liveFeedback && liveFeedback.length > 0) setFeedbackSessions(liveFeedback);
      } catch (err) {
        console.warn("Using fallback local seed:", err);
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
    setCurrentUser(MOCK_PROFILES[4]); // Fallback to member
    router.push(`/${locale}/login`);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "ar" : "en";
    setLocale(nextLocale);
    // Replace URL locale prefix
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        availableUsers: MOCK_PROFILES,
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
        addTask,
        updateTaskStatus,
        addPointEvent,
        approvePointEvent,
        rejectPointEvent,
        submitAppeal,
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
