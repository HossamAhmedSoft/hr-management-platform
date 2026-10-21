"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Mail,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  referenceNo?: string;
  isAr: boolean;
  onVerified: (referenceNo?: string) => void;
}

export function EmailVerificationModal({
  isOpen,
  onOpenChange,
  email,
  referenceNo,
  isAr,
  onVerified,
}: EmailVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setErrorMessage("");
      setSuccessMessage("");
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    // Single digit or pasted multiple digits
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split("");
      const next = [...digits];
      pasted.forEach((d, i) => {
        if (i < 6) next[i] = d;
      });
      setDigits(next);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
      if (pasted.length === 6) {
        submitCode(next.join(""));
      }
      return;
    }

    const next = [...digits];
    next[index] = clean.slice(-1);
    setDigits(next);

    // Auto advance to next box
    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if 6 digits filled
    if (index === 5 && clean) {
      const fullCode = next.join("");
      if (fullCode.length === 6) {
        submitCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (codeToSubmit?: string) => {
    const code = codeToSubmit || digits.join("");
    if (code.length < 6) {
      setErrorMessage(isAr ? "يرجى إدخال الرمز المكون من 6 أرقام كاملاً." : "Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/registration/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(isAr ? "تم التحقق من البريد بنجاح! جاري تحويلك..." : "Email verified successfully! Redirecting...");
        setTimeout(() => {
          onVerified(data.reference_no || referenceNo);
          onOpenChange(false);
        }, 900);
      } else {
        setErrorMessage(data.error || (isAr ? "رمز التحقق غير صحيح أو انتهت صلاحيته." : "Invalid or expired code."));
      }
    } catch (err: any) {
      setErrorMessage(isAr ? "حدث خطأ في الاتصال بالخادم." : "Network connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending) return;
    setIsResResending(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/registration/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(isAr ? "تم إرسال رمز جديد إلى بريدك الإلكتروني." : "A new verification code was sent.");
        setCooldownSeconds(60);
      } else {
        setErrorMessage(data.error || (isAr ? "فشل إعادة إرسال الرمز." : "Failed to resend code."));
      }
    } catch {
      setErrorMessage(isAr ? "تعذر الاتصال بالخادم لإعادة الإرسال." : "Network error during resend.");
    } finally {
      setIsResResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-white">
            {isAr ? "تأكيد ملكية البريد الإلكتروني" : "Verify Your Email Address"}
          </DialogTitle>
          <DialogDescription className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
            {isAr
              ? `أرسلنا رمز تحقق مكوّن من 6 أرقام إلى:`
              : `We sent a 6-digit verification code to:`}
            <span className="block font-semibold text-white mt-0.5 dir-ltr tracking-wider truncate">
              {email}
            </span>
          </DialogDescription>
        </div>

        <div className="p-6 space-y-5">
          {referenceNo && (
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-center">
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                {isAr ? "رقم المرجع الخاص بطلبك: " : "Application Reference: "}
                <strong className="font-mono tracking-wider font-bold">{referenceNo}</strong>
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 dir-ltr">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isLoading}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-950 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={() => submitCode()}
              disabled={isLoading || digits.join("").length < 6}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري التحقق..." : "Verifying..."}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAr ? "تأكيد الرمز والمتابعة" : "Verify & Continue"}</span>
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-1">
              <span>{isAr ? "لم يصلك الرمز؟" : "Didn't receive code?"}</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldownSeconds > 0 || isResending}
                className={`font-semibold transition-colors flex items-center gap-1 ${
                  cooldownSeconds > 0
                    ? "text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                    : "text-blue-600 dark:text-blue-400 hover:underline"
                }`}
              >
                {isResending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>
                  {cooldownSeconds > 0
                    ? isAr
                      ? `إعادة الإرسال بعد (${cooldownSeconds}ث)`
                      : `Resend in (${cooldownSeconds}s)`
                    : isAr
                    ? "إعادة إرسال الرمز الآن"
                    : "Resend Code Now"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
