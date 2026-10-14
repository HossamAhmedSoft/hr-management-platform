"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  KeyRound,
  Clock,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";
import {
  loginWithCredentials,
  registerWithCredentials,
  isDatabaseEmpty,
  generateSecurityTokenCode,
  verifySecurityTokenCode,
  checkLoginLockout,
} from "@/lib/auth-service";
import { Profile } from "@/types";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, locale, toggleLocale, theme, toggleTheme, isAuthenticated } = useApp();
  const isAr = locale === "ar";

  const reason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  // Two-Factor / Security Token Code State
  const [authStep, setAuthStep] = useState<"credentials" | "token_code">("credentials");
  const [pendingUser, setPendingUser] = useState<Profile | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenCodeDemo, setTokenCodeDemo] = useState("");
  const [tokenSecondsRemaining, setTokenSecondsRemaining] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Lockout State
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

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

  // 2FA countdown interval
  useEffect(() => {
    if (authStep !== "token_code" || tokenSecondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setTokenSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [authStep, tokenSecondsRemaining]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Submit Credentials
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
        window.location.href = `/${locale}`;
        return;
      } else {
        setErrorMessage(res.error || (isAr ? "فشل إنشاء الحساب" : "Failed to create account"));
      }
    } else {
      // Standard login: Validate credentials with skipSession=true to prompt for 2FA token
      const res = await loginWithCredentials(cleanEmail, password, rememberMe, true);
      if (res.success && res.user) {
        // Generate 6-digit Security Token Code
        const generated = generateSecurityTokenCode(cleanEmail);
        setPendingUser(res.user);
        setTokenCodeDemo(generated.code);
        setTokenSecondsRemaining(300); // 5 minutes
        setResendCooldown(60);
        setAuthStep("token_code");
        setIsLoading(false);
        return;
      } else {
        // Check if now locked
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

  // Step 2: Verify Token Code (2FA)
  const handleTokenCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setIsLoading(true);
    setErrorMessage("");

    if (!tokenInput.trim() || tokenInput.trim().length < 6) {
      setErrorMessage(isAr ? "يرجى إدخال رمز الأمان المكون من 6 أرقام" : "Please enter the 6-digit security code");
      setIsLoading(false);
      return;
    }

    const verification = verifySecurityTokenCode(pendingUser.email, tokenInput.trim());
    if (verification.success) {
      // Completed full authentication cycle!
      login(pendingUser, rememberMe);
      window.location.href = `/${locale}`;
      return;
    } else {
      setErrorMessage(
        verification.error ||
          (isAr ? "رمز التحقق غير صحيح أو انتهت صلاحيته." : "Invalid or expired security code.")
      );
    }
    setIsLoading(false);
  };

  // Resend Security Token Code
  const handleResendToken = () => {
    if (!pendingUser || resendCooldown > 0) return;
    const generated = generateSecurityTokenCode(pendingUser.email);
    setTokenCodeDemo(generated.code);
    setTokenSecondsRemaining(300);
    setResendCooldown(60);
    setTokenInput("");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9fa] dark:bg-[#171717] transition-colors">
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
          {/* Reason Alert Banner (Expired or Inactivity Logout) */}
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
                    authStep === "token_code"
                      ? "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]"
                      : isFirstTimeSetup
                      ? "bg-[#fef7e0] dark:bg-[#fbbc04]/20 text-[#b06000] dark:text-[#fdd663]"
                      : "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 text-[#1a73e8] dark:text-[#8ab4f8]"
                  }`}
                >
                  {authStep === "token_code" ? (
                    <KeyRound className="w-6 h-6 animate-pulse" />
                  ) : isFirstTimeSetup ? (
                    <Crown className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>

                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {authStep === "token_code"
                    ? isAr
                      ? "التحقق من رمز الأمان (2FA)"
                      : "Security Token Verification (2FA)"
                    : isFirstTimeSetup
                    ? isAr
                      ? "تهيئة حساب مدير النظام (Super Admin)"
                      : "First-time Super Admin Setup"
                    : isAr
                    ? "تسجيل الدخول إلى البوابة"
                    : "Sign In to Portal"}
                </h2>

                <p className="text-xs text-muted-foreground">
                  {authStep === "token_code"
                    ? isAr
                      ? `تم إصدار رمز أمان مؤقت للتحقق من هوية (${email}).`
                      : `A temporary security code was generated to verify (${email}).`
                    : isFirstTimeSetup
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

              {/* ──────────────── STEP 1: CREDENTIALS FORM ──────────────── */}
              {authStep === "credentials" && (
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
                    disabled={isLoading || lockoutSeconds > 0}
                    className="w-full h-10 rounded-lg bg-[#1a73e8] hover:bg-[#1765cc] text-white font-semibold text-xs shadow-xs"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {isAr ? "جارِ التحقق من البيانات..." : "Verifying Credentials..."}
                      </span>
                    ) : isFirstTimeSetup ? (
                      isAr ? "إنشاء حساب مدير النظام وبدء العمل" : "Initialize Super Admin & Start"
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <span>{isAr ? "المتابعة والتحقق الأمني" : "Continue to Security Check"}</span>
                        {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </Button>
                </form>
              )}

              {/* ──────────────── STEP 2: 2FA TOKEN CODE FORM ──────────────── */}
              {authStep === "token_code" && (
                <form onSubmit={handleTokenCodeSubmit} className="space-y-4 text-xs animate-in fade-in duration-200">
                  {/* Security Demo Token Badge */}
                  <div className="p-3 rounded-xl bg-[#e8f0fe] dark:bg-[#1a73e8]/15 border border-[#d2e3fc] dark:border-[#1a73e8]/30 space-y-1.5">
                    <div className="flex items-center justify-between text-[#1a73e8] dark:text-[#8ab4f8]">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isAr ? "رمز الأمان المؤقت (2FA):" : "Active 2FA Security Token:"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {Math.floor(tokenSecondsRemaining / 60)}:
                          {(tokenSecondsRemaining % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xl font-mono font-black tracking-widest text-[#174ea6] dark:text-[#aecbfa]">
                        {tokenCodeDemo}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {isAr ? "صالح لمدة 5 دقائق" : "Valid for 5 mins"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="token-code-input" className="font-semibold text-foreground block mb-1">
                      {isAr ? "أدخل رمز الأمان المكون من 6 أرقام:" : "Enter 6-digit Security Token Code:"}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
                      <Input
                        id="token-code-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        required
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        className="pl-9 rtl:pl-3 rtl:pr-9 h-11 text-center font-mono font-bold tracking-[0.4em] text-base rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || tokenInput.length < 6 || tokenSecondsRemaining <= 0}
                    className="w-full h-10 rounded-lg bg-[#1a73e8] hover:bg-[#1765cc] text-white font-semibold text-xs shadow-xs"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        {isAr ? "جارِ التحقق من الرمز..." : "Verifying Code..."}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isAr ? "تأكيد الرمز والدخول إلى البوابة" : "Verify Token & Sign In"}</span>
                      </span>
                    )}
                  </Button>

                  {/* Resend & Back Actions */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendToken}
                      className="text-[#1a73e8] hover:underline disabled:text-muted-foreground disabled:no-underline flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed bg-transparent border-0 p-0"
                    >
                      <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? "opacity-50" : ""}`} />
                      <span>
                        {resendCooldown > 0
                          ? isAr
                            ? `إعادة الإرسال بعد (${resendCooldown}ث)`
                            : `Resend in (${resendCooldown}s)`
                          : isAr
                          ? "إعادة إرسال رمز جديد"
                          : "Resend Code"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep("credentials");
                        setErrorMessage("");
                        setTokenInput("");
                      }}
                      className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent border-0 p-0"
                    >
                      {isAr ? "العودة لتغيير الحساب" : "Back to Sign In"}
                    </button>
                  </div>
                </form>
              )}

              {/* Administrative Footnote */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isFirstTimeSetup
                    ? isAr
                      ? "⚡ خطوة لمرة واحدة فقط لربط الحساب القيادي الأول بقاعدة البيانات السحابية."
                      : "⚡ One-time setup to establish the primary leadership account."
                    : isAr
                    ? "🔒 محمي بنظام أمان ثنائي (2FA) ومراقبة مستمرة للنشاط مع انتهاء تلقائي للجلسات."
                    : "🔒 Protected by 2FA verification, rate limiting, and idle auto-logout."}
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
