"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Edit,
  Trash2,
  Filter,
  User,
  X,
  TrendingUp,
  TrendingDown,
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
import { getPointClassification, isDuplicateDeduction, isUserInTrack } from "@/lib/utils";
import { PointEvent } from "@/types";

export default function PointsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberParam = searchParams.get("member");

  const {
    pointEvents,
    addPointEvent,
    updatePointEvent,
    deletePointEvent,
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
  const canRecordPoints =
    userRole === "super_admin" ||
    userRole === "hr_admin" ||
    userRole === "hr_reviewer" ||
    userRole === "team_lead";
  const canReviewPoints =
    userRole === "super_admin" ||
    userRole === "hr_admin" ||
    userRole === "hr_reviewer";
  const canManagePoints =
    userRole === "super_admin" ||
    userRole === "hr_admin" ||
    userRole === "team_lead";

  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [pointTeamFilter, setPointTeamFilter] = useState<string>("all");
  const [filterMember, setFilterMember] = useState<string>(
    isMember && currentUser?.id ? currentUser.id : memberParam || "all"
  );
  const [activeMainTab, setActiveMainTab] = useState<"ledger" | "balances" | "caps">("ledger");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showPolicyGuardrail, setShowPolicyGuardrail] = useState(false);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [selectedEventForReview, setSelectedEventForReview] = useState<PointEvent | null>(null);
  const [reviewRationale, setReviewRationale] = useState("");

  // Edit Point Event State
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PointEvent | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [editCategory, setEditCategory] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<PointEvent["status"]>("approved");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Point Event State
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<PointEvent | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Helper to match user to committee
  const isUserInTeam = (u: any, teamId?: string) => {
    if (!teamId || teamId === "all") return true;
    return isUserInTrack(u, teamId, teams);
  };

  // Selectable users for team lead vs admins, filtered by pointTeamFilter
  const selectableUsers = React.useMemo(() => {
    let pool = availableUsers;
    if (userRole === "team_lead" && currentUser?.team_id) {
      pool = pool.filter((u) => isUserInTeam(u, currentUser.team_id));
    }
    if (pointTeamFilter !== "all") {
      pool = pool.filter((u) => isUserInTeam(u, pointTeamFilter));
    }
    return pool;
  }, [availableUsers, currentUser, userRole, pointTeamFilter]);

  // Form states for creating point event
  const [targetMember, setTargetMember] = useState(selectableUsers[0]?.id || "");
  const [selectedCategory, setSelectedCategory] = useState(POLICY_POINT_CATEGORIES[0]?.id || "");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [explanation, setExplanation] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  useEffect(() => {
    if (memberParam) {
      setFilterMember((prev) => (prev !== memberParam ? memberParam : prev));
    }
  }, [memberParam]);

  useEffect(() => {
    if (selectableUsers.length > 0) {
      setTargetMember((prev) => {
        if (!prev || !selectableUsers.some((u) => u.id === prev)) {
          return selectableUsers[0].id;
        }
        return prev;
      });
    } else {
      setTargetMember((prev) => (prev ? "" : prev));
    }
  }, [selectableUsers]);

  // Robust user matching helper to strictly isolate each member's points without cross-mix
  const isMatchUser = (targetId?: string, comparisonUserId?: string) => {
    const compareWith = comparisonUserId || currentUser?.id;
    if (!targetId || !compareWith) return false;

    const cleanTarget = targetId.toLowerCase().trim();
    const cleanComp = compareWith.toLowerCase().trim();

    if (cleanTarget === cleanComp) return true;

    const targetProf = availableUsers.find(
      (u) => u.id.toLowerCase() === cleanTarget || (u.email && u.email.toLowerCase().trim() === cleanTarget)
    );
    const compProf = availableUsers.find(
      (u) => u.id.toLowerCase() === cleanComp || (u.email && u.email.toLowerCase().trim() === cleanComp)
    );

    if (targetProf && compProf) {
      return (
        targetProf.id.toLowerCase() === compProf.id.toLowerCase() ||
        (!!targetProf.email &&
          !!compProf.email &&
          targetProf.email.toLowerCase().trim() === compProf.email.toLowerCase().trim())
      );
    }

    if (targetProf) {
      return (
        targetProf.id.toLowerCase() === cleanComp ||
        (!!targetProf.email && targetProf.email.toLowerCase().trim() === cleanComp)
      );
    }
    if (compProf) {
      return (
        compProf.id.toLowerCase() === cleanTarget ||
        (!!compProf.email && compProf.email.toLowerCase().trim() === cleanTarget)
      );
    }

    return false;
  };

  // Determine active member scope
  const activeScopedMemberId = isMember
    ? currentUser?.id
    : filterMember !== "all"
    ? filterMember
    : null;

  // Scoped point events based on role and explicit member filter
  const visibleEvents = pointEvents.filter((p) => {
    if (activeScopedMemberId) {
      return isMatchUser(p.member_id, activeScopedMemberId);
    }
    if (userRole === "team_lead" && currentUser?.team_id) {
      const targetUser = availableUsers.find((u) => u.id === p.member_id);
      if (targetUser?.team_id !== currentUser.team_id && !isMatchUser(p.member_id)) {
        return false;
      }
    }
    if (filterTeam !== "all") {
      const targetUser = availableUsers.find((u) => u.id === p.member_id);
      if (!targetUser || !isUserInTeam(targetUser, filterTeam)) {
        return false;
      }
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
    const clean = id.toLowerCase().trim();
    const prof = availableUsers.find(
      (u) => u.id.toLowerCase() === clean || (u.email && u.email.toLowerCase().trim() === clean)
    );
    return prof?.full_name || id;
  };

  const getFilteredMemberName = () => {
    if (filterMember === "all") return "";
    return getMemberName(filterMember);
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

    if (!targetMember) return;
    const targetProf = availableUsers.find((u) => u.id === targetMember);

    addPointEvent({
      member_id: targetMember,
      team_id: targetProf?.team_id || teams[0]?.id || "",
      event_date: eventDate,
      category_id: selectedCatObj.id,
      cap_category_id: resolvedCapId,
      direction: selectedCatObj.direction,
      value: selectedCatObj.direction === "positive" ? selectedCatObj.default_value : -Math.abs(selectedCatObj.default_value),
      explanation: explanation.trim(),
      evidence_url: evidenceUrl.trim() || undefined,
      recorded_by: currentUser.id,
      status: canReviewPoints ? "approved" : "pending_review",
    });

    setExplanation("");
    setEvidenceUrl("");
    setIsRecommendOpen(false);
  };

  // Open Edit Point Event Modal
  const openEditModal = (evt: PointEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEvent(evt);
    setEditValue(evt.value);
    setEditCategory(evt.category_id || POLICY_POINT_CATEGORIES[0]?.id || "");
    setEditExplanation(evt.explanation);
    setEditDate(evt.event_date);
    setEditStatus(evt.status);
    setIsEditEventOpen(true);
  };

  // Save Edit Point Event
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editExplanation.trim()) return;
    setIsSubmittingEdit(true);

    const success = await updatePointEvent(editingEvent.id, {
      value: Number(editValue),
      category_id: editCategory,
      explanation: editExplanation.trim(),
      event_date: editDate,
      status: editStatus,
    });

    if (success) {
      setIsEditEventOpen(false);
      setEditingEvent(null);
    } else {
      alert(isAr ? "فشل تعديل حركة النقاط" : "Failed to update point event");
    }
    setIsSubmittingEdit(false);
  };

  // Open Delete Point Event Modal
  const openDeleteModal = (evt: PointEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingEvent(evt);
    setIsDeleteEventOpen(true);
  };

  // Confirm Delete Point Event
  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setIsSubmittingDelete(true);
    const success = await deletePointEvent(deletingEvent.id);
    if (success) {
      setIsDeleteEventOpen(false);
      setDeletingEvent(null);
    } else {
      alert(isAr ? "فشل حذف واقعة النقاط" : "Failed to delete point event");
    }
    setIsSubmittingDelete(false);
  };

  // Calculate approved balances
  const approvedPositive = visibleEvents
    .filter((p) => p.status === "approved" && p.direction === "positive")
    .reduce((sum, p) => sum + p.value, 0);

  const approvedNegative = visibleEvents
    .filter((p) => p.status === "approved" && p.direction === "negative")
    .reduce((sum, p) => sum + p.value, 0);

  const netBalance = approvedPositive + approvedNegative;
  const netTier = getPointClassification(netBalance);

  // Per-member calculation helper for the leaderboard view
  const calculateMemberBalance = (memberId: string) => {
    const memEvents = pointEvents.filter(
      (p) => isMatchUser(p.member_id, memberId) && p.status === "approved"
    );
    const pos = memEvents
      .filter((p) => p.direction === "positive")
      .reduce((sum, p) => sum + p.value, 0);
    const neg = memEvents
      .filter((p) => p.direction === "negative")
      .reduce((sum, p) => sum + p.value, 0);
    return { pos, neg, net: pos + neg };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={
          isAr
            ? isMember
              ? "سجل نقاطي ومستوى الأداء"
              : filterMember !== "all"
              ? `سجل نقاط العضو: ${getFilteredMemberName()}`
              : "سجل النقاط الإيجابية والسلبية"
            : isMember
            ? "My Points & Governance"
            : filterMember !== "all"
            ? `Points for: ${getFilteredMemberName()}`
            : "Points Ledger Governance"
        }
        description={
          isAr
            ? isMember
              ? "متابعة رصيد نقاطك المعتمدة، والسقف الشهري لفئات النقاط الإيجابية، وسجل الإجراءات الخاص بك."
              : "نظام النقاط المنفصل عن التقييم الشهري. يُحسب رصيد كل عضو بشكل مستقل تماماً من العمليات المعتمدة فقط."
            : isMember
            ? "Track your approved personal point balance, monthly positive caps, and individual event history."
            : "Policy ledger strictly separate from monthly evaluation scores. Balances are calculated per member."
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

      {/* Member Filter Banner if isolated to single member */}
      {filterMember !== "all" && !isMember && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-foreground">
              {isAr
                ? `يتم الآن عرض رصيد وسجل نقاط العضو (${getFilteredMemberName()}) فقط.`
                : `Showing points strictly for: ${getFilteredMemberName()}`}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterMember("all");
              router.push(`/${locale}/points`);
            }}
            className="h-7 text-xs gap-1 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
          >
            <X className="w-3.5 h-3.5" />
            {isAr ? "إلغاء التصفية (عرض الكل)" : "Clear Filter"}
          </Button>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border/70 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr
              ? activeScopedMemberId
                ? "النقاط الإيجابية المعتمدة للعضو"
                : "إجمالي النقاط الإيجابية للمنظمة"
              : activeScopedMemberId
              ? "Member Positive Points"
              : "Org Positive Points"}
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            +{approvedPositive} pts
          </p>
        </Card>

        <Card className="p-4 border-border/70 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr
              ? activeScopedMemberId
                ? "النقاط السلبية المعتمدة للعضو"
                : "إجمالي النقاط السلبية للمنظمة"
              : activeScopedMemberId
              ? "Member Negative Points"
              : "Org Negative Points"}
          </span>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">
            {approvedNegative} pts
          </p>
        </Card>

        <Card className="p-4 border-border/70 bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {isAr
              ? activeScopedMemberId
                ? "صافي رصيد العضو الفردي"
                : "صافي رصيد المنظمة الإجمالي"
              : activeScopedMemberId
              ? "Member Net Balance"
              : "Org Overall Net Balance"}
          </span>
          <div className="flex items-center justify-between mt-1">
            <p
              className={`text-2xl font-black ${
                netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {netBalance > 0 ? `+${netBalance}` : netBalance} pts
            </p>
            {activeScopedMemberId && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-muted text-foreground">
                {netTier.label}
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Primary Section Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/30 rounded-2xl border border-border/60 max-w-xl">
        <button
          type="button"
          onClick={() => setActiveMainTab("ledger")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            activeMainTab === "ledger"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4 text-primary" />
          <span>{isAr ? "سجل الحركات" : "Ledger"}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {filteredEvents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("balances")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            activeMainTab === "balances"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4 text-indigo-500" />
          <span>{isAr ? (isMember ? "تفاصيل رصيدي" : "أرصدة الأعضاء") : (isMember ? "My Standing" : "Member Balances")}</span>
          {!isMember && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-bold">
              {availableUsers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("caps")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
            activeMainTab === "caps"
              ? "bg-card text-foreground shadow-sm border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>{isAr ? "اللوائح والأسقف" : "Caps & Policy"}</span>
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeMainTab === "ledger" && (
        <div className="space-y-4">
          {/* Filter and Member Selector Strip for Admins */}
          {!isMember && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                <Filter className="w-4 h-4 text-primary" />
                <span>{isAr ? "اختيار عضو لمعاينة رصيده وسجله الفردي:" : "Select Member to inspect individual balance:"}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none max-w-[170px]"
                >
                  <option value="all">{isAr ? "جميع الفرق واللجان" : "All Committees"}</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.name_ar : t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterMember}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterMember(val);
                    if (val === "all") {
                      router.push(`/${locale}/points`);
                    } else {
                      router.push(`/${locale}/points?member=${val}`);
                    }
                  }}
                  className="h-8 px-3 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none min-w-[200px]"
                >
                  <option value="all">
                    {isAr ? "جميع الأعضاء (عرض عام)" : "All Members (Global View)"}
                  </option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Filter Tabs for Events */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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

            <button
              type="button"
              onClick={() => setShowPolicyGuardrail(!showPolicyGuardrail)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-medium transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? (showPolicyGuardrail ? "إخفاء الضوابط" : "عرض ضوابط اللائحة") : (showPolicyGuardrail ? "Hide Policy Guide" : "Show Policy Guide")}</span>
            </button>
          </div>

          {/* Expandable Policy Guardrail Box */}
          {showPolicyGuardrail && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  {isAr ? "ضوابط لائحة النقاط الرسمية:" : "Mandatory Policy Guardrail:"}
                </p>
                <p>
                  {isAr
                    ? "1. رصيد النقاط منفصل تماماً عن التقييم الشهري للـ 100 درجة. 2. لا يُسمح بتكرار الخصم لنفس الواقعة. 3. النقاط السلبية لا تؤدي للفصل المباشر بل للمتابعة والتطوير."
                    : "1. Points are independent of monthly 100-pt evaluation. 2. Deductions cannot be duplicated. 3. Points do not automatically expel members."}
                </p>
              </div>
            </div>
          )}

      {/* Ledger Table */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">
              {isAr ? "لا توجد حركات نقاط مسجلة حالياً" : "No point events recorded yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "استخدم زر 'تسجيل واقعة نقاط' بالأعلى لتسجيل حركة جديدة لأي عضو."
                : "Use the 'Record Point Event' button above to register an entry."}
            </p>
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Review Controls for HR Reviewer or Admin */}
                {evt.status === "pending_review" && canReviewPoints && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => approvePointEvent(evt.id, "Verified by Admin")}
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isAr ? "اعتماد" : "Approve"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rejectPointEvent(evt.id, "Rejected by Admin")}
                      className="text-xs h-8 text-rose-600 hover:bg-rose-500/10 gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {isAr ? "رفض" : "Reject"}
                    </Button>
                  </>
                )}

                {/* Edit Point Event for Admins */}
                {canManagePoints && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => openEditModal(evt, e)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title={isAr ? "تعديل حركة النقاط" : "Edit Point Entry"}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                )}

                {/* Delete Point Event for Admins */}
                {canManagePoints && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => openDeleteModal(evt, e)}
                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-500/10"
                    title={isAr ? "حذف حركة النقاط" : "Delete Point Entry"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
        </div>
      )}

      {/* TAB 2: MEMBER BALANCES */}
      {activeMainTab === "balances" && (
        <div className="space-y-4">
          {!isMember ? (
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm font-bold">
                      {isAr ? "أرصدة جميع الأعضاء في النظام" : "All Member Balances & Standing"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAr
                        ? "اضغط على أي عضو لعرض سجله الفردي وتفاصيل عملياته."
                        : "Click any member card to inspect their dedicated transaction ledger."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={isAr ? "بحث بالاسم أو البريد..." : "Search name or email..."}
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="h-8 text-xs max-w-[200px]"
                    />
                    <select
                      value={filterTeam}
                      onChange={(e) => setFilterTeam(e.target.value)}
                      className="h-8 px-2.5 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none"
                    >
                      <option value="all">{isAr ? "جميع الفرق" : "All Committees"}</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {isAr ? t.name_ar : t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableUsers
                    .filter((u) => {
                      const matchesSearch =
                        !memberSearchQuery.trim() ||
                        u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(memberSearchQuery.toLowerCase());
                      const matchesTeam = filterTeam === "all" || isUserInTeam(u, filterTeam);
                      return matchesSearch && matchesTeam;
                    })
                    .map((user) => {
                      const bal = calculateMemberBalance(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            setFilterMember(user.id);
                            setActiveMainTab("ledger");
                            router.push(`/${locale}/points?member=${user.id}`);
                          }}
                          className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                              {user.full_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {user.email}
                            </p>
                            <span className="text-[10px] text-muted-foreground/80 mt-1 inline-block">
                              {user.role.replace("_", " ")}
                            </span>
                          </div>

                          <div className="text-right rtl:text-left shrink-0">
                            <p
                              className={`text-sm font-black ${
                                bal.net >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {bal.net > 0 ? `+${bal.net}` : bal.net} pts
                            </p>
                            <span className="text-[10px] text-muted-foreground block">
                              +{bal.pos} / {bal.neg}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Member Personal Standing Card */
            <Card className="border-border/80 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    {isAr ? "مستوى أدائي ونقاطي المعتمدة" : "My Personal Standing & Balance"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isAr
                      ? "رصيدك الحالي المعتمد بناءً على لائحة الحوافز والالتزام الخاصة بالمؤسسة."
                      : "Your verified points according to the official chapter incentive policy."}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setActiveMainTab("ledger")}
                  variant="outline"
                  className="text-xs h-8 gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  {isAr ? "عرض سجل حركاتي" : "View My Events"}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {isAr ? "مجموع النقاط الإيجابية" : "Total Positive"}
                  </span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    +{approvedPositive} pts
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    {isAr ? "مجموع النقاط السلبية" : "Total Deductions"}
                  </span>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {approvedNegative} pts
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-xs font-semibold text-primary">
                    {isAr ? "تصنيف ومستوى الأداء" : "Standing Tier"}
                  </span>
                  <p className="text-lg font-black text-foreground mt-1">
                    {netTier.label}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: CAPS & POLICY */}
      {activeMainTab === "caps" && (
        <div className="space-y-4">
          {/* Policy Guardrails Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">
                {isAr
                  ? "ضوابط لائحة النقاط الرسمية المعتمدة:"
                  : "Official Policy Governance Guardrails:"}
              </p>
              <p className="leading-relaxed">
                {isAr
                  ? "1. رصيد النقاط منفصل تماماً عن التقييم الشهري للـ 100 درجة (لا يؤثر مباشرة في درجة التقييم الفني)."
                  : "1. Points ledger is strictly independent of the monthly 100-pt technical evaluation."}
              </p>
              <p className="leading-relaxed">
                {isAr
                  ? "2. لا يُسمح بتكرار الخصم لنفس الواقعة أو الحدث لمنع الازدواجية التأديبية."
                  : "2. Deduction duplicates for the exact same occurrence are prohibited."}
              </p>
              <p className="leading-relaxed">
                {isAr
                  ? "3. النقاط السلبية لا تؤدي للفصل المباشر بل للمتابعة والتطوير وخطط التحسين."
                  : "3. Negative points do not result in expulsion; they trigger PIP mentoring and improvement."}
              </p>
            </div>
          </div>

          {/* Monthly Positive Caps Breakdown */}
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>
                  {isAr
                    ? "الأسقف الشهرية لفئات النقاط الإيجابية (Caps)"
                    : "Official Positive Point Monthly Caps"}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  {isAr ? "7 فئات مستقلة" : "7 Distinct Caps"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {POLICY_POINT_CAP_CATEGORIES.map((cap) => (
                  <div key={cap.id} className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between font-semibold text-foreground">
                      <span className="truncate">{isAr ? cap.name_ar : cap.name}</span>
                      <span className="text-emerald-600 shrink-0 font-bold">Max {cap.monthly_cap}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full w-1/4" />
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {isAr ? "الحد الأقصى للنقاط المكتسبة شهرياً من هذا النشاط." : "Monthly maximum cap for this incentive activity."}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Point Event Modal */}
      {isEditEventOpen && editingEvent && (
        <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                {isAr ? "تعديل واقعة النقاط" : "Edit Point Entry"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-muted-foreground text-[11px]">
                  {isAr ? "العضو:" : "Member:"}
                </p>
                <p className="font-bold text-foreground text-xs mt-0.5">
                  {getMemberName(editingEvent.member_id)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "قيمة النقاط (+ أو -):" : "Points Value:"}
                  </label>
                  <Input
                    type="number"
                    required
                    value={editValue}
                    onChange={(e) => setEditValue(Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "الحالة:" : "Status:"}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="approved">{isAr ? "معتمدة (Approved)" : "Approved"}</option>
                    <option value="pending_review">{isAr ? "قيد المراجعة" : "Pending"}</option>
                    <option value="rejected">{isAr ? "مرفوضة" : "Rejected"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "البيان / التوضيح:" : "Explanation:"}
                </label>
                <Textarea
                  required
                  rows={3}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "التاريخ:" : "Date:"}
                </label>
                <Input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditEventOpen(false)}
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

      {/* Delete Point Event Confirmation Modal */}
      {isDeleteEventOpen && deletingEvent && (
        <Dialog open={isDeleteEventOpen} onOpenChange={setIsDeleteEventOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5 text-rose-600" />
                {isAr ? "تأكيد حذف واقعة النقاط" : "Confirm Point Deletion"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-foreground">
                {isAr
                  ? `هل أنت متأكد من رغبتك في حذف واقعة النقاط (${deletingEvent.value > 0 ? `+${deletingEvent.value}` : deletingEvent.value} pts) المسجلة للعضو (${getMemberName(deletingEvent.member_id)})؟`
                  : `Are you sure you want to delete point entry (${deletingEvent.value} pts) for ${getMemberName(deletingEvent.member_id)}?`}
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteEventOpen(false)}
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
                  {isAr ? "اللجنة / المسار (تصفية الأعضاء):" : "Committee / Track (Filter):"}
                </label>
                <select
                  value={pointTeamFilter}
                  onChange={(e) => {
                    const tId = e.target.value;
                    setPointTeamFilter(tId);
                    const filtered = availableUsers.filter((u) => isUserInTeam(u, tId));
                    if (filtered.length > 0 && !filtered.some((u) => u.id === targetMember)) {
                      setTargetMember(filtered[0].id);
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
                  {isAr ? "العضو المعني (ضمن اللجنة):" : "Target Member (Within Committee):"}
                </label>
                <select
                  value={targetMember}
                  onChange={(e) => setTargetMember(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  {selectableUsers.length === 0 ? (
                    <option value="">{isAr ? "لا يوجد أعضاء في هذه اللجنة" : "No members in this committee"}</option>
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
                  {POLICY_POINT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.direction === "positive" ? "🟢 +" : "🔴 "}
                      {cat.default_value} pts - {isAr ? cat.name_ar : cat.name}
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
                  {isAr ? "البيان والتوضيح الإداري:" : "Explanation / Justification:"}
                </label>
                <Textarea
                  required
                  rows={2}
                  placeholder={
                    isAr
                      ? "شرح سبب المنح أو الخصم وفق اللائحة..."
                      : "Describe incident per policy..."
                  }
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "رابط الدليل المرفق (اختياري):" : "Evidence Link (Optional):"}
                </label>
                <Input
                  type="url"
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
                  {isAr ? "تسجيل واحتساب" : "Record Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
