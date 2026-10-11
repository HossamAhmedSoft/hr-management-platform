"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Plus,
  Scale,
  FileCheck,
  CheckCircle,
  Clock,
  ArrowDown,
  Info,
  Edit,
  Trash2,
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
import { Incident } from "@/types";

export default function IncidentsPage() {
  const {
    incidents,
    addIncident,
    updateIncident,
    deleteIncident,
    availableUsers,
    teams,
    currentUser,
    locale,
  } = useApp();
  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canLogIncident =
    userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";

  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [incidentTeamFilter, setIncidentTeamFilter] = useState<string>("all");

  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [targetMemberId, setTargetMemberId] = useState(availableUsers[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<number>(1);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Edit Incident State
  const [isEditIncidentOpen, setIsEditIncidentOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLevel, setEditLevel] = useState<number>(1);
  const [editResolutionNotes, setEditResolutionNotes] = useState("");
  const [editStatus, setEditStatus] = useState<Incident["status"]>("open");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Incident State
  const [isDeleteIncidentOpen, setIsDeleteIncidentOpen] = useState(false);
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

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

  const selectableUsersForIncident = React.useMemo(() => {
    let pool = availableUsers;
    if (userRole === "team_lead" && currentUser?.team_id) {
      pool = pool.filter((u) => isUserInTeam(u, currentUser.team_id));
    }
    if (incidentTeamFilter !== "all") {
      pool = pool.filter((u) => isUserInTeam(u, incidentTeamFilter));
    }
    return pool;
  }, [availableUsers, currentUser, userRole, incidentTeamFilter]);

  React.useEffect(() => {
    if (!targetMemberId && selectableUsersForIncident.length > 0) {
      setTargetMemberId(selectableUsersForIncident[0].id);
    }
  }, [selectableUsersForIncident, targetMemberId]);

  // Robust matching helper
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

  const visibleIncidents = incidents.filter((inc) => {
    if (isMember) {
      return isMatchUser(inc.target_member_id || inc.member_id);
    }
    if (userRole === "team_lead" && currentUser?.team_id) {
      const targetUser = availableUsers.find((u) => u.id === (inc.target_member_id || inc.member_id));
      if (targetUser && !isUserInTeam(targetUser, currentUser.team_id) && !isMatchUser(inc.target_member_id || inc.member_id)) {
        return false;
      }
    }
    if (filterTeam !== "all") {
      const targetUser = availableUsers.find((u) => u.id === (inc.target_member_id || inc.member_id));
      if (!targetUser || !isUserInTeam(targetUser, filterTeam)) {
        return false;
      }
    }
    return true;
  });

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMemberId = targetMemberId || availableUsers[0]?.id;
    if (!currentUser || !finalMemberId || !title.trim()) return;

    addIncident({
      title: title.trim(),
      description: description.trim(),
      member_id: finalMemberId,
      target_member_id: finalMemberId,
      reported_by: currentUser.id,
      status: "open",
      level: level as 1 | 2 | 3 | 4,
      escalation_level: level,
      decision_notes: resolutionNotes.trim() || undefined,
    });

    setTitle("");
    setDescription("");
    setResolutionNotes("");
    setLevel(1);
    setIsNewIncidentOpen(false);
  };

  // Open Edit Modal
  const openEditModal = (inc: Incident, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingIncident(inc);
    setEditTitle(inc.title);
    setEditDescription(inc.description);
    setEditLevel(inc.level || inc.escalation_level || 1);
    setEditResolutionNotes(inc.decision_notes || "");
    setEditStatus(inc.status || "open");
    setIsEditIncidentOpen(true);
  };

  // Save Edit Incident
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident || !editTitle.trim()) return;
    setIsSubmittingEdit(true);

    const success = await updateIncident(editingIncident.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      level: editLevel as any,
      escalation_level: editLevel,
      decision_notes: editResolutionNotes.trim() || undefined,
      status: editStatus,
    });

    if (success) {
      setIsEditIncidentOpen(false);
      setEditingIncident(null);
    } else {
      alert(isAr ? "فشل تعديل الإشعار" : "Failed to update incident");
    }
    setIsSubmittingEdit(false);
  };

  // Open Delete Modal
  const openDeleteModal = (inc: Incident, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingIncident(inc);
    setIsDeleteIncidentOpen(true);
  };

  // Confirm Delete Incident
  const handleConfirmDelete = async () => {
    if (!deletingIncident) return;
    setIsSubmittingDelete(true);
    const success = await deleteIncident(deletingIncident.id);
    if (success) {
      setIsDeleteIncidentOpen(false);
      setDeletingIncident(null);
    } else {
      alert(isAr ? "فشل حذف الإشعار" : "Failed to delete incident");
    }
    setIsSubmittingDelete(false);
  };

  const getMemberName = (id: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id;
  };

  const ladderSteps = [
    {
      level: 1,
      title: isAr ? "المستوى 1: تنبيه ودي مباشر" : "Level 1: Friendly Notice",
      color: "border-[#1a73e8] bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]",
      desc: isAr
        ? "جلسة توجيه غير رسمية 1-on-1 مع قائد الفريق للتنبيه الودي وتحديد أوجه الدعم والمساندة."
        : "Informal 1-on-1 dialogue with Team Lead focusing on friendly alignment and support.",
    },
    {
      level: 2,
      title: isAr ? "المستوى 2: خطة تحسين الأداء (PIP)" : "Level 2: PIP Plan",
      color: "border-[#fbbc04] bg-[#fef7e0] dark:bg-[#fbbc04]/20 text-[#b06000] dark:text-[#fdd663]",
      desc: isAr
        ? "خطة تطوير واضحة ومحددة زمنياً (1-2 أسبوع) بالتعاون بين قائد الفريق وإدارة الموارد البشرية."
        : "Structured Performance Improvement Plan (1-2 weeks) overseen by HR and Lead.",
    },
    {
      level: 3,
      title: isAr ? "المستوى 3: مراجعة قائد ونائب الفريق" : "Level 3: Head/Vice Head Review",
      color: "border-[#e37400] bg-[#feefe3] dark:bg-[#e37400]/20 text-[#b06000] dark:text-[#fcad70]",
      desc: isAr
        ? "اجتماع رسمي ثلاثي مشترك لمناقشة التحديات والوصول لحلول جذرية أو تعديل نطاق المهام."
        : "Joint formal session with Team Head & Vice Head to resolve operational roadblocks.",
    },
    {
      level: 4,
      title: isAr ? "المستوى 4: تصعيد لقيادة مجتمع GDG" : "Level 4: Chapter Leadership",
      color: "border-[#ea4335] bg-[#fce8e6] dark:bg-[#ea4335]/20 text-[#c5221f] dark:text-[#f28b82]",
      desc: isAr
        ? "جلسة استماع نهائية بحضور قيادة الفرع والـ HR لتحديد القرارات الإدارية المناسبة."
        : "Final administrative hearing with Chapter Leadership & HR for conclusive resolutions.",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? (isMember ? "سجل إشعاراتي وحالات المتابعة" : "إدارة حالات التصعيد المتدرج") : (isMember ? "My Escalation Records" : "Escalation Ladder Governance")}
        description={
          isAr
            ? isMember
              ? "متابعة الإشعارات الإدارية الخاصة بك، وحالة كل إجراء مع حق تقديم تظلم رسمي خلال 7 أيام عمل."
              : "نظام حل النزاعات وتدرج المعالجة المكون من 4 مستويات لضمان العدالة والشفافية وتجنب القرارات المفاجئة."
            : isMember
              ? "Review administrative notices addressed to you with immediate appeal rights within 7 working days."
              : "Structured 4-tier conflict escalation ladder ensuring fair warnings, mediation, and transparent hearings."
        }
      >
        {canLogIncident && (
          <Button
            size="sm"
            onClick={() => setIsNewIncidentOpen(true)}
            className="gap-2 bg-[#ea4335] hover:bg-[#d93025] text-white"
          >
            <Plus className="w-4 h-4" />
            {isAr ? "تسجيل واقعة تصعيد" : "Log Escalation Case"}
          </Button>
        )}
      </PageHeader>

      {/* Escalation Ladder Visualization */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              {isAr ? "سلّم التصعيد التدريجي المعتمد باللائحة" : "Official 4-Level Progressive Ladder"}
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {isAr ? "معالجة تدريجية تبدأ بالتوجيه" : "Constructive Resolution Path"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {ladderSteps.map((step) => (
              <div
                key={step.level}
                className={`p-3.5 rounded-xl border-l-4 rtl:border-l-0 rtl:border-r-4 ${step.color} space-y-1.5`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>{step.title}</span>
                  <span className="opacity-70 font-mono">L{step.level}</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {isAr ? "سجل الحالات المفتوحة والإجراءات الإدارية" : "Active Escalation Incidents"} ({visibleIncidents.length})
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

        <div className="space-y-3">
          {visibleIncidents.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
              <p className="text-sm font-semibold">{isAr ? "لا توجد حالات تصعيد مسجلة حالياً" : "No escalation cases recorded"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "بيئة العمل تسير بانسجام وفق أعلى معايير الحوكمة والتعاون." : "All committees are operating smoothly under fair governance principles."}
              </p>
            </Card>
          ) : (
            visibleIncidents.map((inc) => (
              <Card
                key={inc.id}
                className="p-4 border-border/70 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fce8e6] dark:bg-[#ea4335]/20 text-[#ea4335] dark:text-[#f28b82]">
                        Level {inc.level || inc.escalation_level || 1}
                      </span>
                      <h4 className="font-bold text-xs text-foreground">
                        {inc.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Target Member: <strong>{getMemberName(inc.target_member_id || inc.member_id || "")}</strong> • Reported by: {getMemberName(inc.reported_by)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={inc.status} size="sm" />
                    {canLogIncident && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => openEditModal(inc, e)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title={isAr ? "تعديل الإشعار" : "Edit Incident"}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => openDeleteModal(inc, e)}
                          className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-500/10"
                          title={isAr ? "حذف الإشعار" : "Delete Incident"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-foreground bg-[#f8f9fa] dark:bg-[#202124] p-3 rounded-md border border-border">
                  {inc.description}
                </p>

                {inc.decision_notes && (
                  <div className="text-xs text-[#137333] dark:text-[#81c995] bg-[#e6f4ea] dark:bg-[#34a853]/20 p-2.5 rounded-md border border-[#ceead6] dark:border-[#34a853]/30">
                    <strong>{isAr ? "القرار الرسمي والتسوية:" : "Formal Resolution Note:"}</strong>{" "}
                    {inc.decision_notes}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Incident Dialog */}
      {isEditIncidentOpen && editingIncident && (
        <Dialog open={isEditIncidentOpen} onOpenChange={setIsEditIncidentOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                <span>{isAr ? "تعديل الإشعار الإداري" : "Edit Incident"}</span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "مستوى التصعيد:" : "Level:"}
                </label>
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(parseInt(e.target.value))}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  <option value={1}>{isAr ? "المستوى 1: تنبيه وتوجيه ودي مباشر" : "Level 1: Friendly Notice"}</option>
                  <option value={2}>{isAr ? "المستوى 2: خطة تحسين الأداء PIP" : "Level 2: PIP Plan"}</option>
                  <option value={3}>{isAr ? "المستوى 3: مراجعة قائد ونائب الفريق" : "Level 3: Head/Vice Head Review"}</option>
                  <option value={4}>{isAr ? "المستوى 4: تصعيد لقيادة مجتمع GDG" : "Level 4: Chapter Leadership Hearing"}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "عنوان الواقعة:" : "Incident Title:"}
                </label>
                <Input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "تفاصيل وسياق الواقعة:" : "Documented Statement:"}
                </label>
                <Textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "ملاحظات التسوية / الإجراء التصحيحي:" : "Resolution Notes:"}
                </label>
                <Input
                  value={editResolutionNotes}
                  onChange={(e) => setEditResolutionNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditIncidentOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEdit}
                  size="sm"
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
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Incident Dialog */}
      {isDeleteIncidentOpen && deletingIncident && (
        <Dialog open={isDeleteIncidentOpen} onOpenChange={setIsDeleteIncidentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5 text-rose-600" />
                {isAr ? "تأكيد حذف الإشعار الإداري" : "Confirm Incident Deletion"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-foreground">
                {isAr
                  ? `هل أنت متأكد من رغبتك في حذف الإشعار "${deletingIncident.title}"؟`
                  : `Are you sure you want to delete incident "${deletingIncident.title}"?`}
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteIncidentOpen(false)}
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

      {/* Log Escalation Incident Dialog */}
      {isNewIncidentOpen && (
        <Dialog open={isNewIncidentOpen} onOpenChange={setIsNewIncidentOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#ea4335]" />
                <span>
                  {isAr ? "تسجيل واقعة تصعيد إداري" : "Log Escalation Incident Case"}
                </span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateIncident} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "اللجنة / المسار (تصفية الأعضاء):" : "Committee / Track (Filter):"}
                </label>
                <select
                  value={incidentTeamFilter}
                  onChange={(e) => {
                    const tId = e.target.value;
                    setIncidentTeamFilter(tId);
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
                  {isAr ? "العضو المعني بالواقعة (ضمن اللجنة):" : "Target Member (Within Committee):"}
                </label>
                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  required
                >
                  {selectableUsersForIncident.length === 0 ? (
                    <option value="">{isAr ? "لا يوجد أعضاء في هذه اللجنة" : "No members in this committee"}</option>
                  ) : (
                    selectableUsersForIncident.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role.replace("_", " ")})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "مستوى التصعيد المتدرج:" : "Escalation Ladder Level:"}
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  <option value={1}>{isAr ? "المستوى 1: تنبيه وتوجيه ودي مباشر (أزرق)" : "Level 1: Friendly Notice (Blue)"}</option>
                  <option value={2}>{isAr ? "المستوى 2: خطة تحسين الأداء PIP (أصفر)" : "Level 2: PIP Plan (Yellow)"}</option>
                  <option value={3}>{isAr ? "المستوى 3: مراجعة قائد ونائب الفريق (برتقالي)" : "Level 3: Head/Vice Head Review (Orange)"}</option>
                  <option value={4}>{isAr ? "المستوى 4: تصعيد لقيادة مجتمع GDG (أحمر)" : "Level 4: Chapter Leadership Hearing (Red)"}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "عنوان الواقعة:" : "Incident Title:"}
                </label>
                <Input
                  required
                  placeholder={
                    isAr
                      ? "مثال: تأخر متكرر عن تسليم مرحلة المشروع"
                      : "e.g., Repeated delivery delays on milestone"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "تفاصيل وسياق الواقعة الموثقة:" : "Documented Statement & Facts:"}
                </label>
                <Textarea
                  rows={3}
                  required
                  placeholder={
                    isAr
                      ? "اشرح ملابسات الحالة وما تم مناقشته مع العضو..."
                      : "Describe the timeline, facts, and initial discussion..."
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "ملاحظات التوجيه أو قرار التسوية (اختياري):" : "Resolution / Settlement Notes (Optional):"}
                </label>
                <Input
                  placeholder={
                    isAr
                      ? "ما تم الاتفاق عليه لتسوية الموضوع"
                      : "Corrective action or agreement agreed upon"
                  }
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewIncidentOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" className="bg-[#ea4335] hover:bg-[#d93025] text-white">
                  {isAr ? "حفظ وتوثيق الحالة" : "Record Escalation"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
