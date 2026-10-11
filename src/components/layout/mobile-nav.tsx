"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Award,
  TrendingUp,
  Menu,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { canAccessRoute } from "@/lib/auth-service";

interface MobileNavProps {
  onOpenSidebar: () => void;
}

export function MobileNav({ onOpenSidebar }: MobileNavProps) {
  const pathname = usePathname();
  const { locale, currentUser, tasks } = useApp();
  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";

  // Calculate user's active tasks count for badge
  const myPendingTasksCount = tasks.filter((t) => {
    if (!currentUser) return false;
    const isAssigned =
      t.assignees &&
      t.assignees.some(
        (a) =>
          a.profile_id === currentUser.id ||
          a.profile?.id === currentUser.id ||
          (currentUser.email && a.profile?.email === currentUser.email)
      );
    return isAssigned && (t.status === "assigned" || t.status === "in_progress");
  }).length;

  const isEducationStaff =
    userRole === "track_lead" ||
    userRole === "lead_instructor" ||
    userRole === "ta_mentor";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
}

  const fourthItem: NavItem = isEducationStaff
    ? {
        href: `/${locale}/education`,
        label: isAr ? "المسارات" : "Tracks",
        icon: GraduationCap,
      }
    : {
        href: `/${locale}/evaluations`,
        label: isAr ? "التقييم" : "Eval",
        icon: TrendingUp,
      };

  const navItems: NavItem[] = [
    {
      href: `/${locale}`,
      label: isAr ? "الرئيسية" : "Home",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/${locale}/tasks`,
      label: isAr ? "المهام" : "Tasks",
      icon: CheckSquare,
      badge: myPendingTasksCount > 0 ? myPendingTasksCount : undefined,
    },
    {
      href: `/${locale}/points`,
      label: isAr ? "النقاط" : "Points",
      icon: Award,
    },
    fourthItem,
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-md border-t border-border shadow-lg safe-area-bottom"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative group select-none min-h-[48px]",
                isActive
                  ? "text-[#1a73e8] dark:text-[#8ab4f8]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center px-3.5 py-1 rounded-full transition-all duration-200",
                  isActive
                    ? "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 shadow-2xs"
                    : "group-hover:bg-muted/50"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform group-active:scale-90",
                    isActive ? "stroke-[2.4]" : "stroke-[1.8]"
                  )}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-[#ea4335] rounded-full ring-2 ring-card animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[64px]",
                  isActive ? "font-bold text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 5th Button: Open Full Menu */}
        <button
          onClick={onOpenSidebar}
          aria-label={isAr ? "فتح القائمة الكاملة" : "Open full menu"}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-muted-foreground hover:text-foreground active:scale-95 transition-all select-none min-h-[48px]"
        >
          <div className="flex items-center justify-center px-3.5 py-1 rounded-full hover:bg-muted/50 transition-colors">
            <Menu className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">
            {isAr ? "المزيد" : "Menu"}
          </span>
        </button>
      </div>
    </nav>
  );
}
