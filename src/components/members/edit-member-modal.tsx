"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UserCheck,
  User,
  Mail,
  ShieldCheck,
  Users,
  Phone,
  Activity,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Profile, Team, UserRole, MemberStatus } from "@/types";

interface EditMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: Profile | null;
  teams: Team[];
  isSuperAdmin: boolean;
  onSuccess: () => void;
  updateProfile: (id: string, data: any) => Promise<any>;
  isAr: boolean;
}

export function EditMemberModal({
  isOpen,
  onOpenChange,
  member,
  teams,
  isSuperAdmin,
  onSuccess,
  updateProfile,
  isAr,
}: EditMemberModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [teamId, setTeamId] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<MemberStatus>("active");
  const [bio, setBio] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      setFullName(member.full_name || "");
      setEmail(member.email || "");
      setRole(member.role || "member");
      setTeamId(member.team_id || "");
      setPhone(member.phone || "");
      setStatus(member.status || "active");
      setBio(member.bio || "");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, member]);

  if (!member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError(isAr ? "يرجى كتابة الاسم والبريد الإلكتروني." : "Please enter full name and email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateProfile(member.id, {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        team_id: teamId || undefined,
        phone: phone.trim() || undefined,
        status,
        bio: bio.trim() || undefined,
      });

      if (res && res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onOpenChange(false);
          onSuccess();
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || (isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card text-card-foreground">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {isAr ? `تعديل بيانات (${member.full_name})` : `Edit Profile (${member.full_name})`}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {isAr
                  ? "تحديث الدور الوظيفي، اللجنة المعتمدة، ومعلومات التواصل."
                  : "Update role, committee assignment, and contact information."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isAr ? "تم حفظ التعديلات بنجاح!" : "Changes saved successfully!"}</span>
            </div>
          )}

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "الاسم الكامل" : "Full Name"}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 text-xs rounded-xl border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "البريد الإلكتروني" : "Email"}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs rounded-xl border-border bg-background"
              />
            </div>
          </div>

          {/* Role & Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "الصلاحية" : "Role"}
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={!isSuperAdmin && member.role === "super_admin"}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
              >
                <option value="member">{isAr ? "عضو (Member)" : "Member"}</option>
                <option value="team_lead">{isAr ? "قائد فريق (Team Lead)" : "Team Lead"}</option>
                <option value="hr_reviewer">{isAr ? "مراجع الموارد (HR Reviewer)" : "HR Reviewer"}</option>
                <option value="hr_admin">{isAr ? "مسؤول الموارد (HR Admin)" : "HR Admin"}</option>
                {isSuperAdmin && (
                  <option value="super_admin">{isAr ? "مدير النظام (Super Admin)" : "Super Admin"}</option>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "الفريق / اللجنة" : "Team"}
              </Label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

          {/* Status & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "الحالة" : "Status"}
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="active">{isAr ? "نشط (Active)" : "Active"}</option>
                <option value="suspended">{isAr ? "موقوف (Suspended)" : "Suspended"}</option>
                <option value="on_leave">{isAr ? "إجازة (On Leave)" : "On Leave"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "رقم الهاتف" : "Phone"}
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 100 000 0000"
                className="h-10 text-xs rounded-xl border-border bg-background"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {isAr ? "نبذة تعريفية" : "Bio / Notes"}
            </Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isAr ? "نبذة عن تخصص العضو ومسؤولياته..." : "Brief background or responsibilities..."}
              className="text-xs h-20 rounded-xl resize-none border-border bg-background"
            />
          </div>

          {/* Footer */}
          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-9 px-4 text-xs"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl h-9 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmitting
                ? (isAr ? "جارِ الحفظ..." : "Saving...")
                : (isAr ? "حفظ التعديلات" : "Save Changes")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
