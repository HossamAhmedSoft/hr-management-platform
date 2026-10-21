"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  HelpCircle,
  Eye,
  Sliders,
  Shield,
  FileText,
  Calendar,
  Layers,
  ChevronDown,
  RefreshCw,
  Send,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/app-context";
import {
  RegistrationRequest,
  RegistrationStatus,
  RegistrationField,
  RegistrationSettings,
  UserRole,
} from "@/types";

export default function RegistrationsAdminPage() {
  const router = useRouter();
  const { locale, currentUser, teams } = useApp();
  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";
  const canApprove = userRole === "super_admin" || userRole === "hr_admin";
  const canReview = canApprove || userRole === "hr_reviewer";

  // Data states
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [settings, setSettings] = useState<RegistrationSettings | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Review Drawer / Modal
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Decision Modal States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveRole, setApproveRole] = useState<UserRole>("member");
  const [approveTeamId, setApproveTeamId] = useState<string>("");
  const [approveNotes, setApproveNotes] = useState("");
  const [isExecutingApprove, setIsExecutingApprove] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonVisible, setRejectReasonVisible] = useState(true);
  const [rejectCooldownDays, setRejectCooldownDays] = useState(14);
  const [isExecutingReject, setIsExecutingReject] = useState(false);

  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  const [infoFields, setInfoFields] = useState<string[]>([]);
  const [infoMessage, setInfoMessage] = useState("");
  const [isExecutingRequestInfo, setIsExecutingRequestInfo] = useState(false);

  // Settings Save State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Alert message
  const [actionAlert, setActionAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/registrations");
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.data || []);
        setStatusCounts(data.statusCounts || {});
        if (data.settings) setSettings(data.settings);
      }

      // Also load fields
      const fieldsRes = await fetch("/api/auth/registration/schema");
      const fieldsData = await fieldsRes.json();
      if (fieldsRes.ok && fieldsData.success) {
        setFields(fieldsData.fields || []);
      }
    } catch (err) {
      console.error("Failed to load registration data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (type: "success" | "error", message: string) => {
    setActionAlert({ type, message });
    setTimeout(() => setActionAlert(null), 5000);
  };

  const openApproveDialog = (req: RegistrationRequest) => {
    setSelectedRequest(req);
    setApproveRole(req.assigned_role || "member");
    setApproveTeamId(req.assigned_team_id || req.submitted_data?.preferred_track || "");
    setApproveNotes("");
    setIsApproveModalOpen(true);
  };

  const handleExecuteApprove = async () => {
    if (!selectedRequest) return;
    setIsExecutingApprove(true);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedRequest.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: approveRole,
          team_id: approveTeamId || undefined,
          internal_notes: approveNotes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("success", data.message || (isAr ? "تم اعتماد الطلب بنجاح." : "Approved successfully."));
        setIsApproveModalOpen(false);
        setIsDetailModalOpen(false);
        loadData();
      } else {
        showAlert("error", data.error || (isAr ? "فشل اعتماد الطلب." : "Failed to approve."));
      }
    } catch {
      showAlert("error", isAr ? "حدث خطأ بالشبكة." : "Network error.");
    } finally {
      setIsExecutingApprove(false);
    }
  };

  const openRejectDialog = (req: RegistrationRequest) => {
    setSelectedRequest(req);
    setRejectReason("");
    setRejectReasonVisible(true);
    setRejectCooldownDays(settings?.reject_cooldown_days || 14);
    setIsRejectModalOpen(true);
  };

  const handleExecuteReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    setIsExecutingReject(true);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedRequest.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: rejectReason.trim(),
          reason_visible: rejectReasonVisible,
          cooldown_days: rejectCooldownDays,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("success", isAr ? "تم تسجيل قرار الرفض وحفظ السبب." : "Request rejected successfully.");
        setIsRejectModalOpen(false);
        setIsDetailModalOpen(false);
        loadData();
      } else {
        showAlert("error", data.error || (isAr ? "فشل تسجيل الرفض." : "Failed to reject."));
      }
    } catch {
      showAlert("error", isAr ? "حدث خطأ بالشبكة." : "Network error.");
    } finally {
      setIsExecutingReject(false);
    }
  };

  const openRequestInfoDialog = (req: RegistrationRequest) => {
    setSelectedRequest(req);
    setInfoFields(["id_card_doc"]);
    setInfoMessage("");
    setIsRequestInfoModalOpen(true);
  };

  const handleExecuteRequestInfo = async () => {
    if (!selectedRequest || !infoMessage.trim() || infoFields.length === 0) return;
    setIsExecutingRequestInfo(true);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedRequest.id}/request-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: infoFields,
          message: infoMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert("success", isAr ? "تم إرسال طلب استكمال البيانات للمتقدم." : "Information request sent.");
        setIsRequestInfoModalOpen(false);
        setIsDetailModalOpen(false);
        loadData();
      } else {
        showAlert("error", data.error || (isAr ? "فشلت العملية." : "Operation failed."));
      }
    } catch {
      showAlert("error", isAr ? "حدث خطأ بالشبكة." : "Network error.");
    } finally {
      setIsExecutingRequestInfo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/registrations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
        showAlert("success", isAr ? "تم حفظ إعدادات التسجيل بنجاح." : "Settings updated successfully.");
      } else {
        showAlert("error", data.error || "Failed to update settings.");
      }
    } catch {
      showAlert("error", "Network error.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (teamFilter !== "all" && r.assigned_team_id !== teamFilter && r.submitted_data?.preferred_track !== teamFilter) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = r.full_name?.toLowerCase().includes(term);
      const matchEmail = r.email?.toLowerCase().includes(term);
      const matchRef = r.reference_no?.toLowerCase().includes(term);
      const matchPhone = r.phone?.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchRef && !matchPhone) return false;
    }
    return true;
  });

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case "pending_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? "قيد المراجعة" : "Under Review"}</span>
          </span>
        );
      case "needs_info":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? "مطلوب استكمال" : "Needs Info"}</span>
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? "معتمد" : "Approved"}</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>{isAr ? "مرفوض" : "Rejected"}</span>
          </span>
        );
      case "pending_email_verification":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? "بانتظار تأكيد البريد" : "Pending Email"}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isAr ? "إدارة طلبات الانضمام والاعتماد" : "Registration Requests & Approvals"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {isAr
                  ? "مراجعة واعتماد ملفات المتقدمين، مطابقة وثائق الهوية (KYC)، وتعيين اللجان الرسمية."
                  : "Review applicant profiles, verify KYC documentation, and assign committees."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="h-10 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isAr ? "تحديث" : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Floating Action Alert */}
      {actionAlert && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 transition-all ${
            actionAlert.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          {actionAlert.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionAlert.message}</span>
        </div>
      )}

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground block truncate">
            {isAr ? "إجمالي الطلبات" : "Total Requests"}
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {statusCounts.all || 0}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 block truncate">
            {isAr ? "بانتظار المراجعة" : "Pending Review"}
          </span>
          <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {statusCounts.pending_approval || 0}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400 block truncate flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{isAr ? "تجاوز مهلة الرد (SLA)" : "SLA Breached (>48h)"}</span>
          </span>
          <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {statusCounts.sla_breached || 0}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 block truncate">
            {isAr ? "مطلوب استكمال (Needs Info)" : "Needs Info"}
          </span>
          <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {statusCounts.needs_info || 0}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block truncate">
            {isAr ? "تم اعتمادهم" : "Approved"}
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {statusCounts.approved || 0}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground block truncate">
            {isAr ? "مرفوضة" : "Rejected"}
          </span>
          <span className="text-xl font-bold font-mono text-muted-foreground">
            {statusCounts.rejected || 0}
          </span>
        </div>
      </div>

      {/* Tabs: Review Queue vs Settings & Field Builder */}
      <Tabs defaultValue="queue" className="w-full space-y-4">
        <TabsList className="p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-border">
          <TabsTrigger value="queue" className="text-xs font-semibold rounded-xl flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            <span>{isAr ? "قائمة الطلبات المتقدمة" : "Requests Queue"}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs font-semibold rounded-xl flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>{isAr ? "إعدادات التسجيل ومحدد الحقول" : "Field Builder & Settings"}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: REQUESTS QUEUE ── */}
        <TabsContent value="queue" className="space-y-4 m-0">
          {/* Search & Filters */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute start-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالاسم، البريد، الرقم القومي، المرجع..." : "Search name, email, ref, phone..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-9 h-10 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium outline-none"
              >
                <option value="all">{isAr ? "جميع الحالات" : "All Statuses"}</option>
                <option value="pending_approval">{isAr ? "بانتظار المراجعة" : "Pending Review"}</option>
                <option value="needs_info">{isAr ? "مطلوب استكمال" : "Needs Info"}</option>
                <option value="approved">{isAr ? "معتمد" : "Approved"}</option>
                <option value="rejected">{isAr ? "مرفوض" : "Rejected"}</option>
                <option value="pending_email_verification">{isAr ? "بانتظار تأكيد البريد" : "Pending Email"}</option>
              </select>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium outline-none"
              >
                <option value="all">{isAr ? "جميع اللجان والمسارات" : "All Teams"}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Requests Table */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4 text-start">{isAr ? "المتقدم" : "Applicant"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "رقم المرجع والتاريخ" : "Reference & Date"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "الكلية والمسار" : "Faculty & Track"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "الحالة" : "Status"}</th>
                    <th className="py-3 px-4 text-start">{isAr ? "المهلة (SLA)" : "SLA"}</th>
                    <th className="py-3 px-4 text-end">{isAr ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        {isAr ? "لا توجد طلبات تسجيل مطابقة للمعايير المحددة." : "No matching registration requests found."}
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req: any) => {
                      const isBreached = req.is_sla_breached;
                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {req.full_name}
                              </span>
                              <span className="text-[11px] text-muted-foreground block dir-ltr truncate max-w-[200px]">
                                {req.email}
                              </span>
                              {req.phone && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {req.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 dark:text-zinc-200 block">
                                {req.reference_no}
                              </span>
                              <span className="text-[10px] text-muted-foreground block font-sans">
                                {new Date(req.submitted_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 max-w-[180px]">
                              <span className="font-medium text-slate-800 dark:text-zinc-200 block truncate">
                                {req.submitted_data?.preferred_track || isAr ? "غير محدد" : "Unassigned"}
                              </span>
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {req.submitted_data?.faculty_department || "NCTU"}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>

                          <td className="py-3.5 px-4">
                            {req.status === "pending_approval" ? (
                              isBreached ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{isAr ? "تجاوز 48 ساعة" : "> 48h"}</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {req.hours_pending ? `${req.hours_pending}h` : "< 1h"}
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-end">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setIsDetailModalOpen(true);
                                }}
                                className="h-8 px-2.5 text-xs rounded-lg"
                              >
                                <Eye className="w-3.5 h-3.5 me-1" />
                                <span>{isAr ? "معاينة" : "Review"}</span>
                              </Button>

                              {canApprove && (req.status === "pending_approval" || req.status === "needs_info") && (
                                <Button
                                  size="sm"
                                  onClick={() => openApproveDialog(req)}
                                  className="h-8 px-2.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                >
                                  <Check className="w-3.5 h-3.5 me-1" />
                                  <span>{isAr ? "اعتماد" : "Approve"}</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: FIELD BUILDER & REGISTRATION SETTINGS ── */}
        <TabsContent value="settings" className="space-y-5 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Global Registration Settings Panel */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <div className="pb-2 border-b border-border">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>{isAr ? "سياسات التسجيل العامة" : "Registration Policies"}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr ? "التحكم في أوضاع فتح التسجيل وقواعد فترات الانتظار والـ SLA." : "Control registration modes and SLA parameters."}
                </p>
              </div>

              {settings && (
                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-zinc-300">
                      {isAr ? "وضع التسجيل (Registration Mode)" : "Registration Mode"}
                    </label>
                    <select
                      value={settings.registration_mode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          registration_mode: e.target.value as any,
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none"
                    >
                      <option value="OPEN_WITH_APPROVAL">
                        {isAr ? "مفتوح بطلب مسبق وموافقة إدارية (OPEN_WITH_APPROVAL)" : "Open with Admin Approval"}
                      </option>
                      <option value="DOMAIN_RESTRICTED">
                        {isAr ? "مقيد بنطاق الجامعة فقط (DOMAIN_RESTRICTED)" : "Domain Restricted (nctu.edu.eg)"}
                      </option>
                      <option value="INVITE_ONLY">
                        {isAr ? "بدعوات رسمية فقط (INVITE_ONLY)" : "Invite Only"}
                      </option>
                      <option value="CLOSED">
                        {isAr ? "التسجيل مغلق بالكامل (CLOSED)" : "Registration Closed"}
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 dark:text-zinc-300">
                        {isAr ? "إنذار مهلة المراجعة (ساعة)" : "SLA Warning (Hours)"}
                      </label>
                      <Input
                        type="number"
                        value={settings.sla_warning_hours || 48}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            sla_warning_hours: parseInt(e.target.value, 10) || 48,
                          })
                        }
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 dark:text-zinc-300">
                        {isAr ? "مهلة إعادة التقديم (يوم)" : "Reject Cooldown (Days)"}
                      </label>
                      <Input
                        type="number"
                        value={settings.reject_cooldown_days || 14}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            reject_cooldown_days: parseInt(e.target.value, 10) || 14,
                          })
                        }
                        className="h-10 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-zinc-300">
                      {isAr ? "الدور الافتراضي عند الاعتماد" : "Default Role on Approval"}
                    </label>
                    <select
                      value={settings.default_assigned_role || "member"}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          default_assigned_role: e.target.value as any,
                        })
                      }
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none"
                    >
                      <option value="member">{isAr ? "عضو (Member)" : "Member"}</option>
                      <option value="team_lead">{isAr ? "قائد فريق (Team Lead)" : "Team Lead"}</option>
                      <option value="ta_mentor">{isAr ? "معيد / مرشد (TA / Mentor)" : "TA Mentor"}</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingSettings}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                  >
                    {isSavingSettings ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : settingsSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isAr ? "تم الحفظ!" : "Saved!"}</span>
                      </>
                    ) : (
                      <span>{isAr ? "حفظ التغييرات" : "Save Settings"}</span>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Dynamic Schema Fields Inspector */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span>{isAr ? "حقول نموذج التسجيل النشطة" : "Active Registration Fields"}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? "الحقول المحددة في المخطط الديناميكي ومسارات ربطها بجدول الملفات." : "Dynamic schema fields mapped to profile entities."}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-500/10 px-2 py-1 rounded-lg">
                  {fields.length} {isAr ? "حقول" : "Fields"}
                </span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pe-1">
                {fields.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-800/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {isAr ? f.label_ar : f.label_en}
                        </span>
                        {f.is_required && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                            {isAr ? "إلزامي" : "Required"}
                          </span>
                        )}
                        {f.is_sensitive && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            PII
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono block">
                        key: {f.field_key} • {f.field_type} • step: {f.step_index}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-200/50 dark:bg-zinc-700/50 px-2 py-1 rounded-md max-w-[140px] truncate">
                      {f.maps_to}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── MODAL 1: Full Detail & KYC Document Review Drawer ── */}
      {selectedRequest && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card text-card-foreground">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-6 text-white flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  <span>{selectedRequest.full_name}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-white/80 mt-0.5">
                  {selectedRequest.reference_no} • {selectedRequest.email}
                </DialogDescription>
              </div>
              <div>{getStatusBadge(selectedRequest.status)}</div>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
              {/* Submission Fields Grid */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white pb-1 border-b border-border">
                  {isAr ? "بيانات مقدم الطلب والمطابقة:" : "Applicant Information & KYC:"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">{isAr ? "الرقم القومي / جواز السفر:" : "National ID:"}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {selectedRequest.submitted_data?.national_id || isAr ? "غير محدد" : "N/A"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">{isAr ? "الكلية والتخصص:" : "Faculty / Department:"}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedRequest.submitted_data?.faculty_department || "NCTU"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">{isAr ? "الفرقة الدراسية:" : "Academic Year:"}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedRequest.submitted_data?.academic_year || "Year 1"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">{isAr ? "المسار التقني المطلوب:" : "Preferred Track:"}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {selectedRequest.submitted_data?.preferred_track || "N/A"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">{isAr ? "مستوى الخبرة:" : "Experience Level:"}</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {selectedRequest.submitted_data?.experience_level || "Beginner"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-border">
                    <span className="text-[10px] text-muted-foreground block">{isAr ? "رقم الهاتف:" : "Phone:"}</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {selectedRequest.phone || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Motivation / Bio */}
                {selectedRequest.submitted_data?.bio_or_motivation && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-border space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground block uppercase">
                      {isAr ? "دوافع الانضمام والنبذة:" : "Motivation & Bio:"}
                    </span>
                    <p className="text-slate-800 dark:text-zinc-200 leading-relaxed">
                      {selectedRequest.submitted_data.bio_or_motivation}
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white pb-1 border-b border-border">
                  {isAr ? "المستندات والوثائق المرفوعة (KYC Documents):" : "Uploaded Verification Documents:"}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-900 dark:text-white">
                          {isAr ? "صورة الرقم القومي / الكارنيه" : "ID Card / Student Document"}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {selectedRequest.submitted_data?.id_card_doc || "national_id.png"}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
                      <Download className="w-3.5 h-3.5 me-1" />
                      <span>{isAr ? "معاينة" : "Preview"}</span>
                    </Button>
                  </div>

                  {selectedRequest.submitted_data?.cv_resume_doc && (
                    <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold block text-slate-900 dark:text-white">
                            {isAr ? "السيرة الذاتية (CV)" : "Resume / CV"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px] block">
                            {selectedRequest.submitted_data.cv_resume_doc}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
                        <Download className="w-3.5 h-3.5 me-1" />
                        <span>{isAr ? "تحميل" : "Download"}</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Immutable Event Timeline */}
              {selectedRequest.events && selectedRequest.events.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white pb-1 border-b border-border">
                    {isAr ? "سجل التتبع والتدقيق (Audit Timeline):" : "Audit Timeline:"}
                  </h4>
                  <div className="space-y-2">
                    {selectedRequest.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-zinc-800/30 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white block font-mono text-[11px]">
                            {ev.action}
                          </span>
                          <p className="text-slate-600 dark:text-zinc-400">{ev.comment}</p>
                          {ev.actor_name && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400">
                              By: {ev.actor_name}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(ev.created_at).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="p-4 border-t border-border bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
                className="h-9 text-xs rounded-xl"
              >
                {isAr ? "إغلاق" : "Close"}
              </Button>

              {canApprove && (selectedRequest.status === "pending_approval" || selectedRequest.status === "needs_info") && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openRequestInfoDialog(selectedRequest)}
                    className="h-9 text-xs rounded-xl text-blue-600 border-blue-200"
                  >
                    <HelpCircle className="w-3.5 h-3.5 me-1" />
                    <span>{isAr ? "طلب استكمال" : "Request Info"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => openRejectDialog(selectedRequest)}
                    className="h-9 text-xs rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <X className="w-3.5 h-3.5 me-1" />
                    <span>{isAr ? "رفض" : "Reject"}</span>
                  </Button>

                  <Button
                    onClick={() => openApproveDialog(selectedRequest)}
                    className="h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 me-1" />
                    <span>{isAr ? "اعتماد وقبول العضو" : "Approve Member"}</span>
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── MODAL 2: Approve & Role Assignment Dialog ── */}
      {selectedRequest && (
        <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl border border-border shadow-2xl bg-card">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold">
                {isAr ? `اعتماد وتفعيل عضوية (${selectedRequest.full_name})` : `Approve Member (${selectedRequest.full_name})`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAr
                  ? "سيتم إنشاء حساب عضو رسمي بقاعدة البيانات وربطه باللجنة المختارة وتفعيل صلاحياته."
                  : "Promote applicant to official Profile with specified role and committee."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "تعيين الدور الإداري (System Role)" : "Assign Role"} *
                </label>
                <select
                  value={approveRole}
                  onChange={(e) => setApproveRole(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none"
                >
                  <option value="member">{isAr ? "عضو رسمي (Member)" : "Member"}</option>
                  <option value="team_lead">{isAr ? "قائد فريق / لجنة (Team Lead)" : "Team Lead"}</option>
                  <option value="track_lead">{isAr ? "قائد مسار أكاديمي (Track Lead)" : "Track Lead"}</option>
                  <option value="lead_instructor">{isAr ? "محاضر رئيسي (Lead Instructor)" : "Lead Instructor"}</option>
                  <option value="ta_mentor">{isAr ? "مرشد تقني / معيد (TA Mentor)" : "TA Mentor"}</option>
                  <option value="hr_reviewer">{isAr ? "مراجع موارد بشرية (HR Reviewer)" : "HR Reviewer"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "تعيين اللجنة أو الفريق المعتمد" : "Assign Team / Committee"}
                </label>
                <select
                  value={approveTeamId}
                  onChange={(e) => setApproveTeamId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs outline-none"
                >
                  <option value="">{isAr ? "-- بدون تعيين لجنة محددة --" : "-- Unassigned --"}</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.name_ar : t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "ملاحظات إدارية داخلية (اختياري)" : "Internal Review Notes"}
                </label>
                <Input
                  placeholder={isAr ? "نتائج المقابلة أو شروط إضافية..." : "Interview notes or conditions..."}
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsApproveModalOpen(false)}
                className="h-10 text-xs rounded-xl"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleExecuteApprove}
                disabled={isExecutingApprove}
                className="h-10 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isExecutingApprove ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isAr ? "تأكيد الاعتماد والإنشاء" : "Confirm Approval"}</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── MODAL 3: Reject Dialog ── */}
      {selectedRequest && (
        <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl border border-border shadow-2xl bg-card">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2">
                <XCircle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold">
                {isAr ? `رفض طلب الانضمام (${selectedRequest.full_name})` : `Reject Request (${selectedRequest.full_name})`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAr
                  ? "كتابة سبب الرفض إلزامي وسيتم تسجيله في سجل التدقيق."
                  : "Rejection reason is required and recorded in the audit log."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "سبب الرفض (إلزامي)" : "Rejection Reason"} *
                </label>
                <Textarea
                  required
                  placeholder={isAr ? "اكتب سبب القرار بوضوح..." : "Enter reason clearly..."}
                  value={rejectReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                  className="min-h-[80px] text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk_visible"
                  checked={rejectReasonVisible}
                  onChange={(e) => setRejectReasonVisible(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <label htmlFor="chk_visible" className="cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                  {isAr ? "إظهار سبب الرفض للمتقدم عند الاستعلام عن طلبه" : "Show reason to applicant"}
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "فترة حظر إعادة التقديم (يوم)" : "Cooldown Days Before Re-applying"}
                </label>
                <Input
                  type="number"
                  value={rejectCooldownDays}
                  onChange={(e) => setRejectCooldownDays(parseInt(e.target.value, 10) || 14)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRejectModalOpen(false)}
                className="h-10 text-xs rounded-xl"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleExecuteReject}
                disabled={isExecutingReject || !rejectReason.trim()}
                className="h-10 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isExecutingReject ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isAr ? "تسجيل قرار الرفض" : "Confirm Rejection"}</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── MODAL 4: Request More Info Dialog ── */}
      {selectedRequest && (
        <Dialog open={isRequestInfoModalOpen} onOpenChange={setIsRequestInfoModalOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl border border-border shadow-2xl bg-card">
            <DialogHeader>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2">
                <HelpCircle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold">
                {isAr ? "طلب استكمال أو توضيح بيانات" : "Request Additional Information"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isAr
                  ? "تحديد الحقول المطلوب تحديثها وإرسال رسالة توجيه لمقدم الطلب."
                  : "Specify which fields need updating and provide reviewer guidance."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block">
                  {isAr ? "حدد الحقول المطلوب تعديلها:" : "Fields to Update:"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "id_card_doc", label_ar: "صورة بطاقة الهوية / الكارنيه", label_en: "ID Document" },
                    { key: "national_id", label_ar: "الرقم القومي", label_en: "National ID" },
                    { key: "cv_resume_doc", label_ar: "السيرة الذاتية (CV)", label_en: "CV / Resume" },
                    { key: "bio_or_motivation", label_ar: "نبذة ودوافع الانضمام", label_en: "Bio / Motivation" },
                    { key: "github_url", label_ar: "رابط حساب GitHub", label_en: "GitHub URL" },
                    { key: "faculty_department", label_ar: "الكلية والتخصص", label_en: "Faculty / Dept" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-slate-50 dark:bg-zinc-800/40 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={infoFields.includes(item.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setInfoFields([...infoFields, item.key]);
                          } else {
                            setInfoFields(infoFields.filter((k) => k !== item.key));
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="truncate">{isAr ? item.label_ar : item.label_en}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "رسالة التوجيه للمتقدم (إلزامي)" : "Reviewer Instructions (Required)"} *
                </label>
                <Textarea
                  required
                  placeholder={
                    isAr
                      ? "مثال: الصورة المرفقة للرقم القومي غير واضحة، يرجى إعادة رفع صورة واضحة ومقروءة..."
                      : "e.g. Uploaded ID document is blurry, please provide a clear scan..."
                  }
                  value={infoMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInfoMessage(e.target.value)}
                  className="min-h-[80px] text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsRequestInfoModalOpen(false)}
                className="h-10 text-xs rounded-xl"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleExecuteRequestInfo}
                disabled={isExecutingRequestInfo || !infoMessage.trim() || infoFields.length === 0}
                className="h-10 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isExecutingRequestInfo ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isAr ? "إرسال طلب الاستكمال" : "Send Request"}</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
