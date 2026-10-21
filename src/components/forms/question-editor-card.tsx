"use client";

import React, { useState } from "react";
import {
  FormQuestion,
  QuestionType,
  QuestionOption,
  QuestionValidation,
  QuestionScoring,
  QuestionSettings,
} from "@/types/forms";
import {
  Type,
  AlignLeft,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Sliders,
  Star,
  Calendar,
  Clock,
  Hash,
  Mail,
  Phone,
  Link as LinkIcon,
  UploadCloud,
  Grid,
  ListOrdered,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  Settings,
  HelpCircle,
  Award,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionEditorCardProps {
  question: FormQuestion;
  index: number;
  totalQuestions: number;
  isQuiz: boolean;
  locale: "en" | "ar";
  onUpdate: (updates: Partial<FormQuestion>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenLogicModal: () => void;
}

const QUESTION_TYPES: Array<{
  type: QuestionType;
  label: string;
  label_ar: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "text" | "choice" | "rating" | "date" | "advanced";
}> = [
  { type: "short_text", label: "Short Answer", label_ar: "إجابة قصيرة", icon: Type, category: "text" },
  { type: "paragraph", label: "Paragraph", label_ar: "فقرة تفصيلية", icon: AlignLeft, category: "text" },
  { type: "multiple_choice", label: "Multiple Choice", label_ar: "خيارات متعددة", icon: CheckCircle2, category: "choice" },
  { type: "checkboxes", label: "Checkboxes", label_ar: "مربعات اختيار", icon: CheckSquare, category: "choice" },
  { type: "dropdown", label: "Dropdown Menu", label_ar: "قائمة منسدلة", icon: ChevronDown, category: "choice" },
  { type: "linear_scale", label: "Linear Scale", label_ar: "مقياس خطي تدريجي", icon: Sliders, category: "rating" },
  { type: "rating", label: "Star Rating", label_ar: "تقييم بالنجوم", icon: Star, category: "rating" },
  { type: "date", label: "Date Picker", label_ar: "تحديد تاريخ", icon: Calendar, category: "date" },
  { type: "time", label: "Time Picker", label_ar: "تحديد وقت", icon: Clock, category: "date" },
  { type: "number", label: "Number", label_ar: "رقم عددي", icon: Hash, category: "text" },
  { type: "email", label: "Email Address", label_ar: "بريد إلكتروني", icon: Mail, category: "text" },
  { type: "phone", label: "Phone Number", label_ar: "رقم هاتف", icon: Phone, category: "text" },
  { type: "url", label: "Website Link", label_ar: "رابط موقع", icon: LinkIcon, category: "text" },
  { type: "file_upload", label: "File Attachment", label_ar: "إرفاق ملف", icon: UploadCloud, category: "advanced" },
  { type: "matrix_radio", label: "Multiple Choice Grid", label_ar: "شبكة خيارات متعددة", icon: Grid, category: "advanced" },
  { type: "matrix_checkbox", label: "Checkbox Grid", label_ar: "شبكة مربعات اختيار", icon: Grid, category: "advanced" },
  { type: "ranking", label: "Item Ranking", label_ar: "ترتيب العناصر حسب الأولوية", icon: ListOrdered, category: "advanced" },
];

export function QuestionEditorCard({
  question,
  index,
  totalQuestions,
  isQuiz,
  locale,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpenLogicModal,
}: QuestionEditorCardProps) {
  const isAr = locale === "ar";
  const [showDescription, setShowDescription] = useState(
    Boolean(question.description || question.description_ar)
  );
  const [showValidationDrawer, setShowValidationDrawer] = useState(false);
  const [showScoringDrawer, setShowScoringDrawer] = useState(false);

  const currentTypeMeta =
    QUESTION_TYPES.find((t) => t.type === question.type) || QUESTION_TYPES[0];
  const Icon = currentTypeMeta.icon;

  // Options Helpers
  const addOption = () => {
    const existing = question.options || [];
    const newOpt: QuestionOption = {
      id: `opt_${Date.now()}_${existing.length + 1}`,
      label: `Option ${existing.length + 1}`,
      label_ar: `خيار ${existing.length + 1}`,
      value: `option_${existing.length + 1}`,
      points: 0,
      is_correct: false,
    };
    onUpdate({ options: [...existing, newOpt] });
  };

  const updateOption = (optId: string, updates: Partial<QuestionOption>) => {
    const existing = question.options || [];
    onUpdate({
      options: existing.map((o) => (o.id === optId ? { ...o, ...updates } : o)),
    });
  };

  const removeOption = (optId: string) => {
    const existing = question.options || [];
    onUpdate({
      options: existing.filter((o) => o.id !== optId),
    });
  };

  const hasOptions =
    question.type === "multiple_choice" ||
    question.type === "checkboxes" ||
    question.type === "dropdown";

  return (
    <div className="relative group bg-card border border-border hover:border-[#1a73e8]/50 dark:hover:border-[#8ab4f8]/50 rounded-2xl p-5 shadow-xs transition-all duration-200">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground font-mono text-xs font-bold">
            {index + 1}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
            <Icon className="w-3.5 h-3.5" />
            <span>{isAr ? currentTypeMeta.label_ar : currentTypeMeta.label}</span>
          </div>
          {isQuiz && (
            <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30 text-xs">
              <Award className="w-3 h-3 me-1" />
              {question.scoring?.points || 0} {isAr ? "نقاط" : "pts"}
            </Badge>
          )}
        </div>

        {/* Type Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={question.type}
            onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
            className="text-xs bg-muted/60 hover:bg-muted font-medium text-foreground px-3 py-1.5 rounded-lg border border-border/80 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {isAr ? t.label_ar : t.label}
              </option>
            ))}
          </select>

          {/* Reordering Buttons */}
          <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-lg border border-border/60">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveUp}
              title={isAr ? "تحريك لأعلى" : "Move up"}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-background transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={index === totalQuestions - 1}
              onClick={onMoveDown}
              title={isAr ? "تحريك لأسفل" : "Move down"}
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-background transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Question Title Fields (English & Arabic) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              {isAr ? "عنوان السؤال (إنجليزي)" : "Question Title (English)"}
            </label>
            <Input
              value={question.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="e.g. What is your primary specialization?"
              className="font-medium text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              {isAr ? "عنوان السؤال (عربي)" : "Question Title (Arabic)"}
            </label>
            <Input
              value={question.title_ar}
              onChange={(e) => onUpdate({ title_ar: e.target.value })}
              placeholder="مثال: ما هو تخصصك البرمجي الأساسي؟"
              className="font-medium text-sm font-sans"
              dir="rtl"
            />
          </div>
        </div>

        {/* Optional Description / Help Text */}
        {showDescription && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 animate-in fade-in">
            <Textarea
              value={question.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Help text or instructions (English)..."
              rows={2}
              className="text-xs"
              dir="ltr"
            />
            <Textarea
              value={question.description_ar || ""}
              onChange={(e) => onUpdate({ description_ar: e.target.value })}
              placeholder="تعليمات أو توضيح إضافي (بالعربية)..."
              rows={2}
              className="text-xs font-sans"
              dir="rtl"
            />
          </div>
        )}
      </div>

      {/* Options Editor (Multiple Choice / Checkboxes / Dropdown) */}
      {hasOptions && (
        <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-foreground">
              {isAr ? "خيارات الإجابة" : "Answer Choices"}
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(question.settings?.allow_other)}
                  onChange={(e) =>
                    onUpdate({
                      settings: { ...question.settings, allow_other: e.target.checked },
                    })
                  }
                  className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <span>{isAr ? 'إضافة خيار "أخرى"' : 'Add "Other" Option'}</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            {(question.options || []).map((opt, optIndex) => (
              <div key={opt.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4 text-center">
                  {optIndex + 1}.
                </span>
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                  placeholder={`Option ${optIndex + 1} (English)`}
                  className="h-8 text-xs flex-1"
                  dir="ltr"
                />
                <Input
                  value={opt.label_ar || ""}
                  onChange={(e) => updateOption(opt.id, { label_ar: e.target.value })}
                  placeholder={`خيار ${optIndex + 1} (عربي)`}
                  className="h-8 text-xs flex-1"
                  dir="rtl"
                />

                {isQuiz && (
                  <label
                    title={isAr ? "تعيين كإجابة صحيحة" : "Mark as correct answer"}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold cursor-pointer border transition-colors",
                      opt.is_correct
                        ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/50"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    <input
                      type={question.type === "checkboxes" ? "checkbox" : "radio"}
                      name={`correct_${question.id}`}
                      checked={Boolean(opt.is_correct)}
                      onChange={(e) => {
                        if (question.type === "checkboxes") {
                          updateOption(opt.id, { is_correct: e.target.checked });
                        } else {
                          // Uncheck others for radio
                          const opts = (question.options || []).map((o) => ({
                            ...o,
                            is_correct: o.id === opt.id,
                          }));
                          onUpdate({ options: opts });
                        }
                      }}
                      className="sr-only"
                    />
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{opt.is_correct ? (isAr ? "صحيحة" : "Correct") : (isAr ? "خاطئة" : "Wrong")}</span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addOption}
            className="text-xs text-primary hover:text-primary/90 mt-1 h-8"
          >
            <Plus className="w-3.5 h-3.5 me-1" />
            {isAr ? "إضافة خيار جديد" : "Add Option"}
          </Button>
        </div>
      )}

      {/* Linear Scale & Star Rating Settings */}
      {question.type === "linear_scale" && (
        <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
              {isAr ? "من" : "Min Scale"}
            </label>
            <Input
              type="number"
              value={question.settings?.scale_min ?? 1}
              onChange={(e) =>
                onUpdate({
                  settings: { ...question.settings, scale_min: parseInt(e.target.value, 10) },
                })
              }
              className="h-8"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
              {isAr ? "إلى" : "Max Scale"}
            </label>
            <Input
              type="number"
              value={question.settings?.scale_max ?? 5}
              onChange={(e) =>
                onUpdate({
                  settings: { ...question.settings, scale_max: parseInt(e.target.value, 10) },
                })
              }
              className="h-8"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
              {isAr ? "وصف الحد الأدنى" : "Min Label"}
            </label>
            <Input
              value={question.settings?.scale_min_label || ""}
              onChange={(e) =>
                onUpdate({
                  settings: { ...question.settings, scale_min_label: e.target.value },
                })
              }
              placeholder="e.g. Poor / ضعيف"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
              {isAr ? "وصف الحد الأقصى" : "Max Label"}
            </label>
            <Input
              value={question.settings?.scale_max_label || ""}
              onChange={(e) =>
                onUpdate({
                  settings: { ...question.settings, scale_max_label: e.target.value },
                })
              }
              placeholder="e.g. Excellent / ممتاز"
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {/* File Upload Settings */}
      {question.type === "file_upload" && (
        <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
              {isAr ? "الصيغ المسموح بها (مفصولة بفاصلة)" : "Allowed Extensions (comma separated)"}
            </label>
            <Input
              value={(question.validation?.allowed_file_types || []).join(", ")}
              onChange={(e) =>
                onUpdate({
                  validation: {
                    ...question.validation,
                    allowed_file_types: e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
                  },
                })
              }
              placeholder="pdf, png, jpg, docx, zip"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1">
              {isAr ? "الحد الأقصى للحجم (ميجابايت)" : "Max File Size (MB)"}
            </label>
            <Input
              type="number"
              value={question.validation?.max_file_size_mb ?? 10}
              onChange={(e) =>
                onUpdate({
                  validation: {
                    ...question.validation,
                    max_file_size_mb: parseInt(e.target.value, 10),
                  },
                })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border/60">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={question.is_required}
              onCheckedChange={(checked) => onUpdate({ is_required: checked })}
            />
            <span className="text-xs font-semibold text-foreground">
              {isAr ? "إلزامي" : "Required"}
            </span>
          </label>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDescription(!showDescription)}
            className="text-xs text-muted-foreground h-7 px-2"
          >
            <HelpCircle className="w-3.5 h-3.5 me-1" />
            {isAr ? "تعليمات إضافية" : "Description"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenLogicModal}
            className="text-xs text-[#1a73e8] dark:text-[#8ab4f8] hover:bg-primary/10 h-7 px-2"
          >
            <Sparkles className="w-3.5 h-3.5 me-1" />
            {isAr ? "قواعد المنطق والشرط" : "Logic Rules"}
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {isQuiz && (
            <div className="flex items-center gap-1.5 me-2 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {isAr ? "الدرجة:" : "Points:"}
              </span>
              <input
                type="number"
                min="0"
                value={question.scoring?.points ?? 0}
                onChange={(e) =>
                  onUpdate({
                    scoring: {
                      ...question.scoring,
                      points: Math.max(0, parseInt(e.target.value, 10) || 0),
                    },
                  })
                }
                className="w-12 h-6 text-xs text-center font-bold bg-background rounded border border-border"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onDuplicate}
            title={isAr ? "تكرار السؤال" : "Duplicate Question"}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title={isAr ? "حذف السؤال" : "Delete Question"}
            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
