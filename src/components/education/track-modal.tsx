"use client";

import React, { useState, useEffect } from "react";
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
import {
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  User,
  Users,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { tracksService } from "@/lib/tracks-service";
import { TechnicalTrack, TrackCategory } from "@/types";

interface TrackModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trackToEdit?: TechnicalTrack | null;
  onSuccess: () => void;
  logUserAction?: (action: any) => void;
  isAr: boolean;
}

export function TrackModal({
  isOpen,
  onOpenChange,
  trackToEdit,
  onSuccess,
  logUserAction,
  isAr,
}: TrackModalProps) {
  const isEditing = !!trackToEdit;

  const [formData, setFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
    category: "web" as TrackCategory,
    cohort: "Season 2026 - Cohort 1",
    start_date: "2026-03-01",
    end_date: "2026-06-30",
    lead_name: "Eng. Ahmed Tarek",
    max_capacity: 40,
    attendance_requirements: 75,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (trackToEdit) {
        setFormData({
          name: trackToEdit.name || "",
          name_ar: trackToEdit.name_ar || "",
          description: trackToEdit.description || "",
          category: trackToEdit.category || "web",
          cohort: trackToEdit.cohort || "Season 2026 - Cohort 1",
          start_date: trackToEdit.start_date || "2026-03-01",
          end_date: trackToEdit.end_date || "2026-06-30",
          lead_name: trackToEdit.lead_name || "",
          max_capacity: trackToEdit.max_capacity || 40,
          attendance_requirements: trackToEdit.attendance_requirements || 75,
        });
      } else {
        setFormData({
          name: "",
          name_ar: "",
          description: "",
          category: "web",
          cohort: "Season 2026 - Cohort 1",
          start_date: "2026-03-01",
          end_date: "2026-06-30",
          lead_name: "",
          max_capacity: 40,
          attendance_requirements: 75,
        });
      }
      setError(null);
    }
  }, [isOpen, trackToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ar.trim() || !formData.name.trim()) {
      setError(isAr ? "يرجى كتابة اسم المسار بالعربية والإنجليزية." : "Please enter track name in Arabic and English.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (isEditing && trackToEdit) {
      tracksService.updateTrack(trackToEdit.id, {
        name: formData.name.trim(),
        name_ar: formData.name_ar.trim(),
        description: formData.description.trim(),
        category: formData.category,
        cohort: formData.cohort.trim(),
        lead_name: formData.lead_name.trim(),
        max_capacity: Number(formData.max_capacity) || 40,
        attendance_requirements: Number(formData.attendance_requirements) || 75,
      });

      if (logUserAction) {
        logUserAction({
          action: "TRACK_UPDATED",
          entity_type: "technical_track",
          entity_id: trackToEdit.id,
          reason: `تحديث بيانات المسار التقني: "${formData.name_ar}"`,
          details: `Cohort: ${formData.cohort}, Lead: ${formData.lead_name}.`,
          after_value: { name: formData.name, cohort: formData.cohort },
        });
      }
    } else {
      tracksService.createTrack({
        name: formData.name.trim(),
        name_ar: formData.name_ar.trim(),
        description: formData.description.trim(),
        category: formData.category,
        cohort: formData.cohort.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        lead_name: formData.lead_name.trim(),
        max_capacity: Number(formData.max_capacity) || 40,
        attendance_requirements: Number(formData.attendance_requirements) || 75,
        attendance_weight: 40,
        assignment_weight: 30,
        participation_weight: 20,
        conduct_weight: 10,
        certificate_min_score: 75,
        status: "active",
        syllabus: ["Core fundamentals", "Intermediate frameworks", "Production capstone"],
      });

      if (logUserAction) {
        logUserAction({
          action: "TRACK_CREATED",
          entity_type: "technical_track",
          entity_id: `track_${Date.now()}`,
          reason: `إنشاء مسار تقني جديد: "${formData.name_ar} (${formData.name})"`,
          details: `Category: ${formData.category}, Cohort: ${formData.cohort}, Lead: ${formData.lead_name}.`,
          after_value: { name: formData.name, cohort: formData.cohort },
        });
      }
    }

    setIsSubmitting(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card text-card-foreground">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {isEditing
                  ? (isAr ? `تعديل المسار: ${trackToEdit?.name_ar || trackToEdit?.name}` : `Edit Track: ${trackToEdit?.name}`)
                  : (isAr ? "إنشاء مسار تقني جديد" : "Create Technical Track")}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {isAr
                  ? "تحديد معايير وتفاصيل المسار التدريبي والسعة القصوى والمدرب المسؤول."
                  : "Configure track parameters, instructor lead, and capacity."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "اسم المسار (بالعربية)" : "Track Name (Arabic)"}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder={isAr ? "مثال: تطوير الويب الحديث" : "Arabic title"}
                className="h-10 text-xs rounded-xl border-border bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                {isAr ? "اسم المسار (English)" : "Track Name (English)"}
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Modern Web Development"
                className="h-10 text-xs rounded-xl border-border bg-background"
                required
              />
            </div>
          </div>

          {/* Category & Cohort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "الفئة التقنية" : "Category"}
              </Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="web">Web Development (Fullstack)</option>
                <option value="mobile">Flutter / Mobile Applications</option>
                <option value="cybersecurity">Cybersecurity & Ethical Hacking</option>
                <option value="embedded">Embedded Systems & IoT</option>
                <option value="uiux">UI/UX Product Design</option>
                <option value="ai_ml">AI, ML & Data Science</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "الدفعة / الموسم" : "Cohort"}
              </Label>
              <Input
                value={formData.cohort}
                onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                className="h-10 text-xs rounded-xl border-border bg-background"
                placeholder="Season 2026 - Cohort 1"
              />
            </div>
          </div>

          {/* Lead & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "المدرب المسؤول" : "Lead Instructor"}
              </Label>
              <Input
                value={formData.lead_name}
                onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
                placeholder={isAr ? "م. أحمد طارق" : "Eng. Ahmed Tarek"}
                className="h-10 text-xs rounded-xl border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "السعة القصوى" : "Capacity"}
              </Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                className="h-10 text-xs rounded-xl border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {isAr ? "شرط الحضور (%)" : "Min Attendance (%)"}
              </Label>
              <Input
                type="number"
                min={50}
                max={100}
                value={formData.attendance_requirements}
                onChange={(e) => setFormData({ ...formData, attendance_requirements: Number(e.target.value) })}
                className="h-10 text-xs rounded-xl border-border bg-background"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              {isAr ? "وصف ومخرجات المسار" : "Description & Objectives"}
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={isAr ? "أهداف ومخرجات التدريب ومشاريع التخرج المستهدفة..." : "Track description and deliverables..."}
              className="text-xs h-20 rounded-xl resize-none border-border bg-background"
            />
          </div>

          {/* Footer */}
          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-9 px-4 text-xs"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl h-9 px-5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isEditing
                ? (isAr ? "حفظ التعديلات" : "Update Track")
                : (isAr ? "إنشاء المسار" : "Create Track")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
