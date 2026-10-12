"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle2,
  Settings,
  Filter,
  Plus,
  Search,
  MessageSquare,
  Calendar,
  AlertCircle,
  TrendingDown,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  RiskFollowUpCase,
  RiskRule,
  RiskSeverity,
  CaseActionLog,
} from "@/types";
import { tracksService } from "@/lib/tracks-service";

interface AtRiskDashboardProps {
  isAr: boolean;
  canManage: boolean;
  currentUser: any;
  selectedTrackId: string;
  onRefresh: () => void;
}

export function AtRiskDashboard({
  isAr,
  canManage,
  currentUser,
  selectedTrackId,
  onRefresh,
}: AtRiskDashboardProps) {
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeCaseForAction, setActiveCaseForAction] = useState<RiskFollowUpCase | null>(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Case Action Form State
  const [caseStatus, setCaseStatus] = useState<RiskFollowUpCase["status"]>("contact_attempted");
  const [assignedOwnerName, setAssignedOwnerName] = useState("");
  const [followUpDeadline, setFollowUpDeadline] = useState("");
  const [nextActionNote, setNextActionNote] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [newActionType, setNewActionType] = useState<
    | "supportive_reminder"
    | "clarify_requirements"
    | "office_hours_mentor"
    | "workload_extension"
    | "additional_learning_resources"
    | "technical_blocker"
  >("office_hours_mentor");
  const [newActionDescription, setNewActionDescription] = useState(
    "Scheduled 1-on-1 office hours to review missing project milestones and clarify submission criteria."
  );
  const [newActionOutcome, setNewActionOutcome] = useState("Participant confirmed attendance.");

  // Evaluate Live Risk Results
  const evaluationResults = tracksService.evaluateAtRiskParticipants();
  const cases = tracksService.getRiskFollowUpCases({
    trackId: selectedTrackId,
    status: filterStatus,
    riskLevel: filterRiskLevel,
  });
  const rules = tracksService.getRiskRules();
  const allActionLogs = tracksService.getCaseActions();

  // Metrics
  const urgentCount = cases.filter((c) => c.risk_level === "urgent_support").length;
  const needsFollowUpCount = cases.filter((c) => c.risk_level === "needs_follow_up").length;
  const monitorCount = cases.filter((c) => c.risk_level === "monitor").length;
  const resolvedCount = cases.filter((c) => c.status === "resolved" || c.status === "closed").length;
  const openCasesCount = cases.filter((c) => c.status !== "resolved" && c.status !== "closed").length;

  const filteredCases = cases.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.participant_name.toLowerCase().includes(q) ||
        c.participant_email?.toLowerCase().includes(q) ||
        c.track_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCaseModal = (c: RiskFollowUpCase) => {
    setActiveCaseForAction(c);
    setCaseStatus(c.status);
    setAssignedOwnerName(c.assigned_owner_name);
    setFollowUpDeadline(c.follow_up_deadline);
    setNextActionNote(c.next_action || "");
    setResolutionNotes(c.resolution_notes || "");
    setIsCaseModalOpen(true);
  };

  const handleSaveCaseUpdates = () => {
    if (!activeCaseForAction) return;

    // Update case status & notes
    tracksService.updateRiskCaseStatus(
      activeCaseForAction.id,
      caseStatus,
      nextActionNote,
      resolutionNotes
    );

    // Record action log if description provided
    if (newActionDescription.trim()) {
      tracksService.addCaseAction({
        case_id: activeCaseForAction.id,
        action_type: newActionType,
        description: newActionDescription,
        performed_by_id: currentUser?.id || "mentor_nour",
        performed_by_name: currentUser?.full_name || "Mentor Nour",
        participant_response: newActionOutcome,
        agreed_next_steps: nextActionNote,
        next_deadline: followUpDeadline,
      });
    }

    setIsCaseModalOpen(false);
    onRefresh();
  };

  const handleToggleRule = (ruleId: string) => {
    tracksService.toggleRiskRule(ruleId);
    onRefresh();
  };

  const handleUpdateRuleThreshold = (ruleId: string, val: number) => {
    const r = rules.find((item) => item.id === ruleId);
    if (!r) return;
    tracksService.saveRiskRule({
      ...r,
      threshold_value: val,
    });
    onRefresh();
  };

  return (
    <div className="space-y-5">
      {/* Non-punitive Ethical Guiding Banner */}
      <Card className="border-border/80 bg-blue-500/5 dark:bg-blue-900/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  {isAr
                    ? "نظام الدعم والمتابعة المبكرة (غير عقابي)"
                    : "Early Support & Academic Intervention (Non-Punitive)"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr
                    ? "تنبيهات التعثر هي إشارات لتقديم الدعم والإرشاد، وليست دليلاً على التقصير. يتم استبعاد الإجازات المعتمدة ومهل التسليم تلقائياً."
                    : "Risk indicators are supportive signals to schedule mentoring, never grounds for dismissal. Excused absences and extensions are excluded."}
                </p>
              </div>
            </div>

            {canManage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRulesModalOpen(true)}
                className="h-8 text-xs font-semibold gap-1.5 shrink-0 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isAr ? "إعدادات ومعايير التعثر" : "Configure Risk Rules"}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3 border-border/80 bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground flex justify-between">
            <span>{isAr ? "الحالات المفتوحة" : "Open Cases"}</span>
            <AlertCircle className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {openCasesCount}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isAr ? "تحت المتابعة الفعالة" : "Active follow-up"}
          </span>
        </Card>

        <Card className="p-3 border-red-500/30 bg-red-500/5">
          <div className="text-[11px] font-semibold text-red-600 flex justify-between">
            <span>{isAr ? "دعم عاجل" : "Urgent Support"}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">
            {urgentCount}
          </div>
          <span className="text-[10px] text-red-600/80">
            {isAr ? "تراكم غياب أو تعثر" : "Multiple blockers"}
          </span>
        </Card>

        <Card className="p-3 border-amber-500/30 bg-amber-500/5">
          <div className="text-[11px] font-semibold text-amber-600 flex justify-between">
            <span>{isAr ? "بحاجة لمتابعة" : "Needs Follow-Up"}</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {needsFollowUpCount}
          </div>
          <span className="text-[10px] text-amber-600/80">
            {isAr ? "تجاوز مهلة أو غيابين" : "Approaching limits"}
          </span>
        </Card>

        <Card className="p-3 border-blue-500/30 bg-blue-500/5">
          <div className="text-[11px] font-semibold text-blue-600 flex justify-between">
            <span>{isAr ? "قيد الملاحظة" : "Monitor"}</span>
            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {monitorCount}
          </div>
          <span className="text-[10px] text-blue-600/80">
            {isAr ? "إشارة أولية مبكرة" : "Early heads-up"}
          </span>
        </Card>

        <Card className="p-3 border-[#34a853]/30 bg-[#34a853]/5">
          <div className="text-[11px] font-semibold text-[#34a853] flex justify-between">
            <span>{isAr ? "حالات تم حلها" : "Resolved"}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34a853]" />
          </div>
          <div className="text-2xl font-black text-[#34a853] mt-1">
            {resolvedCount}
          </div>
          <span className="text-[10px] text-[#34a853]/80">
            {isAr ? "استعادوا التقدم" : "Back on track"}
          </span>
        </Card>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isAr ? "بحث بالمتدرب أو المسار..." : "Search participant or track..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-8 pl-3 pr-8"
            />
          </div>

          <select
            value={filterRiskLevel}
            onChange={(e) => setFilterRiskLevel(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-lg border border-border bg-background"
          >
            <option value="all">{isAr ? "جميع مستويات التعثر" : "All Risk Levels"}</option>
            <option value="urgent_support">{isAr ? "دعم عاجل (Urgent)" : "Urgent Support"}</option>
            <option value="needs_follow_up">{isAr ? "بحاجة لمتابعة (Follow-Up)" : "Needs Follow-Up"}</option>
            <option value="monitor">{isAr ? "قيد الملاحظة (Monitor)" : "Monitor"}</option>
            <option value="resolved">{isAr ? "تم حلها (Resolved)" : "Resolved"}</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-lg border border-border bg-background"
          >
            <option value="all">{isAr ? "جميع حالات المتابعة" : "All Case Statuses"}</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="contact_attempted">Contact Attempted</option>
            <option value="support_plan_active">Support Plan Active</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          className="h-8 text-xs font-semibold gap-1 text-[#1a73e8]"
        >
          <span>{isAr ? "إعادة فحص المؤشرات" : "Re-evaluate Flags"}</span>
        </Button>
      </div>

      {/* At-Risk Cases & Live Evidence Table */}
      <div className="space-y-3">
        {filteredCases.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#34a853]" />
            <p className="text-xs font-bold">
              {isAr ? "لا توجد حالات تعثر مطابقة للمعايير المحددة." : "No at-risk cases found matching filters."}
            </p>
          </Card>
        ) : (
          filteredCases.map((c) => {
            const isUrgent = c.risk_level === "urgent_support";
            const isNeedsFollowUp = c.risk_level === "needs_follow_up";
            const isResolved = c.status === "resolved" || c.status === "closed";

            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isUrgent
                    ? "border-red-500/40 bg-red-500/5"
                    : isNeedsFollowUp
                    ? "border-amber-500/40 bg-amber-500/5"
                    : isResolved
                    ? "border-[#34a853]/40 bg-[#34a853]/5"
                    : "border-border bg-card"
                }`}
              >
                {/* Case Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-foreground">
                      {c.participant_name}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {c.track_name} ({c.cohort})
                    </Badge>
                    <Badge
                      variant={
                        isUrgent
                          ? "danger"
                          : isNeedsFollowUp
                          ? "warning"
                          : isResolved
                          ? "success"
                          : "info"
                      }
                      className="text-[10px] font-black uppercase"
                    >
                      {c.risk_level.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Status: {c.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {isAr ? "المسؤول:" : "Owner:"}{" "}
                      <strong className="text-foreground">{c.assigned_owner_name}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[#ea4335] font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {isAr ? "الموعد:" : "Due:"} {c.follow_up_deadline}
                    </span>
                  </div>
                </div>

                {/* Transparent Evidence Indicators Strip */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    {isAr ? "المؤشرات والأدلة الرقمية المسببة للتنبيه:" : "Triggering Indicators & Evidence:"}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {c.triggering_indicators.map((ind, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-background/80 border border-border/60 text-xs flex items-start gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-foreground text-[11px] block">
                            {ind.rule_name}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                            {isAr ? ind.evidence_ar || ind.evidence : ind.evidence}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Support Plan & Actions */}
                <div className="p-2.5 rounded-lg bg-background/60 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-foreground">
                      {isAr ? "خطة الدعم المقترحة:" : "Support Plan:"}{" "}
                    </span>
                    <span className="text-muted-foreground">
                      {c.recommended_action || "Schedule 1-on-1 coaching session."}
                    </span>
                    {c.next_action && (
                      <p className="text-[11px] text-primary font-medium mt-0.5">
                        ↳ Next: {c.next_action}
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenCaseModal(c)}
                      className="h-7 text-xs font-bold bg-[#1a73e8] text-white shrink-0"
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      {isAr ? "إدارة خطة المتابعة" : "Manage Case & Actions"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Case Management Dialog */}
      <Dialog open={isCaseModalOpen} onOpenChange={setIsCaseModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#1a73e8]" />
              <span>{isAr ? "إدارة حالة المتابعة والدعم الأكاديمي" : "Follow-Up Case Management"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {activeCaseForAction?.participant_name} • {activeCaseForAction?.track_name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs">
            {/* Case Status & Assignment Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "حالة الملف" : "Case Status"}</Label>
                <select
                  value={caseStatus}
                  onChange={(e) => setCaseStatus(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs font-bold"
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="contact_attempted">Contact Attempted</option>
                  <option value="awaiting_participant_response">Awaiting Participant Response</option>
                  <option value="support_plan_active">Support Plan Active</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="resolved">Resolved (Back on Track)</option>
                  <option value="closed">Closed (No Action Required)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>{isAr ? "المسؤول عن المتابعة" : "Assigned Owner"}</Label>
                <Input
                  value={assignedOwnerName}
                  onChange={(e) => setAssignedOwnerName(e.target.value)}
                  className="h-8 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label>{isAr ? "مهلة الإنجاز" : "Follow-Up Deadline"}</Label>
                <Input
                  type="date"
                  value={followUpDeadline}
                  onChange={(e) => setFollowUpDeadline(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Log New Support Action */}
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
              <span className="font-bold text-xs text-primary block">
                {isAr ? "توثيق إجراء دعم جديد:" : "Log New Supportive Intervention:"}
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{isAr ? "نوع الإجراء" : "Action Type"}</Label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs"
                  >
                    <option value="office_hours_mentor">Office Hours / 1-on-1 Mentoring</option>
                    <option value="clarify_requirements">Clarifying Assignment Requirements</option>
                    <option value="supportive_reminder">Supportive Gentle Reminder</option>
                    <option value="workload_extension">Workload Review & Extension</option>
                    <option value="technical_blocker">Technical Blocker Resolution</option>
                    <option value="additional_learning_resources">Additional Learning Resources</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>{isAr ? "استجابة المتدرب" : "Participant Response"}</Label>
                  <Input
                    value={newActionOutcome}
                    onChange={(e) => setNewActionOutcome(e.target.value)}
                    placeholder="E.g. Understood requirements, will submit by Friday."
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>{isAr ? "تفاصيل الإجراء والملاحظات" : "Action Notes"}</Label>
                <Textarea
                  value={newActionDescription}
                  onChange={(e) => setNewActionDescription(e.target.value)}
                  placeholder="Detail the discussion and agreed remedies..."
                  className="h-14 text-xs"
                />
              </div>
            </div>

            {/* Next Steps & Resolution */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>{isAr ? "الخطوة القادمة المتفق عليها" : "Agreed Next Step"}</Label>
                <Input
                  value={nextActionNote}
                  onChange={(e) => setNextActionNote(e.target.value)}
                  placeholder="Submit Assignment 2 draft by next Tuesday."
                  className="h-8 text-xs font-semibold"
                />
              </div>

              {(caseStatus === "resolved" || caseStatus === "closed") && (
                <div className="space-y-1">
                  <Label className="text-[#34a853] font-bold">
                    {isAr ? "ملاحظات إغلاق الحالة والحل" : "Resolution Summary Notes"}
                  </Label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Participant submitted outstanding work and resumed regular attendance..."
                    className="h-14 text-xs"
                  />
                </div>
              )}
            </div>

            {/* History of Past Actions on this Case */}
            {activeCaseForAction && (
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="font-bold text-xs text-muted-foreground block">
                  {isAr ? "سجل الإجراءات السابقة للحالة:" : "Action History Log:"}
                </span>
                {allActionLogs
                  .filter((a) => a.case_id === activeCaseForAction.id)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-lg bg-muted/30 border border-border/50 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="font-bold text-foreground">
                          {log.action_type.replace(/_/g, " ")} by {log.performed_by_name}
                        </span>
                        <span>
                          {new Date(log.created_at || log.timestamp || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{log.description}</p>
                      {log.participant_response && (
                        <p className="text-primary italic">
                          Response: &quot;{log.participant_response}&quot;
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCaseModalOpen(false)}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCaseUpdates}
              className="bg-[#1a73e8] text-white font-bold"
            >
              {isAr ? "حفظ التحديثات والإجراء" : "Save Case Updates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Risk Rules & Thresholds Config Modal */}
      <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>{isAr ? "تخصيص قواعد ومؤشرات التعثر" : "Configure At-Risk Rules & Thresholds"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "تعديل المعايير الرقمية لكشف الحالات قبل التفعيل التشغيلي."
                : "Adjust numerical thresholds, evaluation periods, and severities for early intervention."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 rounded-xl border border-border bg-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-xs">{rule.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {rule.severity.replace("_", " ")}
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    variant={rule.enabled ? "default" : "outline"}
                    onClick={() => handleToggleRule(rule.id)}
                    className={`h-6 text-[10px] ${
                      rule.enabled ? "bg-[#34a853] text-white" : "text-muted-foreground"
                    }`}
                  >
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {rule.description}
                </p>

                <div className="flex items-center gap-4 pt-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-semibold">
                      {isAr ? "قيمة الحد (Threshold):" : "Threshold Value:"}
                    </span>
                    <Input
                      type="number"
                      value={rule.threshold_value}
                      onChange={(e) =>
                        handleUpdateRuleThreshold(rule.id, Number(e.target.value))
                      }
                      className="h-6 w-20 text-xs font-bold"
                    />
                  </div>

                  <div className="text-muted-foreground">
                    <span>Target: {rule.target_metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button size="sm" onClick={() => setIsRulesModalOpen(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
