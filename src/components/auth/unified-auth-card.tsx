"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Globe,
  Moon,
  Sun,
  LogIn,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
} from "lucide-react";
import { SignInPanel } from "./sign-in-panel";
import { RegistrationWizard } from "./registration-wizard";
import { EmailVerificationModal } from "./email-verification-modal";
import { StatusDashboardModal } from "./status-dashboard-modal";
import { StatusCheckDrawer } from "./status-check-drawer";
import { useApp } from "@/lib/app-context";
import { RegistrationStatus } from "@/types";

export function UnifiedAuthCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, toggleLocale, theme, toggleTheme, isAuthenticated } = useApp();
  const isAr = locale === "ar";

  const modeParam = searchParams.get("mode");
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    modeParam === "register" ? "register" : "login"
  );

  // Sync mode with URL searchParams without page reload
  useEffect(() => {
    if (modeParam === "register" && activeTab !== "register") {
      setActiveTab("register");
    } else if (modeParam === "login" && activeTab !== "login") {
      setActiveTab("login");
    }
  }, [modeParam]);

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", tab);
    window.history.replaceState({}, "", url.toString());
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${locale}`);
    }
  }, [isAuthenticated, locale, router]);

  // Modal States
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationRef, setVerificationRef] = useState("");

  const [isStatusDashboardOpen, setIsStatusDashboardOpen] = useState(false);
  const [statusDashboardData, setStatusDashboardData] = useState<{
    status: RegistrationStatus;
    referenceNo: string;
    email: string;
    fullName?: string;
    submittedAt?: string;
    decisionReason?: string;
    infoRequestedFields?: string[];
    infoRequestMessage?: string;
    reapplyCooldownUntil?: string;
  } | null>(null);

  const [isStatusCheckOpen, setIsStatusCheckOpen] = useState(false);

  const handleRegistrationSubmitted = (email: string, referenceNo: string) => {
    setVerificationEmail(email);
    setVerificationRef(referenceNo);
    setIsVerificationModalOpen(true);
  };

  const handleEmailVerified = (referenceNo?: string) => {
    setStatusDashboardData({
      status: "pending_approval",
      referenceNo: referenceNo || verificationRef,
      email: verificationEmail,
      submittedAt: new Date().toISOString(),
    });
    setIsStatusDashboardOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Floating Utility Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Brand Emblem */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white block leading-none">
              GDG on Campus NCTU
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              {isAr ? "منظومة إدارة الموارد والأداء" : "HR & Operations Platform"}
            </span>
          </div>
        </div>

        {/* Global Controls: Language, Theme, Status Tracker */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStatusCheckOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-blue-500" />
            <span>{isAr ? "متابعة طلب انضمام" : "Track Application"}</span>
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors shadow-sm"
            title={isAr ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors shadow-sm"
            title={isAr ? "تبديل المظهر" : "Toggle theme"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </header>

      {/* Main Center Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-5xl rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* Left/Right Brand & Process Showcase Panel (Desktop 5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background Decorative Circles */}
            <div className="absolute -top-24 -start-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -end-24 w-72 h-72 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />

            {/* Top Brand Identity */}
            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Season 2026 • Chapter Operations</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                  {isAr
                    ? "بوابة الحوكمة والانضمام الرسمي"
                    : "Official Chapter Governance Portal"}
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 mt-2 leading-relaxed">
                  {isAr
                    ? "مجتمع مطوري Google بجامعة القاهرة التكنولوجية الجديدة (GDG on Campus NCTU). بيئة تقنية متكاملة لإدارة اللجان والمسارات الأكاديمية."
                    : "Google Developer Groups on Campus at New Cairo Technological University. Empowering developers and student leaders."}
                </p>
              </div>
            </div>

            {/* Middle Workflow Visualizer: 3 Steps to Active Membership */}
            <div className="relative py-8 space-y-4">
              <div className="text-xs font-bold tracking-wider uppercase text-blue-200/80">
                {isAr ? "مسار الانضمام واعتماد العضوية:" : "Membership Approval Pathway:"}
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    1
                  </div>
                  <div className="text-xs">
                    <strong className="block font-semibold text-white">
                      {isAr ? "تقديم البيانات والمستندات" : "Submit Details & KYC"}
                    </strong>
                    <span className="text-blue-100/75 text-[11px]">
                      {isAr ? "ملء النموذج الشامل وتأكيد البريد برمز OTP" : "Complete schema form and verify email via OTP"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                    2
                  </div>
                  <div className="text-xs">
                    <strong className="block font-semibold text-white">
                      {isAr ? "مراجعة وتدقيق الموارد البشرية" : "HR Review & Committee Routing"}
                    </strong>
                    <span className="text-blue-100/75 text-[11px]">
                      {isAr ? "فحص الملف وتعيين المسار التقني والدور الإداري" : "Leader evaluation and committee track assignment"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/25 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <strong className="block font-semibold text-white">
                      {isAr ? "الاعتماد وتفعيل الصلاحيات" : "Official Approval & Activation"}
                    </strong>
                    <span className="text-blue-100/75 text-[11px]">
                      {isAr ? "تفعيل حساب العضو والوصول الفوري للمهام والأنشطة" : "Direct access to tasks, points ledger, and workshops"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="relative pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-100/70">
              <span>NCTU Campus Hub</span>
              <span>v2.5 Security Enforced</span>
            </div>
          </div>

          {/* Right/Left Interactive Form Container (Desktop 7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            {/* Animated Tab Switcher Header */}
            <div>
              <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 w-full mb-6">
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === "login"
                      ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isAr ? "تسجيل الدخول (Sign In)" : "Sign In"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    activeTab === "register"
                      ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAr ? "طلب انضمام جديد (Create Account)" : "Create Account"}</span>
                </button>
              </div>

              {/* Dynamic Panel View */}
              {activeTab === "login" ? (
                <SignInPanel
                  isAr={isAr}
                  onSwitchToRegister={() => switchTab("register")}
                  onOpenStatusCheck={() => setIsStatusCheckOpen(true)}
                  onShowRegistrationStatus={(data) => {
                    setStatusDashboardData(data);
                    setIsStatusDashboardOpen(true);
                  }}
                  onShowEmailVerification={(email, referenceNo) => {
                    setVerificationEmail(email);
                    setVerificationRef(referenceNo || "");
                    setIsVerificationModalOpen(true);
                  }}
                />
              ) : (
                <RegistrationWizard
                  isAr={isAr}
                  onSwitchToLogin={() => switchTab("login")}
                  onSubmitted={handleRegistrationSubmitted}
                />
              )}
            </div>

            {/* Bottom Security Notice */}
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? "تشفير كامل وحماية لبيانات الهوية (KYC)" : "Encrypted & Tamper-proof KYC"}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsStatusCheckOpen(true)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {isAr ? "استعلام بالرقم المرجعي" : "Query with Reference No"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-400 dark:text-zinc-600">
        <p>
          © 2026 GDG on Campus New Cairo Technological University (NCTU). All rights reserved.
        </p>
      </footer>

      {/* Connected Modals */}
      <EmailVerificationModal
        isOpen={isVerificationModalOpen}
        onOpenChange={setIsVerificationModalOpen}
        email={verificationEmail}
        referenceNo={verificationRef}
        isAr={isAr}
        onVerified={handleEmailVerified}
      />

      {statusDashboardData && (
        <StatusDashboardModal
          isOpen={isStatusDashboardOpen}
          onOpenChange={setIsStatusDashboardOpen}
          status={statusDashboardData.status}
          referenceNo={statusDashboardData.referenceNo}
          email={statusDashboardData.email}
          fullName={statusDashboardData.fullName}
          submittedAt={statusDashboardData.submittedAt}
          decisionReason={statusDashboardData.decisionReason}
          infoRequestedFields={statusDashboardData.infoRequestedFields}
          infoRequestMessage={statusDashboardData.infoRequestMessage}
          reapplyCooldownUntil={statusDashboardData.reapplyCooldownUntil}
          isAr={isAr}
          onLoginClick={() => switchTab("login")}
        />
      )}

      <StatusCheckDrawer
        isOpen={isStatusCheckOpen}
        onOpenChange={setIsStatusCheckOpen}
        isAr={isAr}
        onStatusFound={(data) => {
          setStatusDashboardData(data);
          setIsStatusDashboardOpen(true);
        }}
      />
    </div>
  );
}
