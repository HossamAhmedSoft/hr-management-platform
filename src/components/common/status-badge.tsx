import React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "draft"
  | "pending"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "approved"
  | "completed"
  | "rejected"
  | "revision_required"
  | "urgent"
  | "warning"
  | "active"
  | "closed"
  | "positive"
  | "negative";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  status,
  label,
  className,
  size = "md",
}: StatusBadgeProps) {
  const norm = status.toLowerCase();

  const getStyle = (): { bg: string; text: string; border: string; dot: string } => {
    switch (norm) {
      case "approved":
      case "completed":
      case "resolved":
      case "active":
      case "positive":
        return {
          bg: "bg-[#e6f4ea] dark:bg-[#34a853]/20",
          text: "text-[#137333] dark:text-[#81c995]",
          border: "border-[#ceead6] dark:border-[#34a853]/40",
          dot: "bg-[#34a853]",
        };
      case "rejected":
      case "urgent":
      case "failed":
      case "negative":
        return {
          bg: "bg-[#fce8e6] dark:bg-[#ea4335]/20",
          text: "text-[#c5221f] dark:text-[#f28b82]",
          border: "border-[#fad2cf] dark:border-[#ea4335]/40",
          dot: "bg-[#ea4335]",
        };
      case "pending":
      case "pending_review":
      case "under_review":
      case "revision_required":
      case "warning":
        return {
          bg: "bg-[#fef7e0] dark:bg-[#fbbc04]/20",
          text: "text-[#b06000] dark:text-[#fdd663]",
          border: "border-[#feefc3] dark:border-[#fbbc04]/40",
          dot: "bg-[#fbbc04]",
        };
      case "in_progress":
      case "assigned":
      case "submitted":
        return {
          bg: "bg-[#e8f0fe] dark:bg-[#1a73e8]/20",
          text: "text-[#1a73e8] dark:text-[#8ab4f8]",
          border: "border-[#d2e3fc] dark:border-[#1a73e8]/40",
          dot: "bg-[#1a73e8]",
        };
      case "draft":
      case "closed":
      default:
        return {
          bg: "bg-[#f1f3f4] dark:bg-[#303134]",
          text: "text-[#3c4043] dark:text-[#bdc1c6]",
          border: "border-[#dadce0] dark:border-[#3c4043]",
          dot: "bg-[#80868b]",
        };
    }
  };

  const style = getStyle();
  const displayLabel = label || status.replace(/_/g, " ").toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 shrink-0", style.dot)} />
      {displayLabel}
    </span>
  );
}
