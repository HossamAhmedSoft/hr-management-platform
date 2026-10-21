"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  RefreshCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-context";
import { loginWithCredentials, checkLoginLockout } from "@/lib/auth-service";
import { RegistrationStatus, RegistrationRequest } from "@/types";

interface SignInPanelProps {
  isAr: boolean;
  onSwitchToRegister: () => void;
  onOpenStatusCheck: () => void;
  onShowRegistrationStatus: (data: {
    status: RegistrationStatus;
    referenceNo: string;
    email: string;
    fullName?: string;
    submittedAt?: string;
    decisionReason?: string;
    infoRequestedFields?: string[];
    infoRequestMessage?: string;
    reapplyCooldownUntil?: string;
  }) => void;
  onShowEmailVerification: (email: string, referenceNo?: string) => void;
}

export function SignInPanel({
  isAr,
  onSwitchToRegister,
  onOpenStatusCheck,
  onShowRegistrationStatus,
  onShowEmailVerification,
}: SignInPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, locale } = useApp();

  const nextParam = searchParams.get("next");
  const reasonParam = searchParams.get("reason");
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const [googleConfig, setGoogleConfig] = useState<{
    configured: boolean;
    clientId: string;
    redirectUri: string;
    missingFields: string[];
  } | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // Fetch Google config
  useEffect(() => {
    fetch("/api/auth/google/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.configured === "boolean") {
          setGoogleConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Handle URL errors or expired reason
  useEffect(() => {
    if (reasonParam === "expired") {
      setErrorMessage(
        isAr
          ? "انتهت صلاحية جلسة العمل الخاصة بك. يرجى تسجيل الدخول مجدداً."
          : "Your session has expired. Please sign in again."
      );
    }
  }, [reasonParam, isAr]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState("CapsLock")) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleGoogleCredentialResponse = async (credential: string) => {
    setIsGoogleLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/google/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: credential, remember_me: rememberMe }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        login(data.user, rememberMe);
        const destination = nextParam && !nextParam.includes("/auth") ? nextParam : `/${locale}`;
        window.location.href = destination;
        return;
      } else {
        setErrorMessage(
          data.error ||
            (isAr ? "فشل التحقق من حساب Google." : "Google account verification failed.")
        );
      }
    } catch {
      setErrorMessage(isAr ? "حدث خطأ في الاتصال أثناء التحقق من Google." : "Network error.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    setErrorMessage("");
    const isConfigured = googleConfig ? googleConfig.configured : Boolean(googleClientId);
    const activeClientId = googleConfig?.clientId || googleClientId;

    if (!isConfigured) {
      setErrorMessage(
        isAr
          ? "خدمة Google Sign-In تتطلب إدخال GOOGLE_CLIENT_ID في إعدادات البيئة."
          : "Google Sign-In is not configured yet."
      );
      return;
    }

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id && activeClientId) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: activeClientId,
          callback: (response: any) => {
            if (response.credential) {
              handleGoogleCredentialResponse(response.credential);
            }
          },
        });
        (window as any).google.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn("GIS One-Tap error, falling back to server redirect:", e);
      }
    }

    const targetNext = nextParam && !nextParam.includes("/auth") ? nextParam : `/${locale}`;
    window.location.href = `/api/auth/google/oauth?locale=${locale}&next=${encodeURIComponent(
      targetNext
    )}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    // Check lockout first
    const lockout = checkLoginLockout(cleanEmail);
    if (lockout.isLocked) {
      setLockoutSeconds(lockout.remainingSeconds);
      setErrorMessage(
        isAr
          ? `تم قفل تسجيل الدخول مؤقتاً لتكرار المحاولات الخاطئة. يرجى الانتظار (${lockout.remainingSeconds}ث).`
          : `Login temporarily locked. Please wait (${lockout.remainingSeconds}s).`
      );
      setIsLoading(false);
      return;
    }

    try {
      const res = await loginWithCredentials(cleanEmail, password, rememberMe, false);

      if (res.success && res.user) {
        login(res.user, rememberMe);
        // Safe post-login redirect: strictly prevent open redirects
        let destination = `/${locale}`;
        if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.includes("/auth")) {
          destination = nextParam;
        }
        window.location.href = destination;
        return;
      }

      // Check if user credentials match a pending registration request!
      if (res.registrationStatus && res.registrationRequest) {
        const req = res.registrationRequest;

        if (res.registrationStatus === "pending_email_verification") {
          onShowEmailVerification(req.email, req.reference_no);
          setIsLoading(false);
          return;
        }

        onShowRegistrationStatus({
          status: res.registrationStatus,
          referenceNo: req.reference_no,
          email: req.email,
          fullName: req.full_name,
          submittedAt: req.submitted_at,
          decisionReason: req.decision_reason || undefined,
          infoRequestedFields: req.info_requested_fields || undefined,
          infoRequestMessage: req.info_request_message || undefined,
          reapplyCooldownUntil: req.reapply_cooldown_until || undefined,
        });
        setIsLoading(false);
        return;
      }

      // Login failed
      const postLockout = checkLoginLockout(cleanEmail);
      if (postLockout.isLocked) {
        setLockoutSeconds(postLockout.remainingSeconds);
      }
      setErrorMessage(
        res.error ||
          (isAr
            ? "بيانات الدخول غير صحيحة، أو الحساب غير مسجل."
            : "Invalid credentials or account not registered.")
      );
    } catch {
      setErrorMessage(isAr ? "حدث خطأ غير متوقع بالخادم." : "An unexpected server error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Identity Services Script */}
      {(googleConfig?.clientId || googleClientId) && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => {
            const activeId = googleConfig?.clientId || googleClientId;
            if (typeof window !== "undefined" && (window as any).google?.accounts?.id && activeId) {
              try {
                (window as any).google.accounts.id.initialize({
                  client_id: activeId,
                  callback: (response: any) => {
                    if (response.credential) {
                      handleGoogleCredentialResponse(response.credential);
                    }
                  },
                });
              } catch {}
            }
          }}
        />
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isAr ? "تسجيل الدخول إلى حسابك" : "Sign In to Your Account"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          {isAr
            ? "أدخل بيانات اعتمادك المعتمدة للوصول إلى لوحة العمليات والأداء."
            : "Enter your verified credentials to access operations & performance."}
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Caps lock warning */}
      {capsLockActive && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{isAr ? "تحذير: مفتاح Caps Lock مفعل حالياً!" : "Warning: Caps Lock is ON!"}</span>
        </div>
      )}

      {/* Google Login Option */}
      <button
        type="button"
        onClick={handleGoogleButtonClick}
        disabled={isLoading || isGoogleLoading || lockoutSeconds > 0}
        className="w-full h-11 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950 transition-all flex items-center justify-center gap-3 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-sm"
      >
        {isGoogleLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{isAr ? "متابعة باستخدام حساب Google" : "Continue with Google Account"}</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-zinc-800 w-full" />
        <span className="bg-white dark:bg-zinc-950 px-3 text-[11px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 font-medium">
          {isAr ? "أو عبر البريد الرسمي" : "Or with official email"}
        </span>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            <span>{isAr ? "البريد الإلكتروني" : "Email Address"}</span>
          </label>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="member@nctu.edu.eg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || lockoutSeconds > 0}
            className="h-11 text-xs rounded-xl border-slate-300 dark:border-zinc-700 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? "كلمة المرور" : "Password"}</span>
            </label>
            <button
              type="button"
              onClick={onOpenStatusCheck}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isAr ? "متابعة حالة طلب انضمام؟" : "Track pending application?"}
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyDown}
              disabled={isLoading || lockoutSeconds > 0}
              className="h-11 text-xs rounded-xl pe-10 border-slate-300 dark:border-zinc-700 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>{isAr ? "تذكر جلستي لمدة 24 ساعة" : "Remember my session (24h)"}</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || lockoutSeconds > 0}
          className="w-full h-11 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-xs"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isAr ? "جاري تسجيل الدخول..." : "Signing in..."}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>
                {lockoutSeconds > 0
                  ? isAr
                    ? `مغلق مؤقتاً (${lockoutSeconds}ث)`
                    : `Locked (${lockoutSeconds}s)`
                  : isAr
                  ? "تسجيل الدخول"
                  : "Sign In"}
              </span>
            </>
          )}
        </Button>
      </form>

      {/* Switch to Registration */}
      <div className="pt-2 text-center text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
        <span>{isAr ? "لست عضواً بعد في GDG NCTU؟ " : "Not a GDG NCTU member yet? "}</span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
        >
          {isAr ? "قدم طلب انضمام جديد (Create Account)" : "Apply to Join (Create Account)"}
        </button>
      </div>
    </div>
  );
}
