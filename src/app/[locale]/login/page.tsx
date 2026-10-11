"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Globe,
  Moon,
  Sun,
  Database,
  Key,
  Server,
  UserPlus,
  LogIn,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";
import {
  loginWithSupabaseOrFallback,
  registerWithSupabaseOrFallback,
  isSupabaseConfigured,
  getAvailableTestAccounts,
} from "@/lib/auth-service";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, locale, toggleLocale, theme, toggleTheme } = useApp();
  const isAr = locale === "ar";

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("lead@gdgnctu.com");
  const [password, setPassword] = useState("admin123456");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Supabase Configuration State
  const [showCloudSettings, setShowCloudSettings] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [isCloudActive, setIsCloudActive] = useState(false);

  useEffect(() => {
    setIsCloudActive(isSupabaseConfigured());
    if (typeof window !== "undefined") {
      setSupabaseUrl(localStorage.getItem("gdg_supabase_url") || "");
      setSupabaseAnonKey(localStorage.getItem("gdg_supabase_anon_key") || "");
    }
  }, []);

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      if (supabaseUrl && supabaseAnonKey) {
        localStorage.setItem("gdg_supabase_url", supabaseUrl.trim());
        localStorage.setItem("gdg_supabase_anon_key", supabaseAnonKey.trim());
        setIsCloudActive(true);
        setSuccessMessage(
          isAr
            ? "تم حفظ إعدادات Supabase بنجاح! النظام متصل بقاعدة البيانات السحابية."
            : "Supabase credentials saved! Connected to cloud database."
        );
      } else {
        localStorage.removeItem("gdg_supabase_url");
        localStorage.removeItem("gdg_supabase_anon_key");
        setIsCloudActive(false);
        setSuccessMessage(
          isAr
            ? "تم الرجوع إلى الوضع المحلي المستقل."
            : "Reverted to standalone offline mode."
        );
      }
      setShowCloudSettings(false);
    }
  };

  const testAccounts = getAvailableTestAccounts();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (authMode === "signin") {
      const res = await loginWithSupabaseOrFallback(email, password);
      if (res.success && res.user) {
        login(res.user);
      } else {
        setErrorMessage(
          res.error || (isAr ? "بيانات الدخول غير صحيحة" : "Invalid login credentials")
        );
      }
    } else {
      if (!fullName) {
        setErrorMessage(isAr ? "يرجى كتابة الاسم الكامل" : "Please enter your full name");
        setIsLoading(false);
        return;
      }
      const res = await registerWithSupabaseOrFallback(email, password, fullName, role);
      if (res.success && res.user) {
        setSuccessMessage(
          isAr
            ? "تم إنشاء الحساب بنجاح! جارِ الدخول إلى البوابة..."
            : "Account created successfully! Redirecting..."
        );
        setTimeout(() => {
          login(res.user!);
        }, 800);
      } else {
        setErrorMessage(
          res.error || (isAr ? "فشل إنشاء الحساب" : "Failed to create account")
        );
      }
    }

    setIsLoading(false);
  };

  const handleQuickLogin = (account: (typeof testAccounts)[0]) => {
    setEmail(account.user.email);
    login(account.user);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9fa] dark:bg-[#171717] transition-colors">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
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
          {/* Cloud Database Status Pill */}
          <button
            type="button"
            onClick={() => setShowCloudSettings(!showCloudSettings)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-border bg-muted/50 hover:bg-muted transition-colors"
            title={isAr ? "إعدادات الربط السحابي" : "Cloud DB Settings"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCloudActive ? "bg-[#34a853] animate-pulse" : "bg-[#fbbc04]"
              }`}
            />
            <span className="text-foreground">
              {isCloudActive
                ? isAr
                  ? "Supabase متصل"
                  : "Cloud Active"
                : isAr
                ? "وضع مستقل"
                : "Standalone"}
            </span>
            <Settings2 className="w-3 h-3 text-muted-foreground ml-0.5" />
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="h-8 text-xs font-semibold gap-1 text-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "en" ? "عربي" : "EN"}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-foreground"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-[#fbbc04]" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {/* Optional Cloud DB Settings Box */}
          {showCloudSettings && (
            <Card className="border border-[#1a73e8] bg-card p-4 rounded-xl shadow-md text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#1a73e8]" />
                  {isAr ? "إعدادات الربط بقاعدة بيانات Supabase" : "Supabase Cloud Database Config"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {isAr ? "مجاني وسحابي" : "Free Cloud DB"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isAr
                  ? "يمكنك لصق رابط مشروع Supabase والمفتاح العام للربط المباشر، أو تركهما فارغين للاستمرار في الوضع المحلي."
                  : "Paste your Supabase Project URL & Anon Key for live cloud syncing, or leave empty for offline demo mode."}
              </p>
              <form onSubmit={handleSaveCloudConfig} className="space-y-2">
                <div>
                  <label className="text-[10px] font-semibold text-foreground block mb-0.5">
                    Project URL:
                  </label>
                  <Input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-foreground block mb-0.5">
                    Anon Public Key:
                  </label>
                  <Input
                    type="text"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCloudSettings(false)}
                    className="h-7 text-xs"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-xs bg-[#1a73e8] hover:bg-[#1765cc] text-white"
                  >
                    {isAr ? "حفظ وتفعيل" : "Save & Connect"}
                  </Button>
                </div>
              </form>
            </Card>
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
              {/* Header Title */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {isAr ? "بوابة إدارة العمليات والأداء" : "GDG NCTU Management Portal"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "نظام الحوكمة ولائحة النقاط والتقييمات الرسمية"
                    : "HR Governance, Points Ledger & Performance System"}
                </p>
              </div>

              {/* Mode Switcher: Sign In vs Sign Up */}
              <div className="flex rounded-lg bg-muted p-1 border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setErrorMessage("");
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    authMode === "signin"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isAr ? "تسجيل الدخول" : "Sign In"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setErrorMessage("");
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    authMode === "signup"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAr ? "حساب جديد" : "Create Account"}</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#fce8e6] text-[#c5221f] text-xs flex items-center gap-2 border border-[#fad2cf]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-[#e6f4ea] text-[#137333] text-xs flex items-center gap-2 border border-[#ceead6]">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                {authMode === "signup" && (
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      {isAr ? "الاسم الكامل:" : "Full Name:"}
                    </label>
                    <Input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isAr ? "مثال: حسام أحمد" : "e.g. Hossam Ahmed"}
                      className="h-10 rounded-lg bg-background text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "البريد الإلكتروني:" : "Email Address:"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gdgnctu.com"
                      className="pl-9 h-10 rounded-lg bg-background text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-foreground">
                      {isAr ? "كلمة المرور:" : "Password:"}
                    </label>
                    {authMode === "signin" && (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(
                            isAr
                              ? "رابط استعادة كلمة المرور: تم إرسال تعليمات إعادة التعيين للبريد الإلكتروني."
                              : "Password reset link sent to registered email address."
                          );
                        }}
                        className="text-[11px] text-[#1a73e8] hover:underline"
                      >
                        {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-10 rounded-lg bg-background text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      {isAr ? "الدور المطلوب:" : "Requested Role:"}
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#1a73e8]"
                    >
                      <option value="member">{isAr ? "عضو (Member)" : "Member"}</option>
                      <option value="team_lead">{isAr ? "قائد فريق (Team Lead)" : "Team Lead"}</option>
                      <option value="hr_reviewer">{isAr ? "مراجع الموارد (HR Reviewer)" : "HR Reviewer"}</option>
                      <option value="hr_admin">{isAr ? "مسؤول الموارد (HR Admin)" : "HR Admin"}</option>
                    </select>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-lg bg-[#1a73e8] hover:bg-[#1765cc] text-white font-semibold text-xs shadow-xs"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {isAr ? "جارِ المعالجة..." : "Processing..."}
                    </span>
                  ) : authMode === "signin" ? (
                    isAr ? "تسجيل الدخول إلى حسابك" : "Sign In to Account"
                  ) : (
                    isAr ? "إنشاء حساب جديد وتفعيل الصلاحيات" : "Register New Account"
                  )}
                </Button>
              </form>

              {/* Quick Persona Switcher for Instant Testing */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {isAr ? "دخول سريع بحسابات معتمدة (1-Click Login):" : "Official Roles (1-Click Login):"}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-[#e6f4ea] px-1.5 py-0.5 rounded">
                    5 Roles Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {testAccounts.map((item) => (
                    <button
                      key={item.user.id}
                      type="button"
                      onClick={() => handleQuickLogin(item)}
                      className="p-2 rounded-lg border border-border hover:border-[#1a73e8] hover:bg-[#e8f0fe]/50 dark:hover:bg-[#1a73e8]/10 text-left flex items-center justify-between transition-all group"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-[#1a73e8]">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.user.email}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#1a73e8] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-card">
        <p>
          GDG on Campus — New Cairo Technological University (NCTU) • Policy v2.4
        </p>
      </div>
    </div>
  );
}
