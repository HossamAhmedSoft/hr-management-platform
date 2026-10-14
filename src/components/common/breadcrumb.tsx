"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const { locale } = useApp();
  const isAr = locale === "ar";

  // If explicit items not provided, automatically deduce from pathname
  const resolvedItems: BreadcrumbItem[] = React.useMemo(() => {
    if (items && items.length > 0) return items;

    const segments = (pathname || "")
      .replace(new RegExp(`^\\/(${locale})?`), "")
      .split("/")
      .filter(Boolean);

    if (segments.length === 0) {
      return [{ label: isAr ? "الرئيسية" : "Dashboard", href: `/${locale}`, isCurrent: true }];
    }

    const mapRouteToLabel: Record<string, { ar: string; en: string }> = {
      tasks: { ar: "المهام والتكليفات", en: "Tasks" },
      points: { ar: "سجل النقاط", en: "Points Ledger" },
      evaluations: { ar: "التقييم الشهري", en: "Evaluations" },
      attendance: { ar: "الحضور والاجتماعات", en: "Attendance" },
      appeals: { ar: "التظلمات والطعون", en: "Appeals" },
      members: { ar: "دليل الأعضاء", en: "Members" },
      teams: { ar: "اللجان والفرق", en: "Teams" },
      education: { ar: "المسارات الأكاديمية", en: "Academy" },
      reports: { ar: "التقارير والتحليلات", en: "Reports" },
      "hr-kpis": { ar: "مؤشرات HR", en: "HR KPIs" },
      incidents: { ar: "سلم التصعيد", en: "Escalation" },
      feedback: { ar: "جلسات المتابعة", en: "Feedback & PIP" },
      policy: { ar: "اللائحة والسياسات", en: "Policy Catalog" },
      "audit-log": { ar: "سجل التدقيق الأمني", en: "Security Audit" },
      forbidden: { ar: "غير مصرح", en: "Restricted" },
    };

    const autoItems: BreadcrumbItem[] = [
      { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
    ];

    let currentPath = `/${locale}`;
    segments.forEach((seg, index) => {
      currentPath += `/${seg}`;
      const isLast = index === segments.length - 1;
      const lookup = mapRouteToLabel[seg];
      const label = lookup ? (isAr ? lookup.ar : lookup.en) : seg;
      autoItems.push({
        label,
        href: isLast ? undefined : currentPath,
        isCurrent: isLast,
      });
    });

    return autoItems;
  }, [items, pathname, locale, isAr]);

  if (resolvedItems.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-xs text-muted-foreground", className)}
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {resolvedItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === resolvedItems.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {!isFirst && (
                <ChevronRight
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground/60 shrink-0",
                    isAr && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              )}
              {item.isCurrent || !item.href ? (
                <span
                  className="font-bold text-foreground truncate max-w-[200px]"
                  aria-current="page"
                >
                  {isFirst && <Home className="w-3.5 h-3.5 inline ltr:mr-1 rtl:ml-1" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors hover:underline truncate max-w-[180px] font-medium"
                >
                  {isFirst && <Home className="w-3.5 h-3.5 inline ltr:mr-1 rtl:ml-1" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
