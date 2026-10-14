import React from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs, BreadcrumbItem } from "./breadcrumb";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showBreadcrumbs?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  badge,
  breadcrumbs,
  showBreadcrumbs = true,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-2 pb-4 sm:pb-6 border-b border-border/60", className)}>
      {showBreadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-1" />}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
        {children && (
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full md:w-auto shrink-0 pt-1 md:pt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
