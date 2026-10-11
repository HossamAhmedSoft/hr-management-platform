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
  ExternalLink,
  Lock,
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

  const mainNav = [
    {
      href: `/${locale}`,
      label: isAr ? "لوحة القيادة" : "Dashboard Overview",
      icon: LayoutDashboard,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
    },
    {
      href: `/${locale}/members`,
      label: isAr ? "دليل الأعضاء" : "Members Directory",
      icon: Users,
      color: "text-[#34a853] dark:text-[#81c995]",
    },
    {
      href: `/${locale}/teams`,
      label: isAr ? "اللجان والمسارات" : "Tracks & Committees",
      icon: Layers,
      color: "text-[#fbbc04] dark:text-[#fdd663]",
    },
    {
      href: `/${locale}/tasks`,
      label: isAr ? "إدارة المهام والتسليمات" : "Tasks & Milestones",
      icon: CheckSquare,
      color: "text-[#ea4335] dark:text-[#f28b82]",
    },
    {
      href: `/${locale}/points`,
      label: isAr ? "سجل النقاط واللوائح" : "Points Ledger & Rules",
      icon: Award,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
    },
    {
      href: `/${locale}/evaluations`,
      label: isAr ? "التقييم الشهري (100 درجة)" : "Monthly Evaluations",
      icon: TrendingUp,
      color: "text-[#34a853] dark:text-[#81c995]",
    },
  ];

  const secondaryNav = [
    {
      href: `/${locale}/feedback`,
      label: isAr ? "المتابعة وخطط التحسين" : "Feedback & PIP",
      icon: HeartHandshake,
      color: "text-[#b06000] dark:text-[#fdd663]",
    },
    {
      href: `/${locale}/incidents`,
      label: isAr ? "سلم التصعيد والمخالفات" : "Escalation Ladder",
      icon: ShieldAlert,
      color: "text-[#ea4335] dark:text-[#f28b82]",
    },
    {
      href: `/${locale}/appeals`,
      label: isAr ? "التظلمات (7 أيام عمل)" : "Appeals & Disputes",
      icon: Scale,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
    },
    {
      href: `/${locale}/education`,
      label: isAr ? "المسارات التعليمية" : "Educational Tracks",
      icon: GraduationCap,
      color: "text-[#34a853] dark:text-[#81c995]",
    },
    {
      href: `/${locale}/attendance`,
      label: isAr ? "الحضور والاجتماعات" : "Attendance Logs",
      icon: CalendarCheck,
      color: "text-[#b06000] dark:text-[#fdd663]",
    },
    {
      href: `/${locale}/reports`,
      label: isAr ? "التقارير والتحليلات" : "Reports & Exports",
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
      href: `/${locale}/policy`,
      label: isAr ? "السياسات والتقويم" : "Policy & Settings",
      icon: Settings,
      color: "text-[#5f6368] dark:text-[#9aa0a6]",
    },
    {
      href: `/${locale}/audit-log`,
      label: isAr ? "سجل التدقيق الأمني" : "Audit Log Records",
      icon: FileText,
      color: "text-[#5f6368] dark:text-[#9aa0a6]",
    },
  ];

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
          "fixed top-0 bottom-0 z-50 flex flex-col w-68 bg-card border-r border-border transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isAr ? "right-0 border-l border-r-0" : "left-0",
          isOpen
            ? "translate-x-0 shadow-xl"
            : isAr
            ? "translate-x-full"
            : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border">
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
              <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1">
                <span>GDG on Campus</span>
              </div>
              <p className="text-[10px] font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
                NCTU Chapter
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Main Section */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isAr ? "النظام الأساسي" : "Core Modules"}
            </div>
            {mainNav.map((item) => {
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
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                    isActive
                      ? "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
                  )}
                >
                  {isActive && (
                    <span
                      className={cn(
                        "absolute top-1 bottom-1 w-1 bg-[#1a73e8] rounded-full",
                        isAr ? "right-0" : "left-0"
                      )}
                    />
                  )}
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors shrink-0",
                      isActive ? "text-[#1a73e8] dark:text-[#8ab4f8]" : item.color
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Operations & Governance Section */}
          <div className="space-y-1 pt-2 border-t border-border">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isAr ? "الحوكمة والعمليات" : "Governance & Operations"}
            </div>
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              const isAllowed = currentUser ? canAccessRoute(currentUser.role, item.href) : true;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                    isActive
                      ? "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8] font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#f1f3f4] dark:hover:bg-[#303134]",
                    !isAllowed && "opacity-80"
                  )}
                >
                  {isActive && (
                    <span
                      className={cn(
                        "absolute top-1 bottom-1 w-1 bg-[#1a73e8] rounded-full",
                        isAr ? "right-0" : "left-0"
                      )}
                    />
                  )}
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors shrink-0",
                      isActive ? "text-[#1a73e8] dark:text-[#8ab4f8]" : item.color
                    )}
                  />
                  <span className="truncate flex-1">{item.label}</span>
                  {!isAllowed && (
                    <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer info: Google Workspace status badge */}
        <div className="p-3 border-t border-border bg-[#f8f9fa] dark:bg-[#202124]">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#34a853]" />
              <span className="font-semibold text-foreground">System v2.4</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border">
              Egypt (Sun-Thu)
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
