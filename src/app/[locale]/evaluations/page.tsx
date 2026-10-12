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
  Edit,
  Trash2,
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
import { calculateEvaluationScore, isUserInTrack } from "@/lib/utils";
import { Evaluation } from "@/types";

export default function EvaluationsPage() {
  const {
    evaluations,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    availableUsers,
    teams,
    currentUser,
    locale,
  } = useApp();
  const isAr = locale === "ar";

  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canConductEvaluation =
    userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";
  const canManageEvaluation =
    userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";

  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [evalTeamFilter, setEvalTeamFilter] = useState<string>("all");

  // Helper to match user to committee
  const isUserInTeam = (u: any, teamId?: string) => {
    if (!teamId || teamId === "all") return true;
    return isUserInTrack(u, teamId, teams);
  };

  // Target users for evaluation: Team Lead can only evaluate their team, or filtered by selected committee
  const evalTargetUsers = React.useMemo(() => {
    let pool = availableUsers.filter((u) => u.id !== currentUser?.id);
    if (userRole === "team_lead" && currentUser?.team_id) {
      pool = pool.filter((u) => isUserInTeam(u, currentUser.team_id));
    }
    if (evalTeamFilter !== "all") {
      pool = pool.filter((u) => isUserInTeam(u, evalTeamFilter));
    }
    return pool;
  }, [availableUsers, currentUser, userRole, evalTeamFilter]);

  const [isNewEvalOpen, setIsNewEvalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(
    evalTargetUsers[0]?.id || availableUsers[0]?.id || ""
  );
  const [evalCycle, setEvalCycle] = useState(POLICY_EVALUATION_PERIODS[0]?.id || "");

  // Edit Evaluation State
  const [isEditEvalOpen, setIsEditEvalOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null);
  const [editRatings, setEditRatings] = useState<{
    [catId: string]: { rating: number; isNA: boolean };
  }>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Evaluation State
  const [isDeleteEvalOpen, setIsDeleteEvalOpen] = useState(false);
  const [deletingEval, setDeletingEval] = useState<Evaluation | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  React.useEffect(() => {
    if (evalTargetUsers.length > 0) {
      if (!selectedMemberId || !evalTargetUsers.some((u) => u.id === selectedMemberId)) {
        setSelectedMemberId(evalTargetUsers[0].id);
      }
    } else {
      setSelectedMemberId("");
    }
  }, [evalTargetUsers, selectedMemberId]);

  // Rating state for creating evaluation (rating: number | null for N/A)
  const [ratings, setRatings] = useState<{ [catId: string]: { rating: number; isNA: boolean } }>({
    "eval-cat-1": { rating: 4.5, isNA: false },
    "eval-cat-2": { rating: 4.0, isNA: false },
    "eval-cat-3": { rating: 4.2, isNA: false },
    "eval-cat-4": { rating: 4.0, isNA: false },
    "eval-cat-5": { rating: 3.8, isNA: false },
    "eval-cat-6": { rating: 4.5, isNA: false },
  });

  // Calculate live score for new eval
  const calculationInputs = POLICY_EVALUATION_CATEGORIES.map((cat) => ({
    categoryWeight: cat.weight,
    rating: ratings[cat.id]?.isNA ? null : ratings[cat.id]?.rating ?? 3.0,
  }));
  const liveResult = calculateEvaluationScore(calculationInputs);

  // Calculate live score for edit eval
  const editCalculationInputs = POLICY_EVALUATION_CATEGORIES.map((cat) => ({
    categoryWeight: cat.weight,
    rating: editRatings[cat.id]?.isNA ? null : editRatings[cat.id]?.rating ?? 3.0,
  }));
  const editLiveResult = calculateEvaluationScore(editCalculationInputs);

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

  const handleEditRatingChange = (catId: string, val: number) => {
    setEditRatings((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], rating: val, isNA: false },
    }));
  };

  const handleEditToggleNA = (catId: string) => {
    setEditRatings((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], isNA: !prev[catId]?.isNA },
    }));
  };

  // Open Edit Modal
  const openEditModal = (ev: Evaluation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEval(ev);

    // Populate ratings from existing evaluation or default
    const currentR: { [catId: string]: { rating: number; isNA: boolean } } = {};
    POLICY_EVALUATION_CATEGORIES.forEach((cat) => {
      const existingRating = ev.ratings?.find((r) => r.category_id === cat.id);
      if (existingRating && existingRating.rating !== null && existingRating.rating !== undefined) {
        currentR[cat.id] = { rating: existingRating.rating, isNA: false };
      } else if (existingRating && existingRating.rating === null) {
        currentR[cat.id] = { rating: 3.0, isNA: true };
      } else {
        currentR[cat.id] = { rating: 4.0, isNA: false };
      }
    });

    setEditRatings(currentR);
    setIsEditEvalOpen(true);
  };

  // Submit Edit Evaluation
  const handleSaveEdit = async () => {
    if (!editingEval) return;
    setIsSubmittingEdit(true);

    const updatedRatings = POLICY_EVALUATION_CATEGORIES.map((cat) => ({
      id: `rating_${Date.now()}_${cat.id}`,
      evaluation_id: editingEval.id,
      category_id: cat.id,
      rating: editRatings[cat.id]?.isNA ? null : editRatings[cat.id]?.rating ?? 3.0,
    }));

    const success = await updateEvaluation(editingEval.id, {
      total_score: editLiveResult.score || 0,
      performance_band: editLiveResult.band || "Satisfactory",
      ratings: updatedRatings,
    });

    if (success) {
      setIsEditEvalOpen(false);
      setEditingEval(null);
    } else {
      alert(isAr ? "فشل تعديل التقييم" : "Failed to update evaluation");
    }
    setIsSubmittingEdit(false);
  };

  // Open Delete Modal
  const openDeleteModal = (ev: Evaluation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingEval(ev);
    setIsDeleteEvalOpen(true);
  };

  // Submit Delete Evaluation
  const handleConfirmDelete = async () => {
    if (!deletingEval) return;
    setIsSubmittingDelete(true);
    const success = await deleteEvaluation(deletingEval.id);
    if (success) {
      setIsDeleteEvalOpen(false);
      setDeletingEval(null);
    } else {
      alert(isAr ? "فشل حذف التقييم" : "Failed to delete evaluation");
    }
    setIsSubmittingDelete(false);
  };

  // Robust user matching helper
  const isMatchUser = (targetId?: string) => {
    if (!targetId || !currentUser) return false;
    if (targetId === currentUser.id) return true;
    if (currentUser.email && targetId.toLowerCase() === currentUser.email.toLowerCase()) return true;
    const targetProf = availableUsers.find((u) => u.id === targetId);
    if (
      targetProf?.email &&
      currentUser.email &&
      targetProf.email.toLowerCase() === currentUser.email.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // Scoped evaluations based on role
  const visibleEvaluations = evaluations.filter((e) => {
    if (isMember) {
      return isMatchUser(e.member_id);
    }
    if (userRole === "team_lead" && currentUser?.team_id) {
      const evalMember = availableUsers.find((u) => u.id === e.member_id);
      if (evalMember?.team_id !== currentUser.team_id && !isMatchUser(e.member_id)) {
        return false;
      }
    }
    if (filterTeam !== "all") {
      const evalMember = availableUsers.find((u) => u.id === e.member_id);
      if (!evalMember || !isUserInTeam(evalMember, filterTeam)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={
          isAr
            ? isMember
              ? "تقييمي الشهري الرسمي"
              : "التقييم الشهري الرسمي (من 100)"
            : isMember
            ? "My Monthly Evaluation"
            : "Monthly Performance Evaluations (100 pts)"
        }
        description={
          isAr
            ? isMember
              ? "استعراض تقييمك الشهري المعتمد، والأوزان النسبية لكل معيار، ومستوى الأداء المحقق وفق اللائحة."
              : "نظام التقييم الدوري وفق 6 معايير معتمدة (30/25/15/10/10/10) مع إمكانية تعديل وحذف التقييمات."
            : isMember
            ? "Review your official monthly score, category weighted breakdown, and accredited performance band."
            : "Official 6-category weighted evaluation (100 pts) with full ability to conduct, edit, and delete."
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
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {isAr ? "التقييمات المعتمدة للدورة الحالية" : "Finalized Evaluations"} ({visibleEvaluations.length})
          </h3>
          {!isMember && (
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 h-8">
              <span className="text-xs text-muted-foreground font-semibold">
                {isAr ? "تصفية حسب اللجنة:" : "Filter Committee:"}
              </span>
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">{isAr ? "جميع الفرق واللجان" : "All Committees"}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

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
                className="p-5 border-border/70 hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
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
                </div>

                {/* Edit & Delete Action Buttons for Admins */}
                {canManageEvaluation && (
                  <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => openEditModal(ev, e)}
                      className="text-xs h-7 gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5 text-primary" />
                      {isAr ? "تعديل التقييم" : "Edit"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => openDeleteModal(ev, e)}
                      className="text-xs h-7 gap-1.5 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isAr ? "حذف التقييم" : "Delete"}
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Evaluation Dialog */}
      {isEditEvalOpen && editingEval && (
        <Dialog open={isEditEvalOpen} onOpenChange={setIsEditEvalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>
                  {isAr
                    ? `تعديل التقييم الشهري: ${getMemberName(editingEval.member_id)}`
                    : `Edit Evaluation: ${getMemberName(editingEval.member_id)}`}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                  {editLiveResult.band}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-3 text-xs">
              {/* 6 Category Sliders for Edit */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  {isAr ? "تعديل تقييم المعايير (من 1 إلى 5):" : "Update Ratings (1.0 to 5.0):"}
                </h4>

                {POLICY_EVALUATION_CATEGORIES.map((cat) => {
                  const currentRating = editRatings[cat.id]?.rating ?? 3.0;
                  const isNA = editRatings[cat.id]?.isNA ?? false;
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
                            onClick={() => handleEditToggleNA(cat.id)}
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
                              handleEditRatingChange(cat.id, parseFloat(e.target.value))
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
                    {isAr ? "النتيجة النهائية الجديدة:" : "New Total Score:"}
                  </span>
                  <p className="text-3xl font-black text-primary">
                    {editLiveResult.score ?? "Not Evaluated"} / 100
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {isAr ? "المستوى التقديري الجديد:" : "New Performance Tier:"}
                  </span>
                  <p className="text-sm font-extrabold text-foreground mt-0.5">
                    {editLiveResult.band}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditEvalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmittingEdit}
                  onClick={handleSaveEdit}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmittingEdit
                    ? isAr
                      ? "جارِ الحفظ..."
                      : "Saving..."
                    : isAr
                    ? "حفظ التعديلات"
                    : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Evaluation Confirmation Dialog */}
      {isDeleteEvalOpen && deletingEval && (
        <Dialog open={isDeleteEvalOpen} onOpenChange={setIsDeleteEvalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5 text-rose-600" />
                {isAr ? "تأكيد حذف التقييم الشهري" : "Confirm Evaluation Deletion"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-foreground">
                {isAr
                  ? `هل أنت متأكد من رغبتك في حذف التقييم الشهري (${deletingEval.total_score}/100) المسجل للعضو (${getMemberName(deletingEval.member_id)})؟`
                  : `Are you sure you want to delete the evaluation (${deletingEval.total_score}/100) for ${getMemberName(deletingEval.member_id)}?`}
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteEvalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="button"
                  disabled={isSubmittingDelete}
                  size="sm"
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isSubmittingDelete
                    ? isAr
                      ? "جارِ الحذف..."
                      : "Deleting..."
                    : isAr
                    ? "نعم، حذف نهائياً"
                    : "Delete Permanently"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
              {/* Committee, Member & Period Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "اللجنة / المسار (تصفية الأعضاء):" : "Committee / Track (Filter):"}
                  </label>
                  <select
                    value={evalTeamFilter}
                    onChange={(e) => {
                      const tId = e.target.value;
                      setEvalTeamFilter(tId);
                      const filtered = availableUsers.filter((u) => u.id !== currentUser?.id && isUserInTeam(u, tId));
                      if (filtered.length > 0 && !filtered.some((u) => u.id === selectedMemberId)) {
                        setSelectedMemberId(filtered[0].id);
                      }
                    }}
                    className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    <option value="all">{isAr ? "جميع اللجان والمسارات" : "All Committees"}</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.name_ar : t.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                      <option value="">{isAr ? "لا يوجد أعضاء في هذه اللجنة" : "No members in committee"}</option>
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

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
