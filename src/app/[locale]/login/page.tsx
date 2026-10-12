"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";
import {
  loginWithCredentials,
  registerWithCredentials,
  isDatabaseEmpty,
} from "@/lib/auth-service";

export default function LoginPage() {
  const router = useRouter();
  const { login, locale, toggleLocale, theme, toggleTheme, isAuthenticated } = useApp();
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}`);
    }
  }, [isAuthenticated, locale, router]);

  useEffect(() => {
    isDatabaseEmpty().then((empty) => {
      setIsFirstTimeSetup(empty);
    });
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    if (isFirstTimeSetup) {
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setErrorMessage(isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields");
        setIsLoading(false);
        return;
      }
      const res = await registerWithCredentials(
        email.trim().toLowerCase(),
        password,
        fullName.trim(),
        "super_admin"
      );
      if (res.success && res.user) {
        login(res.user);
        window.location.href = `/${locale}`;
        return;
      } else {
        setErrorMessage(res.error || (isAr ? "فشل إنشاء الحساب" : "Failed to create account"));
      }
    } else {
      const res = await loginWithCredentials(email, password);
      if (res.success && res.user) {
        login(res.user);
        window.location.href = `/${locale}`;
        return;
      } else {
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

              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#fce8e6] dark:bg-[#ea4335]/20 text-[#c5221f] dark:text-[#f28b82] text-xs flex items-center gap-2 border border-[#fad2cf] dark:border-[#ea4335]/30">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                {isFirstTimeSetup && (
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      {isAr ? "الاسم الكامل لمدير النظام:" : "Super Admin Full Name:"}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
                      <Input
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
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "البريد الإلكتروني:" : "Email Address:"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
                    <Input
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
                    <label className="font-semibold text-foreground">
                      {isAr ? "كلمة المرور:" : "Password:"}
                    </label>
                    {!isFirstTimeSetup && (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(
                            isAr
                              ? "يرجى مراجعة مدير النظام (Super Admin) لإعادة تعيين كلمة المرور."
                              : "Please contact Super Admin to reset your password."
                          );
                        }}
                        className="text-[11px] text-[#1a73e8] hover:underline"
                      >
                        {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
                    <Input
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
                      className="absolute right-3 rtl:right-auto rtl:left-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-lg bg-[#1a73e8] hover:bg-[#1765cc] text-white font-semibold text-xs shadow-xs"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {isAr ? "جارِ الحفظ والتحقق..." : "Processing..."}
                    </span>
                  ) : isFirstTimeSetup ? (
                    isAr ? "إنشاء حساب مدير النظام وبدء العمل" : "Initialize Super Admin & Start"
                  ) : isAr ? (
                    "دخول إلى الحساب"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Quick 1-Click Demo Accounts */}
              {!isFirstTimeSetup && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground">
                      {isAr ? "دخول سريع لتجربة الأدوار (1-Click):" : "Quick Demo Role Sign In:"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {isAr ? "بدون كتابة كلمة مرور" : "Instant Preview"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        name: "حسام أحمد",
                        role: "Super Admin",
                        email: "hossam.admin@gdgnctu.com",
                        badge: "مدير النظام",
                        color: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 hover:bg-red-100",
                      },
                      {
                        name: "سارة علي",
                        role: "HR Admin",
                        email: "sara.hr@gdgnctu.com",
                        badge: "مسؤول الموارد",
                        color: "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-100",
                      },
                      {
                        name: "يوسف إبراهيم",
                        role: "Member (Web)",
                        email: "youssef.web@gdgnctu.com",
                        badge: "عضو مسار Web",
                        color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-100",
                      },
                      {
                        name: "كريم حسن",
                        role: "Member (Mobile)",
                        email: "karim.mobile@gdgnctu.com",
                        badge: "عضو مسار Mobile",
                        color: "border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 hover:bg-purple-100",
                      },
                    ].map((dp) => (
                      <button
                        key={dp.email}
                        type="button"
                        onClick={async () => {
                          setIsLoading(true);
                          setErrorMessage("");
                          setEmail(dp.email);
                          setPassword("password123");
                          const res = await loginWithCredentials(dp.email, "password123");
                          if (res.success && res.user) {
                            login(res.user);
                            window.location.href = `/${locale}`;
                            return;
                          }
                          const res2 = await loginWithCredentials(dp.email);
                          if (res2.success && res2.user) {
                            login(res2.user);
                            window.location.href = `/${locale}`;
                            return;
                          }
                          setErrorMessage(res.error || (isAr ? "تعذر الدخول بالحساب التجريبي" : "Demo login failed"));
                          setIsLoading(false);
                        }}
                        className={`p-2 rounded-lg border text-right rtl:text-right ltr:text-left text-[11px] transition-all hover:scale-[1.02] flex flex-col justify-between cursor-pointer ${dp.color}`}
                      >
                        <span className="font-bold truncate">{dp.name}</span>
                        <span className="text-[9px] opacity-80 mt-0.5">{isAr ? dp.badge : dp.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Administrative Footnote */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isFirstTimeSetup
                    ? isAr
                      ? "⚡ خطوة لمرة واحدة فقط لربط الحساب القيادي الأول بقاعدة البيانات السحابية."
                      : "⚡ One-time setup to establish the primary leadership account."
                    : isAr
                    ? "🔒 إنشاء وتفعيل الحسابات مقتصر على مدير النظام (Super Admin) فقط."
                    : "🔒 Account provisioning is restricted to Super Admin only."}
                </p>
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
