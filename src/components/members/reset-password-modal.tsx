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
import {
  Key,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Profile } from "@/types";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: Profile | null;
  onSuccess: () => void;
  resetMemberPassword: (id: string, newPass: string) => Promise<any>;
  isAr: boolean;
}

export function ResetPasswordModal({
  isOpen,
  onOpenChange,
  member,
  onSuccess,
  resetMemberPassword,
  isAr,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "GDG#";
    for (let i = 0; i < 8; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
  };

  useEffect(() => {
    if (isOpen && member) {
      generateStrongPassword();
      setError(null);
      setSuccess(false);
      setCopied(false);
    }
  }, [isOpen, member]);

  if (!member) return null;

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError(isAr ? "كلمة السر يجب أن تكون 6 أحرف على الأقل." : "Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await resetMemberPassword(member.id, password);
      if (res && res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onOpenChange(false);
          onSuccess();
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.message || (isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card text-card-foreground">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {isAr ? `تغيير كلمة السر (${member.full_name})` : `Reset Password (${member.full_name})`}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {isAr
                  ? "تعيين كلمة مرور جديدة آمنة وإرسالها أو تزويد العضو بها."
                  : "Assign a new secure credentials for this account."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isAr ? "تم تحديث كلمة السر بنجاح!" : "Password updated successfully!"}</span>
            </div>
          )}

          {/* Account Details */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <p className="text-muted-foreground text-[11px]">
              {isAr ? "البريد الإلكتروني المعتمد للحساب:" : "Registered Account Email:"}
            </p>
            <p className="font-bold text-foreground text-xs mt-0.5 font-mono">
              {member.email}
            </p>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {isAr ? "كلمة السر الجديدة" : "New Password"}
                <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  {isAr ? "توليد كلمة عشوائية" : "Generate Strong"}
                </button>
                {password && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">{isAr ? "تم النسخ" : "Copied"}</span>
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
              <Input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-xs rounded-xl border-border bg-background font-mono pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              className="rounded-xl h-9 px-5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmitting
                ? (isAr ? "جارِ التحديث..." : "Updating...")
                : (isAr ? "تحديث كلمة السر" : "Update Password")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
