"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Form, FormResponse, FormAnalytics } from "@/types/forms";
import { useApp } from "@/lib/app-context";
import { dbService } from "@/lib/db-service";
import { internalDB } from "@/lib/internal-db";
import { computeFormAnalytics } from "@/lib/forms-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  Download,
  BarChart3,
  Table as TableIcon,
  User,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Award,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#1a73e8", "#34a853", "#fbbc04", "#ea4335", "#9334e8", "#00bcd4", "#ff9800"];

export default function FormResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useApp();
  const isAr = locale === "ar";
  const formId = (params?.id as string) || "";

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<"summary" | "table" | "individual">("summary");
  const [search, setSearch] = useState("");
  const [individualIndex, setIndividualIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!formId) return;
      try {
        // Fast local check first (0ms instantaneous display)
        const local = internalDB.getFormById(formId);
        if (local) {
          setForm(local);
          const localResps = internalDB.getFormResponses(local.id);
          setResponses(localResps);
          setAnalytics(computeFormAnalytics(local, localResps));
          setLoading(false);
        }

        const found = await dbService.getFormById(formId);
        if (found) {
          setForm(found);
          const resps = await dbService.getFormResponses(found.id);
          setResponses(resps);
          const stats = computeFormAnalytics(found, resps);
          setAnalytics(stats);
        }
      } catch (e) {
        console.error("Error loading responses:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [formId]);

  const handleDeleteResponse = async (respId: string) => {
    if (!confirm(isAr ? "هل أنت متأكد من حذف هذا الرد؟" : "Delete this response?")) return;
    try {
      await dbService.deleteFormResponse(respId);
      const remaining = responses.filter((r) => r.id !== respId);
      setResponses(remaining);
      if (form) {
        setAnalytics(computeFormAnalytics(form, remaining));
      }
      if (individualIndex >= remaining.length) {
        setIndividualIndex(Math.max(0, remaining.length - 1));
      }
    } catch (e) {
      console.error("Delete response error:", e);
    }
  };

  const handleExportCSV = () => {
    if (!form) return;
    window.open(`/api/forms/${form.id}/export`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">
          {isAr ? "جاري تحميل الردود والتحليلات..." : "Loading Responses & Analytics..."}
        </span>
      </div>
    );
  }

  if (!form) return null;

  const filteredResponses = responses.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      r.respondent_name?.toLowerCase().includes(q) ||
      r.respondent_email?.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  const currentIndividual = responses[individualIndex] || null;

  return (
    <div className="space-y-6">
      {/* Top Google-Accent Strip */}
      <div className="google-accent-strip w-full rounded-full" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/forms/${form.id}/builder`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-foreground">
                {isAr ? form.title_ar || form.title : form.title}
              </h1>
              <Badge variant="outline" className="text-xs font-bold text-primary bg-primary/10">
                {responses.length} {isAr ? "ردود مسجلة" : "Responses"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "لوحة تحليل الردود والإحصاءات المباشرة والتصدير"
                : "Real-time response analytics, charts, and data export"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs gap-1.5 h-9 rounded-xl"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? "تصدير إلى Excel / CSV" : "Export to CSV / Excel"}</span>
          </Button>

          <Link href={`/${locale}/forms/${form.id}/builder`}>
            <Button size="sm" className="text-xs gap-1.5 h-9 rounded-xl">
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? "محرر الأسئلة" : "Form Builder"}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground block">
              {isAr ? "إجمالي الردود" : "Total Submissions"}
            </span>
            <div className="text-2xl font-black text-foreground">
              {analytics.total_submissions}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {isAr ? "استجابات مكتملة" : "Completed submissions"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 block">
              {isAr ? "معدل الإكمال" : "Completion Rate"}
            </span>
            <div className="text-2xl font-black text-emerald-600">
              {analytics.completion_rate}%
            </div>
            <span className="text-[10px] text-muted-foreground">
              {analytics.total_views} {isAr ? "مشاهدات" : "views"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-[#1a73e8] block">
              {isAr ? "متوسط وقت الحل" : "Avg. Completion Time"}
            </span>
            <div className="text-2xl font-black text-[#1a73e8]">
              {Math.round(analytics.average_completion_time_seconds / 60)} {isAr ? "دقيقة" : "min"}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {analytics.average_completion_time_seconds}s avg
            </span>
          </div>

          {form.quiz_settings?.is_quiz && (
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-purple-600 block">
                {isAr ? "متوسط درجات الاختبار" : "Average Quiz Score"}
              </span>
              <div className="text-2xl font-black text-purple-600">
                {analytics.average_quiz_score ?? 0}%
              </div>
              <span className="text-[10px] text-muted-foreground">
                {isAr ? "نسبة النجاح المطلوبة:" : "Passing threshold:"} {form.quiz_settings.passing_score_percentage || 70}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tabs Selector: Summary / Table / Individual */}
      <div className="flex items-center gap-1 bg-muted/40 p-1.5 rounded-2xl border border-border w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === "summary"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
          <span>{isAr ? "الملخص الإحصائي والرسوم" : "Summary Analytics"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("table")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === "table"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TableIcon className="w-3.5 h-3.5 text-[#34a853]" />
          <span>{isAr ? "جدول الردود التفصيلي" : "Data Grid"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("individual")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
            activeTab === "individual"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="w-3.5 h-3.5 text-[#fbbc04]" />
          <span>{isAr ? "استعراض الردود الفردية" : "Individual Responses"}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SUMMARY & VISUAL CHARTS                           */}
      {/* ======================================================== */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {responses.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-2xl">
              <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-bold text-foreground">
                {isAr ? "لا توجد ردود مسجلة بعد" : "No responses collected yet"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isAr ? "شارك رابط النموذج لجمع أولى الردود." : "Share your form link to collect the first submission."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Quiz Distribution if applicable */}
              {form.quiz_settings?.is_quiz && analytics?.quiz_score_distribution && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3 col-span-full">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>{isAr ? "توزيع درجات الاختبار للمشاركين" : "Quiz Score Distribution"}</span>
                  </h3>
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.quiz_score_distribution}>
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#9334e8" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Per-Question Charts */}
              {(form.questions || []).map((q) => {
                const stat = analytics?.question_stats[q.id];
                const hasOptions =
                  stat?.option_counts && Object.keys(stat.option_counts).length > 0;

                const chartData = hasOptions
                  ? Object.entries(stat.option_counts!).map(([k, v]) => ({
                      name: k,
                      count: v,
                    }))
                  : [];

                return (
                  <div
                    key={q.id}
                    className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-foreground">
                        {isAr ? q.title_ar || q.title : q.title}
                      </h4>
                      <Badge variant="outline" className="text-[10px]">
                        {stat?.total_answers || 0} {isAr ? "إجابات" : "answers"}
                      </Badge>
                    </div>

                    {/* Multiple Choice Chart */}
                    {hasOptions && (
                      <div className="h-48 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical">
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                            <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill="#1a73e8" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Numeric / Rating Average */}
                    {stat?.average_value !== undefined && (
                      <div className="p-4 rounded-xl bg-muted/30 text-center space-y-1">
                        <span className="text-xs text-muted-foreground font-semibold">
                          {isAr ? "متوسط التقييم:" : "Average Rating:"}
                        </span>
                        <div className="text-3xl font-black text-primary">
                          {stat.average_value} / {q.settings?.scale_max || q.settings?.max_rating || 5}
                        </div>
                      </div>
                    )}

                    {/* Free Text Samples */}
                    {stat?.text_samples && stat.text_samples.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground block">
                          {isAr ? "عينة من الإجابات النصية:" : "Latest responses:"}
                        </span>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {stat.text_samples.map((txt, i) => (
                            <div key={i} className="text-xs p-2 rounded-lg bg-muted/40 border border-border/50 text-foreground">
                              &ldquo;{txt}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: DATA GRID TABLE                                   */}
      {/* ======================================================== */}
      {activeTab === "table" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "بحث في المشاركين..." : "Search respondents..."}
                className="h-8 text-xs ps-8 rtl:ps-3 rtl:pe-8 bg-background"
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {filteredResponses.length} {isAr ? "سجل" : "records"}
            </span>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">{isAr ? "المشارك" : "Respondent"}</th>
                    <th className="py-3 px-4">{isAr ? "التاريخ" : "Submitted"}</th>
                    {form.quiz_settings?.is_quiz && (
                      <th className="py-3 px-4">{isAr ? "الدرجة" : "Score"}</th>
                    )}
                    {(form.questions || []).slice(0, 3).map((q) => (
                      <th key={q.id} className="py-3 px-4 truncate max-w-xs">
                        {isAr ? q.title_ar || q.title : q.title}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center">{isAr ? "حذف" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResponses.map((r, rIdx) => {
                    const answersMap: Record<string, any> = {};
                    r.answers?.forEach((a) => {
                      answersMap[a.question_id] = a.answer_value;
                    });

                    return (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-muted-foreground">{rIdx + 1}</td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          <div>
                            <span>{r.respondent_name || "Anonymous"}</span>
                            {r.respondent_email && (
                              <span className="text-[10px] text-muted-foreground block font-mono">
                                {r.respondent_email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(r.submitted_at).toLocaleString()}
                        </td>
                        {form.quiz_settings?.is_quiz && (
                          <td className="py-3 px-4 font-bold text-emerald-600">
                            {r.score ?? 0} ({r.percentage ?? 0}%)
                          </td>
                        )}
                        {(form.questions || []).slice(0, 3).map((q) => {
                          const val = answersMap[q.id];
                          const displayStr = Array.isArray(val)
                            ? val.join(", ")
                            : typeof val === "object"
                            ? JSON.stringify(val)
                            : String(val || "-");
                          return (
                            <td key={q.id} className="py-3 px-4 truncate max-w-xs text-muted-foreground">
                              {displayStr}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteResponse(r.id)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: INDIVIDUAL RESPONSES BROWSER                      */}
      {/* ======================================================== */}
      {activeTab === "individual" && (
        <div className="space-y-4 max-w-3xl mx-auto">
          {responses.length === 0 ? (
            <div className="p-8 text-center bg-card border border-border rounded-2xl">
              <p className="text-xs text-muted-foreground">No responses to review.</p>
            </div>
          ) : currentIndividual ? (
            <div className="space-y-4">
              {/* Pager Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border shadow-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={individualIndex === 0}
                  onClick={() => setIndividualIndex(individualIndex - 1)}
                  className="text-xs gap-1"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{isAr ? "السابق" : "Previous"}</span>
                </Button>

                <span className="text-xs font-bold text-foreground font-mono">
                  {individualIndex + 1} / {responses.length}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={individualIndex >= responses.length - 1}
                    onClick={() => setIndividualIndex(individualIndex + 1)}
                    className="text-xs gap-1"
                  >
                    <span>{isAr ? "التالي" : "Next"}</span>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDeleteResponse(currentIndividual.id)}
                    title="Delete this response"
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Individual Details Card */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {currentIndividual.respondent_name || "Anonymous Respondent"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {currentIndividual.respondent_email || "No email recorded"} • {new Date(currentIndividual.submitted_at).toLocaleString()}
                    </p>
                  </div>

                  {form.quiz_settings?.is_quiz && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                      {currentIndividual.score} pts ({currentIndividual.percentage}%)
                    </Badge>
                  )}
                </div>

                {/* Question Answers List */}
                <div className="space-y-4">
                  {(form.questions || []).map((q, idx) => {
                    const ans = currentIndividual.answers?.find((a) => a.question_id === q.id);
                    const val = ans?.answer_value;

                    return (
                      <div key={q.id} className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-1.5">
                        <span className="text-xs font-bold text-foreground block">
                          {idx + 1}. {isAr ? q.title_ar || q.title : q.title}
                        </span>
                        <div className="text-xs font-medium text-primary">
                          {val === undefined || val === null
                            ? "-"
                            : Array.isArray(val)
                            ? val.join(", ")
                            : typeof val === "object"
                            ? JSON.stringify(val)
                            : String(val)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
