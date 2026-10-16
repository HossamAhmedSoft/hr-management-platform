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
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
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
        ...formData,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        university: formData.university.trim(),
        faculty_department: formData.faculty_department.trim(),
        academic_year: formData.academic_year.trim(),
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
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-2xl border-border bg-card shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center border border-[#1a73e8]/20">
              <UserPlus className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-black text-foreground tracking-tight">
              {isAr ? "تسجيل متدرب جديد" : "Register New Trainee"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isAr
              ? "إضافة طالب أو متدرب جديد في قاعدة البيانات الأكاديمية وتنسيبه للمسار المناسب"
              : "Register a student in the academy database and optionally assign to an academic track."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* Section 1: Personal & Contact Info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <User className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>{isAr ? "البيانات الشخصية والتواصل" : "Personal & Contact Information"}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-foreground">
                {isAr ? "الاسم الرباعي" : "Full Name"} <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                    if (errors.full_name) setErrors({ ...errors, full_name: "" });
                  }}
                  placeholder={isAr ? "أحمد محمود عبد الرحمن" : "Ahmed Mahmoud Abdelrahman"}
                  className={`h-9 text-xs rounded-xl pr-3 pl-3 bg-background focus:ring-2 focus:ring-[#1a73e8]/20 ${
                    errors.full_name ? "border-rose-500 focus:border-rose-500" : "border-border"
                  }`}
                />
              </div>
              {errors.full_name && (
                <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.full_name}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  {isAr ? "البريد الإلكتروني" : "Email Address"} <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="student@nctu.edu.eg"
                    dir="ltr"
                    className={`h-9 text-xs rounded-xl bg-background font-mono focus:ring-2 focus:ring-[#1a73e8]/20 text-start ${
                      errors.email ? "border-rose-500 focus:border-rose-500" : "border-border"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  {isAr ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"}
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010 1234 5678"
                  dir="ltr"
                  className="h-9 text-xs rounded-xl bg-background font-mono border-border focus:ring-2 focus:ring-[#1a73e8]/20 text-start"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Info */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <School className="w-3.5 h-3.5 text-[#34a853]" />
              <span>{isAr ? "البيانات الأكاديمية والجامعية" : "Academic Background"}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-foreground">
                {isAr ? "الجامعة أو المؤسسة التعليمية" : "University / Institution"}
              </Label>
              <Input
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="h-9 text-xs rounded-xl bg-background border-border focus:ring-2 focus:ring-[#1a73e8]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  {isAr ? "الكلية / القسم الأكاديمي" : "Faculty / Department"}
                </Label>
                <Input
                  value={formData.faculty_department}
                  onChange={(e) => setFormData({ ...formData, faculty_department: e.target.value })}
                  className="h-9 text-xs rounded-xl bg-background border-border focus:ring-2 focus:ring-[#1a73e8]/20"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  {isAr ? "الفرقة الدراسية" : "Academic Year"}
                </Label>
                <select
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full text-xs h-9 px-3 rounded-xl border border-border bg-background font-medium focus:ring-2 focus:ring-[#1a73e8]/20 focus:outline-none"
                >
                  <option value="الفرقة الأولى">{isAr ? "الفرقة الأولى (Year 1)" : "Year 1"}</option>
                  <option value="الفرقة الثانية">{isAr ? "الفرقة الثانية (Year 2)" : "Year 2"}</option>
                  <option value="الفرقة الثالثة">{isAr ? "الفرقة الثالثة (Year 3)" : "Year 3"}</option>
                  <option value="الفرقة الرابعة">{isAr ? "الفرقة الرابعة (Year 4)" : "Year 4"}</option>
                  <option value="خريج">{isAr ? "خريج (Graduate)" : "Graduate"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Track Assignment */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Layers className="w-3.5 h-3.5 text-[#fbbc04]" />
              <span>{isAr ? "التنسيب والمسار التقني" : "Track Assignment"}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-foreground">
                {isAr ? "المسار الأكاديمي المستهدف" : "Target Technical Track"}
              </Label>
              <select
                value={formData.track_id}
                onChange={(e) => setFormData({ ...formData, track_id: e.target.value })}
                className="w-full text-xs h-9.5 px-3 rounded-xl border border-border bg-background font-bold focus:ring-2 focus:ring-[#1a73e8]/30 focus:outline-none"
              >
                <option value="">
                  {isAr ? "— بدون مسار حالياً (بانتظار التنسيب لاحقاً) —" : "— Unassigned (Enroll later) —"}
                </option>
                {tracks
                  .filter((t) => t.status !== "archived")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.name_ar || t.name : t.name} • ({t.cohort})
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                {formData.track_id
                  ? isAr
                    ? "✓ سيتم ربط المتدرب بالمسار المحدد وتجهيز سجل الحضور والتكليفات له فوراً."
                    : "✓ Trainee will be enrolled in this track immediately with roster records."
                  : isAr
                    ? "• سيتم تسجيل المتدرب كـ 'بانتظار التنسيب' ويمكنك توجيهه لمسار في أي وقت."
                    : "• Trainee will be marked as unassigned and can be enrolled anytime."}
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-[11px] font-bold text-foreground">
                {isAr ? "ملاحظات إضافية (اختياري)" : "Notes (Optional)"}
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isAr ? "أي تفاصيل أو اهتمامات تقنية خاصة بالمتدرب..." : "Additional notes..."}
                className="text-xs h-16 rounded-xl bg-background border-border resize-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/70 flex items-center justify-between sm:justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs h-8.5 font-bold"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs h-8.5 px-4 font-bold bg-[#1a73e8] hover:bg-[#1a73e8]/90 text-white gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? (isAr ? "جارِ الحفظ..." : "Saving...") : (isAr ? "حفظ وتسجيل المتدرب" : "Save Trainee")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
