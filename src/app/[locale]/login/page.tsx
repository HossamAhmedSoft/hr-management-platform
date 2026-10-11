"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Globe,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";
import { getAvailableTestAccounts } from "@/lib/auth-service";

export default function LoginPage() {
  const router = useRouter();
  const { login, locale, toggleLocale, theme, toggleTheme } = useApp();
  const isAr = locale === "ar";

  const [email, setEmail] = useState("lead@gdgnctu.com");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const testAccounts = getAvailableTestAccounts();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    setTimeout(() => {
      // Find matching user from test accounts or fallback to default
      const matched = testAccounts.find(
        (a) => a.user.email.toLowerCase() === email.toLowerCase()
      );

      if (matched) {
        login(matched.user);
      } else {
        // Fallback or accept any valid email with default member role
        login({
          id: `usr_${Date.now()}`,
          email,
          full_name: email.split("@")[0].replace(".", " ").toUpperCase(),
          role: "member",
          status: "active",
          join_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      setIsLoading(false);
    }, 600);
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
        <div className="w-full max-w-md space-y-6">
          <Card className="overflow-hidden border border-border shadow-md bg-card rounded-xl">
            {/* Google 4-Color Signature Accent Bar */}
            <div className="google-accent-strip">
              <div className="seg-blue" />
              <div className="seg-red" />
              <div className="seg-yellow" />
              <div className="seg-green" />
            </div>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Header Title */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {isAr ? "تسجيل الدخول إلى البوابة" : "Sign in to GDG NCTU"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "بوابة إدارة العمليات والأداء ولائحة النقاط"
                    : "HR Operations & Member Performance Management Portal"}
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#fce8e6] text-[#c5221f] text-xs flex items-center gap-2 border border-[#fad2cf]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
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

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-lg bg-[#1a73e8] hover:bg-[#1765cc] text-white font-semibold text-xs shadow-xs"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {isAr ? "جارِ تسجيل الدخول..." : "Signing in..."}
                    </span>
                  ) : isAr ? (
                    "دخول إلى الحساب"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Quick Persona Switcher for Instant Testing */}
              <div className="pt-4 border-t border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {isAr ? "دخول سريع بحسابات تجريبية (1-Click Login):" : "Quick Test Personas (1-Click):"}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-[#e6f4ea] px-1.5 py-0.5 rounded">
                    Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {testAccounts.map((item) => (
                    <button
                      key={item.user.id}
                      type="button"
                      onClick={() => handleQuickLogin(item)}
                      className="p-2.5 rounded-lg border border-border hover:border-[#1a73e8] hover:bg-[#e8f0fe]/50 dark:hover:bg-[#1a73e8]/10 text-left flex items-center justify-between transition-all group"
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
