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
  SlidersHorizontal,
  LogOut,
  CheckSquare,
  Award,
  TrendingUp,
  CheckCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/lib/app-context";
import { Notification } from "@/types";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const {
    currentUser,
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

  const [showNotifications, setShowNotifications] = useState(false);
  const isAr = locale === "ar";
  const isMember = currentUser?.role === "member";

  // Robust matching helper
  const isMatchUser = (targetId?: string) => {
    if (!targetId || !currentUser) return false;
    if (targetId === currentUser.id) return true;
    if (currentUser.email && targetId.toLowerCase() === currentUser.email.toLowerCase()) return true;
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
  const userNotifications = notifications.filter((n) => isMatchUser(n.user_id));
  const unreadCount = userNotifications.filter((n) => !n.is_read).length;

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
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left: Mobile Toggle + Title in English */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground tracking-tight">
                GDG NCTU - Management Portal
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#1a73e8]/30">
                M3 Console
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              {isAr
                ? "منظومة قواعد ونقاط الأداء وإدارة العمليات — جامعة القاهرة التكنولوجية الجديدة"
                : "Rules, Points System & Performance Management Portal"}
            </p>
          </div>
        </div>

        {/* Center: Google Workspace Global Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={
                isAr
                  ? "البحث في الأعضاء، المهام، القواعد، أو النقاط... (Ctrl + K)"
                  : "Search members, tasks, rules, or point ledger... (Ctrl + K)"
              }
              className="w-full h-9 pl-9 pr-4 text-xs rounded-lg bg-[#f1f3f4] dark:bg-[#303134] border border-transparent focus:border-[#1a73e8] focus:bg-background text-foreground placeholder:text-muted-foreground outline-none transition-all"
            />
          </div>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="h-8 px-2 rounded-md text-xs font-semibold gap-1.5 text-foreground hover:bg-muted"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{locale === "en" ? "عربي" : "EN"}</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-md hover:bg-muted"
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
              className="h-8 w-8 rounded-md relative hover:bg-muted"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {totalNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ea4335]" />
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className={`absolute top-10 z-50 w-88 sm:w-96 p-3 bg-card rounded-xl shadow-xl border border-border ${
                  isAr ? "left-0" : "right-0"
                }`}
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
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[11px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>{isAr ? "تحديد الكل كمقروء" : "Mark all read"}</span>
                    </button>
                  )}
                </div>

                <div className="py-2 space-y-2 text-xs max-h-80 overflow-y-auto">
                  {userNotifications.length === 0 && pendingPoints.length === 0 && pendingAppeals.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <CheckCircle className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-emerald-600" />
                      <p className="text-xs font-semibold">
                        {isAr ? "لا توجد إشعارات جديدة حالياً" : "No new notifications"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isAr
                          ? "ستظهر هنا أي تكليفات أو نقاط أو تقييمات تصدرها الإدارة."
                          : "Any new tasks, point adjustments, or evaluations will appear here."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Real User Live Notifications */}
                      {userNotifications.map((n) => {
                        const isTask = n.type === "task_assigned" || n.type === "task_deadline";
                        const isReview = n.type === "task_review";
                        const isPoint = n.type === "point_submitted" || n.type === "point_decision";
                        const isEval = n.type === "evaluation_finalized" || n.type === "evaluation_submitted";

                        return (
                          <Link
                            key={n.id}
                            href={n.link || `/${locale}`}
                            onClick={() => {
                              markNotificationAsRead(n.id);
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
    </header>
  );
}
