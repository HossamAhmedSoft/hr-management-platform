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
  Notification,
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
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, "id" | "created_at">) => Promise<Notification>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

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
          liveNotifications,
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
          dbService.getNotifications(),
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
        if (liveNotifications) setNotifications(liveNotifications);
      } catch (err) {
        console.warn("Error loading live database:", err);
      }
    }
    syncDatabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live notification refresh on user change
  useEffect(() => {
    let isMounted = true;
    async function loadUserNotifications() {
      if (!currentUser?.id) return;
      try {
        const notifs = await dbService.getNotifications();
        if (isMounted && notifs) {
          setNotifications(notifs);
        }
      } catch (err) {
        console.warn("Error refreshing notifications:", err);
      }
    }
    loadUserNotifications();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, currentUser?.email]);

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

  const addNotification = async (notif: Omit<Notification, "id" | "created_at">) => {
    const created = await dbService.createNotification(notif);
    setNotifications((prev) => [created, ...prev]);
    return created;
  };

  const markNotificationAsRead = async (id: string) => {
    await dbService.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllNotificationsAsRead = async () => {
    await dbService.markAllNotificationsAsRead(currentUser?.id);
    setNotifications((prev) =>
      prev.map((n) => (!currentUser?.id || n.user_id === currentUser.id ? { ...n, is_read: true } : n))
    );
  };

  const addTask = async (newTask: Omit<Task, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createTask(newTask);
    if (created) {
      setTasks((prev) => [created, ...prev]);

      // Dispatch notifications to all assignees
      if (newTask.assignees && newTask.assignees.length > 0) {
        for (const assignee of newTask.assignees) {
          if (assignee.profile_id) {
            await addNotification({
              user_id: assignee.profile_id,
              title: locale === "ar" ? "مهمة عمل جديدة مسندة إليك" : "New Task Assigned",
              message:
                locale === "ar"
                  ? `تم تكليفك بمهمة جديدة: "${newTask.title}". الموعد النهائي: ${new Date(newTask.deadline).toLocaleDateString("ar-EG")}`
                  : `You have been assigned task: "${newTask.title}". Deadline: ${new Date(newTask.deadline).toLocaleDateString()}`,
              type: "task_assigned",
              link: `/${locale}/tasks`,
              is_read: false,
            });
          }
        }
      }
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    await dbService.updateTaskStatus(taskId, newStatus);
    const targetTask = tasks.find((t) => t.id === taskId);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, updated_at: new Date().toISOString() }
          : t
      )
    );

    if (targetTask) {
      if (newStatus === "completed" && targetTask.assignees) {
        for (const assignee of targetTask.assignees) {
          if (assignee.profile_id) {
            await addNotification({
              user_id: assignee.profile_id,
              title: locale === "ar" ? "تم اعتماد إنجاز المهمة بنجاح" : "Task Completed & Approved",
              message:
                locale === "ar"
                  ? `تمت مراجعة واعتماد مخرجات المهمة: "${targetTask.title}" بنجاح.`
                  : `Your deliverable for task: "${targetTask.title}" has been reviewed and approved.`,
              type: "task_review",
              link: `/${locale}/tasks`,
              is_read: false,
            });
          }
        }
      } else if (newStatus === "submitted" && targetTask.created_by) {
        await addNotification({
          user_id: targetTask.created_by,
          title: locale === "ar" ? "تم تسليم مخرجات مهمة للمراجعة" : "Deliverable Submitted for Review",
          message:
            locale === "ar"
              ? `قام العضو بتسليم مخرجات المهمة: "${targetTask.title}".`
              : `A deliverable was submitted for task: "${targetTask.title}".`,
          type: "task_review",
          link: `/${locale}/tasks`,
          is_read: false,
        });
      }
    }
  };

  const addPointEvent = async (newEvent: Omit<PointEvent, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createPointEvent(newEvent);
    if (created) {
      setPointEvents((prev) => [created, ...prev]);

      if (newEvent.member_id) {
        const isPos = newEvent.direction === "positive";
        await addNotification({
          user_id: newEvent.member_id,
          title: isPos
            ? (locale === "ar" ? "تسجيل نقاط تميز إيجابية (+)" : "Positive Points Awarded (+)")
            : (locale === "ar" ? "إشعار رسمي بتسجيل خصم نقاط (-)" : "Point Deduction Notice (-)"),
          message:
            locale === "ar"
              ? `${isPos ? "+" : ""}${newEvent.value} نقطة — السبب: ${newEvent.explanation}`
              : `${isPos ? "+" : ""}${newEvent.value} pts — Reason: ${newEvent.explanation}`,
          type: "point_submitted",
          link: `/${locale}/points`,
          is_read: false,
        });
      }
    }
  };

  const approvePointEvent = async (id: string, rationale?: string) => {
    await dbService.updatePointEventStatus(id, "approved", rationale);
    const targetEvt = pointEvents.find((p) => p.id === id);
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

    // Audit trail log
    await addAuditLog({
      actor_id: currentUser?.id || "admin",
      action: "approve",
      entity_type: "point_event",
      entity_id: id,
      reason: rationale || "Approved by HR reviewer",
      after_value: { status: "approved" },
    });

    if (targetEvt?.member_id) {
      await addNotification({
        user_id: targetEvt.member_id,
        title: locale === "ar" ? "اعتماد رسمي لحركة النقاط" : "Official Point Verification",
        message:
          locale === "ar"
            ? `تم اعتماد النقاط (${targetEvt.direction === "positive" ? "+" : ""}${targetEvt.value} نقطة) نهائياً في رصيدك.`
            : `Point event (${targetEvt.direction === "positive" ? "+" : ""}${targetEvt.value} pts) has been officially verified.`,
        type: "point_decision",
        link: `/${locale}/points`,
        is_read: false,
      });
    }
  };

  const rejectPointEvent = async (id: string, rationale?: string) => {
    await dbService.updatePointEventStatus(id, "rejected", rationale);
    const targetEvt = pointEvents.find((p) => p.id === id);
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

    // Audit trail log
    await addAuditLog({
      actor_id: currentUser?.id || "admin",
      action: "reject",
      entity_type: "point_event",
      entity_id: id,
      reason: rationale || "Rejected during review",
      after_value: { status: "rejected" },
    });

    if (targetEvt?.member_id) {
      await addNotification({
        user_id: targetEvt.member_id,
        title: locale === "ar" ? "قرار مراجعة حركة النقاط" : "Point Verification Decision",
        message:
          locale === "ar"
            ? `تم رفض واقعة النقاط بعد المراجعة: ${rationale || targetEvt.explanation}`
            : `Point entry was rejected: ${rationale || targetEvt.explanation}`,
        type: "point_decision",
        link: `/${locale}/points`,
        is_read: false,
      });
    }
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

      // Audit trail log
      await addAuditLog({
        actor_id: currentUser?.id || "evaluator",
        action: "create",
        entity_type: "evaluation",
        entity_id: created.id,
        after_value: { member_id: evalData.member_id, total_score: evalData.total_score },
      });

      if (evalData.member_id) {
        await addNotification({
          user_id: evalData.member_id,
          title: locale === "ar" ? "صدور نتيجة التقييم الشهري" : "Monthly Evaluation Published",
          message:
            locale === "ar"
              ? `تم اعتماد تقييمك الشهري الرسمي بدرجة ${evalData.total_score || 0}/100.`
              : `Your official monthly evaluation is finalized with score ${evalData.total_score || 0}/100.`,
          type: "evaluation_finalized",
          link: `/${locale}/evaluations`,
          is_read: false,
        });
      }
    }
  };

  const addIncident = async (incident: Omit<Incident, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createIncident(incident);
    if (created) {
      setIncidents((prev) => [created, ...prev]);

      // Audit trail log
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        action: "create",
        entity_type: "incident",
        entity_id: created.id,
        reason: incident.title,
        after_value: { member_id: incident.member_id, level: incident.level },
      });

      if (incident.member_id) {
        await addNotification({
          user_id: incident.member_id,
          title: locale === "ar" ? "إشعار إداري رسمي" : "Administrative Notice",
          message:
            locale === "ar"
              ? `تم تسجيل إشعار (${incident.level}) بخصوص: ${incident.title}. يمكنك مراجعة الإشعار وتقديم تظلم خلال 7 أيام عمل.`
              : `A notice (${incident.level}) was recorded: ${incident.title}. You may review and file an appeal within 7 working days.`,
          type: "general",
          link: `/${locale}/appeals`,
          is_read: false,
        });
      }
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
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
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
