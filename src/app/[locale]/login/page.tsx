"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  Moon,
  Sun,
  ShieldCheck,
  Crown,
  User,
  Clock,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";
import {
  loginWithCredentials,
  registerWithCredentials,
  isDatabaseEmpty,
  checkLoginLockout,
} from "@/lib/auth-service";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (momentListener?: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, locale, toggleLocale, theme, toggleTheme, isAuthenticated } = useApp();
  const isAr = locale === "ar";

  const reason = searchParams.get("reason");
  const urlError = searchParams.get("error");
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<{
    configured: boolean;
    clientId: string;
    redirectUri: string;
    missingFields: string[];
  } | null>(null);

  // Lockout State
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Read Google Client ID from environment (build-time fallback)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // Handle URL errors
  useEffect(() => {
    if (urlError) {
      if (urlError === "google_cancelled") {
        setErrorMessage(
          isAr
            ? "تم إلغاء عملية تسجيل الدخول بواسطة Google."
            : "Google sign-in was cancelled."
        );
      } else if (urlError === "account_not_found") {
        setErrorMessage(
          isAr
            ? "هذا الحساب غير مسجل في النظام. يجب أن تتم إضافتك أولاً من قِبل إدارة الموارد البشرية (HR)."
            : "This account is not registered in the system. You must be added by HR administration first."
        );
      } else if (urlError === "account_suspended") {
        setErrorMessage(
          isAr
            ? "تم تعليق هذا الحساب. يرجى مراجعة إدارة الموارد البشرية."
            : "This account has been suspended. Please contact HR administration."
        );
      } else if (urlError === "account_inactive") {
        setErrorMessage(
          isAr
            ? "هذا الحساب غير نشط حالياً. يرجى مراجعة مدير النظام."
            : "This account is inactive. Please contact the administrator."
        );
      } else if (urlError === "csrf_state_mismatch" || urlError === "invalid_oauth_state") {
        setErrorMessage(
          isAr
            ? "فشل التحقق الأمني من الجلسة (CSRF mismatch). يرجى المحاولة مجدداً."
            : "Session security verification failed. Please try again."
        );
      } else if (urlError === "oauth_state_replayed") {
        setErrorMessage(
          isAr
            ? "تم استخدام جلسة المصادقة مسبقاً (Replay detected). يرجى بدء تسجيل دخول جديد."
            : "Authentication transaction was already used. Please start a new login."
        );
      } else if (urlError === "admin_link_requires_auth") {
        setErrorMessage(
          isAr
            ? "الحسابات الإدارية تتطلب تسجيل الدخول بكلمة المرور أولاً لربط حساب Google بأمان."
            : "Administrative accounts require password login first to securely link a Google account."
        );
      } else if (urlError === "duplicate_google_identity") {
        setErrorMessage(
          isAr
            ? "هذا الحساب مرتبط بالفعل بحساب Google آخر."
            : "This account is already linked to a different Google account."
        );
      } else if (urlError === "google_not_configured") {
        setErrorMessage(
          isAr
            ? "خدمة Google Sign-In تتطلب إدخال GOOGLE_CLIENT_ID في إعدادات البيئة."
            : "Google Sign-In requires GOOGLE_CLIENT_ID in your environment variables."
        );
      } else {
        setErrorMessage(
          isAr
            ? "تعذر إتمام تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى."
            : "Could not complete Google sign-in. Please try again."
        );
      }
    }
  }, [urlError, isAr]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}`);
    }
  }, [isAuthenticated, locale, router]);

  // First-time database check
  useEffect(() => {
    isDatabaseEmpty().then((empty) => {
      setIsFirstTimeSetup(empty);
    });
  }, []);

  // Fetch Google Sign-In runtime configuration status dynamically
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

  // Lockout countdown interval
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Handle Google ID Token verification
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
        const destination = nextParam || `/${locale}`;
        window.location.href = destination;
        return;
      } else {
        setErrorMessage(
          data.error ||
            (isAr
              ? "فشل التحقق من حساب Google."
              : "Google account verification failed.")
        );
      }
    } catch (err: any) {
      setErrorMessage(
        isAr
          ? "حدث خطأ في الاتصال أثناء التحقق من Google."
          : "Network error during Google verification."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Google Sign-In Button Click Handler
  const handleGoogleButtonClick = () => {
    setErrorMessage("");

    const isConfigured = googleConfig ? googleConfig.configured : Boolean(googleClientId);
    const activeClientId = googleConfig?.clientId || googleClientId;

    if (!isConfigured) {
      const missing = googleConfig?.missingFields?.length
        ? googleConfig.missingFields.join(", ")
        : "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET";
      setErrorMessage(
        isAr
          ? `خدمة Google Sign-In غير مهيأة بعد. يرجى تزويد متغيرات البيئة في .env.local: (${missing})`
          : `Google Sign-In is not configured yet. Missing environment variables: (${missing})`
      );
      return;
    }

    // Try Google Identity Services One-Tap prompt if loaded
    if (typeof window !== "undefined" && window.google?.accounts?.id && activeClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: (response: any) => {
            if (response.credential) {
              handleGoogleCredentialResponse(response.credential);
            }
          },
        });
        window.google.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn("GIS prompt error, falling back to server OAuth redirect:", e);
      }
    }

    // Direct redirect to OpenID Connect / OAuth PKCE flow
    const targetNext = nextParam && !nextParam.includes("/login") ? nextParam : `/${locale}`;
    window.location.href = `/api/auth/google/oauth?locale=${locale}&next=${encodeURIComponent(
      targetNext
    )}`;
  };

  // Direct Credentials Submit
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
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
          ? `تم قفل تسجيل الدخول مؤقتاً لتكرار المحاولات الخاطئة. يرجى الانتظار.`
          : `Login temporarily locked due to repeated failed attempts. Please wait.`
      );
      setIsLoading(false);
      return;
    }

    if (isFirstTimeSetup) {
      if (!fullName.trim() || !cleanEmail || !password.trim()) {
        setErrorMessage(isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields");
        setIsLoading(false);
        return;
      }
      const res = await registerWithCredentials(
        cleanEmail,
        password,
        fullName.trim(),
        "super_admin"
      );
      if (res.success && res.user) {
        login(res.user, rememberMe);
        const nextUrl = nextParam || `/${locale}`;
        window.location.href = nextUrl;
        return;
      } else {
        setErrorMessage(res.error || (isAr ? "فشل إنشاء الحساب" : "Failed to create account"));
      }
    } else {
      const res = await loginWithCredentials(cleanEmail, password, rememberMe, false);
      if (res.success && res.user) {
        login(res.user, rememberMe);
        const nextUrl = nextParam || `/${locale}`;
        window.location.href = nextUrl;
        return;
      } else {
        const postLockout = checkLoginLockout(cleanEmail);
        if (postLockout.isLocked) {
          setLockoutSeconds(postLockout.remainingSeconds);
        }
        setErrorMessage(
          res.error ||
            (isAr
              ? "بيانات الدخول غير صحيحة، أو الحساب غير مسجل."
              : "Invalid login credentials or account not found.")
        );
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9fa] dark:bg-[#171717] transition-colors">
      {/* Google Identity Services Script */}
      {(googleConfig?.clientId || googleClientId) && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => {
            const activeId = googleConfig?.clientId || googleClientId;
            if (typeof window !== "undefined" && window.google?.accounts?.id && activeId) {
              try {
                window.google.accounts.id.initialize({
                  client_id: activeId,
                  callback: (response: any) => {
                    if (response.credential) {
                      handleGoogleCredentialResponse(response.credential);
                    }
                  },
                });
              } catch (e) {
                console.warn("GIS initialization notice:", e);
              }
            }
          }}
        />
      )}

      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          {/* Google Developer Groups Colored Dots */}
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc04]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground">
            GDG on Campus NCTU
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            aria-label={locale === "en" ? "تغيير اللغة إلى العربية" : "Switch language to English"}
            className="h-8 text-xs font-semibold gap-1 text-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "en" ? "عربي" : "EN"}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={
              theme === "light"
                ? isAr
                  ? "التبديل إلى الوضع الداكن"
                  : "Switch to dark mode"
                : isAr
                ? "التبديل إلى الوضع الفاتح"
                : "Switch to light mode"
            }
            className="h-8 w-8 text-foreground"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-[#fbbc04]" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {/* Reason Alert Banner */}
          {reason && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#fef7e0] dark:bg-[#fbbc04]/15 border border-[#feefc3] dark:border-[#fbbc04]/30 text-[#b06000] dark:text-[#fdd663] text-xs flex items-start gap-2.5 shadow-2xs animate-in fade-in"
            >
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {reason === "idle_timeout"
                    ? isAr
                      ? "تم إنهاء الجلسة لعدم النشاط"
                      : "Session Ended Due to Inactivity"
                    : isAr
                    ? "انتهت صلاحية الجلسة"
                    : "Session Expired"}
                </p>
                <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                  {reason === "idle_timeout"
                    ? isAr
                      ? "تم تسجيل خروجك تلقائياً بعد 30 دقيقة من عدم النشاط حفاظاً على سرية وأمان بياناتك."
                      : "You were automatically signed out after 30 minutes of inactivity to safeguard your account."
                    : isAr
                    ? "انتهت صلاحية جلستك الأمنية السابقة. يرجى إعادة تسجيل الدخول لمتابعة العمل."
                    : "Your previous security session has expired. Please sign in again to continue."}
                </p>
              </div>
            </div>
          )}

          {/* Lockout Alert Banner */}
          {lockoutSeconds > 0 && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#fce8e6] dark:bg-[#ea4335]/15 border border-[#fad2cf] dark:border-[#ea4335]/30 text-[#c5221f] dark:text-[#f28b82] text-xs flex items-start gap-2.5 shadow-2xs animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {isAr ? "🔒 تم قفل تسجيل الدخول مؤقتاً" : "🔒 Login Temporarily Locked"}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  {isAr
                    ? `تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). يرجى الانتظار: ${Math.floor(
                        lockoutSeconds / 60
                      )} دقيقة و ${lockoutSeconds % 60} ثانية.`
                    : `Exceeded maximum failed attempts (5). Please wait: ${Math.floor(
                        lockoutSeconds / 60
                      )}m ${lockoutSeconds % 60}s.`}
                </p>
              </div>
            </div>
          )}

          <Card className="overflow-hidden border border-border shadow-md bg-card rounded-xl">
            {/* Google 4-Color Signature Accent Bar */}
            <div className="google-accent-strip">
              <div className="seg-blue" />
              <div className="seg-red" />
              <div className="seg-yellow" />
              <div className="seg-green" />
            </div>

            <CardContent className="p-6 sm:p-8 space-y-5">
              {/* Card Header Title */}
              <div className="text-center space-y-1">
                <div
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-1 ${
                    isFirstTimeSetup
                      ? "bg-[#fef7e0] dark:bg-[#fbbc04]/20 text-[#b06000] dark:text-[#fdd663]"
                      : "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]"
                  }`}
                >
                  {isFirstTimeSetup ? (
                    <Crown className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>

                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {isFirstTimeSetup
                    ? isAr
                      ? "تهيئة حساب مدير النظام (Super Admin)"
                      : "First-time Super Admin Setup"
                    : isAr
                    ? "تسجيل الدخول إلى البوابة"
                    : "Sign In to Portal"}
                </h2>

                <p className="text-xs text-muted-foreground">
                  {isFirstTimeSetup
                    ? isAr
                      ? "قاعدة البيانات جاهزة ونظيفة. يرجى إنشاء حساب مدير النظام للبدء."
                      : "Database is connected and clean. Create your Super Admin account to start."
                    : isAr
                    ? "بوابة إدارة العمليات والأداء — GDG on Campus NCTU"
                    : "HR Governance & Operations — GDG on Campus NCTU"}
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-[#fce8e6] dark:bg-[#ea4335]/20 text-[#c5221f] dark:text-[#f28b82] text-xs flex items-center gap-2 border border-[#fad2cf] dark:border-[#ea4335]/30"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ──────────────── GOOGLE SIGN-IN BUTTON ──────────────── */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={isLoading || isGoogleLoading || lockoutSeconds > 0}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background hover:bg-muted/70 text-foreground font-medium text-xs shadow-2xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus:outline-hidden focus:ring-2 focus:ring-[#1a73e8]"
                  aria-label={isAr ? "المتابعة باستخدام Google" : "Continue with Google"}
                >
                  {isGoogleLoading ? (
                    <span className="w-4 h-4 border-2 border-[#1a73e8]/40 border-t-[#1a73e8] rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                  <span className="font-semibold text-xs tracking-tight">
                    {isGoogleLoading
                      ? isAr
                        ? "جارِ الاتصال بحساب Google..."
                        : "Connecting with Google..."
                      : isAr
                      ? "المتابعة باستخدام Google"
                      : "Continue with Google"}
                  </span>
                </button>

                {/* Subtle Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-border" />
                  <span className="absolute bg-card px-3 text-[11px] text-muted-foreground select-none">
                    {isAr ? "أو بالبريد الإلكتروني" : "or with email & password"}
                  </span>
                </div>
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
                {isFirstTimeSetup && (
                  <div>
                    <label htmlFor="login-fullname" className="font-semibold text-foreground block mb-1">
                      {isAr ? "الاسم الكامل لمدير النظام:" : "Super Admin Full Name:"}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
                      <Input
                        id="login-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isAr ? "مثال: حسام أحمد" : "e.g. Hossam Ahmed"}
                        className="pl-9 rtl:pl-3 rtl:pr-9 h-10 rounded-lg bg-background text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="font-semibold text-foreground block mb-1">
                    {isAr ? "البريد الإلكتروني:" : "Email Address:"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gdgnctu.com"
                      className="pl-9 rtl:pl-3 rtl:pr-9 h-10 rounded-lg bg-background text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-password" className="font-semibold text-foreground">
                      {isAr ? "كلمة المرور:" : "Password:"}
                    </label>
                    {!isFirstTimeSetup && (
                      <button
                        type="button"
                        onClick={() => {
                          alert(
                            isAr
                              ? "يرجى مراجعة مدير النظام (Super Admin) لإعادة تعيين كلمة المرور."
                              : "Please contact Super Admin to reset your password."
                          );
                        }}
                        className="text-[11px] text-[#1a73e8] hover:underline bg-transparent border-0 p-0 cursor-pointer"
                      >
                        {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 pr-9 rtl:pr-9 rtl:pl-9 h-10 rounded-lg bg-background text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? isAr
                            ? "إخفاء كلمة المرور"
                            : "Hide password"
                          : isAr
                          ? "إظهار كلمة المرور"
                          : "Show password"
                      }
                      className="absolute right-1.5 rtl:right-auto rtl:left-1.5 top-1.5 text-muted-foreground hover:text-foreground p-1 rounded-md min-w-[28px] min-h-[28px] flex items-center justify-center cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-[#1a73e8] focus:ring-[#1a73e8] cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="remember-me" className="font-semibold text-foreground block cursor-pointer select-none">
                      {isAr ? "تذكرني على هذا الجهاز (جلسة ممتدة 24 ساعة)" : "Remember me on this device (24h session)"}
                    </label>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 leading-tight">
                      {isAr
                        ? "اتركه فارغاً على الأجهزة المشتركة لإنهاء الجلسة فور إغلاق المتصفح تلقائياً."
                        : "Leave unchecked on shared devices to auto-terminate session upon browser close."}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading || lockoutSeconds > 0}
                  className="w-full h-10 rounded-lg bg-[#1a73e8] hover:bg-[#1765cc] text-white font-semibold text-xs shadow-xs"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {isAr ? "جارِ تسجيل الدخول..." : "Signing In..."}
                    </span>
                  ) : isFirstTimeSetup ? (
                    isAr ? "إنشاء حساب مدير النظام وبدء العمل" : "Initialize Super Admin & Start"
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isAr ? "تسجيل الدخول" : "Sign In"}</span>
                    </span>
                  )}
                </Button>
              </form>

              {/* Footnote */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isFirstTimeSetup
                    ? isAr
                      ? "⚡ خطوة لمرة واحدة فقط لربط الحساب القيادي الأول بقاعدة البيانات السحابية."
                      : "⚡ One-time setup to establish the primary leadership account."
                    : isAr
                    ? "🔒 محمي بنظام تشفير الجلسات ومطابقة الهوية الموثوقة مع Google OAuth 2.0."
                    : "🔒 Protected by secure sessions and trusted Google OAuth 2.0 identity federation."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-card">
        <p>
          GDG on Campus — New Cairo Technological University (NCTU) • Policy v2.4
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] dark:bg-[#171717]" />}>
      <LoginFormContent />
    </Suspense>
  );
}
