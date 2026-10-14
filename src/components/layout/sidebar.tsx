"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  CheckSquare,
  Award,
  TrendingUp,
  HeartHandshake,
  ShieldAlert,
  Scale,
  GraduationCap,
  CalendarCheck,
  BarChart3,
  Target,
  Settings,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { canAccessRoute } from "@/lib/auth-service";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { locale, currentUser } = useApp();
  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";

  // Group 1: Daily Focus & Action
  const dailyNav = [
    {
      href: `/${locale}`,
      label: isAr ? "لوحة القيادة" : "Dashboard",
      icon: LayoutDashboard,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
    },
    {
      href: `/${locale}/tasks`,
      label: isAr ? "إدارة المهام والتكليفات" : "Tasks & Milestones",
      icon: CheckSquare,
      color: "text-[#ea4335] dark:text-[#f28b82]",
    },
    {
      href: `/${locale}/attendance`,
      label: isAr ? "الحضور والاجتماعات" : "Attendance & Sessions",
      icon: CalendarCheck,
      color: "text-[#34a853] dark:text-[#81c995]",
    },
  ];

  // Group 2: Performance & Academic Standing
  const performanceNav = [
    {
      href: `/${locale}/points`,
      label: isAr ? "سجل وقواعد النقاط" : "Points Ledger & Rules",
      icon: Award,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
    },
    {
      href: `/${locale}/evaluations`,
      label: isAr ? "التقييم الشهري (100 درجة)" : "Monthly Evaluations",
      icon: TrendingUp,
      color: "text-[#34a853] dark:text-[#81c995]",
    },
    {
      href: `/${locale}/appeals`,
      label: isAr ? "التظلمات والطعون" : "Appeals & Inquiries",
      icon: Scale,
      color: "text-[#fbbc04] dark:text-[#fdd663]",
    },
    {
      href: `/${locale}/education`,
      label: isAr ? "المسارات الأكاديمية" : "Academy Tracks",
      icon: GraduationCap,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
    },
    {
      href: `/${locale}/incidents`,
      label: isAr ? "سلم التصعيد والمتابعة" : "Escalation Ladder",
      icon: ShieldAlert,
      color: "text-[#ea4335] dark:text-[#f28b82]",
    },
  ];

  // Group 3: Leadership & Administrative Management
  const adminNav = [
    {
      href: `/${locale}/members`,
      label: isAr ? "دليل الأعضاء" : "Members Directory",
      icon: Users,
      color: "text-[#34a853] dark:text-[#81c995]",
    },
    {
      href: `/${locale}/teams`,
      label: isAr ? "اللجان والفرق" : "Teams & Committees",
      icon: Layers,
      color: "text-[#fbbc04] dark:text-[#fdd663]",
    },
    {
      href: `/${locale}/reports`,
      label: isAr ? "التقارير والتحليلات" : "Reports & Analytics",
      icon: BarChart3,
      color: "text-[#ea4335] dark:text-[#f28b82]",
    },
    {
      href: `/${locale}/hr-kpis`,
      label: isAr ? "مؤشرات كفاءة HR" : "HR Team KPIs",
      icon: Target,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
    },
    {
      href: `/${locale}/feedback`,
      label: isAr ? "جلسات المتابعة وPIP" : "Feedback & PIP",
      icon: HeartHandshake,
      color: "text-[#b06000] dark:text-[#fdd663]",
    },
    {
      href: `/${locale}/audit-log`,
      label: isAr ? "سجل التدقيق الأمني" : "Security Audit Log",
      icon: FileText,
      color: "text-[#5f6368] dark:text-[#9aa0a6]",
    },
    {
      href: `/${locale}/policy`,
      label: isAr ? "اللائحة والسياسات" : "Policy Catalog",
      icon: Settings,
      color: "text-[#5f6368] dark:text-[#9aa0a6]",
    },
  ];

  const visibleDaily = dailyNav.filter((item) => canAccessRoute(userRole, item.href));
  const visiblePerformance = performanceNav.filter((item) => canAccessRoute(userRole, item.href));
  const visibleAdmin = adminNav.filter((item) => canAccessRoute(userRole, item.href));

  const renderNavList = (items: typeof dailyNav) => (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === `/${locale}`
            ? pathname === `/${locale}` || pathname === `/${locale}/`
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors relative group",
              isActive
                ? "bg-[#1a73e8]/10 dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {isActive && (
              <span
                className={cn(
                  "absolute top-2 bottom-2 w-1 bg-[#1a73e8] rounded-full",
                  isAr ? "right-1" : "left-1"
                )}
              />
            )}
            <Icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-[#1a73e8] dark:text-[#8ab4f8]" : item.color
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 z-50 flex flex-col w-[270px] max-w-[85vw] bg-card border-r border-border transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shadow-2xl lg:shadow-none",
          isAr ? "right-0 border-l border-r-0" : "left-0",
          isOpen
            ? "translate-x-0"
            : isAr
            ? "translate-x-full"
            : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            onClick={onClose}
          >
            {/* Google Developer Groups Symbol Dots */}
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc04]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
            </div>
            <div>
              <div className="font-bold text-xs tracking-tight text-foreground flex items-center gap-1">
                <span>GDG on Campus</span>
              </div>
              <p className="text-[10px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
                NCTU Chapter
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted lg:hidden min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categorized Navigation Feed */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4">
          {/* 1. Daily Workspace */}
          {visibleDaily.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {isAr ? "العمل اليومي والمهام" : "Daily Workspace"}
              </div>
              {renderNavList(visibleDaily)}
            </div>
          )}

          {/* 2. Performance & Standing */}
          {visiblePerformance.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-border/60">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {isAr ? "الحوكمة والتقييم" : "Performance & Standing"}
              </div>
              {renderNavList(visiblePerformance)}
            </div>
          )}

          {/* 3. Leadership & Administration */}
          {visibleAdmin.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-border/60">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {isAr ? "الإدارة والتقارير" : "Admin & Governance"}
              </div>
              {renderNavList(visibleAdmin)}
            </div>
          )}
        </div>

        {/* Footer info badge */}
        <div className="p-3 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#34a853]" />
              <span className="font-semibold text-foreground text-[10px]">GDG Portal v2.4</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-card border border-border">
              Egypt (Sun-Thu)
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
