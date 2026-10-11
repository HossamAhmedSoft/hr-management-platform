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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/app-context";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    locale,
    toggleLocale,
    theme,
    toggleTheme,
    unreadNotificationsCount,
    logout,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const isAr = locale === "ar";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return { label: isAr ? "مدير النظام" : "Super Admin", color: "bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]" };
      case "hr_admin":
        return { label: isAr ? "مسؤول الموارد" : "HR Admin", color: "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]" };
      case "hr_reviewer":
        return { label: isAr ? "مراجع الموارد" : "HR Reviewer", color: "bg-[#fef7e0] text-[#b06000] border-[#feefc3]" };
      case "team_lead":
        return { label: isAr ? "قائد فريق" : "Team Lead", color: "bg-[#e6f4ea] text-[#137333] border-[#ceead6]" };
      default:
        return { label: isAr ? "عضو" : "Member", color: "bg-[#f1f3f4] text-[#3c4043] border-[#dadce0]" };
    }
  };

  const badge = getRoleBadge(currentUser.role);

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
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
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

        {/* Right: Controls & Persona Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher for seamless policy auditing */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#f1f3f4] dark:bg-[#303134] border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span className="text-[11px] text-muted-foreground font-medium">
              {isAr ? "الدور:" : "Role:"}
            </span>
            <Select
              value={currentUser.id}
              onValueChange={(val) => {
                const u = availableUsers.find((x) => x.id === val);
                if (u) setCurrentUser(u);
              }}
            >
              <SelectTrigger className="h-6 w-[140px] text-xs border-0 bg-transparent shadow-none focus:ring-0 p-0 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.full_name} ({u.role.replace("_", " ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              {unreadNotificationsCount > 0 && (
                <span className="absolute 1 top-1 right-1 w-2 h-2 rounded-full bg-[#ea4335]" />
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
                    {unreadNotificationsCount} unread
                  </span>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  <div className="p-2.5 rounded-md bg-[#e8f0fe] dark:bg-[#1a73e8]/20 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1a73e8] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {isAr ? "اعتماد نقاط مهمة" : "Point Ledger Entry Approved"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isAr
                          ? "+3 نقاط لتسليم مهمة الواجهة قبل الموعد."
                          : "+3 points awarded for early deliverable."}
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md bg-[#fef7e0] dark:bg-[#fbbc04]/20 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#b06000] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {isAr ? "إشعار بشأن جلسة غياب" : "Point Notice Pending"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isAr
                          ? "لديك 48 ساعة لتقديم توضيح قبل مراجعة الخصم."
                          : "48h window to submit explanation."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <Avatar className="w-8 h-8 rounded-full border border-border">
              <AvatarFallback className="bg-[#1a73e8] text-white font-bold text-xs">
                {currentUser.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-foreground truncate max-w-[120px] leading-tight">
                {currentUser.full_name}
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
