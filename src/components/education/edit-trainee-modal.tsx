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
  Save,
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
import { Participant, TechnicalTrack } from "@/types";

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
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-2xl border-border bg-card shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center border border-[#1a73e8]/20">
              <Pencil className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-black text-foreground tracking-tight">
              {isAr ? "تعديل بيانات المتدرب" : "Edit Trainee"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isAr
              ? `تحديث معلومات المتدرب: ${participant.full_name}`
              : `Update information for: ${participant.full_name}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* Section 1: Personal Info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <User className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>{isAr ? "البيانات الأساسية" : "Personal Information"}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-foreground">
                {isAr ? "الاسم الرباعي" : "Full Name"} <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.full_name}
                onChange={(e) => {
                  setFormData({ ...formData, full_name: e.target.value });
                  if (errors.full_name) setErrors({ ...errors, full_name: "" });
                }}
                className={`h-9 text-xs rounded-xl bg-background focus:ring-2 focus:ring-[#1a73e8]/20 ${
                  errors.full_name ? "border-rose-500" : "border-border"
                }`}
              />
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
                  {isAr ? "البريد الإلكتروني" : "Email"} <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  dir="ltr"
                  className={`h-9 text-xs rounded-xl bg-background font-mono text-start ${
                    errors.email ? "border-rose-500" : "border-border"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  {isAr ? "رقم الهاتف" : "Phone"}
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  dir="ltr"
                  className="h-9 text-xs rounded-xl bg-background font-mono border-border text-start"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Info */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <School className="w-3.5 h-3.5 text-[#34a853]" />
              <span>{isAr ? "البيانات الأكاديمية" : "Academic Background"}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-foreground">
                {isAr ? "الجامعة" : "University"}
              </Label>
              <Input
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="h-9 text-xs rounded-xl bg-background border-border"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  {isAr ? "الكلية / القسم" : "Department"}
                </Label>
                <Input
                  value={formData.faculty_department}
                  onChange={(e) => setFormData({ ...formData, faculty_department: e.target.value })}
                  className="h-9 text-xs rounded-xl bg-background border-border"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-foreground">
                  {isAr ? "الفرقة الدراسية" : "Academic Year"}
                </Label>
                <Input
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="h-9 text-xs rounded-xl bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Track & Enrollment */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Layers className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>{isAr ? "المسار التقني والتنسيب" : "Track Assignment"}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-[#1a73e8] block">
                {isAr ? "المسار الأكاديمي الحالي" : "Assigned Track"}
              </Label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full text-xs h-9.5 px-3 rounded-xl border border-border bg-background font-bold focus:ring-2 focus:ring-[#1a73e8]/30 focus:outline-none"
              >
                <option value="">
                  {isAr ? "— بدون مسار (إلغاء التنسيب) —" : "— Unassigned (Remove from track) —"}
                </option>
                {tracks
                  .filter((t) => t.status !== "archived")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {isAr ? t.name_ar || t.name : t.name} • ({t.cohort})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-[11px] font-bold text-foreground">
                {isAr ? "ملاحظات" : "Notes"}
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? (isAr ? "جارِ الحفظ..." : "Saving...") : (isAr ? "حفظ التعديلات" : "Save Changes")}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
