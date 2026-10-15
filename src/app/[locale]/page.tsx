"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Download,
  Plus,
  Scale,
  ExternalLink,
  CheckSquare,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { StatsCard } from "@/components/common/stats-card";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/app-context";
import { POLICY_POINT_CATEGORIES } from "@/lib/policy-catalog";
import { Task } from "@/types";

export default function DashboardPage() {
  const {
    currentUser,
    availableUsers,
    locale,
    teams,
    tasks,
    pointEvents,
    addPointEvent,
    evaluations,
    submitAppeal,
    incidents,
  } = useApp();

  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canRecordPoints =
    userRole === "super_admin" ||
    userRole === "hr_admin" ||
    userRole === "hr_reviewer" ||
    userRole === "team_lead";
  const canExport =
    userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";

  // Modals state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newSelectedCategory, setNewSelectedCategory] = useState(
    POLICY_POINT_CATEGORIES[0]?.id || ""
  );
  const [targetMemberId, setTargetMemberId] = useState(availableUsers[0]?.id || "");

  React.useEffect(() => {
    if (!targetMemberId && availableUsers.length > 0) {
      setTargetMemberId(availableUsers[0].id);
    }
  }, [availableUsers, targetMemberId]);

  // Matching helper
  const isMatchUser = (targetId?: string, comparisonUserId?: string) => {
    const compareWith = comparisonUserId || currentUser?.id;
    if (!targetId || !compareWith) return false;

    const cleanTarget = targetId.toLowerCase().trim();
    const cleanComp = compareWith.toLowerCase().trim();
    if (cleanTarget === cleanComp) return true;

    const targetProf = availableUsers.find(
      (u) =>
        u.id.toLowerCase() === cleanTarget ||
        (u.email && u.email.toLowerCase().trim() === cleanTarget)
    );
    const compProf = availableUsers.find(
      (u) =>
        u.id.toLowerCase() === cleanComp ||
        (u.email && u.email.toLowerCase().trim() === cleanComp)
    );

    if (targetProf && compProf) {
      return (
        targetProf.id.toLowerCase() === compProf.id.toLowerCase() ||
        (!!targetProf.email &&
          !!compProf.email &&
          targetProf.email.toLowerCase().trim() === compProf.email.toLowerCase().trim())
      );
    }

    if (targetProf) {
      return (
        targetProf.id.toLowerCase() === cleanComp ||
        (!!targetProf.email && targetProf.email.toLowerCase().trim() === cleanComp)
      );
    }
    if (compProf) {
      return (
        compProf.id.toLowerCase() === cleanTarget ||
        (!!compProf.email && compProf.email.toLowerCase().trim() === cleanTarget)
      );
    }

    return false;
  };

  const getMemberName = (id: string) => {
    const clean = id.toLowerCase().trim();
    const prof = availableUsers.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase().trim() === clean)
    );
    return prof?.full_name || id;
  };

  // Task filtering
  const isTaskAssigned = (t: Task) => {
    if (!currentUser) return false;
    if (t.created_by === currentUser.id) return true;
    if (t.assignees && Array.isArray(t.assignees) && t.assignees.length > 0) {
      for (const a of t.assignees) {
        if (!a) continue;
        if (a.profile_id === currentUser.id || a.profile?.id === currentUser.id) return true;
        if (
          currentUser.email &&
          a.profile?.email &&
          a.profile.email.toLowerCase() === currentUser.email.toLowerCase()
        ) {
          return true;
        }
        const matched = availableUsers.find((u) => u.id === a.profile_id);
        if (
          matched &&
          (matched.id === currentUser.id ||
            (currentUser.email &&
              matched.email?.toLowerCase() === currentUser.email.toLowerCase()))
        ) {
          return true;
        }
      }
      return false;
    }
    return false;
  };

  const userActiveTasks = tasks.filter(
    (t) => isTaskAssigned(t) && t.status !== "completed" && t.status !== "cancelled"
  );

  // Points & Metrics (Distinguish Personal Points vs Organization Overview)
  const personalPointEvents = pointEvents.filter((p) => isMatchUser(p.member_id));
  const personalApprovedPositive = personalPointEvents
    .filter((p) => p.status === "approved" && p.direction === "positive")
    .reduce((sum, p) => sum + p.value, 0);
  const personalApprovedNegative = personalPointEvents
    .filter((p) => p.status === "approved" && p.direction === "negative")
    .reduce((sum, p) => sum + p.value, 0);
  const personalTotalNet = personalApprovedPositive + personalApprovedNegative;

  const userPointEvents = isMember
    ? personalPointEvents
    : userRole === "team_lead" && currentUser?.team_id
    ? pointEvents.filter((p) => p.team_id === currentUser.team_id || isMatchUser(p.member_id))
    : pointEvents;

  const userEvaluations = isMember
    ? evaluations.filter((e) => isMatchUser(e.member_id))
    : userRole === "team_lead" && currentUser?.team_id
    ? evaluations.filter((e) => {
        const target = availableUsers.find((u) => u.id === e.member_id);
        return target?.team_id === currentUser.team_id || isMatchUser(e.member_id);
      })
    : evaluations;

  const approvedPositive = userPointEvents
    .filter((p) => p.status === "approved" && p.direction === "positive")
    .reduce((sum, p) => sum + p.value, 0);

  const approvedNegative = userPointEvents
    .filter((p) => p.status === "approved" && p.direction === "negative")
    .reduce((sum, p) => sum + p.value, 0);

  const totalPointsNet = approvedPositive + approvedNegative;

  const attendanceRate =
    userEvaluations.length > 0
      ? Math.round(
          userEvaluations.reduce((sum, e) => {
            const attRating = e.ratings?.find((r) => r.category_id === "eval-cat-3")?.rating;
            return sum + (attRating ? (attRating / 5) * 100 : 100);
          }, 0) / userEvaluations.length
        )
      : 100;

  const avgEvalScore =
    userEvaluations.length > 0
      ? (
          userEvaluations.reduce((sum, e) => sum + (e.total_score || 0), 0) /
          userEvaluations.length
        ).toFixed(1)
      : "—";

  // Recent 3 point events for the clean feed
  const recentPointEvents = userPointEvents.slice(0, 3);

  const handleExportCSV = () => {
    const headers = "ID,Member,Category,Direction,Points,Date,Status,Explanation\n";
    const rows = userPointEvents
      .map(
        (p) =>
          `"${p.id}","${p.member_id}","${p.category_id}","${p.direction}",${p.value},"${p.event_date}","${p.status}","${p.explanation}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdg_nctu_points_log_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Cockpit Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#1a73e8]/10 text-[#1a73e8] dark:text-[#8ab4f8]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {isAr
                ? `مرحباً بك، ${currentUser?.full_name || "العضو"}`
                : `Welcome back, ${currentUser?.full_name || "Member"}`}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "مركز قيادة الأداء والعمليات — ملخص سريع ومباشر لحالتك ومهامك اليوم."
              : "Operations & Governance Cockpit — A clean executive summary of your focus today."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 gap-1.5 text-xs rounded-lg"
            >
              <Download className="w-3.5 h-3.5 text-[#137333]" />
              <span>{isAr ? "تصدير السجل" : "Export CSV"}</span>
            </Button>
          )}

          {canRecordPoints && (
            <Button
              size="sm"
              onClick={() => setIsAddPointModalOpen(true)}
              className="h-8 gap-1.5 text-xs rounded-lg bg-[#1a73e8] hover:bg-[#1765cc] text-white shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "تسجيل نقاط" : "Record Points"}</span>
            </Button>
          )}

          <Link href={`/${locale}/tasks`}>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1 text-xs rounded-lg"
            >
              <span>{isAr ? "المهام" : "Tasks"}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Compact Metric Overview Cards (4 Key Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Net Points */}
        <StatsCard
          title={
            isMember
              ? isAr
                ? "رصيد نقاطي الشخصية"
                : "My Personal Points"
              : userRole === "team_lead"
              ? isAr
                ? "إجمالي نقاط الفريق"
                : "Team Net Points"
              : isAr
              ? "إجمالي نقاط المنظمة"
              : "Org Net Points"
          }
          value={
            isMember
              ? `${personalTotalNet > 0 ? "+" : ""}${personalTotalNet} pts`
              : `${totalPointsNet > 0 ? "+" : ""}${totalPointsNet} pts`
          }
          subtitle={
            isMember
              ? isAr
                ? `+${personalApprovedPositive} إيجابي | ${personalApprovedNegative} سلبي (رصيدك الخاص)`
                : `+${personalApprovedPositive} pos | ${personalApprovedNegative} neg (Your Balance)`
              : isAr
              ? `إجمالي كافة الأعضاء (${approvedPositive >= 0 ? "+" : ""}${approvedPositive} / ${approvedNegative}) • نقاطك: ${personalTotalNet}`
              : `All members (${approvedPositive >= 0 ? "+" : ""}${approvedPositive} / ${approvedNegative}) • You: ${personalTotalNet}`
          }
          icon={<Award className="w-4 h-4" />}
          delta={{
            value: isMember
              ? personalTotalNet >= 10
                ? "Green Tier"
                : personalTotalNet < 0
                ? "Warning Tier"
                : "Normal Tier"
              : isAr
              ? "إجمالي شامل"
              : "Org-Wide",
            isPositive: isMember ? personalTotalNet >= 0 : totalPointsNet >= 0,
          }}
          accentColor="blue"
        />

        {/* Metric 2: Attendance Rate */}
        <StatsCard
          title={isAr ? "نسبة الالتزام" : "Attendance"}
          value={`${attendanceRate}%`}
          subtitle={isAr ? "المستهدف: ≥85%" : "Target: ≥85%"}
          icon={<CheckCircle className="w-4 h-4" />}
          delta={{ value: "Verified", isPositive: attendanceRate >= 85 }}
          accentColor="green"
        />

        {/* Metric 3: Active Tasks */}
        <StatsCard
          title={isAr ? "المهام الجارية" : "Active Tasks"}
          value={userActiveTasks.length}
          subtitle={
            userActiveTasks.length === 0
              ? isAr
                ? "لا توجد مهام متأخرة"
                : "All tasks completed"
              : isAr
              ? "مهام بانتظار إنجازك"
              : "Pending deliverables"
          }
          icon={<CheckSquare className="w-4 h-4" />}
          delta={{
            value: userActiveTasks.length === 0 ? "All Done" : `${userActiveTasks.length} Pending`,
            isPositive: userActiveTasks.length === 0,
          }}
          accentColor="yellow"
        />

        {/* Metric 4: Monthly Performance */}
        <StatsCard
          title={isAr ? "التقييم الشهري" : "Monthly Eval"}
          value={avgEvalScore !== "—" ? `${avgEvalScore} / 100` : "—"}
          subtitle={
            userEvaluations.length > 0
              ? isAr
                ? `${userEvaluations.length} تقييمات معتمدة`
                : `${userEvaluations.length} Finalized`
              : isAr
              ? "في انتظار دورة التقييم"
              : "Awaiting cycle"
          }
          icon={<TrendingUp className="w-4 h-4" />}
          delta={{ value: "Active", isPositive: true }}
          accentColor="red"
        />
      </div>

      {/* 3. Action Center: Tasks Requiring Immediate Attention */}
      <Card className="border border-border/80 bg-card rounded-2xl shadow-2xs overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b border-border/60 bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#1a73e8]" />
              <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                {isAr ? "ما يحتاج انتباهك الآن — التكليفات والمهام" : "Action Required — Active Tasks"}
              </CardTitle>
            </div>
            <Link href={`/${locale}/tasks`}>
              <span className="text-xs font-semibold text-[#1a73e8] hover:underline flex items-center gap-1">
                <span>{isAr ? "عرض كل المهام" : "View All Tasks"}</span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </span>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          {userActiveTasks.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground space-y-1">
              <CheckCircle className="w-7 h-7 mx-auto text-[#34a853] opacity-80" />
              <p className="text-xs font-bold text-foreground">
                {isAr ? "أنت منجز لكافة مهامك!" : "You are completely up to date!"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isAr
                  ? "لا توجد تكليفات عاجلة متأخرة أو بانتظار تسليمك اليوم."
                  : "No pending or overdue deliverables waiting on you today."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {userActiveTasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-[#1a73e8]/40 transition-colors flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {t.priority}
                      </span>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                    <h4 className="font-bold text-xs text-foreground line-clamp-1">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(t.deadline).toLocaleDateString()}</span>
                    </span>
                    <Link href={`/${locale}/tasks`}>
                      <span className="font-bold text-[#1a73e8] hover:underline text-xs">
                        {isAr ? "تسليم المهمة ←" : "Deliver →"}
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Split Grid: Recent Points Feed & Sleek Escalation Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Recent Points Activity Feed (Clean, 3 items max) */}
        <Card className="border border-border/80 bg-card rounded-2xl shadow-2xs overflow-hidden">
          <CardHeader className="py-3.5 px-5 border-b border-border/60 bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#1a73e8]" />
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                  {isAr ? "أحدث حركات النقاط" : "Recent Point Activity"}
                </CardTitle>
              </div>
              <Link href={`/${locale}/points`}>
                <span className="text-xs font-semibold text-[#1a73e8] hover:underline flex items-center gap-1">
                  <span>{isAr ? "سجل النقاط الكامل" : "Full Ledger"}</span>
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {recentPointEvents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground space-y-1">
                <Award className="w-6 h-6 mx-auto opacity-40 text-primary" />
                <p className="text-xs font-semibold">
                  {isAr ? "لا توجد وقائع نقاط مسجلة حالياً" : "No point transactions recorded yet"}
                </p>
              </div>
            ) : (
              recentPointEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md shrink-0 ${
                        evt.direction === "positive"
                          ? "bg-[#e6f4ea] text-[#137333] dark:bg-[#34a853]/20 dark:text-[#81c995]"
                          : "bg-[#fce8e6] text-[#c5221f] dark:bg-[#ea4335]/20 dark:text-[#f28b82]"
                      }`}
                    >
                      {evt.direction === "positive" ? `+${evt.value}` : evt.value} pts
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate max-w-[200px] sm:max-w-xs">
                        {evt.explanation}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {evt.event_date} •{" "}
                        {isMatchUser(evt.member_id) ? (
                          <span className="text-primary font-semibold">
                            {isAr ? "حسابك الشخصي" : "Your Account"}
                          </span>
                        ) : (
                          <span>
                            {isAr ? "العضو: " : "Member: "}
                            {getMemberName(evt.member_id)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {isMatchUser(evt.member_id) && evt.direction === "negative" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDisputeModalOpen(true)}
                      className="h-7 px-2 text-[11px] text-[#c5221f] dark:text-[#f28b82] hover:bg-[#ea4335]/10 shrink-0 font-bold"
                    >
                      <Scale className="w-3 h-3 mr-1" />
                      <span>{isAr ? "تقديم طعن" : "Dispute"}</span>
                    </Button>
                  ) : (
                    <Link href={`/${locale}/points`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <span>{isAr ? "عرض" : "View"}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Sleek Progressive Escalation Ladder (Compact Stepper) */}
        <Card className="border border-border/80 bg-card rounded-2xl shadow-2xs overflow-hidden">
          <CardHeader className="py-3.5 px-5 border-b border-border/60 bg-muted/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#ea4335]" />
                <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                  {isAr ? "سلم المتابعة والتصعيد" : "Escalation & Support Ladder"}
                </CardTitle>
              </div>
              <Link href={`/${locale}/incidents`}>
                <span className="text-xs font-semibold text-[#1a73e8] hover:underline flex items-center gap-1">
                  <span>{isAr ? "التفاصيل والحالات" : "Details"}</span>
                  <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isAr
                ? "تدرج تنظيمي لحماية العضو وضمان الشفافية: لا عقوبة دون إشعار مسبق وجلسة توجيه."
                : "Transparent 4-tier progressive path ensuring alignment before any disciplinary escalation."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
              {/* Level 1 */}
              <div className="p-2.5 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/15 border border-[#d2e3fc] dark:border-[#1a73e8]/30 space-y-1">
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#1a73e8] text-white">
                  L1
                </span>
                <p className="font-bold text-[11px] text-foreground">
                  {isAr ? "تنبيه ودي" : "Notice"}
                </p>
                <span className="text-[10px] text-muted-foreground block">
                  {isAr ? "توجيه ثنائي" : "1-on-1"}
                </span>
              </div>

              {/* Level 2 */}
              <div className="p-2.5 rounded-xl bg-[#fef7e0] dark:bg-[#fbbc04]/15 border border-[#feefc3] dark:border-[#fbbc04]/30 space-y-1">
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#b06000] text-white">
                  L2
                </span>
                <p className="font-bold text-[11px] text-foreground">
                  {isAr ? "خطة PIP" : "Plan"}
                </p>
                <span className="text-[10px] text-muted-foreground block">
                  {isAr ? "تحسين محدد" : "Timeline"}
                </span>
              </div>

              {/* Level 3 */}
              <div className="p-2.5 rounded-xl bg-[#feefe3] dark:bg-[#e37400]/15 border border-[#fed7b2] dark:border-[#e37400]/30 space-y-1">
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#e37400] text-white">
                  L3
                </span>
                <p className="font-bold text-[11px] text-foreground">
                  {isAr ? "مراجعة الفريق" : "Review"}
                </p>
                <span className="text-[10px] text-muted-foreground block">
                  {isAr ? "جلسة استماع" : "Hearing"}
                </span>
              </div>

              {/* Level 4 */}
              <div className="p-2.5 rounded-xl bg-[#fce8e6] dark:bg-[#ea4335]/15 border border-[#fad2cf] dark:border-[#ea4335]/30 space-y-1">
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#ea4335] text-white">
                  L4
                </span>
                <p className="font-bold text-[11px] text-foreground">
                  {isAr ? "تصعيد القيادة" : "Lead"}
                </p>
                <span className="text-[10px] text-muted-foreground block">
                  {isAr ? "قرار نهائي" : "Decision"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dispute Modal (Preserved & Fully Functional) */}
      {isDisputeModalOpen && (
        <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#1a73e8]" />
                <span>
                  {isAr ? "تقديم طعن / تظلم رسمي" : "Submit Point Dispute (7 Working Days)"}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-xs">
              <p className="text-muted-foreground">
                {isAr
                  ? "يُحال التظلم إلى مراجع محايد مستقل وفق مهلة الـ 7 أيام عمل المصرية (باستثناء الجمعة والسبت والعطلات الرسمية)."
                  : "All appeals are assigned to an independent neutral reviewer under the 7 Egyptian working days policy guarantee."}
              </p>
              <div>
                <label className="font-bold text-foreground">
                  {isAr ? "سبب ومبرر الطعن:" : "Factual Objection Grounds:"}
                </label>
                <Textarea
                  required
                  rows={3}
                  placeholder={
                    isAr
                      ? "اشرح سبب عدم صحة تسجيل الخصم أو واقعة النقطة..."
                      : "Describe why this entry contradicts evidence or policy..."
                  }
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDisputeModalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1a73e8] hover:bg-[#1765cc] text-white"
                  onClick={async () => {
                    if (!disputeReason.trim() || !currentUser) return;
                    await submitAppeal({
                      member_id: currentUser.id,
                      entity_type: "point_event",
                      entity_id: "point_event",
                      grounds: disputeReason,
                      deadline_date: new Date(Date.now() + 7 * 86400000)
                        .toISOString()
                        .split("T")[0],
                      status: "under_review",
                    });
                    setIsDisputeModalOpen(false);
                    setDisputeReason("");
                  }}
                >
                  {isAr ? "إرسال للمراجعة المحايدة" : "Submit to Neutral Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Record Point Event Modal (Preserved & Fully Functional) */}
      {isAddPointModalOpen && (
        <Dialog open={isAddPointModalOpen} onOpenChange={setIsAddPointModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-[#1a73e8]" />
                <span>{isAr ? "تسجيل حركة نقاط باللائحة" : "Record Point Event"}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-bold text-foreground">
                  {isAr ? "العضو المستهدف باللائحة:" : "Target Member:"}
                </label>
                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full mt-1 h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground">
                  {isAr ? "فئة النقطة المعتمدة باللائحة:" : "Policy Category:"}
                </label>
                <select
                  value={newSelectedCategory}
                  onChange={(e) => setNewSelectedCategory(e.target.value)}
                  className="w-full mt-1 h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  {POLICY_POINT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.direction === "positive" ? "+" : ""}{c.default_value} pts]{" "}
                      {isAr ? c.name_ar : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground">
                  {isAr ? "بيان الواقعة والدليل المرفق:" : "Explanation & Factual Ground:"}
                </label>
                <Textarea
                  required
                  rows={3}
                  placeholder={
                    isAr
                      ? "تسليم مبكر / مبادرة إيجابية / مساعدة فريق آخر..."
                      : "Detailed explanation matching policy specifications..."
                  }
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddPointModalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1a73e8] hover:bg-[#1765cc] text-white"
                  onClick={() => {
                    const cat = POLICY_POINT_CATEGORIES.find(
                      (c) => c.id === newSelectedCategory
                    );
                    const targetU = availableUsers.find((u) => u.id === targetMemberId);
                    if (cat && newExplanation.trim() && currentUser && targetU) {
                      addPointEvent({
                        member_id: targetU.id,
                        team_id:
                          targetU.team_id || currentUser.team_id || teams[0]?.id || "",
                        event_date: new Date().toISOString().split("T")[0],
                        category_id: cat.id,
                        direction: cat.direction,
                        value:
                          cat.direction === "positive"
                            ? cat.default_value
                            : -Math.abs(cat.default_value),
                        explanation: newExplanation,
                        recorded_by: currentUser.id,
                        status: canRecordPoints ? "approved" : "pending_review",
                      });
                    }
                    setIsAddPointModalOpen(false);
                    setNewExplanation("");
                  }}
                >
                  {isAr ? "إرسال للمراجعة والاعتماد" : "Submit for Verification"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
