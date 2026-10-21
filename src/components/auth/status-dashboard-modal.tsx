"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Send,
  RefreshCw,
} from "lucide-react";
import { RegistrationStatus, RegistrationRequest } from "@/types";

interface StatusDashboardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  status: RegistrationStatus;
  referenceNo: string;
  email: string;
  fullName?: string;
  submittedAt?: string;
  decisionReason?: string;
  infoRequestedFields?: string[];
  infoRequestMessage?: string;
  reapplyCooldownUntil?: string;
  isAr: boolean;
  onLoginClick?: () => void;
}

export function StatusDashboardModal({
  isOpen,
  onOpenChange,
  status,
  referenceNo,
  email,
  fullName,
  submittedAt,
  decisionReason,
  infoRequestedFields,
  infoRequestMessage,
  reapplyCooldownUntil,
  isAr,
  onLoginClick,
}: StatusDashboardModalProps) {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [fieldInputs, setFieldInputs] = useState<Record<string, string>>({});

  const copyReference = () => {
    if (!referenceNo) return;
    navigator.clipboard.writeText(referenceNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError("");

    try {
      const res = await fetch("/api/auth/registration/update-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_no: referenceNo,
          email,
          updated_fields: fieldInputs,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUpdateSuccess(true);
      } else {
        setUpdateError(data.error || (isAr ? "فشل تحديث البيانات." : "Failed to update info."));
      }
    } catch {
      setUpdateError(isAr ? "حدث خطأ في الاتصال بالخادم." : "Network error.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Cooldown days calculation for REJECTED
  let daysRemaining = 0;
  if (reapplyCooldownUntil) {
    const diff = new Date(reapplyCooldownUntil).getTime() - Date.now();
    if (diff > 0) {
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950">
        {/* Status Header Banner */}
        {status === "pending_approval" && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/25">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-white">
              {isAr ? "طلب الانضمام قيد المراجعة الإدارية" : "Application Under Review"}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/85 mt-1">
              {isAr
                ? "تم استلام بياناتك وتأكيد بريدك الإلكتروني بنجاح."
                : "Your submission has been received and email verified."}
            </DialogDescription>
          </div>
        )}

        {status === "needs_info" && (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/25">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-white">
              {isAr ? "مطلوب استكمال أو توضيح بعض البيانات" : "Action Required: Update Information"}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/85 mt-1">
              {isAr
                ? "قام فريق الموارد البشرية بمراجعة طلبك وطلب استكمال ما يلي:"
                : "The HR team reviewed your application and requested updates:"}
            </DialogDescription>
          </div>
        )}

        {status === "rejected" && (
          <div className="bg-gradient-to-r from-slate-700 via-zinc-800 to-slate-900 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
              <XCircle className="w-6 h-6 text-rose-400" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-white">
              {isAr ? "حالة طلب الانضمام: غير مقبول حالياً" : "Application Status: Not Accepted"}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/70 mt-1">
              {isAr
                ? "نشكرك على اهتمامك بالانضمام إلى مجتمع GDG NCTU."
                : "Thank you for your interest in joining the GDG NCTU chapter."}
            </DialogDescription>
          </div>
        )}

        {status === "approved" && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/25">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-white">
              {isAr ? "تهانينا! تم قبول طلبك واعتماد عضويتك" : "Congratulations! Application Approved"}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/85 mt-1">
              {isAr
                ? "تم تفعيل حسابك الرسمي بالمنصة، يمكنك تسجيل الدخول الآن مباشرة."
                : "Your member profile is activated. You can now sign in."}
            </DialogDescription>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Reference Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-medium">
                {isAr ? "رقم المرجع الرسمي:" : "Application Reference:"}
              </span>
              <span className="font-mono text-base font-bold text-slate-900 dark:text-white tracking-wider">
                {referenceNo}
              </span>
            </div>
            <button
              type="button"
              onClick={copyReference}
              className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isAr ? "تم النسخ" : "Copied"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isAr ? "نسخ" : "Copy"}</span>
                </>
              )}
            </button>
          </div>

          {/* Details & Explanation per status */}
          {status === "pending_approval" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed space-y-2">
                <p className="font-semibold text-sm">
                  {isAr ? "ماذا يحدث الآن؟" : "What happens next?"}
                </p>
                <p>
                  {isAr
                    ? "يقوم مسؤولو الموارد البشرية ورؤساء اللجان بمراجعة بيانات المتقدمين ومطابقة المتطلبات والوثائق المرفوعة. متوسط وقت المراجعة والرد هو 24 إلى 48 ساعة عمل."
                    : "HR reviewers and committee leads review applicant documents and profiles. Standard response time is 24–48 business hours."}
                </p>
                <p className="text-[11px] opacity-90">
                  {isAr
                    ? "ستتلقى إشعاراً عبر بريدك الإلكتروني فور اعتماد الطلب أو إذا طُلب استكمال أي وثيقة."
                    : "You will receive an email notification as soon as a decision is made or if additional information is required."}
                </p>
              </div>

              {submittedAt && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {isAr ? "تاريخ تقديم الطلب: " : "Submitted on: "}
                    {new Date(submittedAt).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                      dateStyle: "long",
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {status === "needs_info" && (
            <div className="space-y-4">
              {updateSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-sm">
                    {isAr ? "تم إرسال التحديث بنجاح!" : "Information Submitted Successfully!"}
                  </p>
                  <p className="text-xs">
                    {isAr
                      ? "تمت إعادة تحويل طلبك لفريق المراجعة، وستتلقى إشعاراً عند اتخاذ القرار."
                      : "Your application is back in review queue. You will be notified shortly."}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  {infoRequestMessage && (
                    <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 text-xs">
                      <strong className="block mb-1 font-semibold">
                        {isAr ? "ملاحظة مسؤول المراجعة:" : "Reviewer Instruction:"}
                      </strong>
                      <p>{infoRequestMessage}</p>
                    </div>
                  )}

                  {updateError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs">
                      {updateError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {isAr ? "تحديث البيانات / الرد على الملاحظات:" : "Updated Information / Clarification:"}
                    </label>
                    <Textarea
                      required
                      placeholder={
                        isAr
                          ? "اكتب التعديلات المطلوبة أو رابط المستند المحدث هنا..."
                          : "Enter requested details or updated document link here..."
                      }
                      value={fieldInputs.clarification || ""}
                      onChange={(e) =>
                        setFieldInputs({ ...fieldInputs, clarification: e.target.value })
                      }
                      className="min-h-[100px] text-xs rounded-xl"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isAr ? "إرسال التحديث للمراجعة" : "Submit Updates"}</span>
                  </Button>
                </form>
              )}
            </div>
          )}

          {status === "rejected" && (
            <div className="space-y-3">
              {decisionReason && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
                  <strong className="block mb-1 font-semibold text-slate-900 dark:text-white">
                    {isAr ? "سبب القرار:" : "Reason for decision:"}
                  </strong>
                  <p>{decisionReason}</p>
                </div>
              )}

              {daysRemaining > 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs">
                  <span>
                    {isAr
                      ? `يمكنك إعادة التقديم بعد انقضاء فترة الانتظار (${daysRemaining} يوم متبقي).`
                      : `You can re-apply once the cooldown period expires (${daysRemaining} days remaining).`}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-zinc-400">
                  {isAr
                    ? "انتهت فترة الانتظار؛ يمكنك تقديم طلب انضمام جديد في أي وقت."
                    : "The cooldown period has expired; you may submit a new application."}
                </div>
              )}
            </div>
          )}

          {status === "approved" && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                {isAr
                  ? "مرحباً بك رسمياً في عائلة GDG on Campus NCTU! يمكنك الآن الوصول إلى لوحة تحكم الأعضاء، استعراض مهام لجانك، وسجل النقاط والأنشطة الأكاديمية."
                  : "Welcome to GDG on Campus NCTU! You can now access your member dashboard, committee tasks, points ledger, and educational track sessions."}
              </div>

              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  if (onLoginClick) onLoginClick();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl h-11 text-xs shadow-md shadow-emerald-600/20"
              >
                {isAr ? "الانتقال لتسجيل الدخول الآن" : "Proceed to Sign In"}
              </Button>
            </div>
          )}

          {/* Close button */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-10 rounded-xl text-xs font-medium border-slate-300 dark:border-zinc-700"
            >
              {isAr ? "إغلاق النافذة" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
