"use client";

import React, { useState } from "react";
import {
  Scale,
  Plus,
  Clock,
  Calendar,
  CheckCircle,
  FileText,
  AlertCircle,
  UserCheck,
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
import { calculateWorkingDayDeadline } from "@/lib/utils";

export default function AppealsPage() {
  const { appeals, submitAppeal, resolveAppeal, availableUsers, currentUser, locale } = useApp();
  const isAr = locale === "ar";

  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canReviewAppeals = userRole === "super_admin" || userRole === "hr_admin" || userRole === "hr_reviewer";

  const [isNewAppealOpen, setIsNewAppealOpen] = useState(false);
  const [grounds, setGrounds] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [appealType, setAppealType] = useState("point_event");

  // Review & adjudication state
  const [reviewAppealItem, setReviewAppealItem] = useState<any>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewRationale, setReviewRationale] = useState("");
  const [compensatoryPoints, setCompensatoryPoints] = useState<number>(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Calculate 7 Egyptian working days from today
  const deadlineDate = calculateWorkingDayDeadline(new Date(), 7);

  const getMemberName = (id: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id;
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

  // Scoped appeals based on role
  const visibleAppeals = appeals.filter((a) => {
    if (isMember) {
      // Ordinary member ONLY sees appeals lodged by themselves!
      return isMatchUser(a.member_id);
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grounds.trim() || !currentUser) return;

    submitAppeal({
      member_id: currentUser.id,
      entity_type: appealType,
      entity_id: `appeal_${Date.now()}`,
      grounds,
      evidence_url: evidenceUrl,
      deadline_date: deadlineDate.toISOString().split("T")[0],
      status: "under_review",
    });

    setGrounds("");
    setEvidenceUrl("");
    setIsNewAppealOpen(false);
  };

  const handleOpenReview = (appeal: any, decision: "approved" | "rejected") => {
    setReviewAppealItem(appeal);
    setReviewDecision(decision);
    setReviewRationale(
      decision === "approved"
        ? (isAr ? "تم قبول التظلم بعد مراجعة الوثائق وتصحيح الموقف وفق اللائحة." : "Appeal approved following document review and policy reconciliation.")
        : (isAr ? "تم رفض التظلم لعدم استيفاء الشروط أو غياب الدليل القاطع." : "Appeal rejected due to lack of substantive evidence.")
    );
    setCompensatoryPoints(decision === "approved" ? 5 : 0);
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAppealItem) return;
    setIsSubmittingReview(true);
    try {
      await resolveAppeal(
        reviewAppealItem.id,
        reviewDecision,
        reviewRationale,
        reviewDecision === "approved" ? compensatoryPoints : 0
      );
      setReviewAppealItem(null);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? (isMember ? "تظلماتي وطعوني الرسمية" : "التظلمات والطعون الرسمية") : (isMember ? "My Appeals & Grievances" : "Official Appeals & Grievances")}
        description={
          isAr
            ? isMember
              ? "استعراض التظلمات المقدمة منك ومتابعة حالة المراجعة المحايدة ومهلة الـ 7 أيام عمل."
              : "حق مكفول لكل عضو للطعن في أي قرار خلال مهلة 7 أيام عمل رسمية، مع تعيين مراجع محايد مستقل."
            : isMember
              ? "Track your submitted appeals, status determinations, and 7-working-day rights."
              : "Protected right for every member to appeal any penalty or evaluation within 7 Egyptian working days."
        }
      >
        <Button
          size="sm"
          onClick={() => setIsNewAppealOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {isAr ? "تقديم تظلم رسمي" : "Submit Appeal"}
        </Button>
      </PageHeader>

      {/* 7 Working Days Info Banner */}
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold">
            {isAr
              ? "حساب مهلة التظلم (7 أيام عمل مصرية):"
              : "7-Working-Day Egyptian Calendar Guarantee:"}
          </p>
          <p>
            {isAr
              ? "تحسب مهلة الـ 7 أيام من تاريخ إخطار العضو باستثناء يومي الجمعة والسبت (العطلة الأسبوعية) والعطلات الرسمية. إذا قدمت تظلمك اليوم، تكون مهلتك سارية حتى " +
                deadlineDate.toLocaleDateString("ar-EG")
              : "Working days strictly exclude Friday, Saturday (Egyptian weekend), and official public holidays. An appeal submitted today has until " +
                deadlineDate.toLocaleDateString() +
                " for neutral review."}
          </p>
        </div>
      </div>

      {/* Appeals List */}
      <div className="space-y-4">
        {visibleAppeals.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <Scale className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">
              {isAr ? (isMember ? "لا توجد تظلمات مسجلة باسمك حالياً" : "لا توجد تظلمات مسجلة حالياً") : (isMember ? "You have no active appeals on record" : "No appeals or disputes currently submitted")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "يحق لأي عضو تقديم تظلم رسمي بشأن أي خصم أو تقييم خلال 7 أيام عمل مصرية."
                : "Members can appeal within 7 Egyptian working days of any disciplinary entry."}
            </p>
          </Card>
        ) : (
          visibleAppeals.map((app) => {
            const isPendingDecision =
              app.status === "under_review" ||
              app.status === "submitted" ||
              app.status === "info_requested" ||
              !app.status;

            return (
              <Card
                key={app.id}
                className="p-5 border-border/80 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Appeal by: {getMemberName(app.member_id)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Target: {app.entity_type} • Neutral Reviewer: {app.neutral_reviewer_id ? getMemberName(app.neutral_reviewer_id) : "Pending assignment"}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-2">
                  <span className="font-bold text-foreground block">
                    {isAr ? "أسباب التظلم والمبررات:" : "Appeal Grounds & Justification:"}
                  </span>
                  <p className="text-foreground">{app.grounds}</p>

                  {app.evidence_url && (
                    <a
                      href={app.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-[11px] block mt-1"
                    >
                      🔗 {isAr ? "الدليل والوثائق المرفقة" : "Attached Proof / Evidence"}
                    </a>
                  )}
                </div>

                {/* Neutral Determination Output if resolved or rejected */}
                {(app.status === "resolved" || app.status === "rejected" || app.decision_rationale) && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      app.status === "resolved"
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-200"
                        : "bg-rose-500/10 border-rose-500/25 text-rose-950 dark:text-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        {isAr ? "قرار لجنة المراجعة المحايدة:" : "Neutral Review Determination:"}{" "}
                        {app.status === "resolved" ? (isAr ? "مقبول ومُسوّى" : "Approved & Settled") : (isAr ? "مرفوض" : "Rejected")}
                      </span>
                      {app.neutral_reviewer_id && (
                        <span className="text-[11px] font-normal opacity-80">
                          {isAr ? "المراجع: " : "Reviewer: "}{getMemberName(app.neutral_reviewer_id)}
                        </span>
                      )}
                    </div>
                    {app.decision_rationale && (
                      <p className="text-[11px] leading-relaxed opacity-90 pl-5">
                        {app.decision_rationale}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Deadline: {app.deadline_date || "7 Egyptian Working Days"}</span>
                    {app.neutral_reviewer_id && (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Neutral Review Assigned
                      </span>
                    )}
                  </div>

                  {/* Review Actions for Reviewers and Admins */}
                  {canReviewAppeals && isPendingDecision && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 shadow-sm"
                        onClick={() => handleOpenReview(app, "approved")}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {isAr ? "قبول التظلم" : "Approve Appeal"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-8 gap-1.5"
                        onClick={() => handleOpenReview(app, "rejected")}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {isAr ? "رفض التظلم" : "Reject Appeal"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Submit Appeal Dialog */}
      {isNewAppealOpen && (
        <Dialog open={isNewAppealOpen} onOpenChange={setIsNewAppealOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "تقديم طلب تظلم رسمي جديد" : "Submit Formal Appeal"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "موضوع التظلم:" : "Appeal Subject:"}
                </label>
                <select
                  value={appealType}
                  onChange={(e) => setAppealType(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  <option value="point_event">
                    {isAr ? "واقعة نقاط سلبية" : "Negative Point Event"}
                  </option>
                  <option value="evaluation">
                    {isAr ? "تقييم أداء شهري" : "Monthly Evaluation"}
                  </option>
                  <option value="incident">
                    {isAr ? "مخالفة أو إنذار" : "Incident or Warning"}
                  </option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "الأسباب والوقائع الداعمة للتظلم:" : "Grounds & Factual Statement:"}
                </label>
                <Textarea
                  required
                  rows={4}
                  placeholder={
                    isAr
                      ? "اشرح سبب عدم صحة القرار والظروف القهرية إن وُجدت..."
                      : "Describe why the decision should be amended with facts..."
                  }
                  value={grounds}
                  onChange={(e) => setGrounds(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "رابط الوثيقة أو الدليل الرسمي:" : "Official Evidence Link:"}
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
                  onClick={() => setIsNewAppealOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm">
                  {isAr ? "إرسال التظلم" : "Submit to Neutral Review"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Decision Modal */}
      {reviewAppealItem && (
        <Dialog open={!!reviewAppealItem} onOpenChange={(open) => !open && setReviewAppealItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                {isAr ? "المراجعة المحايدة وإصدار القرار" : "Neutral Review & Final Determination"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleConfirmReview} className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-1">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>{isAr ? "صاحب التظلم:" : "Appellant:"} {getMemberName(reviewAppealItem.member_id)}</span>
                  <span>{reviewAppealItem.entity_type}</span>
                </div>
                <p className="text-muted-foreground text-[11px] line-clamp-2">
                  {reviewAppealItem.grounds}
                </p>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1.5">
                  {isAr ? "القرار الرسمي النهائي:" : "Determination Decision:"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewDecision("approved");
                      if (compensatoryPoints === 0) setCompensatoryPoints(5);
                    }}
                    className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      reviewDecision === "approved"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isAr ? "قبول التظلم والتسوية" : "Approve & Settle"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewDecision("rejected");
                      setCompensatoryPoints(0);
                    }}
                    className={`p-2.5 rounded-lg border text-center font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      reviewDecision === "rejected"
                        ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm"
                        : "bg-background border-border text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    {isAr ? "رفض التظلم وتثبيت القرار" : "Reject Appeal"}
                  </button>
                </div>
              </div>

              {reviewDecision === "approved" && (
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "نقاط التعويض والتسوية المستردة (اختياري):" : "Compensatory / Reversal Points (Optional):"}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={compensatoryPoints}
                      onChange={(e) => setCompensatoryPoints(Number(e.target.value))}
                      className="w-28 text-xs h-9"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {isAr
                        ? "تُضاف النقاط تلقائياً في سجل النقاط كتعويض رسمي معتمد."
                        : "Points are automatically credited to the ledger as an approved settlement."}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "السند القانوني والمبررات والأسباب:" : "Determination Rationale & Legal Findings:"}
                </label>
                <Textarea
                  required
                  rows={3}
                  value={reviewRationale}
                  onChange={(e) => setReviewRationale(e.target.value)}
                  placeholder={
                    isAr
                      ? "اكتب مبررات القرار للإخطار بها في السجل والبريد..."
                      : "Document the reasons and policy rationale for the determination..."
                  }
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingReview}
                  onClick={() => setReviewAppealItem(null)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingReview}
                  className={reviewDecision === "approved" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
                >
                  {isSubmittingReview
                    ? (isAr ? "جاري الحفظ..." : "Saving...")
                    : (isAr ? "تأكيد وإصدار القرار" : "Confirm Determination")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
