import React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  delta?: {
    value: string;
    isPositive: boolean;
  };
  accentColor?: "blue" | "red" | "yellow" | "green";
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  delta,
  accentColor = "blue",
  className,
}: StatsCardProps) {
  const getAccentBorder = () => {
    switch (accentColor) {
      case "blue":
        return "border-t-[3px] border-t-[#1a73e8]";
      case "red":
        return "border-t-[3px] border-t-[#ea4335]";
      case "yellow":
        return "border-t-[3px] border-t-[#fbbc04]";
      case "green":
        return "border-t-[3px] border-t-[#34a853]";
    }
  };

  const getIconColor = () => {
    switch (accentColor) {
      case "blue":
        return "text-[#1a73e8] bg-[#e8f0fe] dark:bg-[#1a73e8]/20";
      case "red":
        return "text-[#ea4335] bg-[#fce8e6] dark:bg-[#ea4335]/20";
      case "yellow":
        return "text-[#b06000] bg-[#fef7e0] dark:bg-[#fbbc04]/20";
      case "green":
        return "text-[#137333] bg-[#e6f4ea] dark:bg-[#34a853]/20";
    }
  };

  return (
    <div
      className={cn(
        "p-5 rounded-lg bg-card border border-border shadow-xs hover:shadow-md transition-all duration-200",
        getAccentBorder(),
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className={cn("p-2 rounded-lg transition-transform", getIconColor())}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full border",
              delta.isPositive
                ? "bg-[#e6f4ea] text-[#137333] border-[#ceead6] dark:bg-[#34a853]/20 dark:text-[#81c995] dark:border-[#34a853]/30"
                : "bg-[#fce8e6] text-[#c5221f] border-[#fad2cf] dark:bg-[#ea4335]/20 dark:text-[#f28b82] dark:border-[#ea4335]/30"
            )}
          >
            {delta.isPositive ? "+" : ""}
            {delta.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-muted-foreground font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
