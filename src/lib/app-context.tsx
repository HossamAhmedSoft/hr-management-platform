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
  Form,
} from "@/types";
import { AlertTriangle } from "lucide-react";
import {
  saveSession,
  getSession,
  clearSession,
  updateSessionActivity,
  canAccessRoute,
} from "@/lib/auth-service";
import { dbService } from "@/lib/db-service";
import { internalDB } from "@/lib/internal-db";

interface AppContextType {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile) => void;
  availableUsers: Profile[];
  isAuthenticated: boolean;
  login: (user: Profile, rememberMe?: boolean) => void;
  logout: (reason?: "manual" | "idle_timeout" | "expired") => void;
  extendSession: () => void;
  idleWarning: boolean;
  idleSecondsRemaining: number;
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
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  addPointEvent: (event: Omit<PointEvent, "id" | "created_at" | "updated_at">) => void;
  updatePointEvent: (id: string, updates: Partial<PointEvent>) => Promise<boolean>;
  deletePointEvent: (id: string) => Promise<boolean>;
  approvePointEvent: (id: string, rationale?: string) => void;
  rejectPointEvent: (id: string, rationale?: string) => void;
  submitAppeal: (appeal: Omit<Appeal, "id" | "created_at" | "updated_at">) => void;
  updateAppeal: (id: string, updates: Partial<Appeal>) => Promise<boolean>;
  resolveAppeal: (
    appealId: string,
    decision: "approved" | "rejected",
    rationale?: string,
    compensatoryPoints?: number
  ) => Promise<boolean>;
  addEvaluation: (evalData: Omit<Evaluation, "id" | "created_at" | "updated_at">) => void;
  updateEvaluation: (id: string, updates: Partial<Evaluation>) => Promise<boolean>;
  deleteEvaluation: (id: string) => Promise<boolean>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
  resetMemberPassword: (email: string, newPassword: string) => Promise<boolean>;
  addIncident: (incident: Omit<Incident, "id" | "created_at" | "updated_at">) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<boolean>;
  deleteIncident: (id: string) => Promise<boolean>;
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
  forms: Form[];
  addForm: (form: Partial<Form>) => Promise<Form>;
  updateForm: (id: string, updates: Partial<Form>) => Promise<Form | null>;
  deleteForm: (id: string) => Promise<boolean>;
  refreshForms: () => Promise<void>;
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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gdg_theme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  const [availableUsers, setAvailableUsers] = useState<Profile[]>(() => internalDB.getProfiles());
  const [teams, setTeams] = useState<Team[]>(() => internalDB.getTeams());
  const [tasks, setTasks] = useState<Task[]>(() => internalDB.getTasks());
  const [pointEvents, setPointEvents] = useState<PointEvent[]>(() => internalDB.getPointEvents());
  const [evaluations, setEvaluations] = useState<Evaluation[]>(() => internalDB.getEvaluations());
  const [appeals, setAppeals] = useState<Appeal[]>(() => internalDB.getAppeals());
  const [incidents, setIncidents] = useState<Incident[]>(() => internalDB.getIncidents());
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>(() => internalDB.getFeedbackSessions());
  const [educationalTracks] = useState<EducationalTrack[]>([]);
  const [attendees] = useState<Attendee[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => internalDB.getAuditLogs());
  const [notifications, setNotifications] = useState<Notification[]>(() => internalDB.getNotifications());
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;
  const [forms, setForms] = useState<Form[]>(() => internalDB.getForms());

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
        if (!isAuthenticated) {
          const liveProfiles = await dbService.getProfiles();
          if (isMounted && liveProfiles) {
            React.startTransition(() => {
              setAvailableUsers(liveProfiles);
            });
          }
          return;
        }

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
        React.startTransition(() => {
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
        });
      } catch (err) {
        console.warn("Error loading live database:", err);
      }
    }
    syncDatabase();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

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

  // Session & Inactivity State
  const [idleWarning, setIdleWarning] = useState<boolean>(false);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(120);

  // Live session verification and hydration with server API
  useEffect(() => {
    let isMounted = true;
    async function verifySessionWithServer() {
      try {
        const session = getSession();
        if (!session) {
          const res = await fetch("/api/auth/session");
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data && data.authenticated && data.user) {
              setCurrentUser(data.user);
              setIsAuthenticated(true);
              saveSession(data.user, true);
            }
          }
          return;
        }

        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          if (data && data.authenticated && data.user) {
            setCurrentUser(data.user);
          } else if (
            data &&
            data.authenticated === false &&
            (data.reason === "expired" || data.reason === "account_inactive")
          ) {
            logout("expired");
          }
        }
      } catch (e) {
        // Network resilience: do not log out on transient connectivity glitches
      }
    }
    verifySessionWithServer();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist session whenever user changes
  const handleSetCurrentUser = (user: Profile, rememberMe: boolean = false) => {
    setCurrentUser(user);
    saveSession(user, rememberMe);
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

  const login = (user: Profile, rememberMe: boolean = false) => {
    handleSetCurrentUser(user, rememberMe);
    addAuditLog({
      actor_id: user.id,
      actor_name: user.full_name,
      action: "AUTH_LOGIN",
      entity_type: "auth",
      entity_id: user.id,
      reason: `تسجيل دخول ناجح للمستخدم (${user.full_name})`,
      details: `User logged in with role: ${user.role}, email: ${user.email}. RememberMe: ${rememberMe}.`,
      after_value: { role: user.role, email: user.email, rememberMe },
    });
    router.push(`/${locale}`);
  };

  const logout = (reason: "manual" | "idle_timeout" | "expired" = "manual") => {
    if (currentUser) {
      addAuditLog({
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: reason === "manual" ? "AUTH_LOGOUT" : "AUTH_SESSION_EXPIRED",
        entity_type: "auth",
        entity_id: currentUser.id,
        reason:
          reason === "manual"
            ? `تسجيل خروج المستخدم (${currentUser.full_name})`
            : `انتهاء الجلسة تلقائياً (${reason}) للمستخدم (${currentUser.full_name})`,
        details: `Session terminated cleanly. Reason: ${reason}.`,
      });
    }
    clearSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIdleWarning(false);
    const query = reason !== "manual" ? `?reason=${reason}` : "";
    router.push(`/${locale}/login${query}`);
  };

  const extendSession = () => {
    updateSessionActivity();
    setIdleWarning(false);
    setIdleSecondsRemaining(120);
  };

  // Activity detection & Inactivity Heartbeat (Auto-logout after 30 mins, alert at 28 mins)
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastRecordedActivity = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecordedActivity > 30000) {
        lastRecordedActivity = now;
        updateSessionActivity();
        setIdleWarning(false);
      }
    };

    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, handleUserActivity, { passive: true })
    );

    const interval = setInterval(() => {
      const session = getSession();
      if (!session) {
        logout("expired");
        return;
      }

      const now = Date.now();
      const lastActive = session.lastActive || session.issuedAt || now;
      const idleMs = now - lastActive;

      const warningThreshold = 28 * 60 * 1000; // 28 minutes
      const timeoutThreshold = 30 * 60 * 1000; // 30 minutes

      if (idleMs >= timeoutThreshold) {
        logout("idle_timeout");
      } else if (idleMs >= warningThreshold) {
        setIdleWarning(true);
        const secLeft = Math.max(0, Math.ceil((timeoutThreshold - idleMs) / 1000));
        setIdleSecondsRemaining(secLeft);
      } else {
        setIdleWarning(false);
      }
    }, 15000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [isAuthenticated]);

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
            // Reward +3 points for task milestone on-time completion if not already awarded
            const alreadyAwarded = pointEvents.some(
              (p) =>
                p.member_id === assignee.profile_id &&
                p.explanation?.includes(targetTask.title) &&
                p.direction === "positive"
            );
            if (!alreadyAwarded) {
              await addPointEvent({
                member_id: assignee.profile_id,
                team_id: targetTask.team_id || "team_general",
                event_date: new Date().toISOString().split("T")[0],
                category_id: "task_milestone_ontime",
                direction: "positive",
                value: 3,
                explanation: locale === "ar"
                  ? `مكافأة إنجاز مهمة عمل بنجاح: "${targetTask.title}" (+3 نقاط وفق اللائحة)`
                  : `Milestone completion reward: "${targetTask.title}" (+3 pts under policy)`,
                recorded_by: currentUser?.id || "admin",
                status: "approved",
              });
            }

            await addNotification({
              user_id: assignee.profile_id,
              title: locale === "ar" ? "تم اعتماد إنجاز المهمة ومنح نقاط التميز" : "Task Completed & Points Awarded",
              message:
                locale === "ar"
                  ? `تمت مراجعة واعتماد مخرجات المهمة: "${targetTask.title}" بنجاح وإضافة +3 نقاط لرصيدك.`
                  : `Your deliverable for task: "${targetTask.title}" was approved (+3 points awarded).`,
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

  const updateAppeal = async (id: string, updates: Partial<Appeal>): Promise<boolean> => {
    const success = await dbService.updateAppeal(id, updates);
    if (success) {
      setAppeals((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates, updated_at: new Date().toISOString() } : a))
      );
    }
    return success;
  };

  const resolveAppeal = async (
    appealId: string,
    decision: "approved" | "rejected",
    rationale?: string,
    compensatoryPoints?: number
  ): Promise<boolean> => {
    const targetAppeal = appeals.find((a) => a.id === appealId);
    if (!targetAppeal) return false;

    const newStatus = decision === "approved" ? "resolved" : "rejected";
    const updates: Partial<Appeal> = {
      status: newStatus as any,
      decision_rationale: rationale || (decision === "approved" ? "تم قبول التظلم واعتماد القرار البديل" : "تم رفض التظلم لعدم استيفاء الشروط"),
      neutral_reviewer_id: currentUser?.id || "reviewer",
      resolved_at: new Date().toISOString(),
    };

    const success = await updateAppeal(appealId, updates);
    if (success) {
      // 1. If approved and compensatory points specified or positive reversal requested
      if (decision === "approved" && compensatoryPoints && compensatoryPoints > 0) {
        await addPointEvent({
          member_id: targetAppeal.member_id,
          team_id: "team_general",
          event_date: new Date().toISOString().split("T")[0],
          category_id: "appeal_compensation",
          direction: "positive",
          value: compensatoryPoints,
          explanation: locale === "ar"
            ? `تسوية وتصحيح قرار بعد قبول التظلم الرسمي رقم #${targetAppeal.id.slice(0, 8)} (+${compensatoryPoints} نقاط تعويضية)`
            : `Appeal settlement and correction: #${targetAppeal.id.slice(0, 8)} (+${compensatoryPoints} compensatory pts)`,
          recorded_by: currentUser?.id || "admin",
          status: "approved",
        });
      }

      // 2. Comprehensive Audit Trail
      await addAuditLog({
        actor_id: currentUser?.id || "reviewer",
        actor_name: currentUser?.full_name,
        action: decision === "approved" ? "APPEAL_APPROVED" : "APPEAL_REJECTED",
        entity_type: "appeal",
        entity_id: appealId,
        reason: `قرار ${decision === "approved" ? "قبول" : "رفض"} التظلم الرسمي للعضو: ${rationale || "المراجعة المحايدة"}`,
        details: `Appeal ${decision}. Target: ${targetAppeal.entity_type}, Compensatory points: ${compensatoryPoints || 0}.`,
        after_value: { appeal_id: appealId, status: newStatus, decision, rationale },
      });

      // 3. Dispatch Notification to the appealing member
      const member = availableUsers.find((u) => u.id === targetAppeal.member_id);
      await addNotification({
        user_id: targetAppeal.member_id,
        recipient_email: member?.email,
        title: locale === "ar"
          ? (decision === "approved" ? "تم قبول تظلمك رسميًا وتصحيح القرار" : "قرار بشأن التظلم المقدم منك")
          : (decision === "approved" ? "Appeal Approved & Settled" : "Appeal Determination Notice"),
        message: locale === "ar"
          ? (decision === "approved"
              ? `أصدرت لجنة المراجعة المحايدة قرارًا بقبول تظلمك (${rationale || "تمت الموافقة"}).`
              : `تمت مراجعة تظلمك وتقرر رفضه للأسباب التالية: ${rationale || "عدم استيفاء اللائحة"}.`)
          : (decision === "approved"
              ? `Neutral review approved your appeal: ${rationale || "Accepted"}.`
              : `Your appeal was reviewed and rejected: ${rationale || "Did not meet criteria"}.`),
        type: "point_decision",
        link: `/${locale}/appeals`,
        is_read: false,
      });
    }

    return success;
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

  const updateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    const res = await dbService.updateTask(id, updates);
    if (res) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "TASK_UPDATED",
        entity_type: "task",
        entity_id: id,
        reason: `تعديل بيانات المهمة: ${res.title}`,
        details: `Task updated with fields: ${Object.keys(updates).join(", ")}.`,
        after_value: updates as Record<string, unknown>,
      });
      return true;
    }
    return false;
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    const target = tasks.find((t) => t.id === id);
    const success = await dbService.deleteTask(id);
    if (success) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "TASK_DELETED",
        entity_type: "task",
        entity_id: id,
        reason: `حذف المهمة نهائياً: ${target?.title || id}`,
        details: `Task removed from system.`,
      });
      return true;
    }
    return false;
  };

  const updatePointEvent = async (id: string, updates: Partial<PointEvent>): Promise<boolean> => {
    const res = await dbService.updatePointEvent(id, updates);
    if (res) {
      setPointEvents((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "POINT_EVENT_UPDATED",
        entity_type: "point_event",
        entity_id: id,
        reason: `تعديل واقعة نقاط: ${res.explanation}`,
        details: `Updated fields: ${Object.keys(updates).join(", ")}. Value: ${res.value}.`,
        after_value: updates as Record<string, unknown>,
      });
      return true;
    }
    return false;
  };

  const deletePointEvent = async (id: string): Promise<boolean> => {
    const target = pointEvents.find((p) => p.id === id);
    const success = await dbService.deletePointEvent(id);
    if (success) {
      setPointEvents((prev) => prev.filter((p) => p.id !== id));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "POINT_EVENT_DELETED",
        entity_type: "point_event",
        entity_id: id,
        reason: `حذف واقعة نقاط: ${target?.explanation || id}`,
        details: `Point event removed from ledger.`,
      });
      return true;
    }
    return false;
  };

  const updateEvaluation = async (id: string, updates: Partial<Evaluation>): Promise<boolean> => {
    const res = await dbService.updateEvaluation(id, updates);
    if (res) {
      setEvaluations((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "EVALUATION_UPDATED",
        entity_type: "evaluation",
        entity_id: id,
        reason: `تعديل نتيجة التقييم الشهري: ${res.total_score}/100`,
        details: `Evaluation score updated to ${res.total_score}. Band: ${res.performance_band}.`,
        after_value: updates as Record<string, unknown>,
      });
      return true;
    }
    return false;
  };

  const deleteEvaluation = async (id: string): Promise<boolean> => {
    const target = evaluations.find((e) => e.id === id);
    const success = await dbService.deleteEvaluation(id);
    if (success) {
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "EVALUATION_DELETED",
        entity_type: "evaluation",
        entity_id: id,
        reason: `حذف تقييم شهري للعضو: ${target?.member_id}`,
        details: `Evaluation record removed.`,
      });
      return true;
    }
    return false;
  };

  const updateProfile = async (id: string, updates: Partial<Profile>): Promise<boolean> => {
    const success = await dbService.updateProfile(id, updates);
    if (success) {
      setAvailableUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      if (currentUser?.id === id) {
        const updatedMe = { ...currentUser, ...updates };
        setCurrentUser(updatedMe);
        saveSession(updatedMe);
      }
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "MEMBER_PROFILE_UPDATED",
        entity_type: "profile",
        entity_id: id,
        reason: `تعديل بيانات العضو في النظام`,
        details: `Profile updated: ${Object.keys(updates).join(", ")}.`,
        after_value: updates as Record<string, unknown>,
      });
      return true;
    }
    return false;
  };

  const deleteProfile = async (id: string): Promise<boolean> => {
    const target = availableUsers.find((u) => u.id === id);
    const success = await dbService.deleteProfile(id);
    if (success) {
      setAvailableUsers((prev) => prev.filter((u) => u.id !== id));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "MEMBER_PROFILE_DELETED",
        entity_type: "profile",
        entity_id: id,
        reason: `حذف حساب العضو نهائياً من النظام: ${target?.full_name} (${target?.email})`,
        details: `Member profile deleted by administrator.`,
      });
      return true;
    }
    return false;
  };

  const resetMemberPassword = async (email: string, newPassword: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    await dbService.setPassword(cleanEmail, newPassword);

    // Update active availableUsers in React context
    setAvailableUsers((prev) =>
      prev.map((user) => {
        if (user.email.toLowerCase().trim() === cleanEmail) {
          let meta: Record<string, any> = {};
          try {
            if (user.academic_notes) {
              meta =
                typeof user.academic_notes === "string"
                  ? JSON.parse(user.academic_notes)
                  : user.academic_notes;
            }
          } catch {
            meta = {};
          }
          meta.pwd = newPassword;
          meta.updated_at = new Date().toISOString();
          return {
            ...user,
            academic_notes: JSON.stringify(meta),
            updated_at: new Date().toISOString(),
          };
        }
        return user;
      })
    );

    await addAuditLog({
      actor_id: currentUser?.id || "admin",
      actor_name: currentUser?.full_name || "Admin",
      action: "MEMBER_PASSWORD_RESET",
      entity_type: "security",
      entity_id: cleanEmail,
      reason: `إعادة تعيين كلمة السر للعضو (${cleanEmail})`,
      details: `Password reset successfully enforced across database and internal engine.`,
    });
    return true;
  };

  const updateIncident = async (id: string, updates: Partial<Incident>): Promise<boolean> => {
    const res = await dbService.updateIncident(id, updates);
    if (res) {
      setIncidents((prev) => prev.map((inc) => (inc.id === id ? { ...inc, ...updates } : inc)));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "INCIDENT_UPDATED",
        entity_type: "incident",
        entity_id: id,
        reason: `تعديل الإشعار الإداري: ${res.title}`,
        details: `Incident updated. Level: ${res.level}.`,
        after_value: updates as Record<string, unknown>,
      });
      return true;
    }
    return false;
  };

  const deleteIncident = async (id: string): Promise<boolean> => {
    const target = incidents.find((i) => i.id === id);
    const success = await dbService.deleteIncident(id);
    if (success) {
      setIncidents((prev) => prev.filter((i) => i.id !== id));
      await addAuditLog({
        actor_id: currentUser?.id || "admin",
        actor_name: currentUser?.full_name,
        action: "INCIDENT_DELETED",
        entity_type: "incident",
        entity_id: id,
        reason: `حذف الإشعار الإداري: ${target?.title || id}`,
        details: `Incident removed.`,
      });
      return true;
    }
    return false;
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

  const refreshForms = async () => {
    const list = await dbService.getForms();
    setForms(list);
  };

  const addForm = async (formData: Partial<Form>): Promise<Form> => {
    const created = await dbService.createForm({
      ...formData,
      created_by: currentUser?.id || "system",
    });
    setForms((prev) => [created, ...prev.filter((f) => f.id !== created.id)]);
    await logUserAction({
      action: "FORM_CREATED",
      entity_type: "form",
      entity_id: created.id,
      reason: `إنشاء استمارة / نموذج جديد: ${created.title}`,
      details: `Form "${created.title}" created with access mode "${created.access_mode}"`,
    });
    return created;
  };

  const updateForm = async (id: string, updates: Partial<Form>): Promise<Form | null> => {
    const updated = await dbService.updateForm(id, updates);
    if (updated) {
      setForms((prev) => prev.map((f) => (f.id === id || f.slug === id ? updated : f)));
      await logUserAction({
        action: "FORM_UPDATED",
        entity_type: "form",
        entity_id: id,
        reason: `تحديث إعدادات أو أسئلة النموذج`,
        details: `Form updated: ${Object.keys(updates).join(", ")}`,
      });
    }
    return updated;
  };

  const deleteForm = async (id: string): Promise<boolean> => {
    const target = forms.find((f) => f.id === id || f.slug === id);
    const success = await dbService.deleteForm(id);
    if (success) {
      setForms((prev) => prev.filter((f) => f.id !== id && f.slug !== id));
      await logUserAction({
        action: "FORM_DELETED",
        entity_type: "form",
        entity_id: id,
        reason: `حذف النموذج: ${target?.title || id}`,
        details: `Form "${target?.title}" deleted`,
      });
    }
    return success;
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
        extendSession,
        idleWarning,
        idleSecondsRemaining,
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
        updateTask,
        deleteTask,
        addPointEvent,
        updatePointEvent,
        deletePointEvent,
        approvePointEvent,
        rejectPointEvent,
        submitAppeal,
        updateAppeal,
        resolveAppeal,
        addEvaluation,
        updateEvaluation,
        deleteEvaluation,
        updateProfile,
        deleteProfile,
        resetMemberPassword,
        addIncident,
        updateIncident,
        deleteIncident,
        addFeedbackSession,
        addAuditLog,
        logUserAction,
        unreadNotificationsCount,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        forms,
        addForm,
        updateForm,
        deleteForm,
        refreshForms,
      }}
    >
      {children}
      {idleWarning && isAuthenticated && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-5 right-5 rtl:right-auto rtl:left-5 z-50 max-w-sm p-4 bg-card/95 dark:bg-[#202124]/95 border-2 border-[#fbbc04] rounded-2xl shadow-2xl backdrop-blur-md text-foreground transition-all animate-in fade-in slide-in-from-bottom-5"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#fef7e0] dark:bg-[#fbbc04]/20 text-[#b06000] dark:text-[#fdd663] shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h4 className="text-xs font-bold text-foreground">
                {locale === "ar" ? "⚠️ تنبيه أمان: انتهاء الجلسة" : "⚠️ Security: Inactivity Alert"}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {locale === "ar"
                  ? `ستنتهي جلستك خلال ${idleSecondsRemaining} ثانية لعدم وجود نشاط حفاظاً على سرية بياناتك.`
                  : `Your session will expire in ${idleSecondsRemaining}s due to inactivity to protect your account.`}
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={extendSession}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1a73e8] hover:bg-[#1765cc] text-white shadow-xs transition-colors cursor-pointer"
                >
                  {locale === "ar" ? "تمديد الجلسة" : "Stay Signed In"}
                </button>
                <button
                  type="button"
                  onClick={() => logout("manual")}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {locale === "ar" ? "تسجيل خروج" : "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
