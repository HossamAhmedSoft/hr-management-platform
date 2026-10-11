"use client";

import React from "react";
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  CheckCircle,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";

export default function ReportsPage() {
  const { teams, evaluations, pointEvents, tasks, availableUsers, locale } = useApp();
  const isAr = locale === "ar";

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const taskDeliveryRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const avgEvalScore = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + (e.total_score || 0), 0) / evaluations.length).toFixed(1)
    : "—";

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
        title={isAr ? "التقارير الإدارية والتحليلات" : "Executive Reports & Analytics"}
        description={
          isAr
            ? "تقارير شاملة لأداء اللجان، نسب تسليم المهام في الموعد، وتوزيع درجات التقييم الشهري المحسوبة مباشرة من قاعدة البيانات."
            : "Aggregated performance intelligence across teams, on-time deliverable ratios, and score distributions computed from live data."
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "متوسط تقييم الأداء العام" : "Overall Org Performance"}
          </span>
          <p className="text-3xl font-black text-primary mt-1">
            {avgEvalScore !== "—" ? `${avgEvalScore} / 100` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {evaluations.length > 0
              ? (isAr ? `${evaluations.length} تقييمات معتمدة مسجلة` : `${evaluations.length} finalized evaluations`)
              : (isAr ? "في انتظار بدء دورة التقييم" : "Awaiting evaluation cycle")}
          </p>
        </Card>

        <Card className="p-5 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "نسبة تسليم المهام" : "Task Delivery Rate"}
          </span>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            {tasks.length > 0 ? `${taskDeliveryRate}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {tasks.length > 0
              ? (isAr ? `${completedTasks} من إجمالي ${tasks.length} مهام منجزة` : `${completedTasks} of ${tasks.length} tasks completed`)
              : (isAr ? "لا توجد مهام مسجلة حالياً" : "No tasks created yet")}
          </p>
        </Card>

        <Card className="p-5 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "إجمالي الأعضاء المسجلين" : "Active Member Roster"}
          </span>
          <p className="text-3xl font-black text-amber-600 mt-1">
            {availableUsers.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? `${teams.length} لجان ومسارات معتمدة` : `Distributed across ${teams.length} teams`}
          </p>
        </Card>
      </div>

      {/* Team Performance Table */}
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
                  <th className="py-2.5 px-3">{isAr ? "الفريق" : "Team"}</th>
                  <th className="py-2.5 px-3">{isAr ? "النوع" : "Type"}</th>
                  <th className="py-2.5 px-3">{isAr ? "الأعضاء" : "Members"}</th>
                  <th className="py-2.5 px-3">{isAr ? "نسبة التسليم" : "Delivery Rate"}</th>
                  <th className="py-2.5 px-3">{isAr ? "متوسط التقييم" : "Avg Score"}</th>
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
    </div>
  );
}
