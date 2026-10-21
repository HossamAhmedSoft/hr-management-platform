"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Form,
  FormSection,
  FormQuestion,
  FormLogicRule,
  FormThemeConfig,
  FormSettings,
  QuizSettings,
  FormEntityLink,
  FormAutomation,
  FormWebhook,
} from "@/types/forms";
import { useApp } from "@/lib/app-context";
import { dbService } from "@/lib/db-service";
import { internalDB } from "@/lib/internal-db";
import { QuestionEditorCard } from "@/components/forms/question-editor-card";
import { LogicRulesModal } from "@/components/forms/logic-rules-modal";
import { ShareFormModal } from "@/components/forms/share-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Save,
  Share2,
  Eye,
  Settings,
  Layers,
  Award,
  Sparkles,
  Link2,
  Webhook,
  Zap,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Undo2,
  Redo2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { generateId, cn } from "@/lib/utils";

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, currentUser } = useApp();
  const isAr = locale === "ar";
  const formId = (params?.id as string) || "";

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // History for Undo / Redo
  const [history, setHistory] = useState<Form[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Active Builder Tab
  const [activeTab, setActiveTab] = useState<"questions" | "settings" | "integrations">("questions");

  // Active Section for multi-page forms
  const [activeSectionId, setActiveSectionId] = useState<string>("");

  // Modals
  const [isLogicModalOpen, setIsLogicModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Integrations State
  const [entityLinks, setEntityLinks] = useState<FormEntityLink[]>([]);
  const [automations, setAutomations] = useState<FormAutomation[]>([]);
  const [webhooks, setWebhooks] = useState<FormWebhook[]>([]);

  // Fetch form data on mount (instant local-first render)
  useEffect(() => {
    async function loadForm() {
      if (!formId) return;
      try {
        // Fast local check first (0ms instantaneous display)
        const local = internalDB.getFormById(formId);
        if (local) {
          setForm(local);
          setHistory([local]);
          setHistoryIndex(0);
          if (local.sections && local.sections.length > 0) {
            setActiveSectionId(local.sections[0].id);
          }
          setEntityLinks(internalDB.getFormEntityLinks(local.id));
          setAutomations(internalDB.getFormAutomations(local.id));
          setWebhooks(internalDB.getFormWebhooks(local.id));
          setLoading(false);
        }

        const found = await dbService.getFormById(formId);
        if (found && (!local || found.updated_at !== local.updated_at)) {
          setForm(found);
          setHistory([found]);
          setHistoryIndex(0);
          if (found.sections && found.sections.length > 0) {
            setActiveSectionId(found.sections[0].id);
          }
          setEntityLinks(internalDB.getFormEntityLinks(found.id));
          setAutomations(internalDB.getFormAutomations(found.id));
          setWebhooks(internalDB.getFormWebhooks(found.id));
        }
      } catch (e) {
        console.error("Failed to load form in builder:", e);
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [formId]);

  // Debounced Autosave & History
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const pushToHistoryAndSave = (updatedForm: Form, isImmediateHistory = false) => {
    setForm(updatedForm);
    setSaveStatus("saving");

    if (isImmediateHistory) {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(updatedForm);
        if (next.length > 30) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
    } else {
      // Debounce history snapshot during typing so input remains smooth 60fps
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => {
        setHistory((prev) => {
          const next = prev.slice(0, historyIndex + 1);
          next.push(updatedForm);
          if (next.length > 30) next.shift();
          return next;
        });
        setHistoryIndex((prev) => Math.min(prev + 1, 29));
      }, 800);
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await dbService.updateForm(updatedForm.id, updatedForm);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 1200);
  };

  // Undo / Redo Handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setForm(prev);
      dbService.updateForm(prev.id, prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setForm(next);
      dbService.updateForm(next.id, next);
    }
  };

  // Section Handlers
  const addSection = () => {
    if (!form) return;
    const newSecId = `sec_${Date.now()}`;
    const nextIdx = (form.sections || []).length;
    const newSection: FormSection = {
      id: newSecId,
      form_id: form.id,
      title: `Section ${nextIdx + 1}`,
      title_ar: `القسم ${nextIdx + 1}`,
      description: "",
      description_ar: "",
      order_index: nextIdx,
    };
    const updated = {
      ...form,
      sections: [...(form.sections || []), newSection],
    };
    setActiveSectionId(newSecId);
    pushToHistoryAndSave(updated, true);
  };

  const updateSection = (secId: string, updates: Partial<FormSection>) => {
    if (!form) return;
    const updated = {
      ...form,
      sections: (form.sections || []).map((s) => (s.id === secId ? { ...s, ...updates } : s)),
    };
    pushToHistoryAndSave(updated, false);
  };

  const removeSection = (secId: string) => {
    if (!form || (form.sections || []).length <= 1) return;
    const remainingSections = (form.sections || []).filter((s) => s.id !== secId);
    const updated = {
      ...form,
      sections: remainingSections,
      // Reassign questions to first section
      questions: (form.questions || []).map((q) =>
        q.section_id === secId ? { ...q, section_id: remainingSections[0].id } : q
      ),
    };
    setActiveSectionId(remainingSections[0].id);
    pushToHistoryAndSave(updated, true);
  };

  // Question Handlers
  const addQuestion = (type: FormQuestion["type"] = "multiple_choice") => {
    if (!form) return;
    const targetSectionId = activeSectionId || form.sections?.[0]?.id || "sec_default";
    const newQId = `q_${Date.now()}`;
    const existingQ = form.questions || [];
    const newQ: FormQuestion = {
      id: newQId,
      form_id: form.id,
      section_id: targetSectionId,
      type,
      title: "Untitled Question",
      title_ar: "سؤال جديد بدون عنوان",
      is_required: false,
      order_index: existingQ.length,
      options:
        type === "multiple_choice" || type === "checkboxes" || type === "dropdown"
          ? [
              { id: `opt_1`, label: "Option 1", label_ar: "خيار 1", value: "opt_1" },
              { id: `opt_2`, label: "Option 2", label_ar: "خيار 2", value: "opt_2" },
            ]
          : undefined,
      scoring: form.quiz_settings?.is_quiz ? { points: 10 } : undefined,
    };
    const updated = {
      ...form,
      questions: [...existingQ, newQ],
    };
    pushToHistoryAndSave(updated, true);
  };

  const updateQuestion = (qId: string, updates: Partial<FormQuestion>) => {
    if (!form) return;
    const updated = {
      ...form,
      questions: (form.questions || []).map((q) => (q.id === qId ? { ...q, ...updates } : q)),
    };
    pushToHistoryAndSave(updated, false);
  };

  const duplicateQuestion = (qId: string) => {
    if (!form) return;
    const targetQ = (form.questions || []).find((q) => q.id === qId);
    if (!targetQ) return;
    const newQ: FormQuestion = {
      ...targetQ,
      id: `q_${Date.now()}`,
      title: `${targetQ.title} (Copy)`,
      title_ar: `${targetQ.title_ar} (نسخة)`,
      order_index: (form.questions || []).length,
    };
    const updated = {
      ...form,
      questions: [...(form.questions || []), newQ],
    };
    pushToHistoryAndSave(updated, true);
  };

  const removeQuestion = (qId: string) => {
    if (!form) return;
    const updated = {
      ...form,
      questions: (form.questions || []).filter((q) => q.id !== qId),
    };
    pushToHistoryAndSave(updated, true);
  };

  const moveQuestion = (qId: string, direction: "up" | "down") => {
    if (!form) return;
    const questions = [...(form.questions || [])];
    const index = questions.findIndex((q) => q.id === qId);
    if (index < 0) return;
    if (direction === "up" && index > 0) {
      const temp = questions[index];
      questions[index] = questions[index - 1];
      questions[index - 1] = temp;
    } else if (direction === "down" && index < questions.length - 1) {
      const temp = questions[index];
      questions[index] = questions[index + 1];
      questions[index + 1] = temp;
    }
    const reordered = questions.map((q, idx) => ({ ...q, order_index: idx }));
    pushToHistoryAndSave({ ...form, questions: reordered }, true);
  };

  // Publish Form Handler
  const [publishing, setPublishing] = useState(false);
  const handlePublish = async () => {
    if (!form) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.data?.form) {
        setForm(data.data.form);
        setIsShareModalOpen(true);
      }
    } catch (e) {
      console.error("Publish error:", e);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">
          {isAr ? "جاري تحميل محرر النماذج..." : "Loading Form Builder..."}
        </span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">
          {isAr ? "النموذج غير موجود أو تم حذفه" : "Form Not Found"}
        </h2>
        <Link href={`/${locale}/forms`}>
          <Button variant="outline" size="sm">
            {isAr ? "العودة لقائمة النماذج" : "Back to Forms"}
          </Button>
        </Link>
      </div>
    );
  }

  const activeSection = (form.sections || []).find((s) => s.id === activeSectionId) || form.sections?.[0];
  const sectionQuestions = (form.questions || []).filter(
    (q) => !activeSection || q.section_id === activeSection.id
  );

  return (
    <div className="space-y-5 -mx-3.5 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
      {/* Top Google-Accent Strip */}
      <div className="google-accent-strip w-full" />

      {/* Builder Header & Navigation Bar */}
      <div className="px-4 sm:px-8 pt-2 pb-4 bg-card border-b border-border shadow-xs sticky top-0 z-30 backdrop-blur-md bg-card/95">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/${locale}/forms`}>
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 rounded-xl">
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </Link>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => pushToHistoryAndSave({ ...form, title: e.target.value })}
                  placeholder="Form Title..."
                  className="text-base font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-1 py-0.5 max-w-[280px] sm:max-w-md truncate"
                />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-bold shrink-0",
                    form.status === "published"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                  )}
                >
                  {form.status}
                </Badge>
              </div>

              {/* Autosave Status Indicator */}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground px-1">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 text-primary animate-pulse">
                    <Save className="w-3 h-3" />
                    {isAr ? "جاري الحفظ التلقائي..." : "Saving changes..."}
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {isAr ? "تم حفظ كافة التعديلات" : "All changes saved"}
                  </span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="text-amber-500">
                    {isAr ? "تعديلات غير محفوظة" : "Unsaved changes"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Tabs: Questions, Settings, Integrations */}
          <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "questions"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAr ? "الأسئلة والأقسام" : "Questions"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "settings"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isAr ? "إعدادات النموذج" : "Settings"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("integrations")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "integrations"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isAr ? "الربط والأتمتة" : "Integrations"}</span>
            </button>
          </div>

          {/* Right: Actions (Undo/Redo, Preview, Share, Publish) */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 me-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={historyIndex <= 0}
                onClick={handleUndo}
                title={isAr ? "تراجع" : "Undo"}
                className="h-8 w-8"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={historyIndex >= history.length - 1}
                onClick={handleRedo}
                title={isAr ? "إعادة" : "Redo"}
                className="h-8 w-8"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              className="text-xs gap-1.5 h-9 rounded-xl"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "معاينة حية" : "Live Preview"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareModalOpen(true)}
              className="text-xs gap-1.5 h-9 rounded-xl"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "مشاركة" : "Share"}</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishing}
              className="text-xs font-bold gap-1.5 h-9 rounded-xl bg-primary text-white hover:bg-primary/90"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{publishing ? (isAr ? "جاري النشر..." : "Publishing...") : (isAr ? "نشر كإصدار جديد" : "Publish Version")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Builder Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        {/* ======================================================== */}
        {/* TAB 1: QUESTIONS & SECTIONS BUILDER                      */}
        {/* ======================================================== */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            {/* Form Cover & Header Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: form.theme_config.primaryColor }}
              />

              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      {isAr ? "عنوان النموذج (English)" : "Form Title (English)"}
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) => pushToHistoryAndSave({ ...form, title: e.target.value })}
                      placeholder="e.g. Workshop Registration"
                      className="text-lg font-bold"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                      {isAr ? "عنوان النموذج (العربية)" : "Form Title (Arabic)"}
                    </label>
                    <Input
                      value={form.title_ar}
                      onChange={(e) => pushToHistoryAndSave({ ...form, title_ar: e.target.value })}
                      placeholder="مثال: استمارة التسجيل في ورشة العمل"
                      className="text-lg font-bold font-sans"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      {isAr ? "وصف النموذج (English)" : "Description / Instructions (English)"}
                    </label>
                    <Textarea
                      value={form.description || ""}
                      onChange={(e) => pushToHistoryAndSave({ ...form, description: e.target.value })}
                      placeholder="Provide helpful context to your respondents..."
                      rows={2}
                      className="text-xs"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      {isAr ? "وصف النموذج (العربية)" : "Description / Instructions (Arabic)"}
                    </label>
                    <Textarea
                      value={form.description_ar || ""}
                      onChange={(e) => pushToHistoryAndSave({ ...form, description_ar: e.target.value })}
                      placeholder="توضيح تفاصيل وشروط التقديم للمشاركين..."
                      rows={2}
                      className="text-xs font-sans"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sections Tab Bar (Multi-page forms) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-2xl border border-border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-foreground me-1">
                  {isAr ? "أقسام النموذج:" : "Form Sections:"}
                </span>
                {(form.sections || []).map((sec, secIdx) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSectionId(sec.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                      activeSectionId === sec.id
                        ? "bg-primary text-white shadow-xs"
                        : "bg-background text-foreground hover:bg-muted border border-border/80"
                    )}
                  >
                    <span>Section {secIdx + 1}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                  className="text-xs h-8 rounded-xl gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إضافة قسم / صفحة جديدة" : "Add Section"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLogicModalOpen(true)}
                  className="text-xs h-8 rounded-xl gap-1 text-[#1a73e8] dark:text-[#8ab4f8]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? "قواعد المنطق والتفرع" : "Logic Rules"}</span>
                </Button>
              </div>
            </div>

            {/* Current Active Section Details */}
            {activeSection && (
              <div className="bg-card/70 border border-border/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">
                      {isAr ? `تعديل القسم:` : `Active Section Details:`}
                    </span>
                    <Input
                      value={activeSection.title}
                      onChange={(e) => updateSection(activeSection.id, { title: e.target.value })}
                      className="h-8 text-xs font-semibold w-48"
                      placeholder="Section Title (EN)"
                    />
                    <Input
                      value={activeSection.title_ar}
                      onChange={(e) => updateSection(activeSection.id, { title_ar: e.target.value })}
                      className="h-8 text-xs font-semibold w-48 font-sans"
                      placeholder="عنوان القسم (عربي)"
                      dir="rtl"
                    />
                  </div>

                  {(form.sections || []).length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(activeSection.id)}
                      className="text-xs text-destructive hover:bg-destructive/10 h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5 me-1" />
                      {isAr ? "حذف القسم" : "Delete Section"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {sectionQuestions.map((q, idx) => (
                <QuestionEditorCard
                  key={q.id}
                  question={q}
                  index={idx}
                  totalQuestions={sectionQuestions.length}
                  isQuiz={Boolean(form.quiz_settings?.is_quiz)}
                  locale={locale}
                  onUpdate={(updates) => updateQuestion(q.id, updates)}
                  onDuplicate={() => duplicateQuestion(q.id)}
                  onDelete={() => removeQuestion(q.id)}
                  onMoveUp={() => moveQuestion(q.id, "up")}
                  onMoveDown={() => moveQuestion(q.id, "down")}
                  onOpenLogicModal={() => setIsLogicModalOpen(true)}
                />
              ))}

              {sectionQuestions.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl">
                  <Plus className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                  <p className="text-xs font-bold text-foreground">
                    {isAr ? "لا توجد أسئلة في هذا القسم بعد" : "No questions in this section yet"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {isAr
                      ? "اضغط على إضافة سؤال لبدء بناء الاستمارة الخاصة بك."
                      : "Click Add Question below to start building your form."}
                  </p>
                </div>
              )}

              {/* Add Question Button Bar */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => addQuestion("multiple_choice")}
                  className="text-xs rounded-xl gap-1.5 h-10 px-5 shadow-sm bg-primary text-white hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? "إضافة سؤال خيارات متعددة" : "Add Multiple Choice Question"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addQuestion("short_text")}
                  className="text-xs rounded-xl gap-1.5 h-10 px-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? "إضافة سؤال نصي قصير" : "Add Text Question"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addQuestion("file_upload")}
                  className="text-xs rounded-xl gap-1.5 h-10 px-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? "إضافة حقل رفع ملف" : "Add File Upload"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: FORM SETTINGS & QUIZ MODE                         */}
        {/* ======================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* General Access & Constraints */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <span>{isAr ? "إعدادات الوصول والتحكم في الاستجابات" : "Access & Response Settings"}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {isAr ? "وضع الوصول والصلاحية" : "Access Mode"}
                  </label>
                  <select
                    value={form.access_mode}
                    onChange={(e) =>
                      pushToHistoryAndSave({
                        ...form,
                        access_mode: e.target.value as Form["access_mode"],
                      })
                    }
                    className="w-full text-xs bg-muted/50 p-2.5 rounded-xl border border-border text-foreground font-medium"
                  >
                    <option value="public">{isAr ? "رابط عام (متاح للجميع دون تسجيل)" : "Public Link (Open to anyone)"}</option>
                    <option value="authenticated">{isAr ? "يتطلب تسجيل الدخول بحساب المنظومة" : "Authenticated Users Only"}</option>
                    <option value="roles">{isAr ? "أدوار محددة فقط (مثل: مسؤولي اللجان، الأعضاء)" : "Specific Roles Only"}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {isAr ? "الحد الأقصى لعدد الردود (اختياري)" : "Response Cap (Optional)"}
                  </label>
                  <Input
                    type="number"
                    value={form.settings?.response_cap || ""}
                    onChange={(e) =>
                      pushToHistoryAndSave({
                        ...form,
                        settings: {
                          ...form.settings,
                          response_cap: e.target.value ? parseInt(e.target.value, 10) : null,
                        },
                      })
                    }
                    placeholder="e.g. 100"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {isAr ? "تقييد بتقديم رد واحد لكل مستخدم" : "Limit to 1 Response per User"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {isAr ? "منع تكرار الإرسال من نفس البريد الإلكتروني" : "Prevents multiple submissions from the same respondent email"}
                    </span>
                  </div>
                  <Switch
                    checked={form.settings?.limit_one_response}
                    onCheckedChange={(checked) =>
                      pushToHistoryAndSave({
                        ...form,
                        settings: { ...form.settings, limit_one_response: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {isAr ? "السماح بتعديل الإجابة بعد الإرسال" : "Allow Editing Response After Submit"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {isAr ? "تمكين المشارك من مراجعة وتحديث ردوده" : "Enables respondents to update their answers later"}
                    </span>
                  </div>
                  <Switch
                    checked={form.settings?.allow_edit}
                    onCheckedChange={(checked) =>
                      pushToHistoryAndSave({
                        ...form,
                        settings: { ...form.settings, allow_edit: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      {isAr ? "إظهار شريط التقدم بين الصفحات" : "Show Progress Bar"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {isAr ? "عرض نسبة الإنجاز أثناء تنقل المشارك بين الأقسام" : "Displays completion percentage across form sections"}
                    </span>
                  </div>
                  <Switch
                    checked={form.settings?.show_progress_bar}
                    onCheckedChange={(checked) =>
                      pushToHistoryAndSave({
                        ...form,
                        settings: { ...form.settings, show_progress_bar: checked },
                      })
                    }
                  />
                </div>
              </div>

              {/* Confirmation Messages */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      {isAr ? "رسالة التأكيد بعد الإرسال (English)" : "Confirmation Message (English)"}
                    </label>
                    <Input
                      value={form.settings?.confirmation_message || ""}
                      onChange={(e) =>
                        pushToHistoryAndSave({
                          ...form,
                          settings: { ...form.settings, confirmation_message: e.target.value },
                        })
                      }
                      className="text-xs"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      {isAr ? "رسالة التأكيد بعد الإرسال (العربية)" : "Confirmation Message (Arabic)"}
                    </label>
                    <Input
                      value={form.settings?.confirmation_message_ar || ""}
                      onChange={(e) =>
                        pushToHistoryAndSave({
                          ...form,
                          settings: { ...form.settings, confirmation_message_ar: e.target.value },
                        })
                      }
                      className="text-xs font-sans"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Mode Configuration */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isAr ? "وضع الاختبار والتصحيح التلقائي (Quiz Mode)" : "Make this a Quiz (Auto-Grading)"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? "تعيين درجات وإجابات صحيحة واحتساب النتيجة فوراً للمشارك" : "Assign point values, define answer keys, and calculate immediate grades"}
                    </p>
                  </div>
                </div>

                <Switch
                  checked={form.quiz_settings?.is_quiz}
                  onCheckedChange={(checked) =>
                    pushToHistoryAndSave({
                      ...form,
                      quiz_settings: { ...form.quiz_settings, is_quiz: checked },
                    })
                  }
                />
              </div>

              {form.quiz_settings?.is_quiz && (
                <div className="space-y-4 pt-3 border-t border-border/60 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                      <span className="text-xs font-semibold text-foreground">
                        {isAr ? "عرض النتيجة للمشارك فور الإرسال" : "Show Score Immediately After Submit"}
                      </span>
                      <Switch
                        checked={form.quiz_settings?.show_score_immediate}
                        onCheckedChange={(checked) =>
                          pushToHistoryAndSave({
                            ...form,
                            quiz_settings: {
                              ...form.quiz_settings,
                              show_score_immediate: checked,
                            },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                      <span className="text-xs font-semibold text-foreground">
                        {isAr ? "عرض الإجابات الصحيحة والتوضيح" : "Show Correct Answers & Feedback"}
                      </span>
                      <Switch
                        checked={form.quiz_settings?.show_correct_answers}
                        onCheckedChange={(checked) =>
                          pushToHistoryAndSave({
                            ...form,
                            quiz_settings: {
                              ...form.quiz_settings,
                              show_correct_answers: checked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      {isAr ? "نسبة النجاح المطلوبة (%)" : "Passing Score Percentage (%)"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.quiz_settings?.passing_score_percentage ?? 70}
                      onChange={(e) =>
                        pushToHistoryAndSave({
                          ...form,
                          quiz_settings: {
                            ...form.quiz_settings,
                            passing_score_percentage: parseInt(e.target.value, 10) || 70,
                          },
                        })
                      }
                      className="w-36 text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Theme & Brand Colors */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-foreground">
                {isAr ? "تخصيص الهوية والألوان" : "Theme & Brand Identity"}
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { name: "Google Blue", hex: "#1a73e8" },
                  { name: "Google Green", hex: "#34a853" },
                  { name: "Google Red", hex: "#ea4335" },
                  { name: "Google Yellow", hex: "#fbbc04" },
                  { name: "Purple", hex: "#9334e8" },
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() =>
                      pushToHistoryAndSave({
                        ...form,
                        theme_config: { ...form.theme_config, primaryColor: color.hex },
                      })
                    }
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform cursor-pointer",
                      form.theme_config.primaryColor === color.hex
                        ? "scale-110 border-foreground shadow-md ring-2 ring-primary/30"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DEEP SYSTEM INTEGRATIONS & AUTOMATIONS            */}
        {/* ======================================================== */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            {/* Entity Linking */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isAr ? "ربط النموذج بالكيانات (Entity Linking)" : "Attach to System Entities"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? "ربط هذا النموذج بمهمة، مسار أكاديمي، أو عضو وإظهاره كتاب تفاعلي" : "Link this form to Tasks, Members, Teams, or Tracks and view responses on their pages"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newLink = internalDB.createFormEntityLink({
                      form_id: form.id,
                      entity_type: "task",
                      link_mode: "tab",
                      field_mappings: {},
                    });
                    setEntityLinks([...entityLinks, newLink]);
                  }}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إضافة ربط كيان" : "Link Entity"}</span>
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                {entityLinks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {isAr ? "لم يتم ربط هذا النموذج بكيان بعد." : "No entity links configured yet."}
                  </p>
                ) : (
                  entityLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="uppercase font-mono text-[10px]">
                          {link.entity_type}
                        </Badge>
                        <span className="font-semibold text-foreground">
                          Mode: {link.link_mode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          internalDB.deleteFormEntityLink(link.id);
                          setEntityLinks(entityLinks.filter((l) => l.id !== link.id));
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Automations */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isAr ? "أتمتة سير العمل (Automated Workflows)" : "Workflow Automations"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? "تنفيذ إجراءات فورية: إنشاء مهام، منح نقاط، تسجيل مخالفات، أو إرسال إشعارات" : "Execute real actions: create tasks, award points, or send notifications upon submission"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newAuto = internalDB.createFormAutomation({
                      form_id: form.id,
                      name: "New Automation Action",
                      trigger_event: "response_submitted",
                      trigger_config: {},
                      action_type: "send_notification",
                      action_config: {
                        notification_title: `New submission: ${form.title}`,
                        notification_message: "A new form response was recorded.",
                        notification_recipient_role: "form_creator",
                      },
                      enabled: true,
                    });
                    setAutomations([...automations, newAuto]);
                  }}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إضافة أتمتة جديدة" : "Add Automation"}</span>
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                {automations.map((auto) => (
                  <div key={auto.id} className="p-4 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{auto.name}</span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={auto.enabled}
                          onCheckedChange={(checked) => {
                            internalDB.updateFormAutomation(auto.id, { enabled: checked });
                            setAutomations(
                              automations.map((a) => (a.id === auto.id ? { ...a, enabled: checked } : a))
                            );
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            internalDB.deleteFormAutomation(auto.id);
                            setAutomations(automations.filter((a) => a.id !== auto.id));
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono bg-background px-2 py-0.5 rounded border border-border">
                        WHEN: {auto.trigger_event}
                      </span>
                      <span>&rarr;</span>
                      <span className="font-mono bg-background px-2 py-0.5 rounded border border-border text-primary font-bold">
                        ACTION: {auto.action_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhooks */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                    <Webhook className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isAr ? "الويبهوك الخارجي المشفر (HMAC Webhooks)" : "Signed Outgoing Webhooks"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isAr ? "إرسال البيانات فوراً لأنظمتك الخارجية موقّعة بتوقيع HMAC-SHA256" : "Dispatch real-time JSON payloads signed with HMAC-SHA256 headers"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newWh = internalDB.createFormWebhook({
                      form_id: form.id,
                      url: "https://api.yourdomain.com/webhooks/forms",
                      secret_key: `sec_${Date.now().toString(36)}`,
                      events: ["response.submitted"],
                      is_active: true,
                    });
                    setWebhooks([...webhooks, newWh]);
                  }}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إضافة Webhook" : "Add Webhook"}</span>
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                {webhooks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {isAr ? "لا توجد روابط Webhook مجهزة." : "No webhooks configured."}
                  </p>
                ) : (
                  webhooks.map((wh) => (
                    <div key={wh.id} className="p-3 rounded-xl bg-muted/30 border border-border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-foreground font-semibold truncate max-w-sm">
                          {wh.url}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            internalDB.deleteFormWebhook(wh.id);
                            setWebhooks(webhooks.filter((w) => w.id !== wh.id));
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Secret Key: {wh.secret_key}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logic Rules Modal */}
      {isLogicModalOpen && (
        <LogicRulesModal
          isOpen={isLogicModalOpen}
          onClose={() => setIsLogicModalOpen(false)}
          formId={form.id}
          sections={form.sections || []}
          questions={form.questions || []}
          logicRules={form.logic_rules || []}
          onSaveRules={(updatedRules) => pushToHistoryAndSave({ ...form, logic_rules: updatedRules })}
          locale={locale}
        />
      )}

      {/* Share Form Modal */}
      {isShareModalOpen && (
        <ShareFormModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          formId={form.id}
          slug={form.slug}
          title={isAr ? form.title_ar || form.title : form.title}
          locale={locale}
        />
      )}

      {/* Interactive Live Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {isAr ? "معاينة الاستمارة التفاعلية" : "Live Form Preview"}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {previewDevice}
                </Badge>
              </div>

              {/* Device Selector */}
              <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={cn(
                    "p-1.5 rounded transition-colors cursor-pointer",
                    previewDevice === "desktop" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"
                  )}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={cn(
                    "p-1.5 rounded transition-colors cursor-pointer",
                    previewDevice === "tablet" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"
                  )}
                  title="Tablet View"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={cn(
                    "p-1.5 rounded transition-colors cursor-pointer",
                    previewDevice === "mobile" ? "bg-background shadow-xs text-primary" : "text-muted-foreground"
                  )}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/${locale}/forms/p/${form.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? "فتح في تبويب مستقل" : "Open in new tab"}</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-xs h-7"
                >
                  {isAr ? "إغلاق" : "Close"}
                </Button>
              </div>
            </div>

            {/* iFrame Container simulating device */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/20 flex justify-center items-start">
              <div
                className={cn(
                  "w-full transition-all duration-300 bg-background rounded-2xl shadow-lg border border-border overflow-hidden h-[95%]",
                  previewDevice === "desktop" && "max-w-4xl",
                  previewDevice === "tablet" && "max-w-xl",
                  previewDevice === "mobile" && "max-w-sm rounded-[32px] border-4 border-slate-700"
                )}
              >
                <iframe
                  src={`/${locale}/forms/p/${form.slug}?preview=true`}
                  className="w-full h-full border-0"
                  title="Live Preview Frame"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
