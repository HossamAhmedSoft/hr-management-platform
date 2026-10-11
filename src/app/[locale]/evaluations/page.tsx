"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Plus,
  CheckCircle,
  HelpCircle,
  Calculator,
  UserCheck,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";
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
import { useApp } from "@/lib/app-context";
import {
  POLICY_EVALUATION_CATEGORIES,
  POLICY_EVALUATION_PERIODS,
} from "@/lib/policy-catalog";
import { calculateEvaluationScore } from "@/lib/utils";

export default function EvaluationsPage() {
  const { evaluations, addEvaluation, availableUsers, currentUser, locale } = useApp();
  const isAr = locale === "ar";

  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canConductEvaluation = userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";

  // Target users for evaluation: Team Lead can only evaluate members of their own team
  const evalTargetUsers = userRole === "team_lead" && currentUser?.team_id
    ? availableUsers.filter((u) => u.team_id === currentUser.team_id && u.id !== currentUser.id)
    : availableUsers.filter((u) => u.id !== currentUser?.id);

  const [isNewEvalOpen, setIsNewEvalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(evalTargetUsers[0]?.id || availableUsers[0]?.id || "");
  const [evalCycle, setEvalCycle] = useState(POLICY_EVALUATION_PERIODS[0]?.id || "");

  React.useEffect(() => {
    if (!selectedMemberId && evalTargetUsers.length > 0) {
      setSelectedMemberId(evalTargetUsers[0].id);
    }
  }, [evalTargetUsers, selectedMemberId]);

  // Rating state for the 6 categories (rating: number | null for N/A)
  const [ratings, setRatings] = useState<{ [catId: string]: { rating: number; isNA: boolean } }>({
    "eval-cat-1": { rating: 4.5, isNA: false },
    "eval-cat-2": { rating: 4.0, isNA: false },
    "eval-cat-3": { rating: 4.2, isNA: false },
    "eval-cat-4": { rating: 4.0, isNA: false },
    "eval-cat-5": { rating: 3.8, isNA: false },
    "eval-cat-6": { rating: 4.5, isNA: false },
  });

  // Calculate live score
  const calculationInputs = POLICY_EVALUATION_CATEGORIES.map((cat) => ({
    categoryWeight: cat.weight,
    rating: ratings[cat.id]?.isNA ? null : ratings[cat.id]?.rating ?? 3.0,
  }));

  const liveResult = calculateEvaluationScore(calculationInputs);

  const getMemberName = (id: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id;
  };

  const handleRatingChange = (catId: string, val: number) => {
    setRatings((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], rating: val, isNA: false },
    }));
  };

  const handleToggleNA = (catId: string) => {
    setRatings((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], isNA: !prev[catId]?.isNA },
    }));
  };

  // Scoped evaluations based on role
  const visibleEvaluations = evaluations.filter((e) => {
    if (isMember) {
      // Ordinary member ONLY sees their own evaluations!
      return e.member_id === currentUser?.id;
    }
    if (userRole === "team_lead" && currentUser?.team_id) {
      // Team lead sees evaluations of their team members
      const evalMember = availableUsers.find((u) => u.id === e.member_id);
      return evalMember?.team_id === currentUser.team_id || e.member_id === currentUser.id;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? (isMember ? "تقييمي الشهري الرسمي" : "التقييم الشهري الرسمي (من 100)") : (isMember ? "My Monthly Evaluation" : "Monthly Performance Evaluations (100 pts)")}
        description={
          isAr
            ? isMember
              ? "استعراض تقييمك الشهري المعتمد، والأوزان النسبية لكل معيار، ومستوى الأداء المحقق وفق اللائحة."
              : "نظام التقييم الدوري وفق 6 معايير معتمدة بأوزان دقيقة (30/25/15/10/10/10) مع معالجة حالات عدم الانطباق (N/A) وتصنيف مستويات الأداء."
            : isMember
              ? "Review your official monthly score, category weighted breakdown, and accredited performance band."
              : "Official 6-category weighted evaluation (100 pts) with mathematical N/A proportional adjustments."
        }
      >
        {canConductEvaluation && (
          <Button
            size="sm"
            onClick={() => setIsNewEvalOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            {isAr ? "إجراء تقييم جديد" : "Conduct Evaluation"}
          </Button>
        )}
      </PageHeader>

      {/* 6 Official Categories Breakdown Cards */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>
              {isAr
                ? "معايير التقييم الستة المعتمدة باللائحة"
                : "Official 6 Evaluation Criteria & Weights"}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              100 Points Total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {POLICY_EVALUATION_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-xl border border-border/60 bg-muted/20 text-center space-y-1"
              >
                <span className="text-2xl font-black text-primary">
                  {cat.weight}%
                </span>
                <p className="text-xs font-bold text-foreground truncate">
                  {isAr ? cat.name_ar : cat.name}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {cat.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Finalized Evaluations List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          {isAr ? "التقييمات المعتمدة للدورة الحالية" : "Finalized Evaluations"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleEvaluations.length === 0 ? (
            <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed">
              <Award className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
              <p className="text-sm font-semibold">
                {isAr
                  ? isMember
                    ? "لم يتم تسجيل تقييم شهري معتمد لك حتى الآن"
                    : "لا توجد تقييمات معتمدة مسجلة حالياً"
                  : isMember
                    ? "No official monthly evaluation finalized for you yet"
                    : "No evaluations recorded yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr
                  ? isMember
                    ? "سيظهر تقييمك هنا فور اعتماده من قائد الفريق وإدارة الموارد البشرية."
                    : "اضغط على 'إجراء تقييم جديد' بالأعلى لبدء تقييم أحد الأعضاء."
                  : isMember
                    ? "Your score will appear here once approved by your Team Lead and HR."
                    : "Click 'Conduct Evaluation' above to evaluate a team member."}
              </p>
            </Card>
          ) : (
            visibleEvaluations.map((ev) => (
            <Card
              key={ev.id}
              className="p-5 border-border/70 hover:shadow-lg transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-foreground">
                    {getMemberName(ev.member_id)}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Evaluator: {getMemberName(ev.evaluator_id)}
                  </p>
                </div>
                <StatusBadge status={ev.status} />
              </div>

              <div className="p-4 rounded-xl bg-muted/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {isAr ? "الدرجة النهائية:" : "Total Score:"}
                  </span>
                  <p className="text-3xl font-black text-primary">
                    {ev.total_score} / 100
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {isAr ? "المستوى المستحق:" : "Performance Band:"}
                  </span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {ev.performance_band}
                  </p>
                </div>
              </div>

              {ev.self_assessment_notes && (
                <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg">
                  <strong>{isAr ? "التقييم الذاتي:" : "Self Assessment:"}</strong>{" "}
                  {ev.self_assessment_notes}
                </div>
              )}
            </Card>
          )))}
        </div>
      </div>

      {/* New Evaluation Dialog with Real-Time Calculator */}
      {isNewEvalOpen && canConductEvaluation && (
        <Dialog open={isNewEvalOpen} onOpenChange={setIsNewEvalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>
                  {isAr ? "نموذج تقييم الأداء الشهري" : "Monthly Performance Evaluation"}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                  {liveResult.band}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-3 text-xs">
              {/* Member & Period Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "العضو المُراد تقييمه:" : "Target Member:"}
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    {evalTargetUsers.length === 0 ? (
                      <option value="">{isAr ? "لا يوجد أعضاء متاحين للتقييم" : "No members available"}</option>
                    ) : (
                      evalTargetUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role.replace("_", " ")})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "دورة التقييم:" : "Evaluation Cycle:"}
                  </label>
                  <select
                    value={evalCycle}
                    onChange={(e) => setEvalCycle(e.target.value)}
                    className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    {POLICY_EVALUATION_PERIODS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 6 Category Sliders */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  {isAr ? "تقييم المعايير (من 1 إلى 5 نجوم):" : "Rate Categories (1.0 to 5.0):"}
                </h4>

                {POLICY_EVALUATION_CATEGORIES.map((cat) => {
                  const currentRating = ratings[cat.id]?.rating ?? 3.0;
                  const isNA = ratings[cat.id]?.isNA ?? false;
                  const subScore = isNA
                    ? "N/A"
                    : ((currentRating / 5) * cat.weight).toFixed(1);

                  return (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-foreground">
                            {isAr ? cat.name_ar : cat.name} ({cat.weight}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleNA(cat.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              isNA
                                ? "bg-amber-500/20 text-amber-600 border-amber-500/40"
                                : "text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            {isNA ? "N/A (Excluded)" : "Mark N/A"}
                          </button>
                          <span className="font-extrabold text-primary w-12 text-right">
                            {subScore} pts
                          </span>
                        </div>
                      </div>

                      {!isNA && (
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.1"
                            value={currentRating}
                            onChange={(e) =>
                              handleRatingChange(cat.id, parseFloat(e.target.value))
                            }
                            className="flex-1 h-1.5 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <span className="font-bold w-8 text-center text-foreground">
                            {currentRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Result Summary */}
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {isAr ? "النتيجة الإجمالية المحسوبة:" : "Calculated Final Score:"}
                  </span>
                  <p className="text-3xl font-black text-primary">
                    {liveResult.score ?? "Not Evaluated"} / 100
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {isAr ? "المستوى التقديري:" : "Performance Tier:"}
                  </span>
                  <p className="text-sm font-extrabold text-foreground mt-0.5">
                    {liveResult.band}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewEvalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const targetId = selectedMemberId || availableUsers[0]?.id;
                    if (!currentUser || !targetId) return;
                    await addEvaluation({
                      member_id: targetId,
                      evaluator_id: currentUser.id,
                      period_id: evalCycle || POLICY_EVALUATION_PERIODS[0]?.id || "period-current",
                      template_id: "tpl-default",
                      status: "finalized",
                      total_score: liveResult.score || 0,
                      performance_band: liveResult.band || "Satisfactory",
                      ratings: POLICY_EVALUATION_CATEGORIES.map((cat) => ({
                        id: `rating_${Date.now()}_${cat.id}`,
                        evaluation_id: "",
                        category_id: cat.id,
                        rating: ratings[cat.id]?.isNA ? null : ratings[cat.id]?.rating ?? 3.0,
                      })),
                    });
                    setIsNewEvalOpen(false);
                  }}
                >
                  {isAr ? "حفظ واعتماد نهائي" : "Finalize & Notify Member"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
