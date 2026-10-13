"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Moon,
  Sun,
  Globe,
  Bell,
  Search,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  LogOut,
  CheckSquare,
  Award,
  TrendingUp,
  CheckCheck,
  Clock,
  Layers,
  ArrowRight,
  Command,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/lib/app-context";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { POLICY_POINT_CATEGORIES } from "@/lib/policy-catalog";
import { tracksService } from "@/lib/tracks-service";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const {
    currentUser,
    login,
    locale,
    toggleLocale,
    theme,
    toggleTheme,
    pointEvents,
    appeals,
    tasks,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    availableUsers,
    logout,
  } = useApp();

  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<
    "all" | "unread" | "assignments" | "sessions" | "feedback" | "follow_ups" | "admin"
  >("all");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [commandCategory, setCommandCategory] = useState<"all" | "members" | "tracks" | "rules" | "pages">("all");
  const isAr = locale === "ar";
  const isMember = currentUser?.role === "member";

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [readTaskIds, setReadTaskIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("gdg_read_task_notifs");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Robust matching helper
  const isMatchUser = (targetId?: string, targetEmail?: string) => {
    if (!currentUser) return false;
    if (targetEmail && currentUser.email && targetEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      return true;
    }
    if (targetId && targetId === currentUser.id) return true;
    if (currentUser.email && targetId && targetId.toLowerCase() === currentUser.email.toLowerCase()) return true;
    const targetProf = availableUsers.find((u) => u.id === targetId);
    if (
      targetProf?.email &&
      currentUser.email &&
      targetProf.email.toLowerCase() === currentUser.email.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // Real user notifications from dbService / AppContext
  const directNotifications = notifications.filter((n) => isMatchUser(n.user_id, n.recipient_email));

  // User's specifically assigned tasks
  const myAssignedTasks = tasks.filter((t) => {
    if (!currentUser) return false;
    if (t.assignees && Array.isArray(t.assignees) && t.assignees.length > 0) {
      return t.assignees.some((a) => {
        if (!a) return false;
        if (a.profile_id === currentUser.id || a.profile?.id === currentUser.id) return true;
        if (
          currentUser.email &&
          a.profile?.email &&
          a.profile.email.toLowerCase() === currentUser.email.toLowerCase()
        ) {
          return true;
        }
        const matched = availableUsers.find((u) => u.id === a.profile_id);
        if (
          matched &&
          (matched.id === currentUser.id ||
            (currentUser.email &&
              matched.email?.toLowerCase() === currentUser.email.toLowerCase()))
        ) {
          return true;
        }
        return false;
      });
    }
    return false;
  });

  // Guaranteed derived task notifications for assignees
  const derivedTaskNotifs = myAssignedTasks
    .filter((t) => !directNotifications.some((n) => n.link?.includes(t.id) || (n.message && n.message.includes(t.title))))
    .map((t) => ({
      id: `derived_task_${t.id}`,
      user_id: currentUser?.id || "",
      recipient_email: currentUser?.email,
      title: isAr ? "مهمة عمل جديدة مسندة إليك" : "New Task Assigned",
      message: isAr
        ? `تم تكليفك بمهمة: "${t.title}". الموعد النهائي: ${new Date(t.deadline).toLocaleDateString("ar-EG")}`
        : `You have been assigned to task: "${t.title}". Deadline: ${new Date(t.deadline).toLocaleDateString()}`,
      type: "task_assigned" as const,
      link: `/${locale}/tasks`,
      is_read: readTaskIds.includes(t.id) || t.status === "completed",
      created_at: t.created_at || new Date().toISOString(),
    }));

  // Derived deadline alerts for tasks expiring within 48h or overdue
  const currentTime = React.useMemo(() => Date.now(), []);
  const deadlineAlerts = (isMember ? myAssignedTasks : tasks)
    .filter((t) => t.status !== "completed" && t.status !== "cancelled" && t.deadline)
    .filter((t) => {
      const diffHours = (new Date(t.deadline).getTime() - currentTime) / (1000 * 60 * 60);
      return diffHours > -48 && diffHours <= 48;
    })
    .map((t) => {
      const diffHours = (new Date(t.deadline).getTime() - currentTime) / (1000 * 60 * 60);
      const isOverdue = diffHours < 0;
      return {
        id: `deadline_${t.id}`,
        user_id: currentUser?.id || "",
        recipient_email: currentUser?.email,
        title: isOverdue
          ? isAr
            ? "⚠️ موعد تسليم متأخر!"
            : "⚠️ Overdue Milestone!"
          : isAr
          ? "⏰ اقتراب موعد تسليم مهمة"
          : "⏰ Upcoming Task Deadline",
        message: isOverdue
          ? isAr
            ? `تجاوزت المهمة "${t.title}" موعدها النهائي.`
            : `Task "${t.title}" is overdue.`
          : isAr
          ? `المهمة "${t.title}" تنتهي خلال ${Math.max(1, Math.round(diffHours))} ساعة.`
          : `Task "${t.title}" is due in ${Math.max(1, Math.round(diffHours))} hours.`,
        type: "system_alert" as const,
        link: `/${locale}/tasks`,
        is_read: readTaskIds.includes(`deadline_${t.id}`),
        created_at: t.deadline,
      };
    });

  // Track Notifications from Technical Tracks system
  const trackNotificationsList = tracksService.getTrackNotifications(currentUser?.id).map((tn) => ({
    id: tn.id,
    user_id: tn.recipient_id,
    recipient_email: tn.recipient_email,
    title: isAr ? tn.title_ar : tn.title,
    message: isAr ? tn.message_ar : tn.message,
    type: "system_alert" as const,
    category: tn.category,
    link: `/${locale}${tn.link}`,
    is_read: tn.is_read,
    created_at: tn.created_at,
    is_track_notif: true,
  }));

  const userNotifications = [
    ...trackNotificationsList,
    ...derivedTaskNotifs.map((n) => ({ ...n, category: "assignments" as const, is_track_notif: false })),
    ...deadlineAlerts.map((n) => ({ ...n, category: "assignments" as const, is_track_notif: false })),
    ...directNotifications.map((n) => ({ ...n, category: "admin" as const, is_track_notif: false })),
  ];
  const unreadCount = userNotifications.filter((n) => !n.is_read).length;

  const filteredNotifications = userNotifications.filter((n) => {
    if (notifCategoryFilter === "unread") return !n.is_read;
    if (notifCategoryFilter !== "all") return n.category === notifCategoryFilter;
    return true;
  });

  const pendingPoints = !isMember
    ? pointEvents.filter((p) => p.status === "pending_review")
    : [];

  const pendingAppeals = !isMember
    ? appeals.filter((a) => a.status === "submitted" || a.status === "under_review")
    : appeals.filter(
        (a) => isMatchUser(a.member_id) && (a.status === "submitted" || a.status === "under_review")
      );

  const pendingTasksToApprove = !isMember
    ? tasks.filter((t) => t.status === "submitted")
    : [];

  const totalNotifications = isMember
    ? unreadCount + pendingAppeals.length
    : unreadCount + pendingPoints.length + pendingAppeals.length + pendingTasksToApprove.length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return { label: isAr ? "مدير النظام" : "Super Admin", color: "bg-[#fce8e6] dark:bg-[#ea4335]/20 text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#ea4335]/30" };
      case "hr_admin":
        return { label: isAr ? "مسؤول الموارد" : "HR Admin", color: "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] border-[#d2e3fc] dark:border-[#1a73e8]/30" };
      case "hr_reviewer":
        return { label: isAr ? "مراجع الموارد" : "HR Reviewer", color: "bg-[#fef7e0] dark:bg-[#fbbc04]/20 text-[#b06000] dark:text-[#fdd663] border-[#feefc3] dark:border-[#fbbc04]/30" };
      case "team_lead":
        return { label: isAr ? "قائد فريق" : "Team Lead", color: "bg-[#e6f4ea] dark:bg-[#34a853]/20 text-[#137333] dark:text-[#81c995] border-[#ceead6] dark:border-[#34a853]/30" };
      default:
        return { label: isAr ? "عضو" : "Member", color: "bg-[#f1f3f4] dark:bg-[#303134] text-[#3c4043] dark:text-[#e8eaed] border-[#dadce0] dark:border-[#5f6368]" };
    }
  };

  const badge = currentUser
    ? getRoleBadge(currentUser.role)
    : { label: isAr ? "عضو" : "Member", color: "bg-[#f1f3f4] dark:bg-[#303134] text-[#3c4043] dark:text-[#e8eaed] border-[#dadce0] dark:border-[#5f6368]" };

  return (
    <header className="sticky top-0 z-30 flex flex-col bg-card border-b border-border shadow-2xs">
      {/* 1. Google 4-Color Signature Accent Bar (Persistent Top Strip) */}
      <div className="google-accent-strip">
        <div className="seg-blue" />
        <div className="seg-red" />
        <div className="seg-yellow" />
        <div className="seg-green" />
      </div>

      {/* 2. Main Header Content Bar */}
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 md:px-6">
        {/* Left: Mobile Toggle + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:bg-muted lg:hidden shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                <span className="sm:hidden">GDG NCTU</span>
                <span className="hidden sm:inline">GDG NCTU - Management Portal</span>
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#1a73e8]/30 shrink-0">
                M3 Console
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block truncate">
              {isAr
                ? "منظومة قواعد ونقاط الأداء وإدارة العمليات — جامعة القاهرة التكنولوجية الجديدة"
                : "Rules, Points System & Performance Management Portal"}
            </p>
          </div>
        </div>

        {/* Center: Google Workspace Global Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="w-full h-9 pl-9 pr-3 rtl:pl-3 rtl:pr-9 text-xs rounded-lg bg-[#f1f3f4] dark:bg-[#303134] border border-transparent hover:border-[#1a73e8]/40 focus:border-[#1a73e8] focus:bg-background text-foreground text-left rtl:text-right transition-all flex items-center justify-between group cursor-pointer relative"
          >
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground truncate">
              <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
              <span className="truncate">
                {isAr
                  ? "البحث السريع في الأعضاء، القواعد، والمهام..."
                  : "Search members, rules, tasks..."}
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground bg-card rounded border border-border shrink-0 shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCommandOpen(true)}
            className="h-8 w-8 rounded-lg hover:bg-muted lg:hidden"
            aria-label={isAr ? "البحث السريع (Ctrl+K)" : "Quick Search (Ctrl+K)"}
            title={isAr ? "بحث (Ctrl+K)" : "Search (Ctrl+K)"}
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </Button>
          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="h-8 px-1.5 sm:px-2 rounded-lg text-xs font-semibold gap-1 text-foreground hover:bg-muted"
            aria-label={locale === "en" ? "تغيير اللغة إلى العربية" : "Switch language to English"}
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] sm:text-xs">{locale === "en" ? "عربي" : "EN"}</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg hover:bg-muted"
            aria-label={
              theme === "light"
                ? isAr
                  ? "التبديل إلى الوضع الداكن"
                  : "Switch to dark mode"
                : isAr
                ? "التبديل إلى الوضع الفاتح"
                : "Switch to light mode"
            }
            title="Toggle Dark/Light"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Sun className="w-4 h-4 text-[#fbbc04]" />
            )}
          </Button>

          {/* Notifications Button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="h-8 w-8 rounded-lg relative hover:bg-muted"
              aria-label={isAr ? "عرض مركز الإشعارات" : "View notifications center"}
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {totalNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ea4335]" />
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                {/* Mobile backdrop */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs sm:hidden"
                  onClick={() => setShowNotifications(false)}
                />

                <div
                  className={cn(
                    "fixed top-15 inset-x-3 sm:inset-x-auto sm:top-10 z-50 sm:w-96 p-3 bg-card rounded-2xl sm:rounded-xl shadow-2xl border border-border",
                    isAr ? "sm:left-0" : "sm:right-0"
                  )}
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {isAr ? "مركز الإشعارات والتنبيهات" : "Notification Feed"}
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#1a73e8] text-white">
                          {unreadCount} {isAr ? "جديد" : "new"}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          markAllNotificationsAsRead();
                          tracksService.markAllTrackNotificationsRead(currentUser?.id);
                          const allIds = myAssignedTasks.map((t) => t.id);
                          const updated = Array.from(new Set([...readTaskIds, ...allIds]));
                          setReadTaskIds(updated);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("gdg_read_task_notifs", JSON.stringify(updated));
                          }
                        }}
                        className="text-[11px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>{isAr ? "تحديد الكل كمقروء" : "Mark all read"}</span>
                      </button>
                    )}
                  </div>

                  {/* Notification Category Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none border-b border-border">
                    {(
                      [
                        { id: "all", label: isAr ? "الكل" : "All" },
                        { id: "unread", label: isAr ? "غير مقروء" : "Unread" },
                        { id: "assignments", label: isAr ? "المهام" : "Assignments" },
                        { id: "sessions", label: isAr ? "الجلسات" : "Sessions" },
                        { id: "feedback", label: isAr ? "الملاحظات" : "Feedback" },
                        { id: "follow_ups", label: isAr ? "المتابعة" : "Follow-ups" },
                        { id: "admin", label: isAr ? "الإدارة" : "Admin" },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNotifCategoryFilter(cat.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap transition-colors font-medium cursor-pointer ${
                          notifCategoryFilter === cat.id
                            ? "bg-[#1a73e8] text-white shadow-2xs"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                <div className="py-2 space-y-2 text-xs max-h-80 overflow-y-auto">
                  {filteredNotifications.length === 0 && pendingPoints.length === 0 && pendingAppeals.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <CheckCircle className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-emerald-600" />
                      <p className="text-xs font-semibold">
                        {isAr ? "لا توجد إشعارات مطابقة" : "No matching notifications"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isAr
                          ? "ستظهر هنا أي تنبيهات تخص التكليفات والمهام ومسارات التدريب."
                          : "Any alerts for tasks, sessions, and tracks will appear here."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Real User Live Notifications */}
                      {filteredNotifications.map((n) => {
                        const isTask = n.type === "task_assigned" || n.type === "task_deadline";
                        const isReview = n.type === "task_review";
                        const isPoint = n.type === "point_submitted" || n.type === "point_decision";
                        const isEval = n.type === "evaluation_finalized" || n.type === "evaluation_submitted";

                        return (
                          <Link
                            key={n.id}
                            href={n.link || `/${locale}`}
                            onClick={() => {
                              if (n.is_track_notif) {
                                tracksService.markTrackNotificationRead(n.id);
                              } else if (n.id.startsWith("derived_task_")) {
                                const taskId = n.id.replace("derived_task_", "");
                                const updated = Array.from(new Set([...readTaskIds, taskId]));
                                setReadTaskIds(updated);
                                if (typeof window !== "undefined") {
                                  localStorage.setItem("gdg_read_task_notifs", JSON.stringify(updated));
                                }
                              } else {
                                markNotificationAsRead(n.id);
                              }
                              setShowNotifications(false);
                            }}
                            className={`p-2.5 rounded-lg flex items-start gap-2.5 transition-colors border block ${
                              !n.is_read
                                ? "bg-[#e8f0fe] dark:bg-[#1a73e8]/15 border-[#d2e3fc] dark:border-[#1a73e8]/30"
                                : "bg-muted/40 hover:bg-muted/70 border-transparent"
                            }`}
                          >
                            <div className="p-1 rounded bg-background shrink-0 mt-0.5 shadow-2xs">
                              {isTask && <CheckSquare className="w-4 h-4 text-[#1a73e8]" />}
                              {isReview && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                              {isPoint && <Award className="w-4 h-4 text-[#b06000] dark:text-[#fbbc04]" />}
                              {isEval && <TrendingUp className="w-4 h-4 text-purple-600" />}
                              {!isTask && !isReview && !isPoint && !isEval && (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-bold text-foreground text-xs truncate">
                                  {n.title}
                                </p>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-[#1a73e8] shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                {n.message}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })} • {new Date(n.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Admin Pending Action Items */}
                      {!isMember && pendingPoints.map((p) => (
                        <Link
                          key={p.id}
                          href={`/${locale}/points`}
                          onClick={() => setShowNotifications(false)}
                          className="p-2.5 rounded-lg bg-[#e8f0fe]/80 dark:bg-[#1a73e8]/10 border border-[#d2e3fc] dark:border-[#1a73e8]/25 flex items-start gap-2 block hover:bg-[#e8f0fe] transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 text-[#1a73e8] mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-foreground">
                              {isAr ? "طلب تسجيل نقاط بانتظار المراجعة" : "Point Entry Pending Review"}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {p.explanation}
                            </p>
                          </div>
                        </Link>
                      ))}

                      {pendingAppeals.map((a) => (
                        <Link
                          key={a.id}
                          href={`/${locale}/appeals`}
                          onClick={() => setShowNotifications(false)}
                          className="p-2.5 rounded-lg bg-[#fef7e0]/80 dark:bg-[#fbbc04]/10 border border-[#feefc3] dark:border-[#fbbc04]/25 flex items-start gap-2 block hover:bg-[#fef7e0] transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4 text-[#b06000] mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-foreground">
                              {isAr ? "تظلم جديد بانتظار المراجعة المحايدة" : "Appeal Awaiting Review"}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {a.grounds || a.objection || (isAr ? "طلب طعن قيد النظر" : "Dispute under review")}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          </div>

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <Avatar className="w-8 h-8 rounded-full border border-border">
              <AvatarFallback className="bg-[#1a73e8] text-white font-bold text-xs">
                {currentUser?.full_name
                  ? currentUser.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-foreground truncate max-w-[120px] leading-tight">
                {currentUser?.full_name || (isAr ? "مستخدم" : "User")}
              </p>
              <span
                className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded border ${badge.color}`}
              >
                {badge.label}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-muted-foreground hover:text-[#ea4335] hover:bg-[#fce8e6] dark:hover:bg-[#ea4335]/20 ml-1"
              title={isAr ? "تسجيل الخروج" : "Sign Out"}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Global Spotlight Command Palette Dialog (Ctrl + K) */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsCommandOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
            {/* Top Search Input */}
            <div className="flex items-center px-4 py-3 border-b border-border gap-3 bg-muted/20">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                autoFocus
                type="text"
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder={
                  isAr
                    ? "ابحث عن عضو، مهمة، قاعدة نقاط، أو مسار... (Esc للإغلاق)"
                    : "Search members, tasks, point rules, or tracks... (Esc to close)"
                }
                className="w-full text-sm bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-medium"
              />
              {commandSearch && (
                <button
                  onClick={() => setCommandSearch("")}
                  className="p-1 text-muted-foreground hover:text-foreground rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-card border border-border rounded shadow-2xs">
                ESC
              </kbd>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-muted/10 overflow-x-auto no-scrollbar text-xs">
              {(
                [
                  { id: "all", label: isAr ? "الكل" : "All" },
                  { id: "members", label: isAr ? "الأعضاء" : "Members" },
                  { id: "tracks", label: isAr ? "اللجان والمسارات" : "Tracks" },
                  { id: "rules", label: isAr ? "قواعد النقاط" : "Policy Rules" },
                  { id: "pages", label: isAr ? "الصفحات" : "Pages" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCommandCategory(tab.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0",
                    commandCategory === tab.id
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results Body */}
            <div className="overflow-y-auto p-3 space-y-4 text-xs divide-y divide-border/40 max-h-[60vh]">
              {/* Pages Section */}
              {(commandCategory === "all" || commandCategory === "pages") && (
                <div className="space-y-1.5 pt-2 first:pt-0">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                    {isAr ? "صفحات المنظومة" : "System Navigation"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { title: isAr ? "لوحة القيادة" : "Dashboard Overview", href: `/${locale}` },
                      { title: isAr ? "دليل الأعضاء" : "Members Directory", href: `/${locale}/members` },
                      { title: isAr ? "اللجان والمسارات" : "Tracks & Committees", href: `/${locale}/teams` },
                      { title: isAr ? "المهام والتسليمات" : "Tasks & Milestones", href: `/${locale}/tasks` },
                      { title: isAr ? "سجل النقاط واللوائح" : "Points Ledger & Rules", href: `/${locale}/points` },
                      { title: isAr ? "التقييم الشهري (100 درجة)" : "Monthly Evaluations", href: `/${locale}/evaluations` },
                      { title: isAr ? "المتابعة وخطط التحسين" : "Feedback & PIP", href: `/${locale}/feedback` },
                      { title: isAr ? "سلم التصعيد والمخالفات" : "Escalation Ladder", href: `/${locale}/incidents` },
                      { title: isAr ? "التظلمات الرسمية" : "Appeals & Disputes", href: `/${locale}/appeals` },
                      { title: isAr ? "المسارات التقنية والأكاديمية" : "Technical Tracks & Academy", href: `/${locale}/education` },
                      { title: isAr ? "الحضور والاجتماعات" : "Attendance Logs", href: `/${locale}/attendance` },
                      { title: isAr ? "التقارير والتحليلات" : "Reports & Exports", href: `/${locale}/reports` },
                      { title: isAr ? "مؤشرات كفاءة HR" : "HR Team KPIs", href: `/${locale}/hr-kpis` },
                      { title: isAr ? "السياسات والتقويم" : "Policy & Settings", href: `/${locale}/policy` },
                      { title: isAr ? "سجل التدقيق الأمني" : "Security Audit Log", href: `/${locale}/audit-log` },
                    ]
                      .filter((p) => !commandSearch || p.title.toLowerCase().includes(commandSearch.toLowerCase()))
                      .slice(0, commandSearch ? 6 : 4)
                      .map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            router.push(p.href);
                            setIsCommandOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors flex items-center justify-between border border-border/50"
                        >
                          <span className="font-semibold text-foreground">{p.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground rtl:rotate-180" />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Members Section */}
              {(commandCategory === "all" || commandCategory === "members") && (
                <div className="space-y-1.5 pt-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                    {isAr ? "دليل الأعضاء" : "Members"}
                  </p>
                  <div className="space-y-1">
                    {availableUsers
                      .filter(
                        (u) =>
                          !commandSearch ||
                          u.full_name.toLowerCase().includes(commandSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(commandSearch.toLowerCase()) ||
                          u.role.toLowerCase().includes(commandSearch.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            router.push(`/${locale}/members`);
                            setIsCommandOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors flex items-center justify-between border border-border/50"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="w-7 h-7 text-xs">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {u.full_name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{u.full_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-card shrink-0 font-semibold capitalize">
                            {u.role.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tracks Section */}
              {(commandCategory === "all" || commandCategory === "tracks") && (
                <div className="space-y-1.5 pt-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                    {isAr ? "اللجان والمسارات التقنية" : "Tracks & Committees"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { id: "web", name: "Web Development Track", nameAr: "مسار تطوير الويب", type: "tech" },
                      { id: "mobile", name: "Mobile App Track", nameAr: "مسار تطبيقات الموبايل", type: "tech" },
                      { id: "uiux", name: "UI/UX Design Track", nameAr: "مسار تصميم واجهات المستخدم", type: "tech" },
                      { id: "ai", name: "AI & Data Science Track", nameAr: "مسار الذكاء الاصطناعي وعلم البيانات", type: "tech" },
                      { id: "embedded", name: "Embedded Systems & IoT", nameAr: "الأنظمة المدمجة وإنترنت الأشياء", type: "tech" },
                      { id: "cyber", name: "Cyber Security Track", nameAr: "مسار الأمن السيبراني", type: "tech" },
                      { id: "hr", name: "Human Resources", nameAr: "الموارد البشرية", type: "non_tech" },
                      { id: "media", name: "Media & Content", nameAr: "الإعلام والمحتوى", type: "non_tech" },
                      { id: "pr", name: "Public Relations & Marketing", nameAr: "العلاقات العامة والتسويق", type: "non_tech" },
                      { id: "ops", name: "Operations & Logistics", nameAr: "العمليات واللوجستيات", type: "non_tech" },
                    ]
                      .filter(
                        (t) =>
                          !commandSearch ||
                          t.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
                          t.nameAr.includes(commandSearch)
                      )
                      .slice(0, 6)
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            router.push(`/${locale}/teams`);
                            setIsCommandOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors flex items-center justify-between border border-border/50"
                        >
                          <div>
                            <p className="font-bold text-foreground">{isAr ? t.nameAr : t.name}</p>
                            <span className="text-[10px] text-muted-foreground">
                              {t.type === "tech" ? (isAr ? "مسار تقني" : "Technical") : (isAr ? "لجنة إدارية" : "Non-Tech")}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground rtl:rotate-180" />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Policy Rules & Points Categories */}
              {(commandCategory === "all" || commandCategory === "rules") && (
                <div className="space-y-1.5 pt-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                    {isAr ? "قواعد النقاط المعتمدة في اللائحة" : "Official Policy Point Rules"}
                  </p>
                  <div className="space-y-1">
                    {POLICY_POINT_CATEGORIES.filter(
                      (r) =>
                        !commandSearch ||
                        r.name.toLowerCase().includes(commandSearch.toLowerCase()) ||
                        r.name_ar.includes(commandSearch) ||
                        r.description.toLowerCase().includes(commandSearch.toLowerCase()) ||
                        String(r.default_value).includes(commandSearch)
                    )
                      .slice(0, 5)
                      .map((r) => {
                        const isPos = r.direction === "positive";
                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              router.push(`/${locale}/points`);
                              setIsCommandOpen(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-muted cursor-pointer transition-colors flex items-center justify-between border border-border/50 gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">
                                {isAr ? r.name_ar : r.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {isAr ? r.description_ar : r.description}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-xs font-black px-2 py-0.5 rounded-full shrink-0 font-mono",
                                isPos
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-600 border border-red-500/20"
                              )}
                            >
                              {isPos ? `+${r.default_value}` : `${r.default_value}`} pts
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{isAr ? "منظومة الحوكمة الرقمية — GDG on Campus NCTU" : "GDG NCTU Governance Platform"}</span>
              <span className="hidden sm:inline">{isAr ? "اضغط Esc للإغلاق أو انقر بالخارج" : "Press Esc to dismiss"}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
