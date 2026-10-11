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
  logUserAction: (log: {
    action: string;
    entity_type: string;
    entity_id?: string;
    reason: string;
    details?: string;
    before_value?: Record<string, unknown>;
    after_value?: Record<string, unknown>;
  }) => Promise<void>;
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

  const addAuditLog = async (log: Omit<AuditLog, "id" | "created_at">) => {
    const fullLog: Omit<AuditLog, "id" | "created_at"> = {
      ...log,
      actor_name: log.actor_name || currentUser?.full_name || "System Actor",
    };
    const created = await dbService.createAuditLog(fullLog);
    if (created) {
      setAuditLogs((prev) => [created, ...prev]);
    }
  };

  const logUserAction = async (log: {
    action: string;
    entity_type: string;
    entity_id?: string;
    reason: string;
    details?: string;
    before_value?: Record<string, unknown>;
    after_value?: Record<string, unknown>;
  }) => {
    await addAuditLog({
      actor_id: currentUser?.id || "system",
      actor_name: currentUser?.full_name || "System Actor",
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id || "gen_" + Date.now(),
      reason: log.reason,
      details: log.details,
      before_value: log.before_value,
      after_value: log.after_value,
    });
  };

  const login = (user: Profile) => {
    handleSetCurrentUser(user);
    addAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      action: "AUTH_LOGIN",
      entity_type: "auth",
      entity_id: user.id,
      reason: `تسجيل دخول ناجح للمستخدم (${user.full_name})`,
      details: `User logged in with role: ${user.role}, email: ${user.email}.`,
      after_value: { role: user.role, email: user.email },
    });
    router.push(`/${locale}`);
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: "AUTH_LOGOUT",
        entity_type: "auth",
        entity_id: currentUser.id,
        reason: `تسجيل خروج المستخدم (${currentUser.full_name})`,
        details: `Session ended cleanly.`,
      });
    }
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

      // Comprehensive Audit Trail
      await addAuditLog({
        actor_id: currentUser?.id || newTask.created_by,
        actor_name: currentUser?.full_name,
        action: "TASK_CREATED",
        entity_type: "task",
        entity_id: created.id,
        reason: `إنشاء وتكليف مهمة عمل: "${newTask.title}"`,
        details: `Task created with priority: ${newTask.priority}, deadline: ${newTask.deadline}.`,
        after_value: {
          title: newTask.title,
          team_id: newTask.team_id,
          priority: newTask.priority,
          deadline: newTask.deadline,
        },
      });

      // Dispatch notifications to all assignees
      if (newTask.assignees && newTask.assignees.length > 0) {
        for (const assignee of newTask.assignees) {
          if (assignee.profile_id) {
            const matchedUser = availableUsers.find((u) => u.id === assignee.profile_id);
            const userEmail = assignee.profile?.email || matchedUser?.email;
            await addNotification({
              user_id: assignee.profile_id,
              recipient_email: userEmail,
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

    // Comprehensive Audit Trail
    await addAuditLog({
      actor_id: currentUser?.id || "member",
      actor_name: currentUser?.full_name,
      action: `TASK_${newStatus.toUpperCase()}`,
      entity_type: "task",
      entity_id: taskId,
      reason: `تحديث حالة المهمة ("${targetTask?.title || taskId}") إلى: ${newStatus}`,
      details: `Status changed to ${newStatus}.`,
      after_value: { status: newStatus, title: targetTask?.title },
    });

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

      // Comprehensive Audit Trail
      await addAuditLog({
        actor_id: currentUser?.id || newEvent.recorded_by,
        actor_name: currentUser?.full_name,
        action: newEvent.direction === "positive" ? "POINT_RECORDED_POSITIVE" : "POINT_RECORDED_NEGATIVE",
        entity_type: "point_event",
        entity_id: created.id,
        reason: `تسجيل واقعة نقاط (${newEvent.direction === "positive" ? "+" : ""}${newEvent.value}): ${newEvent.explanation}`,
        details: `Points event recorded. Member: ${newEvent.member_id}, Category: ${newEvent.category_id}.`,
        after_value: {
          member_id: newEvent.member_id,
          value: newEvent.value,
          direction: newEvent.direction,
          category_id: newEvent.category_id,
          explanation: newEvent.explanation,
          status: created.status,
        },
      });

      if (newEvent.member_id) {
        const isPos = newEvent.direction === "positive";
        const targetMember = availableUsers.find((u) => u.id === newEvent.member_id);
        await addNotification({
          user_id: newEvent.member_id,
          recipient_email: targetMember?.email,
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
      const targetMember = availableUsers.find((u) => u.id === targetEvt.member_id);
      await addNotification({
        user_id: targetEvt.member_id,
        recipient_email: targetMember?.email,
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
      const targetMember = availableUsers.find((u) => u.id === targetEvt.member_id);
      await addNotification({
        user_id: targetEvt.member_id,
        recipient_email: targetMember?.email,
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

      // Comprehensive Audit Trail
      await addAuditLog({
        actor_id: currentUser?.id || newAppeal.member_id,
        actor_name: currentUser?.full_name,
        action: "APPEAL_SUBMITTED",
        entity_type: "appeal",
        entity_id: created.id,
        reason: `تقديم تظلم رسمي: ${newAppeal.grounds || newAppeal.objection || "طلب طعن إداري"}`,
        details: `Appeal filed for target ${newAppeal.entity_type || "item"} (${newAppeal.entity_id || newAppeal.related_point_event_id || newAppeal.related_evaluation_id || "general"}).`,
        after_value: {
          member_id: newAppeal.member_id,
          entity_type: newAppeal.entity_type,
          entity_id: newAppeal.entity_id,
          status: created.status,
        },
      });
    }
  };

  const addEvaluation = async (evalData: Omit<Evaluation, "id" | "created_at" | "updated_at">) => {
    const created = await dbService.createEvaluation(evalData);
    if (created) {
      setEvaluations((prev) => [created, ...prev]);

      // Comprehensive Audit Trail
      await addAuditLog({
        actor_id: currentUser?.id || "evaluator",
        actor_name: currentUser?.full_name,
        action: "EVALUATION_FINALIZED",
        entity_type: "evaluation",
        entity_id: created.id,
        reason: `اعتماد نتيجة التقييم الشهري (${evalData.total_score || 0}/100) للعضو`,
        details: `Evaluation finalized. Band: ${evalData.performance_band || "Evaluated"}.`,
        after_value: { member_id: evalData.member_id, total_score: evalData.total_score, band: evalData.performance_band },
      });

      if (evalData.member_id) {
        const targetMember = availableUsers.find((u) => u.id === evalData.member_id);
        await addNotification({
          user_id: evalData.member_id,
          recipient_email: targetMember?.email,
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

      // Comprehensive Audit Trail
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "INCIDENT_RECORDED",
        entity_type: "incident",
        entity_id: created.id,
        reason: `تسجيل إخطار إداري (${incident.level}): ${incident.title}`,
        details: `Incident level ${incident.level} recorded for member ${incident.member_id}.`,
        after_value: { member_id: incident.member_id, level: incident.level, title: incident.title },
      });

      if (incident.member_id) {
        const targetMember = availableUsers.find((u) => u.id === incident.member_id);
        await addNotification({
          user_id: incident.member_id,
          recipient_email: targetMember?.email,
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

      // Comprehensive Audit Trail
      await addAuditLog({
        actor_id: currentUser?.id || session.provider_id,
        actor_name: currentUser?.full_name,
        action: "FEEDBACK_RECORDED",
        entity_type: "feedback_session",
        entity_id: created.id,
        reason: `توثيق جلسة توجيه ومتابعة 1-on-1`,
        details: `Feedback session recorded with member ${session.member_id} on ${session.date}.`,
        after_value: {
          member_id: session.member_id,
          date: session.date,
        },
      });
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
        logUserAction,
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
