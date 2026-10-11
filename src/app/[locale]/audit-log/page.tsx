"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Shield,
  Search,
  Filter,
  Clock,
  User,
  Database,
  Download,
  CheckCircle,
  AlertTriangle,
  Award,
  TrendingUp,
  Scale,
  Key,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  GraduationCap,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/app-context";
import { AuditLog } from "@/types";

export default function AuditLogPage() {
  const { availableUsers, locale, auditLogs } = useApp();
  const isAr = locale === "ar";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedLogIds, setExpandedLogIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getActorInfo = (log: AuditLog) => {
    if (log.actor_name) return log.actor_name;
    const user = availableUsers.find((u) => u.id === log.actor_id);
    if (user) return `${user.full_name} (${user.role.replace("_", " ")})`;
    return log.actor_id || "System Engine";
  };

  const categories = [
    { key: "all", label: isAr ? "جميع السجلات" : "All Records", icon: Database },
    { key: "task", label: isAr ? "المهام والتسليمات" : "Tasks & Milestones", icon: CheckCircle },
    { key: "point_event", label: isAr ? "النقاط واللوائح" : "Points Ledger", icon: Award },
    { key: "education", label: isAr ? "المسارات والتدريب" : "Technical Tracks", icon: GraduationCap },
    { key: "evaluation", label: isAr ? "التقييمات الشهرية" : "Evaluations", icon: TrendingUp },
    { key: "appeal", label: isAr ? "التظلمات" : "Appeals", icon: Scale },
    { key: "incident", label: isAr ? "المخالفات والمتابعة" : "Incidents & PIP", icon: AlertTriangle },
    { key: "auth", label: isAr ? "الأمان والجلسات" : "Auth & Security", icon: Key },
  ];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      // Category filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "incident") {
          if (l.entity_type !== "incident" && l.entity_type !== "feedback_session") return false;
        } else if (selectedCategory === "auth") {
          if (l.entity_type !== "auth" && l.entity_type !== "system" && l.entity_type !== "policy") return false;
        } else if (selectedCategory === "education") {
          const eduEntities = [
            "technical_track",
            "participant",
            "track_enrollment",
            "track_session",
            "track_assignment",
            "track_submission",
            "track_certificate",
            "attendance_event",
          ];
          if (!eduEntities.includes(l.entity_type)) return false;
        } else if (l.entity_type !== selectedCategory) {
          return false;
        }
      }

      // Search query
      if (search.trim()) {
        const actor = getActorInfo(l).toLowerCase();
        const entity = (l.entity_type || "").toLowerCase();
        const action = (l.action || "").toLowerCase();
        const reason = (l.reason || "").toLowerCase();
        const details = (l.details || "").toLowerCase();
        const entityId = (l.entity_id || "").toLowerCase();
        const q = search.toLowerCase();
        return (
          actor.includes(q) ||
          entity.includes(q) ||
          action.includes(q) ||
          reason.includes(q) ||
          details.includes(q) ||
          entityId.includes(q)
        );
      }

      return true;
    });
  }, [auditLogs, selectedCategory, search, availableUsers]);

  // Statistics
  const totalCount = auditLogs.length;
  const taskLogsCount = auditLogs.filter((l) => l.entity_type === "task").length;
  const pointLogsCount = auditLogs.filter((l) => l.entity_type === "point_event").length;
  const authLogsCount = auditLogs.filter(
    (l) => l.entity_type === "auth" || l.entity_type === "system"
  ).length;

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      "ID",
      "Timestamp",
      "Actor",
      "Actor ID",
      "Action",
      "Entity Type",
      "Entity ID",
      "Reason / Note",
      "Details",
      "Changes / State",
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.created_at).toISOString(),
      `"${getActorInfo(l).replace(/"/g, '""')}"`,
      l.actor_id,
      l.action,
      l.entity_type,
      l.entity_id,
      `"${(l.reason || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.after_value || l.new_state || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `GDG_NCTU_Audit_Trail_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("AUTH") || act.includes("LOGIN") || act.includes("SECURITY")) {
      return {
        bg: "bg-[#fef7e0] dark:bg-[#fbbc04]/20",
        text: "text-[#b06000] dark:text-[#fdd663]",
        border: "border-[#feefc3] dark:border-[#fbbc04]/30",
        icon: Key,
      };
    }
    if (act.includes("APPROVE") || act.includes("VERIF") || act.includes("COMPLET")) {
      return {
        bg: "bg-[#e6f4ea] dark:bg-[#34a853]/20",
        text: "text-[#137333] dark:text-[#81c995]",
        border: "border-[#ceead6] dark:border-[#34a853]/30",
        icon: CheckCircle,
      };
    }
    if (act.includes("REJECT") || act.includes("NEGATIVE") || act.includes("INCIDENT")) {
      return {
        bg: "bg-[#fce8e6] dark:bg-[#ea4335]/20",
        text: "text-[#c5221f] dark:text-[#f28b82]",
        border: "border-[#fad2cf] dark:border-[#ea4335]/30",
        icon: AlertTriangle,
      };
    }
    if (act.includes("CREATE") || act.includes("SUBMIT") || act.includes("RECORD")) {
      return {
        bg: "bg-[#e8f0fe] dark:bg-[#1a73e8]/20",
        text: "text-[#1a73e8] dark:text-[#8ab4f8]",
        border: "border-[#d2e3fc] dark:border-[#1a73e8]/30",
        icon: Award,
      };
    }
    return {
      bg: "bg-muted",
      text: "text-foreground",
      border: "border-border",
      icon: Database,
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={isAr ? "سجل النشاط والتدقيق الأمني الشامل" : "Comprehensive Audit Trail & System Log"}
        description={
          isAr
            ? "سجل رقابي غير قابل للتعديل يوثق كل إجراء يُنفذ على الموقع: تسجيل الدخول، إنشاء المهام، حركات النقاط، والتقييمات."
            : "Immutable, append-only security logs documenting every user action, authentication event, task update, and approval."
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-2 text-xs border-border flex-1 sm:flex-initial justify-center"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          {isAr ? "تصدير السجل (CSV)" : "Export CSV"}
        </Button>
      </PageHeader>

      {/* KPI Metrics Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-border/80 bg-card rounded-xl">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "إجمالي السجلات" : "Total Events"}</span>
            <Database className="w-4 h-4 text-[#1a73e8]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {totalCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "عمليات موثقة" : "Verified Actions"}
          </p>
        </Card>

        <Card className="p-4 border-border/80 bg-card rounded-xl">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "عمليات المهام" : "Task Operations"}</span>
            <CheckCircle className="w-4 h-4 text-[#34a853]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#34a853] font-mono">
            {taskLogsCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "تكليف وتسليمات" : "Creation & Reviews"}
          </p>
        </Card>

        <Card className="p-4 border-border/80 bg-card rounded-xl">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "حركات النقاط" : "Point Ledgers"}</span>
            <Award className="w-4 h-4 text-[#fbbc04]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#b06000] dark:text-[#fdd663] font-mono">
            {pointLogsCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "اعتمادات وخصومات" : "Recorded & Approved"}
          </p>
        </Card>

        <Card className="p-4 border-border/80 bg-card rounded-xl">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "أمان وجلسات" : "Auth & Security"}</span>
            <Shield className="w-4 h-4 text-[#ea4335]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">
            {authLogsCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "جلسات دخول وخروج" : "Logins & Policy"}
          </p>
        </Card>
      </div>

      {/* Category Tabs (Horizontally Swipeable on Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.key;
          return (
            <Button
              key={cat.key}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.key)}
              className="text-xs h-8 rounded-full gap-1.5 shrink-0"
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder={
              isAr
                ? "بحث بالاسم، نوع الإجراء، أو التفاصيل..."
                : "Search actor, action type, entity ID, or details..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-lg bg-background"
          />
        </div>
        <span className="text-[11px] text-muted-foreground self-start sm:self-center font-medium">
          {isAr
            ? `عرض ${filteredLogs.length} من إجمالي ${totalCount} سجل`
            : `Showing ${filteredLogs.length} of ${totalCount} records`}
        </span>
      </div>

      {/* Logs Records Stream */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">
              {isAr ? "لا توجد سجلات مطابقة للبحث" : "No audit trail logs match your query"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "تُسجل جميع العمليات المنفذة في المنصة تلقائياً وتظهر في هذا السجل فور حدوثها."
                : "All operations on the website are appended automatically to this tamper-proof record."}
            </p>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const badge = getActionBadge(log.action);
            const BadgeIcon = badge.icon;
            const isExpanded = expandedLogIds.includes(log.id);
            const stateData = log.after_value || log.new_state || log.previous_state;

            return (
              <Card
                key={log.id}
                className="p-4 border-border/80 hover:shadow-xs transition-all flex flex-col justify-between gap-3 text-xs bg-card rounded-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{log.action}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold text-[10px] uppercase">
                      {log.entity_type}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/80">
                      #{log.entity_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] shrink-0">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} • {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Content description & Actor */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-semibold">{isAr ? "المنفّذ:" : "Actor:"}</span>
                    <strong className="text-foreground">{getActorInfo(log)}</strong>
                  </div>

                  {log.reason && (
                    <p className="text-foreground/90 font-medium leading-relaxed mt-1">
                      {log.reason}
                    </p>
                  )}

                  {log.details && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {log.details}
                    </p>
                  )}
                </div>

                {/* State / Diff Expander */}
                {stateData && (
                  <div className="pt-2 border-t border-border/30">
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>
                        {isExpanded
                          ? isAr
                            ? "إخفاء التفاصيل الفنية للحالة"
                            : "Hide state details"
                          : isAr
                          ? "عرض التفاصيل الفنية للحالة (State Diff)"
                          : "View state diff details"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <pre className="mt-2 p-2.5 rounded-lg bg-muted/60 text-[11px] font-mono overflow-x-auto text-foreground/90 border border-border">
                        {JSON.stringify(stateData, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
