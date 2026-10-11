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
  const { appeals, submitAppeal, availableUsers, currentUser, locale } = useApp();
  const isAr = locale === "ar";

  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canReviewAppeals = userRole === "super_admin" || userRole === "hr_admin" || userRole === "hr_reviewer";

  const [isNewAppealOpen, setIsNewAppealOpen] = useState(false);
  const [grounds, setGrounds] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [appealType, setAppealType] = useState("point_event");

  // Calculate 7 Egyptian working days from today
  const deadlineDate = calculateWorkingDayDeadline(new Date(), 7);

  const getMemberName = (id: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id;
  };

  // Scoped appeals based on role
  const visibleAppeals = appeals.filter((a) => {
    if (isMember) {
      // Ordinary member ONLY sees appeals lodged by themselves!
      return a.member_id === currentUser?.id;
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
          visibleAppeals.map((app) => (
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

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>Deadline: {app.deadline_date}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Neutral Review Assigned
                </span>
              </div>
            </Card>
          ))
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
    </div>
  );
}
