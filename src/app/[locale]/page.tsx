"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Download,
  Filter,
  Plus,
  Scale,
  Sparkles,
  Layers,
  Code,
  Smartphone,
  Palette,
  Cpu,
  Shield,
  Star,
  ExternalLink,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/app-context";
import {
  MOCK_POINT_CATEGORIES,
  MOCK_POINT_CAP_CATEGORIES,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const {
    currentUser,
    locale,
    teams,
    tasks,
    pointEvents,
    addPointEvent,
    evaluations,
    appeals,
    incidents,
  } = useApp();

  const isAr = locale === "ar";

  // Filter states for Points Log & Rules Table
  const [pointTrackFilter, setPointTrackFilter] = useState<"all" | "tech" | "non_tech">("all");
  const [pointStatusFilter, setPointStatusFilter] = useState<"all" | "approved" | "pending_review">("all");

  // Dispute / Add Point Modals
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newSelectedCategory, setNewSelectedCategory] = useState(MOCK_POINT_CATEGORIES[0]?.id || "");

  // Metrics
  const approvedPositive = pointEvents
    .filter((p) => p.status === "approved" && p.direction === "positive")
    .reduce((sum, p) => sum + p.value, 0);

  const approvedNegative = pointEvents
    .filter((p) => p.status === "approved" && p.direction === "negative")
    .reduce((sum, p) => sum + p.value, 0);

  const totalPointsNet = approvedPositive + approvedNegative;
  const attendanceRate = 96.2; // Attendance Benchmark
  const activeWarningsCount = incidents.filter((i) => i.status === "open").length + 1;

  // Track Rubric Ratings State (for Track-Based KPIs & Rubrics Matrix)
  const [trackScores, setTrackScores] = useState<{ [trackId: string]: number }>({
    hr: 4.8,
    media: 4.6,
    pr: 4.5,
    or: 4.7,
    web: 4.9,
    flutter: 4.4,
    uiux: 4.8,
    embedded: 4.5,
    cyber: 4.7,
  });

  const allTracksList = [
    { id: "hr", name: "Human Resources", nameAr: "الموارد البشرية", type: "non_tech", icon: Users, desc: "Recruitment, member retention, welfare & performance policy." },
    { id: "media", name: "Media & Content", nameAr: "الإعلام والمحتوى", type: "non_tech", icon: Palette, desc: "Branding, video coverage, visual production & storytelling." },
    { id: "pr", name: "PR & Marketing", nameAr: "العلاقات العامة والتسويق", type: "non_tech", icon: Sparkles, desc: "Outreach, sponsor engagements, and campaign analytics." },
    { id: "or", name: "Operations & Logistics (OR)", nameAr: "العمليات واللوجستيات", type: "non_tech", icon: Layers, desc: "Hall booking, stage coordination, equipment & crowd flow." },
    { id: "web", name: "Web Development", nameAr: "تطوير الويب", type: "tech", icon: Code, desc: "Next.js, TypeScript, cloud deployment & fullstack quality." },
    { id: "flutter", name: "Flutter / Mobile", nameAr: "تطبيقات الموبايل", type: "tech", icon: Smartphone, desc: "Cross-platform engineering, clean architecture & APIs." },
    { id: "uiux", name: "UI/UX Design", nameAr: "تصميم الواجهات", type: "tech", icon: Palette, desc: "Figma design systems, accessibility & user usability tests." },
    { id: "embedded", name: "Embedded Systems / IoT", nameAr: "الأنظمة المدمجة", type: "tech", icon: Cpu, desc: "Microcontrollers, C/C++, sensor telemetry & hardware." },
    { id: "cyber", name: "Cyber Security", nameAr: "الأمن السيبراني", type: "tech", icon: Shield, desc: "Network defenses, secure auditing & vulnerability scanning." },
  ];

  // Filtered Points Log
  const filteredPointEvents = pointEvents.filter((evt) => {
    if (pointStatusFilter !== "all" && evt.status !== pointStatusFilter) return false;
    if (pointTrackFilter === "tech") {
      return evt.team_id?.includes("web") || evt.team_id?.includes("ai") || evt.team_id?.includes("tech");
    }
    if (pointTrackFilter === "non_tech") {
      return evt.team_id?.includes("hr") || evt.team_id?.includes("pr") || evt.team_id?.includes("ops");
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = "ID,Member,Category,Direction,Points,Date,Status,Explanation\n";
    const rows = pointEvents
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
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title={
          isAr
            ? "بوابة إدارة الأداء وقواعد النقاط — GDG NCTU"
            : "GDG NCTU Performance & Points Management Portal"
        }
        description={
          isAr
            ? "نظام الحوكمة الرقمية للفرق واللجان: فصل تام بين سجل النقاط والتقييم الشهري، وإشعار مسبق قبل أي خصم."
            : "Google Workspace Admin Console aesthetic for member governance, verified points ledger, and progressive escalation."
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-2 text-xs border-border"
        >
          <Download className="w-3.5 h-3.5 text-[#137333]" />
          {isAr ? "تصدير السجل (CSV)" : "Export CSV"}
        </Button>
        <Button
          size="sm"
          onClick={() => setIsAddPointModalOpen(true)}
          className="gap-2 text-xs bg-[#1a73e8] hover:bg-[#1765cc] text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAr ? "تسجيل حركة نقاط" : "Record Point Event"}
        </Button>
      </PageHeader>

      {/* 2. Metric Overview Cards (Google Workspace Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Points */}
        <StatsCard
          title={isAr ? "صافي رصيد النقاط المعتمد" : "Total Net Points"}
          value={`${totalPointsNet > 0 ? "+" : ""}${totalPointsNet} pts`}
          subtitle={isAr ? `+${approvedPositive} إيجابية | ${approvedNegative} سلبية` : `+${approvedPositive} positive | ${approvedNegative} negative`}
          icon={<Award className="w-5 h-5" />}
          delta={{ value: "Green Tier Active", isPositive: true }}
          accentColor="blue"
        />

        {/* Metric 2: Attendance Rate */}
        <StatsCard
          title={isAr ? "معدل الحضور والالتزام" : "Attendance Rate"}
          value={`${attendanceRate}%`}
          subtitle={isAr ? "متوسط حضور الجلسات والورش" : "Average across all 8 committees"}
          icon={<CheckCircle className="w-5 h-5" />}
          delta={{ value: "Target: ≥85%", isPositive: true }}
          accentColor="green"
        />

        {/* Metric 3: Active Warnings */}
        <StatsCard
          title={isAr ? "الإنذارات والحالات النشطة" : "Active Warnings & PIPs"}
          value={activeWarningsCount}
          subtitle={isAr ? "حالات تحت المتابعة والتوجيه" : "Under progressive review ladder"}
          icon={<AlertTriangle className="w-5 h-5" />}
          delta={{ value: "0 Legal Breaches", isPositive: true }}
          accentColor="yellow"
        />

        {/* Metric 4: Performance Distribution */}
        <StatsCard
          title={isAr ? "توزيع الأداء الشهري" : "Performance Distribution"}
          value="88.5 / 100"
          subtitle={isAr ? "92% بمستوى قوي إلى متميز" : "92% in Strong to Outstanding tier"}
          icon={<TrendingUp className="w-5 h-5" />}
          delta={{ value: "+4.2% MoM", isPositive: true }}
          accentColor="red"
        />
      </div>

      {/* 3. Escalation Ladder Component (Vertical Stepper from ui ana) */}
      <Card className="border border-border bg-card shadow-2xs">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <ShieldAlert className="w-4 h-4 text-[#ea4335]" />
                <span>
                  {isAr
                    ? "سلم التصعيد الإداري المتدرج (4 مستويات معتمدة)"
                    : "Progressive Escalation Ladder (4-Level Stepper)"}
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "تدرج لوني تدريجي من الأزرق إلى الأصفر ثم البرتقالي فالأحمر — لا عقوبة دون إشعار وتحقيق."
                  : "Color graduation from Blue to Yellow to Orange to Red. No penalty without prior notice."}
              </p>
            </div>
            <Link href={`/${locale}/incidents`}>
              <Button variant="ghost" size="sm" className="text-xs text-[#1a73e8]">
                {isAr ? "إدارة المخالفات" : "View Incidents"}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Level 1: Friendly Notice (Blue) */}
            <div className="p-4 rounded-lg bg-[#e8f0fe] dark:bg-[#1a73e8]/15 border border-[#d2e3fc] dark:border-[#1a73e8]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1a73e8] text-white">
                  Level 1
                </span>
                <span className="text-xs font-bold text-[#1a73e8]">Blue Notice</span>
              </div>
              <h4 className="font-bold text-xs text-foreground">
                {isAr ? "تنبيه ودي مباشر" : "Friendly Notice"}
              </h4>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                {isAr
                  ? "محادثة توجيهية ثنائية غير رسمية لتصحيح المسار فور حدوث تأخر أو تقصير بسيط."
                  : "Informal, constructive 1-on-1 alignment to address initial delays or misses."}
              </p>
            </div>

            {/* Level 2: PIP (Yellow) */}
            <div className="p-4 rounded-lg bg-[#fef7e0] dark:bg-[#fbbc04]/15 border border-[#feefc3] dark:border-[#fbbc04]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#b06000] text-white">
                  Level 2
                </span>
                <span className="text-xs font-bold text-[#b06000]">Yellow Notice</span>
              </div>
              <h4 className="font-bold text-xs text-foreground">
                {isAr ? "خطة تحسين الأداء (PIP)" : "Performance Plan (PIP)"}
              </h4>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                {isAr
                  ? "خطة أهداف مكتوبة ومحددة زمنياً مع تقديم دعم وتوجيه من قائد الفريق وHR."
                  : "Time-bound formal improvement plan with specific agreed deliverables and mentoring."}
              </p>
            </div>

            {/* Level 3: Head/Vice Head Review (Orange) */}
            <div className="p-4 rounded-lg bg-[#feefe3] dark:bg-[#e37400]/15 border border-[#fed7b2] dark:border-[#e37400]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#e37400] text-white">
                  Level 3
                </span>
                <span className="text-xs font-bold text-[#e37400]">Orange Review</span>
              </div>
              <h4 className="font-bold text-xs text-foreground">
                {isAr ? "مراجعة قائد ونائب الفريق" : "Head/Vice Head Review"}
              </h4>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                {isAr
                  ? "جلسة استماع رسمية على مستوى قيادة اللجنة لبحث أسباب عدم الاستجابة لخطة PIP."
                  : "Formal committee review meeting assessing systemic non-delivery with HR presence."}
              </p>
            </div>

            {/* Level 4: Community Leadership Escalation (Red) */}
            <div className="p-4 rounded-lg bg-[#fce8e6] dark:bg-[#ea4335]/15 border border-[#fad2cf] dark:border-[#ea4335]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#ea4335] text-white">
                  Level 4
                </span>
                <span className="text-xs font-bold text-[#ea4335]">Red Escalation</span>
              </div>
              <h4 className="font-bold text-xs text-foreground">
                {isAr ? "تصعيد لقيادة مجتمع GDG" : "Leadership Escalation"}
              </h4>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                {isAr
                  ? "قرار نهائي من قائد GDG NCTU ولجنة القيادة بشأن عضوية العضو بعد استيفاء التحقيق."
                  : "Final determination by GDG Lead and Executive Board after formal review hearing."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Points Log & Rules Table (Data table with crisp 1px borders from ui ana) */}
      <Card className="border border-border bg-card shadow-2xs">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                {isAr ? "سجل وقائع النقاط وقواعد اللائحة" : "Points Log & Rules Ledger"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "جدول البيانات الرسمي مع تطبيق سقف النقاط الإيجابية والتحقق المستقل."
                  : "Verified log with crisp 1px borders, rounded pill badges, and track filters."}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Track filter */}
              <div className="flex items-center rounded-lg bg-[#f1f3f4] dark:bg-[#303134] p-0.5 border border-border text-xs">
                <button
                  onClick={() => setPointTrackFilter("all")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    pointTrackFilter === "all" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {isAr ? "الكل" : "All Tracks"}
                </button>
                <button
                  onClick={() => setPointTrackFilter("tech")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    pointTrackFilter === "tech" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {isAr ? "تقني" : "Tech"}
                </button>
                <button
                  onClick={() => setPointTrackFilter("non_tech")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    pointTrackFilter === "non_tech" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {isAr ? "غير تقني" : "Non-Tech"}
                </button>
              </div>

              {/* Status filter */}
              <div className="flex items-center rounded-lg bg-[#f1f3f4] dark:bg-[#303134] p-0.5 border border-border text-xs">
                <button
                  onClick={() => setPointStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    pointStatusFilter === "all" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {isAr ? "الكل" : "All Status"}
                </button>
                <button
                  onClick={() => setPointStatusFilter("approved")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    pointStatusFilter === "approved" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {isAr ? "معتمد" : "Approved"}
                </button>
                <button
                  onClick={() => setPointStatusFilter("pending_review")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    pointStatusFilter === "pending_review" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {isAr ? "قيد المراجعة" : "Pending"}
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] dark:bg-[#202124] border-b border-border text-[#5f6368] dark:text-[#9aa0a6] font-semibold">
                  <th className="py-3 px-4">{isAr ? "النقاط" : "Points"}</th>
                  <th className="py-3 px-4">{isAr ? "العضو" : "Member"}</th>
                  <th className="py-3 px-4">{isAr ? "بيان الواقعة والسبب" : "Explanation & Ground"}</th>
                  <th className="py-3 px-4">{isAr ? "التاريخ" : "Date"}</th>
                  <th className="py-3 px-4">{isAr ? "الحالة" : "Status"}</th>
                  <th className="py-3 px-4 text-right">{isAr ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPointEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#202124] transition-colors">
                    {/* Points Pill */}
                    <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                      {evt.direction === "positive" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] dark:bg-[#34a853]/20 dark:text-[#81c995]">
                          +{evt.value} pts
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf] dark:bg-[#ea4335]/20 dark:text-[#f28b82]">
                          {evt.value} pts
                        </span>
                      )}
                    </td>

                    {/* Member */}
                    <td className="py-3 px-4 font-bold text-foreground whitespace-nowrap">
                      {evt.member_id}
                    </td>

                    {/* Explanation */}
                    <td className="py-3 px-4 text-foreground max-w-md">
                      <p className="line-clamp-2">{evt.explanation}</p>
                      {evt.evidence_url && (
                        <a
                          href={evt.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#1a73e8] hover:underline mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {isAr ? "معاينة الدليل" : "Proof Attached"}
                        </a>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap font-mono">
                      {evt.event_date}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={evt.status} size="sm" />
                    </td>

                    {/* Dispute / Action Button */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDisputeModalOpen(true)}
                        className="h-7 text-[11px] text-[#1a73e8] hover:bg-[#e8f0fe] dark:hover:bg-[#1a73e8]/20"
                      >
                        <Scale className="w-3 h-3 mr-1" />
                        {isAr ? "طعن / تظلم" : "Dispute"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 5. Track-Based KPIs & Rubrics Matrix (Responsive Grid from ui ana) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isAr
                ? "مصفوفة تقييم ومعايير المسارات واللجان (Track KPIs & Rubrics Matrix)"
                : "Track-Based KPIs & Rubrics Matrix"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "تقييم اللجان التقنية وغير التقنية وفق مقياس من 1 إلى 5 معايير محددة."
                : "Responsive grid of cards for each track with 1-to-5 point scale evaluation inputs."}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
            9 Core Tracks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTracksList.map((tr) => {
            const Icon = tr.icon;
            const currentScore = trackScores[tr.id] || 4.5;
            const isTech = tr.type === "tech";

            return (
              <Card
                key={tr.id}
                className="p-4 border border-border bg-card hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        isTech
                          ? "bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/20"
                          : "bg-[#fef7e0] text-[#b06000] dark:bg-[#fbbc04]/20"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground">
                        {isAr ? tr.nameAr : tr.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        {isTech ? "Technical Track" : "Non-Tech Committee"}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#f1f3f4] dark:bg-[#303134] text-foreground">
                    ★ {currentScore.toFixed(1)} / 5.0
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {tr.desc}
                </p>

                {/* 1-to-5 point scale rating slider */}
                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Rubric Evaluation:</span>
                    <span className="font-bold text-primary">{currentScore.toFixed(1)} / 5.0</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={currentScore}
                    onChange={(e) =>
                      setTrackScores((prev) => ({
                        ...prev,
                        [tr.id]: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-[#dadce0] dark:bg-[#3c4043] rounded-lg appearance-none cursor-pointer accent-[#1a73e8]"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dispute Modal (Micro-interaction) */}
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
                  onClick={() => {
                    alert(
                      isAr
                        ? "تم تسجيل التظلم وتعيين مراجع محايد وفق المهلة الرسمية."
                        : "Dispute submitted to neutral review queue."
                    );
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

      {/* Record Point Event Modal */}
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
                  {isAr ? "فئة النقطة المعتمدة باللائحة:" : "Policy Category:"}
                </label>
                <select
                  value={newSelectedCategory}
                  onChange={(e) => setNewSelectedCategory(e.target.value)}
                  className="w-full mt-1 h-9 rounded-md border border-border bg-background px-3 text-xs"
                >
                  {MOCK_POINT_CATEGORIES.map((c) => (
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
                    const cat = MOCK_POINT_CATEGORIES.find((c) => c.id === newSelectedCategory);
                    if (cat && newExplanation.trim()) {
                      addPointEvent({
                        member_id: currentUser.id,
                        team_id: "team-web",
                        event_date: new Date().toISOString().split("T")[0],
                        category_id: cat.id,
                        direction: cat.direction,
                        value: cat.default_value,
                        explanation: newExplanation,
                        recorded_by: currentUser.id,
                        status: "pending_review",
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
