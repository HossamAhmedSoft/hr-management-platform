"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  GraduationCap,
  Shield,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Briefcase,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { RegistrationField, RegistrationStep } from "@/types";
import { INITIAL_REGISTRATION_FIELDS } from "@/lib/registration-seed";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface RegistrationWizardProps {
  isAr: boolean;
  onSwitchToLogin: () => void;
  onSubmitted: (email: string, referenceNo: string) => void;
}

const DRAFT_STORAGE_KEY = "gdg_reg_draft_v1";

export function RegistrationWizard({
  isAr,
  onSwitchToLogin,
  onSubmitted,
}: RegistrationWizardProps) {
  const [fields, setFields] = useState<RegistrationField[]>(INITIAL_REGISTRATION_FIELDS);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Never restore password
          delete parsed.password;
          delete parsed.confirm_password;
          return parsed;
        }
      } catch {}
    }
    return {
      university: "nctu",
      gender: "male",
      academic_year: "year_1",
      preferred_track: "team_web",
      experience_level: "beginner",
    };
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // Load latest schema from server if available
  useEffect(() => {
    fetch("/api/auth/registration/schema")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.fields) && data.fields.length > 0) {
          setFields(data.fields);
        }
      })
      .catch(() => {});
  }, []);

  // Autosave non-sensitive fields to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const safe = { ...formData };
        delete safe.password;
        delete safe.confirm_password;
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(safe));
      } catch {}
    }
  }, [formData]);

  const stepConfigs: Record<
    number,
    { title_ar: string; title_en: string; desc_ar: string; desc_en: string }
  > = {
    1: {
      title_ar: "بيانات الحساب الشخصية",
      title_en: "Account & Personal Details",
      desc_ar: "الاسم الرسمي، البريد، كلمة المرور، ورقم التواصل",
      desc_en: "Full name, credentials, and contact information",
    },
    2: {
      title_ar: "البيانات الأكاديمية والتحقق (KYC)",
      title_en: "Academic & KYC Context",
      desc_ar: "الرقم القومي، الكلية، التخصص، والفرقة الدراسية",
      desc_en: "National ID, university, faculty, and academic year",
    },
    3: {
      title_ar: "المسار والخبرات السابقة",
      title_en: "Track & Experience",
      desc_ar: "اللجنة أو التراك المطلوب، مستوى الخبرة، ودوافع الانضمام",
      desc_en: "Preferred track, background, and motivation statement",
    },
    4: {
      title_ar: "المستندات، الميثاق والمراجعة",
      title_en: "Documents, Code of Conduct & Review",
      desc_ar: "إرفاق إثبات القيد، الموافقة على اللائحة، ومراجعة الطلب",
      desc_en: "Upload verification ID, terms consent, and final review",
    },
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleFileUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [key]: isAr ? "حجم الملف لا يجب أن يتجاوز 5 ميجابايت." : "File size cannot exceed 5MB.",
      }));
      return;
    }

    // Save filename and simulate upload
    handleFieldChange(key, file.name);
    handleFieldChange(`${key}_size`, file.size);
    handleFieldChange(`${key}_type`, file.type);
  };

  const validateCurrentStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.full_name || formData.full_name.trim().length < 3) {
        stepErrors.full_name = isAr ? "الاسم الرباعي مطلوب (3 أحرف على الأقل)." : "Full name is required (min 3 chars).";
      }
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        stepErrors.email = isAr ? "يرجى إدخال بريد إلكتروني صحيح." : "Valid email address is required.";
      }
      if (!password || password.length < 8) {
        stepErrors.password = isAr ? "كلمة المرور يجب ألا تقل عن 8 خانات." : "Password must be at least 8 characters.";
      }
      if (password !== confirmPassword) {
        stepErrors.confirm_password = isAr ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.";
      }
      if (!formData.phone || formData.phone.trim().length < 8) {
        stepErrors.phone = isAr ? "رقم الهاتف مطلوب للتواصل." : "Phone number is required.";
      }
      if (!formData.gender) {
        stepErrors.gender = isAr ? "يرجى تحديد النوع." : "Gender is required.";
      }
      if (!formData.date_of_birth) {
        stepErrors.date_of_birth = isAr ? "تاريخ الميلاد مطلوب." : "Date of birth is required.";
      }
    }

    if (currentStep === 2) {
      if (!formData.national_id || formData.national_id.trim().length < 8) {
        stepErrors.national_id = isAr ? "الرقم القومي أو رقم جواز السفر مطلوب." : "National ID or Passport is required.";
      }
      if (!formData.faculty_department || formData.faculty_department.trim().length < 2) {
        stepErrors.faculty_department = isAr ? "الكلية أو التخصص الدراسي مطلوب." : "Faculty / Department is required.";
      }
      if (!formData.academic_year) {
        stepErrors.academic_year = isAr ? "يرجى تحديد الفرقة الدراسية." : "Academic year is required.";
      }
    }

    if (currentStep === 3) {
      if (!formData.preferred_track) {
        stepErrors.preferred_track = isAr ? "يرجى اختيار المسار أو اللجنة." : "Please select a preferred track.";
      }
      if (!formData.experience_level) {
        stepErrors.experience_level = isAr ? "يرجى تحديد مستوى الخبرة." : "Please select experience level.";
      }
      if (!formData.bio_or_motivation || formData.bio_or_motivation.trim().length < 20) {
        stepErrors.bio_or_motivation = isAr ? "يرجى كتابة نبذة لا تقل عن 20 حرفاً." : "Please write at least 20 characters.";
      }
    }

    if (currentStep === 4) {
      if (!formData.id_card_doc) {
        stepErrors.id_card_doc = isAr ? "يرجى إرفاق صورة إثبات القيد أو الرقم القومي." : "Please upload your ID or student card.";
      }
      if (!formData.terms_accepted) {
        stepErrors.terms_accepted = isAr ? "يجب الموافقة على ميثاق السلوك ولائحة المنصة." : "You must accept the community terms.";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      setGeneralError("");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setGeneralError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setGeneralError("");

    const payload = {
      ...formData,
      password,
      locale: isAr ? "ar" : "en",
    };

    try {
      const res = await fetch("/api/auth/registration/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Clear draft
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        }
        onSubmitted(data.email, data.reference_no);
      } else {
        setGeneralError(data.error || (isAr ? "فشل إرسال طلب التسجيل." : "Failed to submit application."));
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
        }
      }
    } catch {
      setGeneralError(isAr ? "حدث خطأ في الاتصال بالخادم." : "Network connection error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wizard Header & Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? "تقديم طلب انضمام جديد" : "Apply for Membership"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isAr ? stepConfigs[currentStep].desc_ar : stepConfigs[currentStep].desc_en}
            </p>
          </div>
          <div className="text-end">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
              {isAr ? `الخطوة ${currentStep} من ${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
            </span>
          </div>
        </div>

        {/* Multi-Step Progress Indicator */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[1, 2, 3, 4].map((stepIdx) => (
            <div key={stepIdx} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  stepIdx < currentStep
                    ? "bg-emerald-500"
                    : stepIdx === currentStep
                    ? "bg-blue-600"
                    : "bg-slate-200 dark:bg-zinc-800"
                }`}
              />
              <span
                className={`text-[10px] hidden sm:block truncate transition-colors ${
                  stepIdx === currentStep
                    ? "font-bold text-blue-600 dark:text-blue-400"
                    : stepIdx < currentStep
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-slate-400 dark:text-zinc-600"
                }`}
              >
                {stepIdx === 1
                  ? isAr ? "١. الحساب" : "1. Account"
                  : stepIdx === 2
                  ? isAr ? "٢. الأكاديمية" : "2. Academic"
                  : stepIdx === 3
                  ? isAr ? "٣. المسار" : "3. Track"
                  : isAr ? "٤. المراجعة" : "4. Review"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* General error */}
      {generalError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Form Content per Step */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── STEP 1: Personal & Account Credentials ── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? "الاسم الرباعي الرسمي (طبقاً لبطاقة الرقم القومي)" : "Full Name (as in Official ID)"} *</span>
              </label>
              <Input
                required
                placeholder={isAr ? "أحمد محمد محمود علي" : "Ahmed Mohamed Ali"}
                value={formData.full_name || ""}
                onChange={(e) => handleFieldChange("full_name", e.target.value)}
                className={`h-10 text-xs rounded-xl ${errors.full_name ? "border-rose-500" : ""}`}
              />
              {errors.full_name && <p className="text-[11px] text-rose-500">{errors.full_name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? "البريد الإلكتروني الرسمي" : "Official Email Address"} *</span>
              </label>
              <Input
                type="email"
                required
                placeholder="name@nctu.edu.eg"
                value={formData.email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={`h-10 text-xs rounded-xl ${errors.email ? "border-rose-500" : ""}`}
              />
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                {isAr ? "سنرسل رمز تأكيد مكون من 6 أرقام إلى هذا البريد فور الإرسال." : "A 6-digit confirmation OTP will be sent here."}
              </p>
              {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isAr ? "كلمة المرور" : "Account Password"} *</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-10 text-xs rounded-xl pe-10 ${errors.password ? "border-rose-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-500">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isAr ? "تأكيد كلمة المرور" : "Confirm Password"} *</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-10 text-xs rounded-xl pe-10 ${errors.confirm_password ? "border-rose-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-[11px] text-rose-500">{errors.confirm_password}</p>}
              </div>
            </div>

            {/* Live Password Strength Meter */}
            <PasswordStrengthMeter password={password} isAr={isAr} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isAr ? "الهاتف (واتساب)" : "Phone (WhatsApp)"} *</span>
                </label>
                <Input
                  required
                  placeholder="+201012345678"
                  value={formData.phone || ""}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  className={`h-10 text-xs rounded-xl ${errors.phone ? "border-rose-500" : ""}`}
                />
                {errors.phone && <p className="text-[11px] text-rose-500">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "النوع" : "Gender"} *
                </label>
                <select
                  value={formData.gender || "male"}
                  onChange={(e) => handleFieldChange("gender", e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="male">{isAr ? "ذكر" : "Male"}</option>
                  <option value="female">{isAr ? "أنثى" : "Female"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isAr ? "تاريخ الميلاد" : "Date of Birth"} *</span>
                </label>
                <Input
                  type="date"
                  required
                  value={formData.date_of_birth || ""}
                  onChange={(e) => handleFieldChange("date_of_birth", e.target.value)}
                  className={`h-10 text-xs rounded-xl ${errors.date_of_birth ? "border-rose-500" : ""}`}
                />
                {errors.date_of_birth && <p className="text-[11px] text-rose-500">{errors.date_of_birth}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Academic & KYC Context ── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? "الرقم القومي (14 رقماً) / رقم جواز السفر" : "National ID / Passport Number"} *</span>
              </label>
              <Input
                required
                placeholder="30403150109988"
                value={formData.national_id || ""}
                onChange={(e) => handleFieldChange("national_id", e.target.value)}
                className={`h-10 text-xs rounded-xl font-mono ${errors.national_id ? "border-rose-500" : ""}`}
              />
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                {isAr ? "مطلوب لإصدار الشهادات والتحقق من هوية الطالب القانونية." : "Required for certification and official identity verification."}
              </p>
              {errors.national_id && <p className="text-[11px] text-rose-500">{errors.national_id}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? "الجامعة / المؤسسة الأكاديمية" : "University / Institution"} *</span>
              </label>
              <select
                value={formData.university || "nctu"}
                onChange={(e) => handleFieldChange("university", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200 outline-none"
              >
                <option value="nctu">
                  {isAr ? "جامعة القاهرة التكنولوجية الجديدة (NCTU)" : "New Cairo Technological University (NCTU)"}
                </option>
                <option value="other">{isAr ? "جامعة أخرى" : "Other University"}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "الكلية / البرنامج الدراسي" : "Faculty / Department"} *
                </label>
                <Input
                  required
                  placeholder={isAr ? "تكنولوجيا المعلومات (IT)" : "Information Technology"}
                  value={formData.faculty_department || ""}
                  onChange={(e) => handleFieldChange("faculty_department", e.target.value)}
                  className={`h-10 text-xs rounded-xl ${errors.faculty_department ? "border-rose-500" : ""}`}
                />
                {errors.faculty_department && (
                  <p className="text-[11px] text-rose-500">{errors.faculty_department}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {isAr ? "الفرقة الدراسية" : "Academic Year"} *
                </label>
                <select
                  value={formData.academic_year || "year_1"}
                  onChange={(e) => handleFieldChange("academic_year", e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200 outline-none"
                >
                  <option value="year_1">{isAr ? "الفرقة الأولى (Year 1)" : "Year 1 (Freshman)"}</option>
                  <option value="year_2">{isAr ? "الفرقة الثانية (Year 2)" : "Year 2 (Sophomore)"}</option>
                  <option value="year_3">{isAr ? "الفرقة الثالثة (Year 3)" : "Year 3 (Junior)"}</option>
                  <option value="year_4">{isAr ? "الفرقة الرابعة (Year 4)" : "Year 4 (Senior)"}</option>
                  <option value="graduate">{isAr ? "خريج حديث (Graduate)" : "Recent Graduate"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {isAr ? "رقم القيد الجامعي / كارنيه الكلية (إن وجد)" : "University Student ID / Seat Number (Optional)"}
              </label>
              <Input
                placeholder="2024-NCTU-044"
                value={formData.student_id_number || ""}
                onChange={(e) => handleFieldChange("student_id_number", e.target.value)}
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: Track & Experience ── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? "اللجنة أو المسار التقني المرغوب" : "Preferred Committee / Track"} *</span>
              </label>
              <select
                value={formData.preferred_track || "team_web"}
                onChange={(e) => handleFieldChange("preferred_track", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200 outline-none"
              >
                <option value="team_web">{isAr ? "مسار تطوير الويب (Web Development)" : "Web Development Track"}</option>
                <option value="team_mobile">{isAr ? "مسار تطبيقات الموبايل (Flutter/Android)" : "Mobile Apps Track"}</option>
                <option value="team_ai">{isAr ? "مسار الذكاء الاصطناعي (AI & Data Science)" : "AI & Data Science Track"}</option>
                <option value="team_cyber">{isAr ? "مسار الأمن السيبراني (Cybersecurity)" : "Cybersecurity Track"}</option>
                <option value="team_embedded">{isAr ? "الأنظمة المدمجة (Embedded Systems & IoT)" : "Embedded Systems Track"}</option>
                <option value="team_uiux">{isAr ? "مسار تصميم واجهات المستخدم (UI/UX)" : "UI/UX Design Track"}</option>
                <option value="team_hr">{isAr ? "لجنة الموارد البشرية (HR)" : "Human Resources Committee"}</option>
                <option value="team_media">{isAr ? "لجنة الميديا وصناعة المحتوى" : "Media & Branding"}</option>
                <option value="team_pr">{isAr ? "لجنة العلاقات العامة والتسويق (PR)" : "Public Relations & Marketing"}</option>
                <option value="team_ops">{isAr ? "لجنة العمليات واللوجستيات (Operations)" : "Operations & Logistics"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {isAr ? "مستوى الخبرة في المجال المطلوب" : "Experience Level in this Field"} *
              </label>
              <select
                value={formData.experience_level || "beginner"}
                onChange={(e) => handleFieldChange("experience_level", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-zinc-200 outline-none"
              >
                <option value="beginner">{isAr ? "مبتدئ / شغوف بالتعلم (Beginner)" : "Beginner / Eager to Learn"}</option>
                <option value="intermediate">{isAr ? "متوسط / قمت ببناء مشاريع سابقة (Intermediate)" : "Intermediate (Built Projects)"}</option>
                <option value="advanced">{isAr ? "متقدم / خبرة عملية وفريق عمل (Advanced)" : "Advanced / Production-ready"}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <GithubIcon className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
                  <span>GitHub URL</span>
                </label>
                <Input
                  placeholder="https://github.com/username"
                  value={formData.github_url || ""}
                  onChange={(e) => handleFieldChange("github_url", e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <LinkedinIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>LinkedIn URL</span>
                </label>
                <Input
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin_url || ""}
                  onChange={(e) => handleFieldChange("linkedin_url", e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? "لماذا ترغب في الانضمام إلى مجتمع GDG NCTU؟" : "Statement of Motivation"} *</span>
              </label>
              <Textarea
                required
                placeholder={
                  isAr
                    ? "اكتب نبذة عن أهدافك، ما تتطلع لاكتسابه، وما هي الإضافة التي ستقدمها للأنشطة والفعاليات..."
                    : "Describe your goals, what you want to learn, and how you will contribute..."
                }
                value={formData.bio_or_motivation || ""}
                onChange={(e) => handleFieldChange("bio_or_motivation", e.target.value)}
                className={`min-h-[90px] text-xs rounded-xl ${errors.bio_or_motivation ? "border-rose-500" : ""}`}
              />
              {errors.bio_or_motivation && (
                <p className="text-[11px] text-rose-500">{errors.bio_or_motivation}</p>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Documents, Consent & Review ── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            {/* ID Card Upload */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isAr ? "صورة بطاقة الرقم القومي أو كارنيه الكلية" : "National ID or Student ID Card Photo"} *</span>
                </label>
                <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => handleFileUpload("id_card_doc", e)}
                className="w-full text-xs text-slate-500 file:me-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-800 dark:file:text-blue-400"
              />
              {formData.id_card_doc && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                  <FileCheck className="w-4 h-4" />
                  <span>{isAr ? "تم اختيار الملف: " : "Selected: "} {formData.id_card_doc}</span>
                </div>
              )}
              {errors.id_card_doc && <p className="text-[11px] text-rose-500">{errors.id_card_doc}</p>}
            </div>

            {/* CV Upload */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? "السيرة الذاتية / CV (اختياري)" : "Resume / CV (Optional)"}</span>
                </label>
                <span className="text-[10px] text-slate-400">PDF (Max 10MB)</span>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload("cv_resume_doc", e)}
                className="w-full text-xs text-slate-500 file:me-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-zinc-800 dark:file:text-zinc-300"
              />
              {formData.cv_resume_doc && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                  <FileCheck className="w-4 h-4" />
                  <span>{isAr ? "تم اختيار الملف: " : "Selected: "} {formData.cv_resume_doc}</span>
                </div>
              )}
            </div>

            {/* Terms of conduct checkbox */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={Boolean(formData.terms_accepted)}
                  onChange={(e) => handleFieldChange("terms_accepted", e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 shrink-0"
                />
                <span className="leading-relaxed">
                  {isAr
                    ? "أوافق على الالتزام بميثاق سلوكيات GDG on Campus ولائحة الحضور والتقييمات، وأقر بصحة جميع البيانات والمستندات المقدمة أعلاه."
                    : "I agree to abide by the GDG Code of Conduct, attendance policies, and confirm all submitted data is accurate."}
                </span>
              </label>
              {errors.terms_accepted && (
                <p className="text-[11px] text-rose-500 ps-6">{errors.terms_accepted}</p>
              )}
            </div>

            {/* Summary Review Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800 dark:text-zinc-200 pb-1 border-b border-slate-200 dark:border-zinc-800">
                {isAr ? "ملخص طلب الانضمام قبل الإرسال:" : "Application Summary:"}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-zinc-400">
                <div>
                  <span className="text-[10px] block opacity-75">{isAr ? "الاسم:" : "Name:"}</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate block">
                    {formData.full_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">{isAr ? "البريد:" : "Email:"}</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate block dir-ltr">
                    {formData.email}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">{isAr ? "الكلية:" : "Faculty:"}</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate block">
                    {formData.faculty_department}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] block opacity-75">{isAr ? "المسار المطلوب:" : "Track:"}</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400 truncate block">
                    {formData.preferred_track}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{isAr ? "السابق" : "Back"}</span>
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <span>{isAr ? "المتابعة للخطوة التالية" : "Continue"}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? "جاري الإرسال..." : "Submitting..."}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isAr ? "إرسال طلب الانضمام رسمياً" : "Submit Application"}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Switch back to sign in */}
      <div className="pt-2 text-center text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80">
        <span>{isAr ? "لديك حساب بالفعل في المنصة؟ " : "Already have an account? "}</span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
        >
          {isAr ? "تسجيل الدخول (Sign In)" : "Sign In"}
        </button>
      </div>
    </div>
  );
}
