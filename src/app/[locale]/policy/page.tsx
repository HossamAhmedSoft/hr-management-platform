"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Calendar,
  Layers,
  Calculator,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle,
  Clock,
  History,
  Sliders,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-context";
import {
  POLICY_POINT_CATEGORIES,
  POLICY_POINT_CAP_CATEGORIES,
  OFFICIAL_POINT_TO_CAP_MAPPINGS,
  POLICY_EVALUATION_CATEGORIES,
} from "@/lib/policy-catalog";

export default function PolicyPage() {
  const { locale, currentUser } = useApp();
  const isAr = locale === "ar";
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "hr_admin";

  // Policy Simulator States
  const [selectedParam, setSelectedParam] = useState<string>("core_task");
  const [proposedValue, setProposedValue] = useState<number>(5.0);
  const [proposedEffectiveDate, setProposedEffectiveDate] = useState<string>("2026-11-01");
  const [changeReason, setChangeReason] = useState<string>("");
  const [simulationResult, setSimulationResult] = useState<{
    oldScore: number;
    newScore: number;
    diff: number;
    notes: string;
  } | null>(null);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParam === "core_task") {
      const oldVal = 5.0;
      const oldMonthlyCap = 9.0;
      // Member completing 2 core tasks
      const oldTotal = Math.min(oldVal * 2, oldMonthlyCap); // 9.0
      const newTotal = Math.min(proposedValue * 2, oldMonthlyCap);
      setSimulationResult({
        oldScore: oldTotal,
        newScore: newTotal,
        diff: Number((newTotal - oldTotal).toFixed(1)),
        notes: isAr
          ? `المحاكاة لعضو أنجز مهمتين أساسيتين في الشهر بموجب السقف الحالي (9 نقاط).`
          : `Simulated for a member completing 2 core tasks under the current monthly cap (9.0 pts).`,
      });
    } else if (selectedParam === "task_cap") {
      const coreTaskVal = 5.0;
      const oldCap = 9.0;
      const oldTotal = Math.min(coreTaskVal * 2, oldCap); // 9.0
      const newTotal = Math.min(coreTaskVal * 2, proposedValue);
      setSimulationResult({
        oldScore: oldTotal,
        newScore: newTotal,
        diff: Number((newTotal - oldTotal).toFixed(1)),
        notes: isAr
          ? `المحاكاة لتأثير تعديل سقف إنجاز المهام على إجمالي النقاط الشهرية المعتمدة.`
          : `Simulated impact of altering the Task Execution monthly cap on net credited points.`,
      });
    } else if (selectedParam === "eval_weight_tasks") {
      // Evaluation task weight simulation (out of 100)
      const oldWeight = 30.0;
      // Standard score with rating 4/5 across all items
      const oldScore = (4 / 5) * 100; // 80.0
      const weightDelta = proposedValue - oldWeight;
      // Normalizing other weights proportionally
      const remainingOldWeights = 70.0;
      const remainingNewWeights = 100.0 - proposedValue;
      const newScore = (4 / 5) * proposedValue + (4 / 5) * remainingNewWeights;
      setSimulationResult({
        oldScore: 80.0,
        newScore: Number(newScore.toFixed(1)),
        diff: Number((newScore - oldScore).toFixed(1)),
        notes: isAr
          ? `محاكاة تقييم شهري بتقدير 4/5 لجميع البنود بعد إعادة وزن المعايير.`
          : `Simulated standard monthly evaluation with 4/5 ratings after weight adjustments.`,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "السياسات واللوائح المعتمدة وحوكمة التعديل" : "Official Policies & Governance"}
        description={
          isAr
            ? "اللوائح الرسمية غير القابلة للتأويل لمجتمع GDG بجامعة القاهرة التكنولوجية الجديدة، محاكي التغييرات المستقبلية وإعدادات التقويم."
            : "Immutable published policy governance, future policy impact simulator, and official working-day calendar configuration."
        }
      />

      {/* Policy Version & Immutability Badge */}
      <Card className="border-border/80 bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              v1.0
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {isAr ? "الإصدار الساري: v1.0.0 (موسم 2026/2027)" : "Active Baseline: v1.0.0 (Season 2026/2027)"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {isAr ? "معتمد رسمياً" : "Officially Ratified"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "تاريخ النفاذ: 1 سبتمبر 2026 | حظر التعديل بأثر رجعي لحماية التقييمات السابقة."
                  : "Effective Date: Sep 1, 2026 | Historical immutability enforced; zero retroactive score alterations."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="w-4 h-4 text-primary" />
            <span>{isAr ? "مرجع اللائحة: PDF النهائي (1)" : "Ref: Official PDF Final(1)"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Non-Negotiable Directives Card */}
      <Card className="border-border/80 border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>
              {isAr
                ? "المبادئ الحاكمة الأساسية (غير قابلة للتفاوض)"
                : "Non-Negotiable Policy Guardrails"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-foreground">
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
            <strong>1. الفصل التام بين النقاط والتقييم الشهري:</strong>
            <p className="text-muted-foreground mt-0.5">
              رصيد النقاط (الإيجابي والسلبي) مستقل استقلالاً تاماً عن درجة التقييم الشهري (من 100). لا يُخصم أي رقم من درجة التقييم بسبب نقاط اللائحة.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
            <strong>2. حظر العقوبات التلقائية من الأرقام وحدها:</strong>
            <p className="text-muted-foreground mt-0.5">
              لا يؤدي انخفاض رصيد النقاط أو بلوغ الرصيد الأحمر إلى الفصل أو التجميد المباشر إطلاقاً. العقوبة تتطلب واقعة موثقة + إخطار + تحقيق إداري.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
            <strong>3. مهلة التوضيح الإلزامية قبل تسجيل الخصم:</strong>
            <p className="text-muted-foreground mt-0.5">
              يلتزم فريق الموارد البشرية بإخطار العضو المعني ومنحه مهلة 48 ساعة لتقديم توضيح أو عذر رسمي قبل البت في تسجيل أي نقطة سلبية.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
            <strong>4. المخالفات الجسيمة (المساس بالنزاهة أو الأخلاقيات):</strong>
            <p className="text-muted-foreground mt-0.5">
              تُحال المخالفات الجسيمة فوراً إلى التحقيق الإداري ولا تخضع لخصم نقاط رقمية مسبقة.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 19: Policy Change Simulator & Impact Preview */}
      <Card className="border-border/80 border-t-4 border-t-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-500" />
              <span>{isAr ? "محاكي تغييرات اللائحة والأثر المستقبلي" : "Policy Change Simulator & Impact Preview"}</span>
            </div>
            <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              {isAr ? "معاينة فقط — لا تعدل البيانات الحية" : "Simulation Preview Only"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "يتيح هذا النموذج للإدارة محاكاة أي تعديل مستقبلي مقترح على أوزان التقييم أو سقوف النقاط لمعاينة أثره الحسابي قبل اعتماده رسمياً. لا تُطبق أي تعديلات بأثر رجعي."
              : "Allows leadership to preview the mathematical effect of proposed policy changes on future evaluation scores prior to ratification. All approved updates apply prospectively."}
          </p>

          <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border/70 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold">{isAr ? "المعيار المقترح تعديله" : "Target Parameter"}</label>
              <select
                aria-label={isAr ? "المعيار المقترح تعديله" : "Target Parameter"}
                value={selectedParam}
                onChange={(e) => {
                  setSelectedParam(e.target.value);
                  if (e.target.value === "core_task") setProposedValue(5.0);
                  if (e.target.value === "task_cap") setProposedValue(10.0);
                  if (e.target.value === "eval_weight_tasks") setProposedValue(35.0);
                }}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
              >
                <option value="core_task">{isAr ? "نقاط المهمة الأساسية (الحالي: +5)" : "Core Task Event Points (Current: +5)"}</option>
                <option value="task_cap">{isAr ? "سقف إنجاز المهام الشهري (الحالي: 9)" : "Task Execution Monthly Cap (Current: 9)"}</option>
                <option value="eval_weight_tasks">{isAr ? "وزن إنجاز المهام في التقييم (الحالي: 30%)" : "Evaluation Task Weight (Current: 30%)"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold">{isAr ? "القيمة المقترحة الجديدة" : "Proposed New Value"}</label>
              <Input
                type="number"
                step="0.5"
                value={proposedValue}
                onChange={(e) => setProposedValue(parseFloat(e.target.value) || 0)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold">{isAr ? "تاريخ النفاذ المقترح" : "Proposed Effective Date"}</label>
              <Input
                type="date"
                value={proposedEffectiveDate}
                onChange={(e) => setProposedEffectiveDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" size="sm" className="w-full gap-2 bg-amber-600 hover:bg-amber-700 h-9 text-xs">
                <Sparkles className="w-4 h-4" />
                {isAr ? "تشغيل المحاكاة" : "Run Simulation"}
              </Button>
            </div>
          </form>

          {simulationResult && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <Info className="w-4 h-4" />
                  {isAr ? "نتيجة محاكاة الأثر الحسابي:" : "Simulated Impact Result:"}
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">{simulationResult.notes}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-[10px] text-muted-foreground block">{isAr ? "النتيجة بموجب اللائحة الحالية" : "Current Baseline Result"}</span>
                  <span className="text-base font-bold text-foreground">{simulationResult.oldScore} pts</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-[10px] text-muted-foreground block">{isAr ? "النتيجة بعد التعديل المقترح" : "Simulated Proposed Result"}</span>
                  <span className="text-base font-bold text-amber-600">{simulationResult.newScore} pts</span>
                </div>
                <div className="p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-[10px] text-muted-foreground block">{isAr ? "الفارق الصافي" : "Net Score Variance"}</span>
                  <span className={`text-base font-bold ${simulationResult.diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {simulationResult.diff >= 0 ? `+${simulationResult.diff}` : simulationResult.diff} pts
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Official Monthly Positive Caps & Point Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>{isAr ? "سقوف النقاط الإيجابية الشهرية (المعتمدة)" : "Official Monthly Positive Caps (7 Categories)"}</span>
              <span className="text-[11px] font-normal text-muted-foreground">Section 4.E</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {POLICY_POINT_CAP_CATEGORIES.map((cap) => (
              <div key={cap.id} className="p-2.5 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between">
                <div>
                  <span className="font-bold">{isAr ? cap.name_ar : cap.name}</span>
                  <span className="text-[10px] text-muted-foreground block">
                    {cap.points_per_event} pts / event
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                  Max: +{cap.monthly_cap} pts/mo
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>{isAr ? "معايير التقييم الشهري الرسمية (100%)" : "Official Monthly Evaluation Criteria (100%)"}</span>
              <span className="text-[11px] font-normal text-muted-foreground">Section 5.A</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {POLICY_EVALUATION_CATEGORIES.map((crit) => (
              <div key={crit.id} className="p-2.5 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between">
                <div>
                  <span className="font-bold">{isAr ? crit.name_ar : crit.name}</span>
                  <span className="text-[10px] text-muted-foreground block">{crit.description}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                  {crit.weight}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Egyptian Working Days Calendar Configuration */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>
              {isAr ? "إعدادات تقويم أيام العمل المصرية" : "Egyptian Working-Day Calendar Setup"}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
              Configured: Sun – Thu
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <p className="text-muted-foreground">
            {isAr
              ? "تُحسب المهل القانونية (مثل مهلة الـ 7 أيام لتقديم التظلمات) وفق تقويم العمل الرسمي في جمهورية مصر العربية."
              : "All operational deadlines (such as the 7-day appeal submission window) strictly adhere to official Egyptian business days."}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-center">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((day) => (
              <div key={day} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-400">
                {day}
                <span className="block text-[10px] font-normal text-muted-foreground">Working Day</span>
              </div>
            ))}
            {["Friday", "Saturday"].map((day) => (
              <div key={day} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 font-bold text-rose-700 dark:text-rose-400">
                {day}
                <span className="block text-[10px] font-normal text-muted-foreground">Weekend (Excluded)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
