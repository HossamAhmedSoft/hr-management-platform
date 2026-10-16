"use client";

import React, { useState } from "react";
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
import {
  UserPlus,
  User,
  Mail,
  Key,
  ShieldCheck,
  Users,
  Phone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Team, UserRole } from "@/types";

interface CreateMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teams: Team[];
  onSuccess: () => void;
  registerWithCredentials: (
    email: string,
    pass: string,
    name: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string; user?: any }>;
  updateProfile: (id: string, data: any) => Promise<any>;
  isAr: boolean;
}

export function CreateMemberModal({
  isOpen,
  onOpenChange,
  teams,
  onSuccess,
  registerWithCredentials,
  updateProfile,
  isAr,
}: CreateMemberModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("GDG_NCTU_2026!");
  const [role, setRole] = useState<UserRole>("member");
  const [teamId, setTeamId] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let generated = "GDG#";
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError(isAr ? "يرجى كتابة الاسم والبريد الإلكتروني." : "Please enter full name and email.");
      return;
    }
    if (!password || password.length < 6) {
      setError(isAr ? "كلمة المرور يجب أن لا تقل عن 6 أحرف." : "Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await registerWithCredentials(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        role
      );

      if (res.success && res.user) {
        if (teamId || phone) {
          await updateProfile(res.user.id, {
            team_id: teamId || undefined,
            phone: phone || undefined,
          });
        }
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFullName("");
          setEmail("");
          setPhone("");
          setPassword("GDG_NCTU_2026!");
          onOpenChange(false);
          onSuccess();
        }, 900);
      } else {
        setError(res.error || (isAr ? "فشل إنشاء الحساب." : "Failed to create account."));
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
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {isAr ? "إنشاء حساب عضو جديد بالمنصة" : "Provision New Member Account"}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {isAr
                  ? "تسجيل بيانات العضو وتعيين الدور الإداري والفريق المعتمد."
                  : "Register member credentials and assign committee role."}
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
              <span>{isAr ? "تم إنشاء الحساب بنجاح!" : "Account created successfully!"}</span>
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
                placeholder={isAr ? "مثال: مريم خالد مصطفى" : "e.g. Mariam Khaled"}
                className="h-10 text-xs rounded-xl border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "البريد الإلكتروني المعتمد" : "Email Address"}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gdgnctu.com"
                className="h-10 text-xs rounded-xl border-border bg-background"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "كلمة المرور الأولية" : "Initial Password"}
                <span className="text-rose-500">*</span>
              </Label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                {isAr ? "توليد كلمة سر عشوائية" : "Generate strong"}
              </button>
            </div>
            <Input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 text-xs rounded-xl border-border bg-background font-mono"
            />
          </div>

          {/* Role & Team */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "الدور والصلاحية" : "Role & Privilege"}
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="member">{isAr ? "عضو (Member)" : "Member"}</option>
                <option value="team_lead">{isAr ? "قائد فريق (Team Lead)" : "Team Lead"}</option>
                <option value="hr_reviewer">{isAr ? "مراجع الموارد (HR Reviewer)" : "HR Reviewer"}</option>
                <option value="hr_admin">{isAr ? "مسؤول الموارد (HR Admin)" : "HR Admin"}</option>
                <option value="super_admin">{isAr ? "مدير النظام (Super Admin)" : "Super Admin"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "الفريق / اللجنة" : "Team / Committee"}
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

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {isAr ? "رقم الهاتف (اختياري)" : "Phone (Optional)"}
            </Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 100 000 0000"
              className="h-10 text-xs rounded-xl border-border bg-background"
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
                ? (isAr ? "جارِ الإنشاء..." : "Creating...")
                : (isAr ? "تأكيد وإنشاء الحساب" : "Create & Provision")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
