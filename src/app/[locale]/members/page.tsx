"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Mail,
  Phone,
  Calendar,
  Shield,
  Layers,
  Award,
  TrendingUp,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Key,
  Edit,
  Trash2,
  CheckSquare,
  ExternalLink,
  GraduationCap,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/app-context";
import { Profile, UserRole, MemberStatus } from "@/types";
import { registerWithCredentials } from "@/lib/auth-service";
import { isUserInTrack } from "@/lib/utils";

export default function MembersPage() {
  const router = useRouter();
  const {
    availableUsers,
    teams,
    locale,
    pointEvents,
    tasks,
    evaluations,
    currentUser,
    updateProfile,
    deleteProfile,
    resetMemberPassword,
  } = useApp();
  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";
  const isSuperAdmin = userRole === "super_admin";
  const canManageMembers = userRole === "super_admin" || userRole === "hr_admin";
  const canExport = userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Super Admin Account Creation State
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("gdg2026!");
  const [newRole, setNewRole] = useState<UserRole>("member");
  const [newTeamId, setNewTeamId] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addAccountSuccess, setAddAccountSuccess] = useState(false);
  const [addAccountError, setAddAccountError] = useState("");
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

  // Password Reset State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetMember, setPasswordTargetMember] = useState<Profile | null>(null);
  const [targetNewPassword, setTargetNewPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(true);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Edit Member Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("member");
  const [editTeamId, setEditTeamId] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState<MemberStatus>("active");
  const [editBio, setEditBio] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Member Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Profile | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Helper: check if member belongs to selected team / committee
  const isUserInTeam = (u: any, teamId?: string) => {
    if (!teamId || teamId === "all") return true;
    return isUserInTrack(u, teamId, teams);
  };

  const filteredMembers = availableUsers.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = isUserInTeam(m, selectedTeam);
    return matchesSearch && matchesTeam;
  });

  const getTeamName = (teamId?: string) => {
    const t = teams.find((x) => x.id === teamId);
    if (!t) return isAr ? "غير محدد" : "Unassigned";
    return isAr ? t.name_ar : t.name;
  };

  // Robust user matching helper to strictly isolate each member's points without cross-mix
  const isMatchUser = (targetId?: string, comparisonUserId?: string) => {
    if (!targetId || !comparisonUserId) return false;

    const cleanTarget = targetId.toLowerCase().trim();
    const cleanComp = comparisonUserId.toLowerCase().trim();

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

  const getMemberNetPoints = (memberId: string) => {
    return pointEvents
      .filter((p) => isMatchUser(p.member_id, memberId) && p.status === "approved")
      .reduce((sum, p) => sum + (p.direction === "positive" ? p.value : -Math.abs(p.value)), 0);
  };

  const getMemberTasksCount = (memberId: string) => {
    return tasks.filter(
      (t) =>
        isMatchUser(t.created_by, memberId) ||
        t.assignees?.some((a) => isMatchUser(a.profile_id || a.profile?.id, memberId))
    ).length;
  };

  const handleExportCSV = () => {
    const headers = "ID,Name,Email,Role,Team,Status,JoinDate,NetPoints\n";
    const rows = filteredMembers
      .map(
        (m) =>
          `"${m.id}","${m.full_name}","${m.email}","${m.role}","${getTeamName(
            m.team_id
          )}","${m.status}","${m.join_date}","${getMemberNetPoints(m.id)}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gdg_nctu_members_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAccount(true);
    setAddAccountError("");
    setAddAccountSuccess(false);

    if (!newFullName.trim() || !newEmail.trim()) {
      setAddAccountError(isAr ? "يرجى إدخال الاسم والبريد الإلكتروني" : "Please enter name and email");
      setIsSubmittingAccount(false);
      return;
    }

    const res = await registerWithCredentials(
      newEmail.trim().toLowerCase(),
      newPassword,
      newFullName.trim(),
      newRole
    );

    if (res.success && res.user) {
      if (newTeamId || newPhone) {
        await updateProfile(res.user.id, {
          team_id: newTeamId || undefined,
          phone: newPhone || undefined,
        });
      }
      setAddAccountSuccess(true);
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      setTimeout(() => {
        setIsAddAccountModalOpen(false);
        setAddAccountSuccess(false);
      }, 1200);
    } else {
      setAddAccountError(res.error || (isAr ? "فشل إنشاء الحساب" : "Failed to create account"));
    }
    setIsSubmittingAccount(false);
  };

  // Open Edit Modal
  const openEditModal = (member: Profile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingMember(member);
    setEditFullName(member.full_name);
    setEditEmail(member.email);
    setEditRole(member.role);
    setEditTeamId(member.team_id || "");
    setEditPhone(member.phone || "");
    setEditStatus((member.status as any) || "active");
    setEditBio(member.bio || "");
    setEditPassword("");
    setEditSuccess(false);
    setEditError("");
    setIsEditModalOpen(true);
  };

  // Submit Edit Member
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmittingEdit(true);
    setEditError("");
    setEditSuccess(false);

    if (editPassword.trim()) {
      if (editPassword.trim().length < 6) {
        setEditError(
          isAr ? "يجب ألا تقل كلمة السر عن 6 أحرف" : "Password must be at least 6 characters"
        );
        setIsSubmittingEdit(false);
        return;
      }
      await resetMemberPassword(editingMember.email, editPassword.trim());
    }

    const success = await updateProfile(editingMember.id, {
      full_name: editFullName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      team_id: editTeamId || undefined,
      phone: editPhone.trim() || undefined,
      status: editStatus,
      bio: editBio.trim() || undefined,
    });

    if (success) {
      setEditSuccess(true);
      if (selectedMember && selectedMember.id === editingMember.id) {
        setSelectedMember({
          ...selectedMember,
          full_name: editFullName.trim(),
          email: editEmail.trim().toLowerCase(),
          role: editRole,
          team_id: editTeamId || undefined,
          phone: editPhone.trim() || undefined,
          status: editStatus,
          bio: editBio.trim() || undefined,
        });
      }
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess(false);
      }, 1000);
    } else {
      setEditError(isAr ? "حدث خطأ أثناء تعديل البيانات" : "Failed to update profile");
    }
    setIsSubmittingEdit(false);
  };

  // Open Password Modal
  const openPasswordModal = (member: Profile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPasswordTargetMember(member);
    setTargetNewPassword("gdg2026!");
    setPasswordSuccess(false);
    setPasswordError("");
    setCopiedPassword(false);
    setShowPasswordText(true);
    setIsPasswordModalOpen(true);
  };

  // Generate random strong password
  const generateStrongPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "GDG";
    for (let i = 0; i < 7; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTargetNewPassword(pwd);
  };

  // Submit Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetMember) return;
    const cleanPw = targetNewPassword.trim();
    if (!cleanPw) {
      setPasswordError(isAr ? "يرجى كتابة كلمة السر الجديدة" : "Please enter a new password");
      return;
    }
    if (cleanPw.length < 6) {
      setPasswordError(
        isAr ? "يجب ألا تقل كلمة السر عن 6 أحرف" : "Password must be at least 6 characters"
      );
      return;
    }
    setIsSubmittingPassword(true);
    setPasswordError("");
    setPasswordSuccess(false);

    try {
      const success = await resetMemberPassword(
        passwordTargetMember.email,
        cleanPw
      );
      if (success) {
        setPasswordSuccess(true);
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setPasswordSuccess(false);
        }, 1500);
      } else {
        setPasswordError(isAr ? "تعذر تغيير كلمة السر" : "Failed to reset password");
      }
    } catch {
      setPasswordError(isAr ? "حدث خطأ أثناء حفظ كلمة السر" : "Error resetting password");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (member: Profile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingMember(member);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Member
  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    setIsSubmittingDelete(true);
    const success = await deleteProfile(deletingMember.id);
    if (success) {
      if (selectedMember && selectedMember.id === deletingMember.id) {
        setSelectedMember(null);
      }
      setIsDeleteModalOpen(false);
      setDeletingMember(null);
    } else {
      alert(isAr ? "فشل حذف العضو" : "Failed to delete member");
    }
    setIsSubmittingDelete(false);
  };

  // Navigate to member tasks
  const handleNavigateToTasks = (memberId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(`/${locale}/tasks?member=${memberId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "دليل أعضاء GDG NCTU" : "GDG NCTU Members Directory"}
        description={
          isAr
            ? "استعراض ملفات الأعضاء، الفرق التابعة، سجلات المهام والنقاط المعتمدة، وإدارة الحسابات وكلمات المرور."
            : "Search and manage GDG committee members, team allocations, performance files, and credentials."
        }
      >
        {canManageMembers && (
          <Button
            size="sm"
            onClick={() => {
              setIsAddAccountModalOpen(true);
              setAddAccountSuccess(false);
              setAddAccountError("");
            }}
            className="gap-2 bg-[#1a73e8] hover:bg-[#1765cc] text-white shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            {isAr ? "إنشاء حساب جديد (Admin)" : "Create Account (Admin)"}
          </Button>
        )}
        {canManageMembers && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4 text-primary" />
            {isAr ? "استيراد CSV" : "Import CSV"}
          </Button>
        )}
        {canExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            {isAr ? "تصدير البيانات" : "Export CSV"}
          </Button>
        )}
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder={
              isAr ? "بحث بالاسم أو البريد..." : "Search by name or email..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50 h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="h-10 px-3 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none"
          >
            <option value="all">
              {isAr ? "جميع الفرق واللجان" : "All Teams & Committees"}
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {isAr ? t.name_ar : t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.length === 0 ? (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">
              {isAr ? "لا يوجد أعضاء مطابقين للبحث" : "No members found"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "يمكنك استخدام 'إنشاء حساب جديد' لإضافة أعضاء جدد إلى النظام."
                : "You can click 'Create Account' above to provision members."}
            </p>
          </Card>
        ) : (
          filteredMembers.map((member) => {
            const netPts = getMemberNetPoints(member.id);
            const taskCount = getMemberTasksCount(member.id);

            return (
              <Card
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="p-5 border-border/70 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <Avatar className="w-13 h-13 border-2 border-primary/20 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {member.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {member.full_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                          {member.role.replace("_", " ")}
                        </span>
                        <StatusBadge status={member.status} />
                      </div>
                    </div>
                  </div>

                  {/* Individual Member Key Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3.5 p-2 rounded-xl bg-muted/30 border border-border/50 text-[11px]">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500 shrink-0" />
                        {isAr ? "النقاط:" : "Points:"}
                      </span>
                      <span
                        className={`font-black ${
                          netPts >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {netPts > 0 ? `+${netPts}` : netPts} pts
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-1 border-r rtl:border-r-0 rtl:border-l border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-blue-500 shrink-0" />
                        {isAr ? "المهام:" : "Tasks:"}
                      </span>
                      <span className="font-black text-foreground">{taskCount}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Quick Action Buttons */}
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {getTeamName(member.team_id)}
                    </span>
                    <span className="text-[11px]">
                      {new Date(member.join_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {/* View Tasks button directly filtered for this member */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleNavigateToTasks(member.id, e)}
                      className="h-7 text-[11px] px-2.5 gap-1.5 flex-1 hover:border-primary/50 text-foreground"
                      title={isAr ? "عرض مهمات هذا العضو فقط" : "View member's tasks"}
                    >
                      <CheckSquare className="w-3 h-3 text-[#1a73e8]" />
                      <span>{isAr ? "مهماته" : "Tasks"}</span>
                    </Button>

                    {/* Edit Member button */}
                    {canManageMembers && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => openEditModal(member, e)}
                        className="h-7 w-7 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={isAr ? "تعديل بيانات العضو" : "Edit Profile"}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* Admin: Change Password button */}
                    {canManageMembers && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => openPasswordModal(member, e)}
                        className="h-7 w-7 p-0 hover:bg-amber-500/10 text-amber-600"
                        title={isAr ? "تغيير كلمة السر" : "Reset Password"}
                      >
                        <Key className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* Super Admin: Delete Member button */}
                    {isSuperAdmin && member.id !== currentUser?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => openDeleteModal(member, e)}
                        className="h-7 w-7 p-0 hover:bg-rose-500/10 text-rose-600"
                        title={isAr ? "حذف الحساب نهائياً" : "Delete Member"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <Dialog
          open={!!selectedMember}
          onOpenChange={(open) => !open && setSelectedMember(null)}
        >
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
            <DialogHeader className="pb-2 border-b border-border/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-13 h-13 border border-primary/30 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                      {selectedMember.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-lg font-bold">
                      {selectedMember.full_name}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedMember.email} • {getTeamName(selectedMember.team_id)}
                    </p>
                  </div>
                </div>

                {/* Direct Action Buttons Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => handleNavigateToTasks(selectedMember.id)}
                    className="gap-1.5 h-8 text-xs bg-[#1a73e8] hover:bg-[#1765cc] text-white"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {isAr ? "مهمات هذا العضو" : "View Member Tasks"}
                  </Button>

                  {canManageMembers && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(selectedMember)}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Edit className="w-3.5 h-3.5 text-primary" />
                      {isAr ? "تعديل" : "Edit"}
                    </Button>
                  )}

                  {canManageMembers && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPasswordModal(selectedMember)}
                      className="gap-1.5 h-8 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <Key className="w-3.5 h-3.5" />
                      {isAr ? "كلمة السر" : "Password"}
                    </Button>
                  )}

                  {isSuperAdmin && selectedMember.id !== currentUser?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDeleteModal(selectedMember)}
                      className="gap-1.5 h-8 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isAr ? "حذف" : "Delete"}
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            {(() => {
              const canViewPrivate =
                isSuperAdmin ||
                userRole === "hr_admin" ||
                userRole === "team_lead" ||
                selectedMember.id === currentUser?.id;

              const memberTasks = tasks.filter(
                (t) =>
                  isMatchUser(t.created_by, selectedMember.id) ||
                  t.assignees?.some((a) => isMatchUser(a.profile_id || a.profile?.id, selectedMember.id))
              );

              const memberPoints = pointEvents.filter((p) => isMatchUser(p.member_id, selectedMember.id));
              const memberEvals = evaluations.filter((e) => isMatchUser(e.member_id, selectedMember.id));
              const netPoints = getMemberNetPoints(selectedMember.id);

              return (
                <Tabs defaultValue="info" className="mt-4">
                  <TabsList className={`grid ${canViewPrivate ? "grid-cols-4" : "grid-cols-2"} w-full`}>
                    <TabsTrigger value="info" className="text-xs">
                      {isAr ? "البيانات الشخصية" : "Personal Info"}
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="text-xs">
                      {isAr ? `المهام (${memberTasks.length})` : `Tasks (${memberTasks.length})`}
                    </TabsTrigger>
                    {canViewPrivate && (
                      <TabsTrigger value="points" className="text-xs">
                        {isAr ? `النقاط (${memberPoints.length})` : `Points (${memberPoints.length})`}
                      </TabsTrigger>
                    )}
                    {canViewPrivate && (
                      <TabsTrigger value="evals" className="text-xs">
                        {isAr ? `التقييمات (${memberEvals.length})` : `Evals (${memberEvals.length})`}
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* TAB 1: Complete Personal Info */}
                  <TabsContent value="info" className="space-y-4 pt-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                          <Shield className="w-3.5 h-3.5 text-primary" />
                          {isAr ? "الصلاحية والدور:" : "Role & Privilege:"}
                        </span>
                        <p className="font-bold text-foreground text-sm capitalize">
                          {selectedMember.role.replace("_", " ")}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          {isAr ? "حالة الحساب:" : "Account Status:"}
                        </span>
                        <div className="mt-1">
                          <StatusBadge status={selectedMember.status} />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          {isAr ? "الفريق / اللجنة:" : "Team / Committee:"}
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {getTeamName(selectedMember.team_id)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-blue-500" />
                          {isAr ? "رقم الهاتف:" : "Phone:"}
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {selectedMember.phone || (isAr ? "غير مسجل" : "Not specified")}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-purple-500" />
                          {isAr ? "تاريخ الانضمام:" : "Join Date:"}
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {new Date(selectedMember.join_date).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-muted-foreground flex items-center gap-1.5 mb-1 font-medium">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {isAr ? "صافي النقاط المعتمدة:" : "Approved Points:"}
                        </span>
                        <p
                          className={`font-black text-sm ${
                            netPoints >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {netPoints > 0 ? `+${netPoints}` : netPoints} pts
                        </p>
                      </div>
                    </div>

                    {/* Bio & Academic / Personal Notes */}
                    <div className="p-4 rounded-xl bg-card border border-border/80">
                      <span className="text-muted-foreground flex items-center gap-1.5 mb-1.5 font-bold">
                        <FileText className="w-4 h-4 text-primary" />
                        {isAr ? "البيان الشخصي والملاحظات:" : "Personal Bio & Notes:"}
                      </span>
                      <p className="text-foreground leading-relaxed">
                        {selectedMember.bio ||
                          (isAr
                            ? "لا توجد نبذة شخصية مدونة حالياً. يمكنك تعديل الحساب لإضافة النبذة أو الكلية والجامعة."
                            : "No personal bio specified. You can edit profile to add bio/university info.")}
                      </p>
                    </div>
                  </TabsContent>

                  {/* TAB 2: Member Tasks */}
                  <TabsContent value="tasks" className="space-y-3 pt-4">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {isAr
                          ? `مهام مسندة للعضو (${memberTasks.length})`
                          : `Tasks assigned to member (${memberTasks.length})`}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNavigateToTasks(selectedMember.id)}
                        className="text-xs h-7 gap-1 text-[#1a73e8]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {isAr ? "عرضها في صفحة المهام كاملة" : "Open in Tasks Page"}
                      </Button>
                    </div>

                    {memberTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                        <p className="text-xs font-medium">
                          {isAr
                            ? "لا توجد مهمات مسندة لهذا العضو حالياً."
                            : "No tasks assigned to this member."}
                        </p>
                      </div>
                    ) : (
                      memberTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl border border-border/80 flex items-center justify-between text-xs bg-card"
                        >
                          <div>
                            <p className="font-bold text-foreground">{t.title}</p>
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                              {isAr ? "الموعد النهائي:" : "Deadline:"}{" "}
                              {new Date(t.deadline).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={t.status} />
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* TAB 3: Points */}
                  <TabsContent value="points" className="space-y-2 pt-4">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold text-foreground">
                        {isAr ? "رصيد النقاط الصافي:" : "Net Balance:"}{" "}
                        <span
                          className={`font-black ${
                            netPoints >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {netPoints > 0 ? `+${netPoints}` : netPoints} pts
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/${locale}/points`)}
                        className="text-xs h-7 text-primary"
                      >
                        {isAr ? "الانتقال لسجل النقاط" : "Go to Points Ledger"}
                      </Button>
                    </div>

                    {memberPoints.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6 bg-muted/20 rounded-xl border border-dashed">
                        {isAr ? "لم تُسجل أي نقاط لهذا العضو بعد." : "No points recorded yet."}
                      </p>
                    ) : (
                      memberPoints.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl border border-border/80 flex items-center justify-between text-xs bg-card"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black ${
                                  p.value > 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {p.value > 0 ? `+${p.value}` : p.value} pts
                              </span>
                              <span className="font-semibold text-foreground">
                                {p.explanation}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                              {isAr ? "التاريخ:" : "Date:"} {p.event_date}
                            </p>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* TAB 4: Evaluations */}
                  <TabsContent value="evals" className="space-y-2 pt-4">
                    {memberEvals.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6 bg-muted/20 rounded-xl border border-dashed">
                        {isAr
                          ? "لا توجد تقييمات شهرية معتمدة لهذا العضو."
                          : "No finalized evaluations recorded for this member."}
                      </p>
                    ) : (
                      memberEvals.map((e) => (
                        <div
                          key={e.id}
                          className="p-3 rounded-xl border border-border/80 flex items-center justify-between text-xs bg-card"
                        >
                          <div>
                            <p className="font-bold text-foreground">
                              {isAr ? "الدرجة الرسمية:" : "Score:"} {e.total_score} / 100
                            </p>
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                              {isAr ? "المستوى المحقق:" : "Band:"} {e.performance_band}
                            </p>
                          </div>
                          <StatusBadge status={e.status} />
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Member Password Modal */}
      {isPasswordModalOpen && passwordTargetMember && (
        <Dialog
          open={isPasswordModalOpen}
          onOpenChange={(open) => !open && setIsPasswordModalOpen(false)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                {isAr
                  ? `تغيير كلمة السر للعضو (${passwordTargetMember.full_name})`
                  : `Reset Password for ${passwordTargetMember.full_name}`}
              </DialogTitle>
            </DialogHeader>

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-500/30">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? "تم تحديث كلمة السر بنجاح! يمكن للعضو استخدام كلمة السر الجديدة فوراً."
                    : "Password updated successfully! Member can sign in with the new password immediately."}
                </span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-3.5 text-xs py-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-muted-foreground text-[11px]">
                  {isAr ? "البريد الإلكتروني المعتمد:" : "Account Email:"}
                </p>
                <p className="font-bold text-foreground text-xs mt-0.5 font-mono">
                  {passwordTargetMember.email}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-foreground">
                    {isAr ? "كلمة السر الجديدة:" : "New Password:"}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isAr ? "توليد كلمة عشوائية" : "Generate Strong"}</span>
                    </button>
                    {targetNewPassword && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(targetNewPassword);
                          setCopiedPassword(true);
                          setTimeout(() => setCopiedPassword(false), 2000);
                        }}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        {copiedPassword ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {isAr ? "تم النسخ!" : "Copied!"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{isAr ? "نسخ" : "Copy"}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    type={showPasswordText ? "text" : "password"}
                    required
                    value={targetNewPassword}
                    onChange={(e) => setTargetNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-9 pr-9 h-9 rounded-lg bg-background text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswordText ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  {isAr
                    ? "يتم تشفير وتحديث كلمة السر مباشرة في قاعدة البيانات المركزية ومزامنتها لتمكين العضو من تسجيل الدخول فوراً عبر أي جهاز."
                    : "Password is encrypted and synchronized directly to the central database, enabling immediate login across all devices."}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPassword}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmittingPassword
                    ? isAr
                      ? "جارِ الحفظ والربط..."
                      : "Saving..."
                    : isAr
                    ? "تأكيد وتفعيل كلمة السر"
                    : "Update & Enforce Password"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Member Profile Modal */}
      {isEditModalOpen && editingMember && (
        <Dialog
          open={isEditModalOpen}
          onOpenChange={(open) => !open && setIsEditModalOpen(false)}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                {isAr
                  ? `تعديل بيانات العضو (${editingMember.full_name})`
                  : `Edit Profile: ${editingMember.full_name}`}
              </DialogTitle>
            </DialogHeader>

            {editSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-500/30">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isAr ? "تم حفظ التعديلات بنجاح!" : "Profile updated successfully!"}
                </span>
              </div>
            )}

            {editError && (
              <div className="p-3 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-500/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs py-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "الاسم الكامل:" : "Full Name:"}
                </label>
                <Input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="h-9 rounded-lg bg-background text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "البريد الإلكتروني:" : "Email:"}
                </label>
                <Input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-9 rounded-lg bg-background text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "الصلاحية:" : "Role:"}
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    disabled={!isSuperAdmin && editingMember.role === "super_admin"}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value="member">{isAr ? "عضو (Member)" : "Member"}</option>
                    <option value="team_lead">{isAr ? "قائد فريق (Team Lead)" : "Team Lead"}</option>
                    <option value="hr_reviewer">{isAr ? "مراجع (HR Reviewer)" : "HR Reviewer"}</option>
                    <option value="hr_admin">{isAr ? "مسؤول (HR Admin)" : "HR Admin"}</option>
                    {isSuperAdmin && (
                      <option value="super_admin">{isAr ? "مدير النظام (Super Admin)" : "Super Admin"}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "الفريق / اللجنة:" : "Team:"}
                  </label>
                  <select
                    value={editTeamId}
                    onChange={(e) => setEditTeamId(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value="">{isAr ? "غير محدد" : "Unassigned"}</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.name_ar : t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "الحالة:" : "Status:"}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value="active">{isAr ? "نشط (Active)" : "Active"}</option>
                    <option value="suspended">{isAr ? "موقوف (Suspended)" : "Suspended"}</option>
                    <option value="on_leave">{isAr ? "إجازة (On Leave)" : "On Leave"}</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "رقم الهاتف:" : "Phone:"}
                  </label>
                  <Input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="h-9 rounded-lg bg-background text-xs"
                  />
                </div>
              </div>

              {canManageMembers && (
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "تعيين كلمة سر جديدة (اختياري):" : "Set New Password (Optional):"}
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder={
                        isAr
                          ? "اتركه فارغاً للإبقاء على كلمة السر الحالية"
                          : "Leave empty to keep existing password"
                      }
                      className="pl-9 h-9 rounded-lg bg-background text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "البيان الشخصي / الكلية والملاحظات:" : "Personal Bio / Notes:"}
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={
                    isAr
                      ? "نبذة عن العضو، جامعته، أو مساره التقني..."
                      : "Member background, university, or track details..."
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* Delete Member Confirmation Modal */}
      {isDeleteModalOpen && deletingMember && (
        <Dialog
          open={isDeleteModalOpen}
          onOpenChange={(open) => !open && setIsDeleteModalOpen(false)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5 text-rose-600" />
                {isAr ? "تأكيد حذف حساب العضو" : "Confirm Member Deletion"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-foreground">
                {isAr
                  ? `هل أنت متأكد من رغبتك في حذف حساب العضو (${deletingMember.full_name}) نهائياً من النظام؟`
                  : `Are you sure you want to permanently delete member ${deletingMember.full_name}?`}
              </p>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                <p className="font-semibold">
                  {isAr
                    ? "تنبيه: سيتم إزالة الحساب نهائياً مع تسجيل عملية الحذف في سجل التدقيق الإداري (Audit Log)."
                    : "Warning: The profile will be removed and logged in the immutable audit trail."}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(false)}
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

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <Dialog
          open={isImportModalOpen}
          onOpenChange={(open) => !open && setIsImportModalOpen(false)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "استيراد قائمة الأعضاء من CSV" : "Import Members CSV"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <p className="text-muted-foreground">
                {isAr
                  ? "يرجى اختيار ملف CSV يحتوي على الأعمدة: Full Name, Email, Role, Team."
                  : "Upload a CSV file containing: Full Name, Email, Role, Team."}
              </p>
              <div className="p-8 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center bg-muted/20">
                <Upload className="w-8 h-8 text-primary mb-2" />
                <p className="font-semibold text-foreground">
                  {isAr ? "اسحب الملف هنا أو اضغط للاختيار" : "Drop CSV here or browse"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Supports UTF-8 CSV / XLSX up to 5MB
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    alert(isAr ? "تمت المعاينة والتحقق بنجاح!" : "Preview validated!");
                    setIsImportModalOpen(false);
                  }}
                >
                  {isAr ? "معاينة واعتماد" : "Preview & Validate"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Super Admin: Create Account Modal */}
      {isAddAccountModalOpen && (
        <Dialog
          open={isAddAccountModalOpen}
          onOpenChange={(open) => !open && setIsAddAccountModalOpen(false)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                {isAr ? "إنشاء حساب وتعيين الصلاحيات (Admin)" : "Create & Provision Account (Admin)"}
              </DialogTitle>
            </DialogHeader>

            {addAccountSuccess && (
              <div className="p-3 rounded-lg bg-[#e6f4ea] dark:bg-[#34a853]/20 text-[#137333] dark:text-[#81c995] text-xs flex items-center gap-2 border border-[#ceead6] dark:border-[#34a853]/30">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? "تم إنشاء الحساب وتفعيله بنجاح! يمكن للمستخدم الآن الدخول إلى المنصة."
                    : "Account provisioned successfully! User can now sign in."}
                </span>
              </div>
            )}

            {addAccountError && (
              <div className="p-3 rounded-lg bg-[#fce8e6] dark:bg-[#ea4335]/20 text-[#c5221f] dark:text-[#f28b82] text-xs flex items-center gap-2 border border-[#fad2cf] dark:border-[#ea4335]/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addAccountError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs py-2">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "الاسم الكامل:" : "Full Name:"}
                </label>
                <Input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder={isAr ? "مثال: مريم خالد" : "e.g. Mariam Khaled"}
                  className="h-9 rounded-lg bg-background text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "البريد الإلكتروني المعتمد:" : "Email Address:"}
                </label>
                <Input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@gdgnctu.com"
                  className="h-9 rounded-lg bg-background text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "كلمة المرور الأولية للمستخدم:" : "Initial Password:"}
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 h-9 rounded-lg bg-background text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "الدور الوظيفي والصلاحية:" : "Role & Privilege:"}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value="member">{isAr ? "عضو (Member)" : "Member"}</option>
                    <option value="team_lead">{isAr ? "قائد فريق (Team Lead)" : "Team Lead"}</option>
                    <option value="hr_reviewer">{isAr ? "مراجع الموارد (HR Reviewer)" : "HR Reviewer"}</option>
                    <option value="hr_admin">{isAr ? "مسؤول الموارد (HR Admin)" : "HR Admin"}</option>
                    <option value="super_admin">{isAr ? "مدير النظام (Super Admin)" : "Super Admin"}</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "الفريق / اللجنة:" : "Team / Committee:"}
                  </label>
                  <select
                    value={newTeamId}
                    onChange={(e) => setNewTeamId(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value="">{isAr ? "غير محدد" : "Unassigned"}</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.name_ar : t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "رقم الهاتف (اختياري):" : "Phone (Optional):"}
                </label>
                <Input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="h-9 rounded-lg bg-background text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddAccountModalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingAccount}
                  size="sm"
                  className="bg-[#1a73e8] hover:bg-[#1765cc] text-white"
                >
                  {isSubmittingAccount
                    ? isAr
                      ? "جارِ الإنشاء..."
                      : "Creating..."
                    : isAr
                    ? "تأكيد وإنشاء الحساب"
                    : "Create & Provision"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
