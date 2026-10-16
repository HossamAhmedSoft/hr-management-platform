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
  Pencil,
  AlertCircle,
  CheckCircle2,
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
import { TechnicalTrack, Participant } from "@/types";

interface EditTraineeModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
  tracks: TechnicalTrack[];
  currentTrackId?: string;
  isAr: boolean;
  onSave: (
    participantId: string,
    formData: {
      full_name: string;
      email: string;
      phone: string;
      university: string;
      faculty_department: string;
      academic_year: string;
      notes: string;
    },
    newTrackId: string,
    originalTrackId: string
  ) => Promise<void> | void;
}

export function EditTraineeModal({
  isOpen,
  onClose,
  participant,
  tracks,
  currentTrackId = "",
  isAr,
  onSave,
}: EditTraineeModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    university: "",
    faculty_department: "",
    academic_year: "",
    notes: "",
  });
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [originalTrackId, setOriginalTrackId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && participant) {
      setFormData({
        full_name: participant.full_name || "",
        email: participant.email || "",
        phone: participant.phone || "",
        university: participant.university || "",
        faculty_department: participant.faculty_department || "",
        academic_year: participant.academic_year || "",
        notes: participant.notes || "",
      });
      setSelectedTrackId(currentTrackId || "");
      setOriginalTrackId(currentTrackId || "");
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, participant, currentTrackId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = isAr ? "يرجى إدخال الاسم الرباعي" : "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = isAr ? "يرجى إدخال البريد الإلكتروني" : "Email is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant || !validate()) return;

    try {
      setIsSubmitting(true);
      await onSave(
        participant.id,
        {
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          university: formData.university.trim(),
          faculty_department: formData.faculty_department.trim(),
          academic_year: formData.academic_year.trim(),
          notes: formData.notes.trim(),
        },
        selectedTrackId,
        originalTrackId
      );
      onClose();
    } catch (err) {
      console.error("Failed to update trainee:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!participant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card text-card-foreground">
        {/* Pinned Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 p-6 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {isAr ? "تعديل بيانات المتدرب" : "Edit Trainee"}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {isAr
                  ? `تحديث معلومات المتدرب: ${participant.full_name}`
                  : `Update information for: ${participant.full_name}`}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form id="edit-trainee-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5 text-xs">
          {/* Section 1: Personal Info */}
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
                className={`h-10 text-xs rounded-xl bg-background ${
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
                  dir="ltr"
                  className={`h-10 text-xs rounded-xl bg-background font-mono text-start ${
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
              <span>{isAr ? "المسار التقني المسجل به" : "Track Assignment"}</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-muted-foreground" />
                {isAr ? "المسار الأكاديمي الحالي" : "Enrolled Academic Track"}
              </Label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full text-xs h-10 px-3 rounded-xl border border-border bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{isAr ? "— بدون مسار حالياً —" : "— Unassigned —"}</option>
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
                {isAr ? "ملاحظات إضافية" : "Notes"}
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
            form="edit-trainee-form"
            disabled={isSubmitting}
            size="sm"
            className="rounded-xl h-9 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? isAr
                  ? "جارِ الحفظ..."
                  : "Saving..."
                : isAr
                ? "حفظ التعديلات"
                : "Save Changes"}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
