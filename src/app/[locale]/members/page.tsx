"use client";

import React, { useState } from "react";
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
import { Profile, UserRole } from "@/types";
import { registerWithCredentials } from "@/lib/auth-service";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";

export default function MembersPage() {
  const { availableUsers, teams, locale, pointEvents, tasks, evaluations, currentUser } = useApp();
  const isAr = locale === "ar";
  const isSuperAdmin = currentUser?.role === "super_admin";

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

  const filteredMembers = availableUsers.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === "all" || m.team_id === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  const getTeamName = (teamId?: string) => {
    const t = teams.find((x) => x.id === teamId);
    if (!t) return isAr ? "غير محدد" : "Unassigned";
    return isAr ? t.name_ar : t.name;
  };

  const handleExportCSV = () => {
    const headers = "ID,Name,Email,Role,Team,Status,JoinDate\n";
    const rows = filteredMembers
      .map(
        (m) =>
          `"${m.id}","${m.full_name}","${m.email}","${m.role}","${getTeamName(
            m.team_id
          )}","${m.status}","${m.join_date}"`
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
        await dbService.updateProfile(res.user.id, {
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
        window.location.reload();
      }, 1200);
    } else {
      setAddAccountError(res.error || (isAr ? "فشل إنشاء الحساب" : "Failed to create account"));
    }
    setIsSubmittingAccount(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "دليل أعضاء GDG NCTU" : "GDG NCTU Members Directory"}
        description={
          isAr
            ? "استعراض ملفات الأعضاء، الفرق التابعة، سجلات المهام والنقاط المعتمدة."
            : "Search and manage GDG committee members, team allocations, and performance files."
        }
      >
        {isSuperAdmin && (
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
            {isAr ? "إنشاء حساب جديد (Super Admin)" : "Create Account (Super Admin)"}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsImportModalOpen(true)}
          className="gap-2"
        >
          <Upload className="w-4 h-4 text-primary" />
          {isAr ? "استيراد CSV" : "Import CSV"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-2"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          {isAr ? "تصدير البيانات" : "Export CSV"}
        </Button>
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
              {isAr ? "لا يوجد أعضاء مسجلين حالياً" : "No members found"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? (isSuperAdmin
                    ? "اضغط على 'إنشاء حساب جديد (Super Admin)' بالأعلى لإضافة أعضاء جدد للنظام."
                    : "سجل مدير النظام (Super Admin) حسابات الأعضاء لتظهر هنا.")
                : (isSuperAdmin
                    ? "Click 'Create New Account' above to provision members."
                    : "Super Admin provisions new accounts.")}
            </p>
          </Card>
        ) : (
          filteredMembers.map((member) => (
          <Card
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className="p-5 border-border/70 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <Avatar className="w-13 h-13 border-2 border-primary/20">
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

            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 truncate">
                <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {getTeamName(member.team_id)}
              </span>
              <span>Joined {new Date(member.join_date).toLocaleDateString()}</span>
            </div>
          </Card>
        )))}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <Dialog
          open={!!selectedMember}
          onOpenChange={(open) => !open && setSelectedMember(null)}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border border-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
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
            </DialogHeader>

            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="info" className="text-xs">
                  {isAr ? "البيانات" : "Info"}
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">
                  {isAr ? "المهام" : "Tasks"}
                </TabsTrigger>
                <TabsTrigger value="points" className="text-xs">
                  {isAr ? "النقاط" : "Points"}
                </TabsTrigger>
                <TabsTrigger value="evals" className="text-xs">
                  {isAr ? "التقييمات" : "Evals"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Role / الصلاحية:</span>
                    <p className="font-bold text-foreground mt-0.5 capitalize">
                      {selectedMember.role.replace("_", " ")}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Status / الحالة:</span>
                    <p className="font-bold text-foreground mt-0.5 capitalize">
                      {selectedMember.status}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Phone / الهاتف:</span>
                    <p className="font-bold text-foreground mt-0.5">
                      {selectedMember.phone || "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Join Date / تاريخ الانضمام:</span>
                    <p className="font-bold text-foreground mt-0.5">
                      {selectedMember.join_date}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-2 pt-4">
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No assigned tasks.
                  </p>
                ) : (
                  tasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-border/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-foreground">{t.title}</p>
                        <p className="text-muted-foreground">
                          Deadline: {new Date(t.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="points" className="space-y-2 pt-4">
                {pointEvents.filter((p) => p.member_id === selectedMember.id)
                  .length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No points recorded yet.
                  </p>
                ) : (
                  pointEvents
                    .filter((p) => p.member_id === selectedMember.id)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-border/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-extrabold ${
                                p.value > 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {p.value > 0 ? `+${p.value}` : p.value} pts
                            </span>
                            <span className="font-semibold text-foreground">
                              {p.explanation}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            Date: {p.event_date}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    ))
                )}
              </TabsContent>

              <TabsContent value="evals" className="space-y-2 pt-4">
                {evaluations.filter((e) => e.member_id === selectedMember.id)
                  .length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No finalized evaluations recorded for this cycle.
                  </p>
                ) : (
                  evaluations
                    .filter((e) => e.member_id === selectedMember.id)
                    .map((e) => (
                      <div
                        key={e.id}
                        className="p-3 rounded-xl border border-border/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            Score: {e.total_score} / 100
                          </p>
                          <p className="text-muted-foreground">
                            Band: {e.performance_band}
                          </p>
                        </div>
                        <StatusBadge status={e.status} />
                      </div>
                    ))
                )}
              </TabsContent>
            </Tabs>
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
                  : "Upload a CSV file containing: Full Name, Email, Role, Team. Duplicates will be flagged automatically."}
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
                    alert("Import simulation: 5 members validated successfully!");
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
                <UserPlus className="w-5 h-5 text-[#1a73e8]" />
                {isAr ? "إنشاء حساب وتعيين الصلاحيات (Super Admin)" : "Create & Provision Account (Super Admin)"}
              </DialogTitle>
            </DialogHeader>

            {addAccountSuccess && (
              <div className="p-3 rounded-lg bg-[#e6f4ea] text-[#137333] text-xs flex items-center gap-2 border border-[#ceead6]">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? "تم إنشاء الحساب وتفعيله بنجاح! يمكن للمستخدم الآن الدخول إلى المنصة."
                    : "Account provisioned successfully! User can now sign in."}
                </span>
              </div>
            )}

            {addAccountError && (
              <div className="p-3 rounded-lg bg-[#fce8e6] text-[#c5221f] text-xs flex items-center gap-2 border border-[#fad2cf]">
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
