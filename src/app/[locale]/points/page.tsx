"use client";

import React, { useState } from "react";
import {
  Award,
  Plus,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  FileCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/app-context";
import {
  POLICY_POINT_CATEGORIES,
  POLICY_POINT_CAP_CATEGORIES,
  OFFICIAL_POINT_TO_CAP_MAPPINGS,
} from "@/lib/policy-catalog";
import { getPointClassification, isDuplicateDeduction } from "@/lib/utils";
import { PointEvent } from "@/types";

export default function PointsPage() {
  const {
    pointEvents,
    addPointEvent,
    approvePointEvent,
    rejectPointEvent,
    availableUsers,
    teams,
    currentUser,
    locale,
  } = useApp();

  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canRecordPoints = userRole === "super_admin" || userRole === "hr_admin" || userRole === "hr_reviewer" || userRole === "team_lead";
  const canReviewPoints = userRole === "super_admin" || userRole === "hr_admin" || userRole === "hr_reviewer";

  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [selectedEventForReview, setSelectedEventForReview] = useState<PointEvent | null>(null);
  const [reviewRationale, setReviewRationale] = useState("");

  // Selectable users for team lead vs admins
  const selectableUsers = userRole === "team_lead" && currentUser?.team_id
    ? availableUsers.filter((u) => u.team_id === currentUser.team_id)
    : availableUsers;

  // Form states
  const [targetMember, setTargetMember] = useState(selectableUsers[0]?.id || "");
  const [selectedCategory, setSelectedCategory] = useState(POLICY_POINT_CATEGORIES[0]?.id || "");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [explanation, setExplanation] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  React.useEffect(() => {
    if (!targetMember && selectableUsers.length > 0) {
      setTargetMember(selectableUsers[0].id);
    }
  }, [selectableUsers, targetMember]);

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

  // Scoped point events based on role
  const visibleEvents = pointEvents.filter((p) => {
    if (isMember) {
      // Ordinary member ONLY sees their own point events!
      return isMatchUser(p.member_id);
    }
    if (userRole === "team_lead" && currentUser?.team_id) {
      // Team lead sees point events of their team members or themselves
      const targetUser = availableUsers.find((u) => u.id === p.member_id);
      return targetUser?.team_id === currentUser.team_id || isMatchUser(p.member_id);
    }
    return true;
  });

  const filteredEvents = visibleEvents.filter((p) => {
    if (filterDirection === "positive") return p.direction === "positive";
    if (filterDirection === "negative") return p.direction === "negative";
    if (filterDirection === "pending") return p.status === "pending_review";
    return true;
  });

  const getMemberName = (id: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id;
  };

  const selectedCatObj = POLICY_POINT_CATEGORIES.find((c) => c.id === selectedCategory);

  const handleRecommend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRecordPoints) {
      alert(
        isAr
          ? "عذراً، صلاحية تسجيل أو اقتراح النقاط مقتصرة على قادة الفرق ومسؤولي الإدارة."
          : "Permission denied: Only team leads and administrators can record points."
      );
      return;
    }
    if (!selectedCatObj || !explanation.trim() || !currentUser) return;

    // Check duplicate deduction prevention
    if (selectedCatObj.direction === "negative") {
      const isDuplicate = isDuplicateDeduction(pointEvents, targetMember, evidenceUrl || explanation);
      if (isDuplicate) {
        alert(
          isAr
            ? "تنبيه: توجد واقعة خصم سابقة مسجلة لنفس الواقعة / الدليل!"
            : "Notice: An existing deduction for this incident/evidence is already on record!"
        );
        return;
      }
    }

    const mapping = OFFICIAL_POINT_TO_CAP_MAPPINGS.find(
      (m) => m.point_category_id === selectedCatObj.id
    );
    const resolvedCapId =
      selectedCatObj.direction === "positive"
        ? mapping?.cap_category_id || "cap-task-exec"
        : undefined;

    addPointEvent({
      member_id: targetMember || availableUsers[0]?.id || "",
      team_id: availableUsers.find((u) => u.id === targetMember)?.team_id || teams[0]?.id || "",
      event_date: eventDate,
      category_id: selectedCatObj.id,
      cap_category_id: resolvedCapId,
      direction: selectedCatObj.direction,
      value: selectedCatObj.default_value,
      explanation,
      evidence_url: evidenceUrl,
      recorded_by: currentUser.id,
      status: "pending_review",
    });

    setExplanation("");
    setEvidenceUrl("");
    setIsRecommendOpen(false);
  };

  // Calculate total approved balance for current view
  const approvedPositive = visibleEvents
    .filter((p) => p.status === "approved" && p.direction === "positive")
    .reduce((sum, p) => sum + p.value, 0);

  const approvedNegative = visibleEvents
    .filter((p) => p.status === "approved" && p.direction === "negative")
    .reduce((sum, p) => sum + p.value, 0);

  const netBalance = approvedPositive + approvedNegative;
  const netTier = getPointClassification(netBalance);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? (isMember ? "سجل نقاطي ومستوى الأداء" : "سجل النقاط الإيجابية والسلبية") : (isMember ? "My Points & Governance" : "Points Ledger Governance")}
        description={
          isAr
            ? isMember
              ? "متابعة رصيد نقاطك المعتمدة، والسقف الشهري لفئات النقاط الإيجابية، وسجل الإجراءات الخاص بك."
              : "نظام النقاط المنفصل تماماً عن التقييم الشهري. يُحسب الرصيد تلقائياً من العمليات المعتمدة فقط مع تطبيق الحدود الشهرية (Caps)."
            : isMember
              ? "Track your approved personal point balance, monthly positive caps, and individual event history."
              : "Policy ledger strictly separate from monthly evaluation scores. Balances are calculated dynamically with monthly caps."
        }
      >
        {canRecordPoints && (
          <Button
            size="sm"
            onClick={() => setIsRecommendOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            {isAr ? "تسجيل واقعة نقاط" : "Record Point Event"}
          </Button>
        )}
      </PageHeader>

      {/* Policy Guardrails Box */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            {isAr
              ? "تنبيه سياسة الموارد البشرية الإلزامية:"
              : "Mandatory Policy Guardrail:"}
          </p>
          <p>
            {isAr
              ? "1. لا يجوز خصم نقاط سلبية دون إخطار العضو ومنحه 48 ساعة للتوضيح. 2. لا يؤدي تراكم النقاط السلبية للفصل المباشر بل للمتابعة والتطوير. 3. المخالفات الجسيمة تُحال للتحقيق ولا تخضع لخصم رقمي."
              : "1. Negative points require evidence + member notification + 48h explanation window. 2. Points never automatically expel members. 3. Serious violations require HR investigation referrals, NOT fixed numeric deductions."}
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border/70 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "إجمالي النقاط الإيجابية المعتمدة" : "Approved Positive Points"}
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            +{approvedPositive} pts
          </p>
        </Card>

        <Card className="p-4 border-border/70 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "إجمالي النقاط السلبية المعتمدة" : "Approved Negative Deductions"}
          </span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {approvedNegative} pts
          </p>
        </Card>

        <Card className="p-4 border-border/70 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr ? "صافي الرصيد المعتمد" : "Net Approved Balance"}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-extrabold text-foreground">
              {netBalance > 0 ? `+${netBalance}` : netBalance} pts
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: `${netTier.color}20`, color: netTier.color }}
            >
              {netTier.label} Tier
            </span>
          </div>
        </Card>
      </div>

      {/* Monthly Cap Categories Breakdown */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>
              {isAr
                ? "الحدود القصوى الشهرية للنقاط الإيجابية (7 فئات معتمدة)"
                : "Monthly Positive Point Caps (7 Policy Categories)"}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {isAr ? "سقف تراكم النقاط شهرياً" : "Monthly cap enforcement layer"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {POLICY_POINT_CAP_CATEGORIES.map((cap) => (
              <div
                key={cap.id}
                className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground truncate max-w-[200px]">
                    {isAr ? cap.name_ar : cap.name}
                  </span>
                  <span className="font-extrabold text-primary">
                    +{cap.points_per_event} / ev
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>{isAr ? "الحد الشهري:" : "Monthly Cap:"}</span>
                  <span className="font-semibold text-foreground">
                    +{cap.monthly_cap} pts max
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 no-scrollbar">
        {[
          { key: "all", label: isAr ? "جميع الحركات" : "All Entries" },
          { key: "pending", label: isAr ? "قيد المراجعة" : "Pending Review" },
          { key: "positive", label: isAr ? "إيجابية فقط" : "Positive Only" },
          { key: "negative", label: isAr ? "سلبية فقط" : "Negative Only" },
        ].map((btn) => (
          <Button
            key={btn.key}
            variant={filterDirection === btn.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterDirection(btn.key)}
            className="text-xs h-8 rounded-full shrink-0"
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">{isAr ? "لا توجد حركات نقاط مسجلة حالياً" : "No point events recorded yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "استخدم زر 'تسجيل / اقتراح حركة نقاط' بالأعلى لتسجيل حركة جديدة." : "Use the 'Recommend Point Event' button above to register a new entry."}</p>
          </Card>
        ) : (
          filteredEvents.map((evt) => (
          <Card
            key={evt.id}
            className="p-4 border-border/70 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-base font-extrabold px-2 py-0.5 rounded-lg ${
                    evt.value > 0
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-rose-500/15 text-rose-600"
                  }`}
                >
                  {evt.value > 0 ? `+${evt.value}` : evt.value} pts
                </span>
                <span className="text-xs font-bold text-foreground">
                  {getMemberName(evt.member_id)}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{evt.event_date}</span>
                <StatusBadge status={evt.status} />
              </div>

              <p className="text-xs text-foreground font-medium">
                {evt.explanation}
              </p>

              {evt.evidence_url && (
                <a
                  href={evt.evidence_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                >
                  <FileCheck className="w-3 h-3" />
                  {isAr ? "معاينة الدليل المرفق" : "View attached evidence"}
                </a>
              )}

              {evt.member_explanation && (
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px]">
                  <strong>{isAr ? "توضيح العضو:" : "Member Explanation:"}</strong>{" "}
                  {evt.member_explanation}
                </div>
              )}
            </div>

            {/* Review Controls (for HR Reviewer or Admin) */}
            {evt.status === "pending_review" && canReviewPoints && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedEventForReview(evt);
                  }}
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isAr ? "مراجعة واعتماد" : "Review"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rejectPointEvent(evt.id, "Rejected by reviewer")}
                  className="text-xs h-8 text-rose-600 hover:bg-rose-500/10 gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {isAr ? "رفض" : "Reject"}
                </Button>
              </div>
            )}
          </Card>
        )))}
      </div>

      {/* Record Point Event Dialog */}
      {isRecommendOpen && canRecordPoints && (
        <Dialog open={isRecommendOpen} onOpenChange={setIsRecommendOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "تسجيل واقعة نقاط جديدة" : "Record Point Event"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRecommend} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "العضو المعني:" : "Target Member:"}
                </label>
                <select
                  value={targetMember}
                  onChange={(e) => setTargetMember(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  {selectableUsers.length === 0 ? (
                    <option value="">{isAr ? "لا يوجد أعضاء مسجلين" : "No members registered"}</option>
                  ) : (
                    selectableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role.replace("_", " ")})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "فئة الواقعة (وفق اللائحة المعتمدة):" : "Policy Category:"}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
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
                <label className="font-semibold text-foreground">
                  {isAr ? "تاريخ الواقعة:" : "Event Date:"}
                </label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "شرح الواقعة والسبب المفصل:" : "Detailed Explanation:"}
                </label>
                <Textarea
                  required
                  rows={3}
                  placeholder={
                    isAr
                      ? "شرح أسباب استحقاق النقاط أو واقعة الخصم..."
                      : "Reason and factual description..."
                  }
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "رابط الدليل (PR / Drive / محادثة موثقة):" : "Evidence Link:"}
                </label>
                <Input
                  placeholder="https://..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecommendOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm">
                  {isAr ? "إرسال للمراجعة" : "Submit to Queue"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Review & Approve Modal */}
      {selectedEventForReview && (
        <Dialog
          open={!!selectedEventForReview}
          onOpenChange={(open) => !open && setSelectedEventForReview(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "اعتماد واقعة النقاط رسميًا" : "Approve Point Event"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-xs">
              <p className="text-muted-foreground">
                Member: <strong className="text-foreground">{getMemberName(selectedEventForReview.member_id)}</strong>
                <br />
                Points:{" "}
                <strong className={selectedEventForReview.value > 0 ? "text-emerald-600" : "text-rose-600"}>
                  {selectedEventForReview.value > 0 ? `+${selectedEventForReview.value}` : selectedEventForReview.value} pts
                </strong>
              </p>
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "مبرر قرار الاعتماد (يسجل في سجل التدقيق):" : "Decision Rationale (Audit Trail):"}
                </label>
                <Textarea
                  rows={2}
                  placeholder={
                    isAr ? "تم التحقق من الدليل واعتماد النقاط..." : "Verified evidence and approved..."
                  }
                  value={reviewRationale}
                  onChange={(e) => setReviewRationale(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEventForReview(null)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    approvePointEvent(selectedEventForReview.id, reviewRationale);
                    setSelectedEventForReview(null);
                    setReviewRationale("");
                  }}
                >
                  {isAr ? "تأكيد الاعتماد" : "Confirm Approval"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
