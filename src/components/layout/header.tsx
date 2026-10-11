"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/lib/app-context";

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
    logout,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const isAr = locale === "ar";

  const pendingPoints = pointEvents.filter((p) => p.status === "pending_review");
  const pendingAppeals = appeals.filter((a) => a.status === "submitted" || a.status === "under_review");
  const totalNotifications = pendingPoints.length + pendingAppeals.length;

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
                className={`absolute top-10 z-50 w-80 p-3 bg-card rounded-lg shadow-lg border border-border ${
                  isAr ? "left-0" : "right-0"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground">
                    {isAr ? "مركز الإشعارات والتنبيهات" : "Notification Feed"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {totalNotifications} {isAr ? "معلق" : "pending"}
                  </span>
                </div>
                <div className="py-2 space-y-2 text-xs max-h-60 overflow-y-auto">
                  {totalNotifications === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      <CheckCircle className="w-6 h-6 mx-auto mb-1 opacity-40 text-emerald-600" />
                      <p className="text-xs font-semibold">
                        {isAr ? "لا توجد إشعارات معلقة" : "No pending notifications"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isAr ? "كل الحركات والتظلمات معتمدة ومستقرة." : "All ledgers and appeals are up to date."}
                      </p>
                    </div>
                  ) : (
                    <>
                      {pendingPoints.map((p) => (
                        <div key={p.id} className="p-2.5 rounded-md bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-[#1a73e8] mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-foreground">
                              {isAr ? "طلب تسجيل نقاط بانتظار المراجعة" : "Point Entry Pending Review"}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {p.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                      {pendingAppeals.map((a) => (
                        <div key={a.id} className="p-2.5 rounded-md bg-[#fef7e0] dark:bg-[#fbbc04]/20 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#b06000] mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-foreground">
                              {isAr ? "تظلم جديد بانتظار المراجعة المحايدة" : "Appeal Awaiting Review"}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {a.grounds || a.objection || (isAr ? "طلب طعن قيد النظر" : "Dispute under review")}
                            </p>
                          </div>
                        </div>
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
