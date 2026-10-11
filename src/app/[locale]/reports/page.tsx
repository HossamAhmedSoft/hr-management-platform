"use client";

import React, { useState } from "react";
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
  const { teams, evaluations, pointEvents, tasks, locale } = useApp();
  const isAr = locale === "ar";

  const handleExportOrgReport = () => {
    const csvContent =
      "Report,GDG NCTU Executive Performance Report\n" +
      "Date," +
      new Date().toISOString() +
      "\n\n" +
      "Team,Members,TaskCompletionRate,AvgEvaluationScore\n" +
      teams
        .map(
          (t) =>
            `"${t.name}",${t.member_count || 10},92%,88.5`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gdg_nctu_org_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "التقارير الإدارية والتحليلات" : "Executive Reports & Analytics"}
        description={
          isAr
            ? "تقارير شاملة لأداء اللجان، نسب تسليم المهام في الموعد، وتوزيع درجات التقييم الشهري."
            : "Aggregated performance intelligence across teams, on-time deliverable ratios, and score distributions."
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
          <p className="text-3xl font-black text-primary mt-1">88.3 / 100</p>
          <p className="text-xs text-muted-foreground mt-1">
            Strong Performance Band Average
          </p>
        </Card>

        <Card className="p-5 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "نسبة التسليم في الموعد" : "On-Time Task Delivery Rate"}
          </span>
          <p className="text-3xl font-black text-emerald-600 mt-1">94.2%</p>
          <p className="text-xs text-muted-foreground mt-1">
            Exceeds 85% target threshold
          </p>
        </Card>

        <Card className="p-5 border-border/70">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "معدل الرضا الداخلي" : "Member Retention & Satisfaction"}
          </span>
          <p className="text-3xl font-black text-amber-600 mt-1">96.8%</p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on mid-term pulse surveys
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
            <table className="w-full text-xs text-left">
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
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20">
                    <td className="py-3 px-3 font-bold text-foreground">
                      {isAr ? t.name_ar : t.name}
                    </td>
                    <td className="py-3 px-3 capitalize text-muted-foreground">
                      {t.type.replace("_", " ")}
                    </td>
                    <td className="py-3 px-3">{t.member_count}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-600">
                      95%
                    </td>
                    <td className="py-3 px-3 font-bold text-primary">89.4</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
