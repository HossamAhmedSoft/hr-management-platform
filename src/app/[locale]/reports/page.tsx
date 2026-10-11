"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Download,
  Filter,
  CheckCircle,
  TrendingUp,
  Award,
  Users,
  Activity,
  AlertTriangle,
  Scale,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";

export default function ReportsPage() {
  const { teams, evaluations, pointEvents, tasks, availableUsers, locale, appeals, incidents } = useApp();
  const isAr = locale === "ar";

  const [activeTab, setActiveTab] = useState<"benchmarks" | "workload" | "health" | "handover">("benchmarks");

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const taskDeliveryRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const avgEvalScore = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + (e.total_score || 0), 0) / evaluations.length).toFixed(1)
    : "—";

  // Data Quality & Operational Health Metrics (Section 21)
  const tasksWithoutCriteria = tasks.filter((t) => !t.acceptance_criteria || t.acceptance_criteria.trim().length === 0);
  const pointEventsMissingEvidence = pointEvents.filter((p) => !p.evidence_url || p.evidence_url.trim().length === 0);
  const membersWithoutTeam = availableUsers.filter((u) => !u.team_id);
  const openAppealsCount = appeals.filter((a) => a.status === "submitted" || a.status === "under_review").length;
  const activePipsCount = incidents.filter((i) => i.status === "open").length;

  const totalDataHealthIssues =
    tasksWithoutCriteria.length +
    pointEventsMissingEvidence.length +
    membersWithoutTeam.length;

  // Workload Analysis (Section 14)
  const memberWorkload = availableUsers.map((m) => {
    const assignedTasks = tasks.filter(
      (t) =>
        t.assignees?.some((a) => a.profile_id === m.id) &&
        (t.status === "assigned" || t.status === "in_progress")
    );
    const completed = tasks.filter(
      (t) => t.assignees?.some((a) => a.profile_id === m.id) && t.status === "completed"
    ).length;
    const isOverloaded = assignedTasks.length >= 4;
    return {
      member: m,
      activeTasksCount: assignedTasks.length,
      completedTasksCount: completed,
      isOverloaded,
    };
  });

  const overloadedMembers = memberWorkload.filter((w) => w.isOverloaded);

  const handleExportOrgReport = () => {
    const csvContent =
      "Report,GDG NCTU Executive Performance Report\n" +
      "Date," +
      new Date().toISOString() +
      "\n\n" +
      "Team,Members,TaskCompletionRate,AvgEvaluationScore\n" +
      teams
        .map((t) => {
          const mCount = availableUsers.filter((u) => u.team_id === t.id).length;
          const tTasks = tasks.filter((tk) => tk.team_id === t.id);
          const tCompleted = tTasks.filter((tk) => tk.status === "completed").length;
          const rate = tTasks.length > 0 ? `${Math.round((tCompleted / tTasks.length) * 100)}%` : "0%";
          return `"${t.name}",${mCount},${rate},${avgEvalScore}`;
        })
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gdg_nctu_org_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "التقارير الإدارية، كفاءة التشغيل وتوزيع الأعباء" : "Executive Reports & Operations Health"}
        description={
          isAr
            ? "تقارير شاملة لأداء اللجان، توزيع أعباء العمل على الأعضاء، مؤشرات جودة وسلامة البيانات، واستعدادات التسليم السنوي."
            : "Aggregated performance intelligence across teams, member workload distribution, data quality audit, and season handover."
        }
      >
        <Button
          size="sm"
          onClick={handleExportOrgReport}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Download className="w-4 h-4" />
          {isAr ? "تصدير التقرير التنفيذي (CSV)" : "Export Executive Report"}
        </Button>
      </PageHeader>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("benchmarks")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "benchmarks"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-muted/30"
          }`}
        >
          {isAr ? "مؤشرات أداء الفرق" : "Team Benchmarks"}
        </button>
        <button
          onClick={() => setActiveTab("workload")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "workload"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-muted/30"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          {isAr ? "إدارة وتوزيع أعباء العمل" : "Workload & Capacity"}
          {overloadedMembers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "health"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-muted/30"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          {isAr ? "صحة ونزاهة البيانات" : "Operational Data Quality"}
          {totalDataHealthIssues > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-600 font-bold">
              {totalDataHealthIssues}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("handover")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "handover"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:bg-muted/30"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {isAr ? "التسليم السنوي للموسم" : "Season Handover"}
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "متوسط تقييم الأداء" : "Org Performance"}
          </span>
          <p className="text-2xl font-black text-primary mt-1">
            {avgEvalScore !== "—" ? `${avgEvalScore} / 100` : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {evaluations.length > 0
              ? (isAr ? `${evaluations.length} تقييمات مسجلة` : `${evaluations.length} evaluations`)
              : (isAr ? "في انتظار دورة التقييم" : "Awaiting cycle")}
          </p>
        </Card>

        <Card className="p-4 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "نسبة تسليم المهام" : "Task Delivery Rate"}
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {tasks.length > 0 ? `${taskDeliveryRate}%` : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {tasks.length > 0
              ? (isAr ? `${completedTasks} من ${tasks.length} منجزة` : `${completedTasks} of ${tasks.length} done`)
              : (isAr ? "لا توجد مهام" : "No tasks")}
          </p>
        </Card>

        <Card className="p-4 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "الأعضاء النشطون" : "Active Roster"}
          </span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {availableUsers.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isAr ? `${teams.length} لجان ومسارات` : `${teams.length} committees`}
          </p>
        </Card>

        <Card className="p-4 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "سلامة البيانات التشغيلية" : "Data Health Score"}
          </span>
          <p className={`text-2xl font-black mt-1 ${totalDataHealthIssues === 0 ? "text-emerald-600" : "text-amber-600"}`}>
            {totalDataHealthIssues === 0 ? "100%" : `${Math.max(60, 100 - totalDataHealthIssues * 10)}%`}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {totalDataHealthIssues === 0
              ? (isAr ? "بيانات مكتملة بدون فجوات" : "0 anomalies detected")
              : (isAr ? `${totalDataHealthIssues} فجوات تحتاج استكمال` : `${totalDataHealthIssues} items need review`)}
          </p>
        </Card>
      </div>

      {/* Tab Content: Benchmarks */}
      {activeTab === "benchmarks" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">
              {isAr ? "مؤشرات أداء الفرق واللجان" : "Committee Performance Benchmarks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 px-3 text-left">{isAr ? "الفريق" : "Team"}</th>
                    <th className="py-2.5 px-3 text-left">{isAr ? "النوع" : "Type"}</th>
                    <th className="py-2.5 px-3 text-left">{isAr ? "الأعضاء" : "Members"}</th>
                    <th className="py-2.5 px-3 text-left">{isAr ? "نسبة التسليم" : "Delivery Rate"}</th>
                    <th className="py-2.5 px-3 text-left">{isAr ? "متوسط التقييم" : "Avg Score"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {isAr ? "لا توجد فرق مضافة حالياً" : "No teams available"}
                      </td>
                    </tr>
                  ) : (
                    teams.map((t) => {
                      const mCount = availableUsers.filter((u) => u.team_id === t.id).length;
                      const tTasks = tasks.filter((tk) => tk.team_id === t.id);
                      const tDone = tTasks.filter((tk) => tk.status === "completed").length;
                      const rate = tTasks.length > 0 ? `${Math.round((tDone / tTasks.length) * 100)}%` : "—";
                      return (
                        <tr key={t.id} className="hover:bg-muted/20">
                          <td className="py-3 px-3 font-bold text-foreground">
                            {isAr ? t.name_ar : t.name}
                          </td>
                          <td className="py-3 px-3 capitalize text-muted-foreground">
                            {t.type.replace("_", " ")}
                          </td>
                          <td className="py-3 px-3">{mCount}</td>
                          <td className="py-3 px-3 font-semibold text-emerald-600">
                            {rate}
                          </td>
                          <td className="py-3 px-3 font-bold text-primary">
                            {avgEvalScore}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Workload & Capacity Management (Section 14) */}
      {activeTab === "workload" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>{isAr ? "تحليل وتوزيع أعباء العمل على الأعضاء" : "Member Workload & Capacity Management"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {isAr ? "مؤشرات الشفافية ومنع الإجهاد" : "Capacity & Anti-Burnout Monitor"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "يساعد هذا القسم قادة الفرق على مراقبة توزيع المهام ومنع إثقال كاهل الأعضاء بمهام زائدة بالتزامن مع فترات الامتحانات الأكاديمية."
                : "Provides team leads with visibility into task allocation to prevent overload, burnout, and imbalances during academic periods."}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 px-3 text-left">{isAr ? "العضو" : "Member"}</th>
                    <th className="py-2.5 px-3 text-left">{isAr ? "اللجنة" : "Committee"}</th>
                    <th className="py-2.5 px-3 text-left">{isAr ? "المهام النشطة" : "Active Tasks"}</th>
                    <th className="py-2.5 px-3 text-left">{isAr ? "المهام المكتملة" : "Completed Tasks"}</th>
                    <th className="py-2.5 px-3 text-left">{isAr ? "حالة العبء" : "Capacity Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {memberWorkload.map((w) => {
                    const memberTeam = teams.find((t) => t.id === w.member.team_id);
                    return (
                      <tr key={w.member.id} className="hover:bg-muted/20">
                        <td className="py-3 px-3 font-bold">
                          {w.member.full_name}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground uppercase text-[10px]">
                          {memberTeam ? (isAr ? memberTeam.name_ar : memberTeam.name) : "—"}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {w.activeTasksCount}
                        </td>
                      <td className="py-3 px-3 text-emerald-600 font-semibold">
                        {w.completedTasksCount}
                      </td>
                      <td className="py-3 px-3">
                        {w.isOverloaded ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold text-[10px]">
                            {isAr ? "عبء مرتفع (ينصح بإعادة التوزيع)" : "Overloaded (Redistribute)"}
                          </span>
                        ) : w.activeTasksCount >= 2 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[10px]">
                            {isAr ? "عبء متوازن ومثالي" : "Optimal Load"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground text-[10px]">
                            {isAr ? "متاح لمهام إضافية" : "Available Capacity"}
                          </span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Operational Health & Data Quality (Section 21) */}
      {activeTab === "health" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>{isAr ? "لوحة فحص جودة ونزاهة البيانات التشغيلية" : "HR Operations Health & Data Quality Monitor"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                Section 21 Monitor
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "يراقب هذا النظام اكتمال البيانات لمنع القرارات الإدارية المبنية على معلومات منقوصة دون تعديل صامت لأي سجل."
                : "Audits platform data integrity across tasks, points, and evaluations to ensure high operational quality without silent modifications."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {isAr ? "مهام بدون معايير قبول واضحة" : "Tasks Lacking Acceptance Criteria"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tasksWithoutCriteria.length === 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                    {tasksWithoutCriteria.length}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isAr
                    ? "يجب على قائد الفريق تحديد معايير القبول بدقة قبل تكليف العضو بالمهمة."
                    : "Must define explicit deliverable requirements before enforcing deadlines."}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {isAr ? "نقاط مسجلة بدون روابط إثبات" : "Points Missing Evidence URLs"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pointEventsMissingEvidence.length === 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                    {pointEventsMissingEvidence.length}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isAr
                    ? "لا يُعتمد أي خصم أو إضافة رسمية دون رابط إثبات ملموس (GitHub/Drive/Chat)."
                    : "Objective proof links are mandatory for all approved point ledger events."}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {isAr ? "التظلمات المفتوحة قيد المراجعة" : "Open Grievance Appeals Pending"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {openAppealsCount}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isAr
                    ? "تلتزم الموارد البشرية بالبت في التظلمات المحايدة خلال مهلة الـ 7 أيام عمل."
                    : "Neutral reviewers must adjudicate within the 7 Egyptian working days window."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: Season Handover (Section 22) */}
      {activeTab === "handover" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>{isAr ? "إجراءات التسليم والترحيل السنوي للموسم" : "Season Handover & Annual Transition"}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                Season 2026/2027
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <p className="text-muted-foreground">
              {isAr
                ? "بروتوكول نهاية الموسم الأكاديمي لترقية الأعضاء الخريجين إلى صفة الخريجين (Alumni)، تجميد سجلات الموسم الحالي للقراءة فقط، وترحيل الصلاحيات للإدارة القادمة."
                : "End-of-season operational routine for transitioning departing leaders, freezing historical evaluation ledgers into read-only archive status, and onboarding the incoming board."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>{isAr ? "1. تجميد وأرشفة بيانات الموسم" : "1. Season Ledger Archival"}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  {isAr
                    ? "يتم قفل كافة التقييمات الشهرية بنهاية يونيو، وتعيين حالة السجلات كأرشيف تاريخي غير قابل للتعديل."
                    : "Freezes all evaluations and point records as read-only historical archives on July 1."}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? "2. تحويل الخريجين لصفة Alumni" : "2. Alumni Status Transition"}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  {isAr
                    ? "يتم تدوير حسابات القادة المنتهية ولايتهم، وتحويل صفة العضوية إلى Alumni مع حفظ شهاداتهم وسجلاتهم كاملة."
                    : "Preserves historical records and certificates while rotating administrative credentials."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
