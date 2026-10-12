"use client";

import React, { useState } from "react";
import {
  HeartHandshake,
  Plus,
  Calendar,
  Lock,
  Target,
  Clock,
  CheckCircle,
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

export default function FeedbackPage() {
  const { feedbackSessions, addFeedbackSession, availableUsers, teams, currentUser, locale } = useApp();
  const isAr = locale === "ar";

  const [feedbackTeamFilter, setFeedbackTeamFilter] = useState("all");

  // Helper to match user to committee
  const isUserInTeam = (u: any, teamId?: string) => {
    if (!teamId || teamId === "all") return true;
    const target = teamId.toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userTeam = (u.team_id || u.team?.id || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userCommittee = (u.committee || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userTeamName = (u.team?.name || "").toLowerCase().trim();

    if (userTeam === target) return true;
    if (userCommittee === target) return true;
    if (userTeam && target && (userTeam.includes(target) || target.includes(userTeam))) return true;
    if (userCommittee && target && (userCommittee.includes(target) || target.includes(userCommittee))) return true;
    if (userTeamName && target && (userTeamName.includes(target) || target.includes(userTeamName))) return true;
    return false;
  };

  const selectableUsersForFeedback = React.useMemo(() => {
    let pool = availableUsers;
    if (feedbackTeamFilter !== "all") {
      pool = pool.filter((u) => isUserInTeam(u, feedbackTeamFilter));
    }
    return pool;
  }, [availableUsers, feedbackTeamFilter]);

  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState(availableUsers[0]?.id || "");
  const [strengths, setStrengths] = useState("");
  const [improvementArea, setImprovementArea] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [supportRequired, setSupportRequired] = useState("");
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [hrPrivateNotes, setHrPrivateNotes] = useState("");

  React.useEffect(() => {
    if (selectableUsersForFeedback.length > 0) {
      if (!targetMemberId || !selectableUsersForFeedback.some((u) => u.id === targetMemberId)) {
        setTargetMemberId(selectableUsersForFeedback[0].id);
      }
    } else {
      setTargetMemberId("");
    }
  }, [selectableUsersForFeedback, targetMemberId]);

  const getMemberName = (id: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id;
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !targetMemberId) return;

    addFeedbackSession({
      member_id: targetMemberId,
      provider_id: currentUser.id,
      date: new Date().toISOString().split("T")[0],
      strengths: strengths.trim() || (isAr ? "التزام ومبادرة إيجابية" : "Positive initiative and commitment"),
      improvement_area: improvementArea.trim() || (isAr ? "متابعة أهداف الأداء المتفق عليها" : "Follow agreed performance targets"),
      next_step: nextStep.trim() || (isAr ? "تسليم مهام المرحلة في الموعد" : "Deliver milestone on schedule"),
      support_required: supportRequired.trim() || (isAr ? "جلسات إرشاد ودعم أسبوعية" : "Weekly guidance and mentoring"),
      follow_up_date: followUpDate,
      hr_private_notes: hrPrivateNotes.trim() || undefined,
      status: "completed",
    });

    setStrengths("");
    setImprovementArea("");
    setNextStep("");
    setSupportRequired("");
    setHrPrivateNotes("");
    setIsNewSessionOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "جلسات المتابعة وخطط التحسين (PIP)" : "Feedback Sessions & PIP Support"}
        description={
          isAr
            ? "جلسات التوجيه الدورية (Strengths, Improvement, Next Steps, Support) وخطط التحسين الشخصية الداعمة."
            : "Constructive feedback loops and Performance Improvement Plans designed to support member development."
        }
      >
        <Button
          size="sm"
          onClick={() => setIsNewSessionOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {isAr ? "تسجيل جلسة متابعة" : "Schedule Feedback Session"}
        </Button>
      </PageHeader>

      {/* Feedback Sessions List */}
      <div className="space-y-4">
        {feedbackSessions.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <HeartHandshake className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">
              {isAr ? "لا توجد جلسات متابعة أو خطط تحسين مسجلة حالياً" : "No feedback or PIP sessions scheduled yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "جلسات المتابعة مصممة لدعم نمو الأعضاء وتوثيق نقاط القوة وخطط التطوير."
                : "Feedback loops are conducted regularly to guide member growth and alignment."}
            </p>
          </Card>
        ) : (
          feedbackSessions.map((fs) => (
          <Card key={fs.id} className="p-5 border-border/80 hover:shadow-md transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {getMemberName(fs.member_id)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Conducted by: {getMemberName(fs.provider_id)} • Date: {fs.date}
                </p>
              </div>
              <StatusBadge status={fs.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                  {isAr ? "نقاط القوة والإشادة:" : "Key Strengths:"}
                </span>
                <p className="text-foreground">{fs.strengths}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                  {isAr ? "مجالات التطوير المقترحة:" : "Areas for Growth:"}
                </span>
                <p className="text-foreground">{fs.improvement_area}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="font-bold text-foreground block mb-1">
                  {isAr ? "الخطوات المتفق عليها:" : "Agreed Next Steps:"}
                </span>
                <p className="text-muted-foreground">{fs.next_step}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="font-bold text-foreground block mb-1">
                  {isAr ? "الدعم المطلوب من الفريق:" : "Support Required from Team:"}
                </span>
                <p className="text-muted-foreground">{fs.support_required}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Follow-up Check: {fs.follow_up_date}
              </span>
              <span className="flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                <Lock className="w-3 h-3 text-muted-foreground" />
                HR Private Notes Encrypted
              </span>
            </div>
          </Card>
        )))}
      </div>

      {/* Schedule Feedback Session Dialog */}
      {isNewSessionOpen && (
        <Dialog open={isNewSessionOpen} onOpenChange={setIsNewSessionOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-primary" />
                <span>
                  {isAr ? "تسجيل جلسة متابعة وتطوير (PIP)" : "Schedule Feedback & PIP Session"}
                </span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateSession} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "اللجنة / المسار (تصفية الأعضاء):" : "Committee / Track (Filter):"}
                </label>
                <select
                  value={feedbackTeamFilter}
                  onChange={(e) => {
                    const tId = e.target.value;
                    setFeedbackTeamFilter(tId);
                    const filtered = availableUsers.filter((u) => isUserInTeam(u, tId));
                    if (filtered.length > 0 && !filtered.some((u) => u.id === targetMemberId)) {
                      setTargetMemberId(filtered[0].id);
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
                  {isAr ? "العضو المعني بالجلسة (ضمن اللجنة):" : "Target Member (Within Committee):"}
                </label>
                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  required
                >
                  {selectableUsersForFeedback.length === 0 ? (
                    <option value="">{isAr ? "لا يوجد أعضاء في هذه اللجنة" : "No members in this committee"}</option>
                  ) : (
                    selectableUsersForFeedback.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role.replace("_", " ")})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "نقاط القوة والإشادة (Strengths):" : "Strengths & Commendations:"}
                </label>
                <Textarea
                  rows={2}
                  required
                  placeholder={
                    isAr
                      ? "ما تميز به العضو خلال الفترة الماضية..."
                      : "Key positive contributions and demonstrations..."
                  }
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "مجالات التطوير والتحسين (Growth Areas):" : "Areas for Growth & Improvement:"}
                </label>
                <Textarea
                  rows={2}
                  required
                  placeholder={
                    isAr
                      ? "النقاط التي تحتاج إلى تركيز وتطوير..."
                      : "Specific skills or habits to develop..."
                  }
                  value={improvementArea}
                  onChange={(e) => setImprovementArea(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "الخطوات القادمة المتفق عليها:" : "Agreed Next Steps:"}
                  </label>
                  <Input
                    required
                    placeholder={isAr ? "أهداف محددة وقابلة للقياس" : "Concrete milestones"}
                    value={nextStep}
                    onChange={(e) => setNextStep(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "الدعم المطلوب من الفريق:" : "Support Required:"}
                  </label>
                  <Input
                    required
                    placeholder={isAr ? "توجيه، تدريب، أو تخفيف عبء" : "Mentorship, tooling, or check-ins"}
                    value={supportRequired}
                    onChange={(e) => setSupportRequired(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "تاريخ جلسة المتابعة القادمة:" : "Follow-up Date:"}
                  </label>
                  <Input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "ملاحظات سرية لفريق الموارد (اختياري):" : "HR Confidential Notes (Optional):"}
                  </label>
                  <Input
                    placeholder={isAr ? "مشفرة ولا تظهر للعضو" : "Encrypted HR internal record"}
                    value={hrPrivateNotes}
                    onChange={(e) => setHrPrivateNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewSessionOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-white">
                  {isAr ? "توثيق الجلسة" : "Save & Finalize Session"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
