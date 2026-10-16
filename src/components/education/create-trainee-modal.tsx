"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  School,
  BookOpen,
  GraduationCap,
  Layers,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TechnicalTrack } from "@/types";

interface CreateTraineeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: TechnicalTrack[];
  defaultTrackId?: string;
  isAr: boolean;
  onSave: (data: {
    full_name: string;
    email: string;
    phone: string;
    university: string;
    faculty_department: string;
    academic_year: string;
    track_id: string;
    cohort: string;
    notes: string;
  }) => Promise<void> | void;
}

export function CreateTraineeModal({
  isOpen,
  onClose,
  tracks,
  defaultTrackId = "",
  isAr,
  onSave,
}: CreateTraineeModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    university: "جامعة مصر التكنولوجية الدولية (NCTU)",
    faculty_department: "كلية تكنولوجيا الصناعة والطاقة",
    academic_year: "الفرقة الثانية",
    track_id: defaultTrackId,
    cohort: "Season 2026 - Cohort 1",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync defaultTrackId when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        university: isAr
          ? "جامعة مصر التكنولوجية الدولية (NCTU)"
          : "New Cairo Technological University (NCTU)",
        faculty_department: isAr
          ? "كلية تكنولوجيا الصناعة والطاقة"
          : "Faculty of Industry & Energy Technology",
        academic_year: isAr ? "الفرقة الثانية" : "Year 2",
        track_id: defaultTrackId,
        cohort: "Season 2026 - Cohort 1",
        notes: "",
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, defaultTrackId, isAr]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = isAr ? "يرجى إدخال الاسم الرباعي" : "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = isAr ? "يرجى إدخال البريد الإلكتروني" : "Email is required";
    } else if (!formData.email.includes("@")) {
      newErrors.email = isAr ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        university: formData.university.trim() || (isAr ? "جامعة مصر التكنولوجية الدولية (NCTU)" : "NCTU"),
        faculty_department: formData.faculty_department.trim() || (isAr ? "كلية تكنولوجيا الصناعة والطاقة" : "Faculty of Technology"),
        academic_year: formData.academic_year.trim() || (isAr ? "الفرقة الثانية" : "Year 2"),
        track_id: formData.track_id,
        cohort: formData.cohort.trim() || "Season 2026 - Cohort 1",
        notes: formData.notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error("Failed to save trainee:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card text-card-foreground">
        {/* Pinned Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {isAr ? "تسجيل متدرب جديد" : "Register New Trainee"}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {isAr
                  ? "إضافة طالب أو متدرب جديد في قاعدة البيانات الأكاديمية وتنسيبه للمسار المناسب"
                  : "Register a student in the academy database and optionally assign to an academic track."}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form id="create-trainee-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5 text-xs">
          {/* Section 1: Personal & Contact Info */}
          <div className="space-y-3 p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? "البيانات الشخصية والتواصل" : "Personal & Contact Information"}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                {isAr ? "الاسم الرباعي" : "Full Name"}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.full_name}
                onChange={(e) => {
                  setFormData({ ...formData, full_name: e.target.value });
                  if (errors.full_name) setErrors({ ...errors, full_name: "" });
                }}
                placeholder={isAr ? "مثال: أحمد محمود عبد الرحمن" : "e.g. Ahmed Mahmoud Abdelrahman"}
                className={`h-10 text-xs rounded-xl bg-background focus:ring-2 focus:ring-blue-500/20 ${
                  errors.full_name ? "border-rose-500 focus:border-rose-500" : "border-border"
                }`}
              />
              {errors.full_name && (
                <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.full_name}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  {isAr ? "البريد الإلكتروني" : "Email Address"}
                  <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  placeholder="student@nctu.edu.eg"
                  dir="ltr"
                  className={`h-10 text-xs rounded-xl bg-background font-mono focus:ring-2 focus:ring-blue-500/20 text-start ${
                    errors.email ? "border-rose-500 focus:border-rose-500" : "border-border"
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  {isAr ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"}
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010XXXXXXXX"
                  dir="ltr"
                  className="h-10 text-xs rounded-xl bg-background text-start border-border"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Background */}
          <div className="space-y-3 p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <School className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{isAr ? "البيانات الأكاديمية والجامعية" : "Academic Background"}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {isAr ? "الجامعة أو المؤسسة التعليمية" : "University / Institution"}
              </Label>
              <Input
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder={isAr ? "جامعة مصر التكنولوجية الدولية (NCTU)" : "University Name"}
                className="h-10 text-xs rounded-xl bg-background border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  {isAr ? "الكلية / القسم الأكاديمي" : "Faculty / Department"}
                </Label>
                <Input
                  value={formData.faculty_department}
                  onChange={(e) => setFormData({ ...formData, faculty_department: e.target.value })}
                  placeholder={isAr ? "كلية تكنولوجيا الصناعة والطاقة" : "Department"}
                  className="h-10 text-xs rounded-xl bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-muted-foreground" />
                  {isAr ? "الفرقة الدراسية" : "Academic Year"}
                </Label>
                <select
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full text-xs h-10 px-3 rounded-xl border border-border bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="الفرقة الأولى">{isAr ? "الفرقة الأولى (Year 1)" : "Year 1"}</option>
                  <option value="الفرقة الثانية">{isAr ? "الفرقة الثانية (Year 2)" : "Year 2"}</option>
                  <option value="الفرقة الثالثة">{isAr ? "الفرقة الثالثة (Year 3)" : "Year 3"}</option>
                  <option value="الفرقة الرابعة">{isAr ? "الفرقة الرابعة (Year 4)" : "Year 4"}</option>
                  <option value="خريج">{isAr ? "خريج حديث (Graduate)" : "Graduate"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Track Assignment */}
          <div className="space-y-3 p-3.5 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{isAr ? "التنسيب والمسار التقني" : "Track Enrollment"}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-muted-foreground" />
                {isAr ? "المسار الأكاديمي المستهدف" : "Target Academic Track"}
              </Label>
              <select
                value={formData.track_id}
                onChange={(e) => setFormData({ ...formData, track_id: e.target.value })}
                className="w-full text-xs h-10 px-3 rounded-xl border border-border bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{isAr ? "— بدون مسار حالياً (بانتظار التنسيب لاحقاً) —" : "— Unassigned (Waitlist) —"}</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name} ({t.cohort})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <FileText className="w-3 h-3 text-muted-foreground" />
                {isAr ? "ملاحظات إضافية (اختياري)" : "Additional Notes"}
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isAr ? "أي خلفية تقنية سابقة أو ملاحظات على الطالب..." : "Any previous background or notes..."}
                className="text-xs h-16 rounded-xl resize-none border-border bg-background"
              />
            </div>
          </div>
        </form>

        {/* Pinned Sticky Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl h-9 px-4 text-xs font-medium"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="submit"
            form="create-trainee-form"
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl h-9 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? isAr
                  ? "جارِ التسجيل..."
                  : "Saving..."
                : isAr
                ? "تسجيل المتدرب"
                : "Register Trainee"}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
