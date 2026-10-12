"use client";

import React, { useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Edit,
  History,
  ShieldAlert,
  ChevronRight,
  Send,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TrackAssignment,
  TrackSubmission,
  TrackSubmissionAttempt,
  StructuredFeedback,
  GradeCorrectionLog,
} from "@/types";
import { tracksService } from "@/lib/tracks-service";

interface AssignmentAttemptsManagerProps {
  assignment: TrackAssignment;
  submission: TrackSubmission;
  participantName: string;
  isAr: boolean;
  canReview: boolean;
  currentUser: any;
  onRefresh: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function AssignmentAttemptsManager({
  assignment,
  submission,
  participantName,
  isAr,
  canReview,
  currentUser,
  onRefresh,
  isOpen,
  onClose,
}: AssignmentAttemptsManagerProps) {
  const attempts = tracksService.getSubmissionAttempts({
    assignmentId: assignment.id,
    participantId: submission.participant_id,
  });

  const corrections = tracksService.getGradeCorrections();

  const [selectedAttemptForReview, setSelectedAttemptForReview] =
    useState<TrackSubmissionAttempt | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);

  // Review Form State
  const [reviewScore, setReviewScore] = useState(assignment.max_score * 0.85);
  const [reviewAction, setReviewAction] = useState<"accept" | "request_revision">("accept");
  const [resubmissionDeadline, setResubmissionDeadline] = useState(
    new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 16)
  );
  const [resubmissionNotes, setResubmissionNotes] = useState("");
  const [structuredFeedback, setStructuredFeedback] = useState<StructuredFeedback>({
    what_went_well: "Great architectural breakdown and clean separation of concerns.",
    needs_improvement: "Error handling for edge cases and input validation could be enhanced.",
    specific_corrections: "Address boundary checks on empty payload responses.",
    required_changes_for_acceptance: "Refactor async exception handler before final acceptance.",
    required_changes: "Refactor async exception handler before final acceptance.",
    learning_resources: "https://docs.gdgnctu.dev/advanced-patterns",
    next_steps: "Implement retry mechanism and submit updated attempt.",
  });

  // Correction Form State
  const [targetAttemptForCorrection, setTargetAttemptForCorrection] =
    useState<TrackSubmissionAttempt | null>(null);
  const [correctedScore, setCorrectedScore] = useState(reviewScore);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctedFeedback, setCorrectedFeedback] = useState("");

  // Resubmit Form State
  const [resubmitUrl, setResubmitUrl] = useState("https://github.com/gdg-nctu/student-project-v2");
  const [resubmitNotes, setResubmitNotes] = useState("");

  const handleOpenReview = (attempt: TrackSubmissionAttempt) => {
    setSelectedAttemptForReview(attempt);
    setReviewScore(attempt.score ?? Math.round(assignment.max_score * 0.85));
    if (attempt.feedback) {
      setStructuredFeedback(attempt.feedback);
    }
    if (attempt.resubmission_deadline) {
      setResubmissionDeadline(attempt.resubmission_deadline.slice(0, 16));
    }
    if (attempt.resubmission_notes) {
      setResubmissionNotes(attempt.resubmission_notes);
    }
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedAttemptForReview) return;
    tracksService.reviewSubmissionAttempt({
      attemptId: selectedAttemptForReview.id,
      score: Number(reviewScore),
      feedback: structuredFeedback,
      reviewerId: currentUser?.id || "instructor_ahmed",
      reviewerName: currentUser?.full_name || "Lead Instructor",
      action: reviewAction,
      resubmissionDeadline:
        reviewAction === "request_revision" ? resubmissionDeadline : undefined,
      resubmissionNotes:
        reviewAction === "request_revision" ? resubmissionNotes : undefined,
    });
    setIsReviewModalOpen(false);
    onRefresh();
  };

  const handleOpenCorrection = (attempt: TrackSubmissionAttempt) => {
    setTargetAttemptForCorrection(attempt);
    setCorrectedScore(attempt.score ?? 80);
    setCorrectionReason("");
    setCorrectedFeedback(attempt.reviewer_feedback || "");
    setIsCorrectionModalOpen(true);
  };

  const handleSubmitCorrection = () => {
    if (!targetAttemptForCorrection) return;
    if (!correctionReason.trim()) {
      alert(isAr ? "يرجى كتابة سبب التعديل للتوثيق الإداري." : "Please enter a documented reason for this grade correction.");
      return;
    }
    tracksService.correctGrade({
      attemptId: targetAttemptForCorrection.id,
      newScore: Number(correctedScore),
      newFeedback: correctedFeedback,
      correctedBy: currentUser?.id || "admin_sarah",
      correctedByName: currentUser?.full_name || "Super Admin",
      reason: correctionReason,
    });
    setIsCorrectionModalOpen(false);
    onRefresh();
  };

  const handleSubmitResubmission = () => {
    if (!resubmitUrl.trim()) return;
    tracksService.recordSubmissionAttempt({
      assignmentId: assignment.id,
      enrollmentId: submission.enrollment_id,
      participantId: submission.participant_id,
      submissionUrl: resubmitUrl,
      notes: resubmitNotes,
    });
    setIsResubmitModalOpen(false);
    setResubmitNotes("");
    onRefresh();
  };

  const officialCalc = tracksService.calculateOfficialFinalScore(
    assignment.id,
    submission.participant_id
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-[#1a73e8]" />
                  <span>
                    {isAr ? "سجل محاولات التسليم والتقييم" : "Submission Attempts & Evaluation History"}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {participantName} • {assignment.title} (Max {assignment.max_score} pts)
                </DialogDescription>
              </div>

              <div className="text-end">
                <span className="text-[10px] text-muted-foreground block font-medium">
                  {isAr ? "سياسة الدرجة الرسمية:" : "Official Grade Policy:"}
                </span>
                <span className="text-xs font-bold text-primary">
                  {assignment.final_grade_policy || "highest_approved"}
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 space-y-4 text-xs">
            {/* Final Official Score Status Card */}
            <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground block font-semibold">
                  {isAr ? "الدرجة الرسمية المعتمدة الحالية:" : "Current Official Accepted Score:"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#34a853]">
                    {officialCalc.finalScore !== null ? `${officialCalc.finalScore} / ${assignment.max_score}` : "Under Review"}
                  </span>
                  {officialCalc.selectedAttemptNumber > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      From Attempt #{officialCalc.selectedAttemptNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsResubmitModalOpen(true)}
                  className="h-8 text-xs font-semibold gap-1 text-[#1a73e8] border-[#1a73e8]/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {isAr ? "تسليم محاولة جديدة" : "Submit New Attempt"}
                </Button>
              </div>
            </div>

            {/* List of Attempts */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-foreground flex items-center justify-between">
                <span>{isAr ? "جميع المحاولات المسجلة (غير قابلة للحذف):" : "All Recorded Attempts (Immutable):"}</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {attempts.length} {isAr ? "محاولات مسجلة" : "attempts recorded"}
                </span>
              </h4>

              {attempts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                  {isAr ? "لا توجد محاولات مسجلة بعد." : "No attempts recorded yet."}
                </div>
              ) : (
                attempts.map((att) => {
                  const attCorrections = corrections.filter((c) => c.attempt_id === att.id);
                  const isAccepted = att.status === "accepted";
                  const isRevision = att.status === "revision_requested";

                  return (
                    <div
                      key={att.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        isAccepted
                          ? "border-[#34a853]/40 bg-[#34a853]/5"
                          : isRevision
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-border bg-card"
                      }`}
                    >
                      {/* Attempt Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md font-black text-xs bg-primary/10 text-primary">
                            Attempt #{att.attempt_number}
                          </span>
                          <Badge
                            variant={
                              isAccepted
                                ? "success"
                                : isRevision
                                ? "warning"
                                : att.status === "graded"
                                ? "info"
                                : "outline"
                            }
                            className="text-[10px]"
                          >
                            {att.status}
                          </Badge>
                          {att.is_late && (
                            <Badge variant="danger" className="text-[10px]">
                              {isAr ? "متأخر" : "Late"}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(att.submitted_at).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Deliverable URL & Notes */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-medium text-[11px]">
                            {isAr ? "رابط المشروع:" : "Deliverable URL:"}
                          </span>
                          <a
                            href={att.submission_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1 font-semibold"
                          >
                            {att.submission_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {att.notes && (
                          <p className="text-[11px] text-muted-foreground italic">
                            &quot;{att.notes}&quot;
                          </p>
                        )}
                      </div>

                      {/* Review & Score Information */}
                      <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground">
                              {isAr ? "الدرجة المرصودة:" : "Attempt Score:"}
                            </span>
                            <span className="font-black text-sm text-foreground">
                              {att.score !== null ? `${att.score} / ${assignment.max_score}` : "—"}
                            </span>
                          </div>

                          {att.reviewer_name && (
                            <span className="text-[10px] text-muted-foreground">
                              Reviewed by {att.reviewer_name}
                            </span>
                          )}
                        </div>

                        {/* Structured Feedback Breakdown */}
                        {att.feedback && (
                          <div className="space-y-1.5 pt-1.5 border-t border-border/40 text-[11px]">
                            {att.feedback.what_went_well && (
                              <div>
                                <span className="font-bold text-[#34a853]">
                                  {isAr ? "✓ نقاط القوة والتميز:" : "✓ What went well:"}
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {att.feedback.what_went_well}
                                </span>
                              </div>
                            )}
                            {att.feedback.needs_improvement && (
                              <div>
                                <span className="font-bold text-amber-600">
                                  {isAr ? "⚠ نقاط تحتاج تحسين:" : "⚠ Needs improvement:"}
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {att.feedback.needs_improvement}
                                </span>
                              </div>
                            )}
                            {att.feedback.specific_corrections && (
                              <div>
                                <span className="font-bold text-foreground">
                                  {isAr ? "• التعديلات المطلوبة:" : "• Specific corrections:"}
                                </span>{" "}
                                <span className="text-muted-foreground">
                                  {att.feedback.specific_corrections}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Revision Details if requested */}
                        {isRevision && att.resubmission_deadline && (
                          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                            <span className="font-bold block">
                              {isAr ? "مهلة إعادة التسليم:" : "Resubmission Deadline:"}{" "}
                              {new Date(att.resubmission_deadline).toLocaleString()}
                            </span>
                            {att.resubmission_notes && (
                              <p className="mt-0.5">{att.resubmission_notes}</p>
                            )}
                          </div>
                        )}

                        {/* Grade Corrections Audit Trail */}
                        {attCorrections.length > 0 && (
                          <div className="pt-2 border-t border-border/40 space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-amber-500" />
                              {isAr ? "سجل تعديلات الدرجات الموثقة (Audit Log):" : "Grade Correction Audit Trail:"}
                            </span>
                            {attCorrections.map((c) => (
                              <div
                                key={c.id}
                                className="text-[10px] p-1.5 rounded bg-muted/40 border border-border/40 text-muted-foreground"
                              >
                                <span className="font-bold text-foreground">
                                  {c.previous_score} → {c.new_score}
                                </span>{" "}
                                by {c.corrected_by_name} ({new Date(c.corrected_at).toLocaleDateString()}).
                                Reason: &quot;{c.reason}&quot;
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Instructor Action Buttons */}
                      {canReview && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {att.score !== null && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenCorrection(att)}
                              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              {isAr ? "تصحيح الدرجة (Audit)" : "Correct Grade (Audit)"}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => handleOpenReview(att)}
                            className="h-7 text-[11px] font-bold bg-[#1a73e8] text-white"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            {att.status === "accepted" || att.status === "graded"
                              ? isAr
                                ? "إعادة تقييم"
                                : "Re-evaluate Attempt"
                              : isAr
                              ? "تقييم المحاولة"
                              : "Review Attempt"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button size="sm" onClick={onClose} variant="outline">
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal with Structured Feedback */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "تقييم المحاولة وإصدار الملاحظات المنظمة" : "Structured Review & Feedback"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {participantName} • Attempt #{selectedAttemptForReview?.attempt_number}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "الدرجة المستحقة (0 - 100)" : "Attempt Score (0 - 100)"}</Label>
                <Input
                  type="number"
                  min="0"
                  max={assignment.max_score}
                  value={reviewScore}
                  onChange={(e) => setReviewScore(Number(e.target.value))}
                  className="h-8 font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label>{isAr ? "القرار التقييمي" : "Review Action"}</Label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs font-bold"
                >
                  <option value="accept">
                    {isAr ? "قبول واعتماد التسليم (Accept)" : "Accept & Grade Deliverable"}
                  </option>
                  <option value="request_revision">
                    {isAr ? "طلب تعديل وإعادة تسليم (Request Revision)" : "Request Revision / Resubmission"}
                  </option>
                </select>
              </div>
            </div>

            {/* Revision Request Conditional Inputs */}
            {reviewAction === "request_revision" && (
              <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-2">
                <div className="space-y-1">
                  <Label className="text-amber-700 dark:text-amber-400 font-bold">
                    {isAr ? "الموعد النهائي لإعادة التسليم" : "Resubmission Deadline"}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={resubmissionDeadline}
                    onChange={(e) => setResubmissionDeadline(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-amber-700 dark:text-amber-400 font-bold">
                    {isAr ? "تعليمات التعديل المطلوبة" : "Revision Instructions"}
                  </Label>
                  <Textarea
                    value={resubmissionNotes}
                    onChange={(e) => setResubmissionNotes(e.target.value)}
                    placeholder="Describe specific fixes required before acceptance..."
                    className="h-16 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Structured Feedback Fields */}
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="font-bold text-foreground text-xs block">
                {isAr ? "الملاحظات التوجيهية المنظمة:" : "Structured Review Criteria:"}
              </span>

              <div className="space-y-1">
                <Label className="text-[#34a853] font-semibold">
                  {isAr ? "ما تم إنجازه بشكل ممتاز (Strengths)" : "What was done well"}
                </Label>
                <Textarea
                  value={structuredFeedback.what_went_well}
                  onChange={(e) =>
                    setStructuredFeedback({
                      ...structuredFeedback,
                      what_went_well: e.target.value,
                    })
                  }
                  className="h-14 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-amber-600 font-semibold">
                  {isAr ? "جوانب تحتاج إلى تحسين (Improvements)" : "Areas for improvement"}
                </Label>
                <Textarea
                  value={structuredFeedback.needs_improvement}
                  onChange={(e) =>
                    setStructuredFeedback({
                      ...structuredFeedback,
                      needs_improvement: e.target.value,
                    })
                  }
                  className="h-14 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-foreground font-semibold">
                  {isAr ? "مصادر تعليمية مقترحة (Learning Resources)" : "Optional learning resources"}
                </Label>
                <Input
                  value={structuredFeedback.learning_resources}
                  onChange={(e) =>
                    setStructuredFeedback({
                      ...structuredFeedback,
                      learning_resources: e.target.value,
                    })
                  }
                  placeholder="https://docs..."
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsReviewModalOpen(false)}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitReview}
              className="bg-[#1a73e8] text-white font-bold"
            >
              {isAr ? "نشر التقييم والملاحظات" : "Publish Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Correction Audit Modal */}
      <Dialog open={isCorrectionModalOpen} onOpenChange={setIsCorrectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <span>{isAr ? "توثيق تعديل الدرجة في السجل الرقابي" : "Grade Correction Audit"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "يتم توثيق أي تعديل في الدرجة بعد نشرها مع تسجيل هوية الفاحص والسبب."
                : "All post-publication grade adjustments are logged with actor, timestamp, and rationale."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border flex justify-between items-center">
              <span>{isAr ? "الدرجة السابقة:" : "Previous Score:"}</span>
              <span className="font-bold text-foreground">
                {targetAttemptForCorrection?.score ?? "—"} / {assignment.max_score}
              </span>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "الدرجة المعدلة الجديدة" : "New Corrected Score"}</Label>
              <Input
                type="number"
                min="0"
                max={assignment.max_score}
                value={correctedScore}
                onChange={(e) => setCorrectedScore(Number(e.target.value))}
                className="h-8 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[#ea4335] font-bold">
                {isAr ? "سبب التعديل (إلزامي للتوثيق)" : "Correction Reason (Required for Audit)"}
              </Label>
              <Textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Regraded after appeal review or lab evaluation re-check..."
                className="h-20 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCorrectionModalOpen(false)}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitCorrection}
              className="bg-amber-600 text-white font-bold"
            >
              {isAr ? "حفظ التعديل الرقابي" : "Record Correction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participant Resubmission Modal */}
      <Dialog open={isResubmitModalOpen} onOpenChange={setIsResubmitModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#1a73e8]" />
              <span>{isAr ? "تقديم محاولة جديدة للمهمة" : "Submit New Assignment Attempt"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {assignment.title} • {isAr ? "المحاولة رقم" : "Attempt #"} {attempts.length + 1}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "رابط المشروع الجديد (GitHub / Demo)" : "Updated Deliverable URL"}</Label>
              <Input
                value={resubmitUrl}
                onChange={(e) => setResubmitUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "ملاحظات التعديل المنفذ" : "Summary of Changes Made"}</Label>
              <Textarea
                value={resubmitNotes}
                onChange={(e) => setResubmitNotes(e.target.value)}
                placeholder="Fixed edge-cases and updated UI based on instructor feedback..."
                className="h-20 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsResubmitModalOpen(false)}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitResubmission}
              className="bg-[#1a73e8] text-white font-bold"
            >
              {isAr ? "إرسال المحاولة" : "Submit Attempt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
