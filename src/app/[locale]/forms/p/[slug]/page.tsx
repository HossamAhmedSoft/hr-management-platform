"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Form, FormQuestion, FormSection } from "@/types/forms";
import {
  evaluateLogicRules,
  resolveAnswerPiping,
  gradeQuizSubmission,
} from "@/lib/forms-service";
import { internalDB } from "@/lib/internal-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  Star,
  UploadCloud,
  FileCheck,
  Award,
  RefreshCw,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicFormViewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";
  const locale = (params?.locale as "en" | "ar") || "en";
  const isAr = locale === "ar";

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<{ message: string; message_ar?: string } | null>(null);

  // Form State
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Honeypot field (spam defense)
  const [honeypot, setHoneypot] = useState("");

  // Start timer for completion time
  const [startTime] = useState<number>(() => Date.now());

  // Fetch published form schema (instant local-first render)
  useEffect(() => {
    async function loadForm() {
      if (!slug) return;
      try {
        // Instant check in local storage (0ms display)
        const local = internalDB.getFormBySlug(slug);
        if (local && (local.status === "published" || local.status === "draft")) {
          setForm(local);
          setLoading(false);
          const draftKey = `gdg_form_draft_${local.id}`;
          if (typeof window !== "undefined") {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
              try {
                setAnswers(JSON.parse(savedDraft));
              } catch {}
            }
          }
        }

        const res = await fetch(`/api/forms/public/${slug}`);
        const data = await res.json();
        if (res.ok && data.data) {
          setForm(data.data);
          const draftKey = `gdg_form_draft_${data.data.id}`;
          if (typeof window !== "undefined") {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
              try {
                setAnswers(JSON.parse(savedDraft));
              } catch {}
            }
          }
        } else if (!local) {
          setErrorState({
            message: data.error || "Form not available.",
            message_ar: data.error_ar || "النموذج غير متاح حالياً.",
          });
        }
      } catch (e: any) {
        const local = internalDB.getFormBySlug(slug);
        if (!local) {
          setErrorState({
            message: "Failed to connect to the form server.",
            message_ar: "تعذر الاتصال بخادم النماذج.",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [slug]);

  // Update Answer & Persist to draft storage
  const handleAnswerChange = (questionId: string, value: any) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);

    // Clear validation error for this field
    if (validationErrors[questionId]) {
      const errs = { ...validationErrors };
      delete errs[questionId];
      setValidationErrors(errs);
    }

    // Persist draft
    if (form) {
      try {
        localStorage.setItem(`gdg_form_draft_${form.id}`, JSON.stringify(updated));
      } catch {}
    }
  };

  // Evaluate dynamic branching logic
  const logicEvaluation = form
    ? evaluateLogicRules(form.logic_rules || [], answers, form.questions || [])
    : { hiddenQuestionIds: new Set<string>(), shouldSubmitImmediately: false };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs text-muted-foreground font-medium">
          {isAr ? "جاري تحميل النموذج..." : "Loading Form..."}
        </span>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-md text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            {isAr ? errorState.message_ar || errorState.message : errorState.message}
          </h2>
          <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}`)} className="text-xs">
            {isAr ? "العودة للرئيسية" : "Go to Homepage"}
          </Button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // Sections setup
  const sections = form.sections && form.sections.length > 0
    ? form.sections
    : [{ id: "sec_default", title: "General", title_ar: "عام", order_index: 0, form_id: form.id }];

  const currentSection = sections[currentSectionIndex] || sections[0];
  const isLastSection = currentSectionIndex === sections.length - 1;

  // Filter questions for current section and exclude hidden questions
  const sectionQuestions = (form.questions || []).filter(
    (q) =>
      q.section_id === currentSection.id &&
      !logicEvaluation.hiddenQuestionIds.has(q.id)
  );

  // Validate current section before moving forward
  const validateCurrentSection = (): boolean => {
    const errs: Record<string, string> = {};

    sectionQuestions.forEach((q) => {
      const val = answers[q.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim() === "") ||
        (Array.isArray(val) && val.length === 0);

      if (q.is_required && isEmpty) {
        errs[q.id] = isAr ? "هذا السؤال إلزامي." : "This question is required.";
      }
    });

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextSection = () => {
    if (!validateCurrentSection()) return;

    if (logicEvaluation.jumpToSectionId) {
      const targetIdx = sections.findIndex((s) => s.id === logicEvaluation.jumpToSectionId);
      if (targetIdx >= 0) {
        setCurrentSectionIndex(targetIdx);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;
    setSubmitting(true);

    const completionTime = Math.max(5, Math.round((Date.now() - startTime) / 1000));

    try {
      const visibleQuestionIds = (form.questions || [])
        .filter((q) => !logicEvaluation.hiddenQuestionIds.has(q.id))
        .map((q) => q.id);

      let successResponse: any = null;

      try {
        const res = await fetch(`/api/forms/public/${form.slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            visible_question_ids: visibleQuestionIds,
            completion_time_seconds: completionTime,
            locale,
            _gdg_hp_field: honeypot, // honeypot
          }),
        });

        const data = await res.json();
        if (res.ok) {
          successResponse = data;
        } else if (data.validationErrors && Array.isArray(data.validationErrors)) {
          const errs: Record<string, string> = {};
          data.validationErrors.forEach((e: any) => {
            errs[e.question_id] = isAr ? e.message_ar || e.message : e.message;
          });
          setValidationErrors(errs);
          setSubmitting(false);
          return;
        }
      } catch {
        // Network unavailable, fallback to local resilient save
      }

      // If server route didn't complete (e.g. offline, local dev, or table not synced), save locally
      if (!successResponse) {
        let quizResultData = undefined;
        if (form.quiz_settings?.is_quiz) {
          const grading = gradeQuizSubmission(form.questions || [], answers, form.quiz_settings);
          quizResultData = {
            score: grading.scoreAwarded,
            total_possible: grading.totalPointsPossible,
            percentage: grading.percentage,
            is_passed: grading.isPassed,
            show_score: form.quiz_settings.show_score_immediate,
          };
        }

        const savedResp = internalDB.createFormResponse({
          form_id: form.id,
          form_version_id: form.current_version_id || "v1",
          completion_time_seconds: completionTime,
          score: quizResultData?.score,
          total_points_possible: quizResultData?.total_possible,
          percentage: quizResultData?.percentage,
          answers: Object.entries(answers).map(([qId, val]) => ({
            id: `ans_${Date.now()}_${qId}`,
            response_id: "",
            question_id: qId,
            question_type: form.questions?.find((q) => q.id === qId)?.type || "short_text",
            answer_value: val,
            created_at: new Date().toISOString(),
          })),
        });

        successResponse = {
          success: true,
          message: isAr ? form.settings.confirmation_message_ar : form.settings.confirmation_message,
          data: {
            response_id: savedResp.id,
            quiz_result: quizResultData,
          },
        };
      }

      setSubmittedData(successResponse);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`gdg_form_draft_${form.id}`);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      alert("Submission error: " + e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================
  // SUBMISSION SUCCESS / QUIZ RESULTS SCREEN
  // ========================================================
  if (submittedData) {
    const quizResult = submittedData.data?.quiz_result;

    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className={cn("min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 flex justify-center items-start", isAr && "font-sans font-cairo")}
      >
        <div className="max-w-2xl w-full bg-card border border-border rounded-3xl shadow-lg overflow-hidden animate-in fade-in space-y-6">
          <div
            className="h-3 w-full"
            style={{ backgroundColor: form.theme_config.primaryColor }}
          />

          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-black text-foreground">
              {isAr ? form.title_ar || form.title : form.title}
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {submittedData.message || (isAr ? "تم تسجيل ردك بنجاح." : "Your response has been recorded.")}
            </p>

            {/* Quiz Results Card */}
            {quizResult && quizResult.show_score && (
              <div className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3 max-w-md mx-auto text-center">
                <Badge
                  className={cn(
                    "text-xs px-3 py-1 font-bold",
                    quizResult.is_passed
                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-600 border-rose-500/30"
                  )}
                >
                  <Award className="w-3.5 h-3.5 me-1" />
                  {quizResult.is_passed
                    ? (isAr ? "ناجح ومؤهل" : "PASSED")
                    : (isAr ? "لم تجتز الاختبار" : "NEEDS IMPROVEMENT")}
                </Badge>

                <div className="text-3xl font-black text-foreground">
                  {quizResult.score} / {quizResult.total_possible}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">
                    ({quizResult.percentage}%)
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              {form.settings?.allow_edit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmittedData(null)}
                  className="text-xs"
                >
                  {isAr ? "تعديل إجابتي" : "Edit your response"}
                </Button>
              )}

              {submittedData.redirect_url && (
                <a href={submittedData.redirect_url} target="_blank" rel="noreferrer">
                  <Button size="sm" className="text-xs gap-1.5">
                    <span>{isAr ? "متابعة الرابط الخارجي" : "Continue"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round(
    ((currentSectionIndex + 1) / sections.length) * 100
  );

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={cn("min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 flex justify-center items-start", isAr && "font-sans font-cairo")}
    >
      {/* Honeypot hidden input for spam bots */}
      <input
        type="text"
        name="_gdg_hp_field"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="max-w-2xl w-full space-y-4">
        {/* Progress Bar */}
        {form.settings?.show_progress_bar && sections.length > 1 && (
          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>
                {isAr
                  ? `القسم ${currentSectionIndex + 1} من ${sections.length}`
                  : `Section ${currentSectionIndex + 1} of ${sections.length}`}
              </span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5 bg-muted rounded-full" />
          </div>
        )}

        {/* Form Main Card */}
        <div className="bg-card border border-border rounded-3xl shadow-md overflow-hidden relative">
          {/* Top Brand Stripe */}
          <div
            className="h-2.5 w-full"
            style={{ backgroundColor: form.theme_config.primaryColor }}
          />

          {/* Form Header */}
          <div className="p-6 sm:p-8 border-b border-border space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {isAr ? form.title_ar || form.title : form.title}
            </h1>
            {(form.description || form.description_ar) && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {resolveAnswerPiping(
                  isAr ? form.description_ar || form.description || "" : form.description || "",
                  answers,
                  form.questions || []
                )}
              </p>
            )}

            {/* Current Section Title */}
            {sections.length > 1 && (
              <div className="pt-2">
                <Badge variant="outline" className="text-xs font-bold text-primary bg-primary/10 border-primary/20">
                  {isAr ? currentSection.title_ar || currentSection.title : currentSection.title}
                </Badge>
              </div>
            )}
          </div>

          {/* Questions Container */}
          <div className="p-6 sm:p-8 space-y-6">
            {sectionQuestions.map((q, idx) => {
              const questionTitle = resolveAnswerPiping(
                isAr ? q.title_ar || q.title : q.title,
                answers,
                form.questions || []
              );
              const questionDesc = resolveAnswerPiping(
                isAr ? q.description_ar || q.description || "" : q.description || "",
                answers,
                form.questions || []
              );
              const err = validationErrors[q.id];
              const currentVal = answers[q.id];

              return (
                <div
                  key={q.id}
                  className={cn(
                    "p-5 rounded-2xl border transition-all duration-200 space-y-3",
                    err
                      ? "border-destructive/60 bg-destructive/5"
                      : "border-border/70 hover:border-border bg-card/60"
                  )}
                >
                  {/* Question Header */}
                  <div>
                    <label className="text-sm font-bold text-foreground block">
                      <span>{questionTitle}</span>
                      {q.is_required && (
                        <span className="text-destructive font-black ms-1">*</span>
                      )}
                    </label>
                    {questionDesc && (
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                        {questionDesc}
                      </p>
                    )}
                  </div>

                  {/* ============================================== */}
                  {/* QUESTION RENDERERS PER TYPE                    */}
                  {/* ============================================== */}

                  {/* 1. Short Text */}
                  {q.type === "short_text" && (
                    <Input
                      value={currentVal || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder={isAr ? q.placeholder_ar || "إجابتك..." : q.placeholder || "Your answer..."}
                      className="text-xs h-10"
                    />
                  )}

                  {/* 2. Paragraph */}
                  {q.type === "paragraph" && (
                    <Textarea
                      value={currentVal || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder={isAr ? q.placeholder_ar || "إجابتك..." : q.placeholder || "Your answer..."}
                      rows={3}
                      className="text-xs"
                    />
                  )}

                  {/* 3. Number */}
                  {q.type === "number" && (
                    <Input
                      type="number"
                      value={currentVal || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="0"
                      className="text-xs h-10 w-48 font-mono"
                    />
                  )}

                  {/* 4. Multiple Choice (Radio) */}
                  {q.type === "multiple_choice" && (
                    <div className="space-y-2 pt-1">
                      {q.options?.map((opt) => (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-xs",
                            currentVal === opt.value
                              ? "bg-primary/10 border-primary text-foreground font-semibold"
                              : "border-border/60 hover:bg-muted/30 text-foreground"
                          )}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt.value}
                            checked={currentVal === opt.value}
                            onChange={() => handleAnswerChange(q.id, opt.value)}
                            className="rounded-full text-primary w-4 h-4 focus:ring-primary"
                          />
                          <span>{isAr ? opt.label_ar || opt.label : opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* 5. Checkboxes (Multi-select) */}
                  {q.type === "checkboxes" && (
                    <div className="space-y-2 pt-1">
                      {q.options?.map((opt) => {
                        const isChecked = Array.isArray(currentVal) && currentVal.includes(opt.value);
                        return (
                          <label
                            key={opt.id}
                            className={cn(
                              "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-xs",
                              isChecked
                                ? "bg-primary/10 border-primary text-foreground font-semibold"
                                : "border-border/60 hover:bg-muted/30 text-foreground"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const currentArr: string[] = Array.isArray(currentVal) ? [...currentVal] : [];
                                if (e.target.checked) {
                                  handleAnswerChange(q.id, [...currentArr, opt.value]);
                                } else {
                                  handleAnswerChange(q.id, currentArr.filter((v) => v !== opt.value));
                                }
                              }}
                              className="rounded text-primary w-4 h-4 focus:ring-primary"
                            />
                            <span>{isAr ? opt.label_ar || opt.label : opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 6. Dropdown */}
                  {q.type === "dropdown" && (
                    <select
                      value={currentVal || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground font-medium"
                    >
                      <option value="">{isAr ? "اختر من القائمة..." : "Choose an option..."}</option>
                      {q.options?.map((opt) => (
                        <option key={opt.id} value={opt.value}>
                          {isAr ? opt.label_ar || opt.label : opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* 7. Linear Scale */}
                  {q.type === "linear_scale" && (
                    <div className="space-y-2 pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        {Array.from(
                          { length: (q.settings?.scale_max || 5) - (q.settings?.scale_min || 1) + 1 },
                          (_, i) => (q.settings?.scale_min || 1) + i
                        ).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, num)}
                            className={cn(
                              "w-10 h-10 rounded-xl font-bold text-xs border transition-all cursor-pointer",
                              currentVal === num
                                ? "bg-primary text-white border-primary shadow-xs scale-105"
                                : "border-border hover:bg-muted text-foreground"
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      {(q.settings?.scale_min_label || q.settings?.scale_max_label) && (
                        <div className="flex justify-between text-[11px] text-muted-foreground px-1 pt-1">
                          <span>{isAr ? q.settings?.scale_min_label_ar || q.settings?.scale_min_label : q.settings?.scale_min_label}</span>
                          <span>{isAr ? q.settings?.scale_max_label_ar || q.settings?.scale_max_label : q.settings?.scale_max_label}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 8. Star Rating */}
                  {q.type === "rating" && (
                    <div className="flex items-center gap-2 pt-1">
                      {Array.from({ length: q.settings?.max_rating || 5 }, (_, i) => i + 1).map((starVal) => (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, starVal)}
                          className="p-1 rounded transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star
                            className={cn(
                              "w-7 h-7 transition-colors",
                              (currentVal || 0) >= starVal
                                ? "fill-[#fbbc04] text-[#fbbc04]"
                                : "text-muted-foreground/40 hover:text-amber-400"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 9. Date Picker */}
                  {q.type === "date" && (
                    <Input
                      type="date"
                      value={currentVal || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="text-xs h-10 w-56"
                    />
                  )}

                  {/* 10. Time Picker */}
                  {q.type === "time" && (
                    <Input
                      type="time"
                      value={currentVal || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="text-xs h-10 w-44"
                    />
                  )}

                  {/* 11. Email / Phone / URL */}
                  {(q.type === "email" || q.type === "phone" || q.type === "url") && (
                    <Input
                      type={q.type}
                      value={currentVal || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder={
                        q.type === "email"
                          ? "name@example.com"
                          : q.type === "phone"
                          ? "+20 100 000 0000"
                          : "https://example.com"
                      }
                      className="text-xs h-10"
                      dir="ltr"
                    />
                  )}

                  {/* 12. File Upload */}
                  {q.type === "file_upload" && (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary/60 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                        <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-xs font-semibold text-foreground">
                          {isAr ? "اضغط لاختيار ملف من جهازك" : "Click to select a file"}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">
                          {isAr ? "الحد الأقصى:" : "Max size:"} {q.validation?.max_file_size_mb || 10} MB
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleAnswerChange(q.id, {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                              });
                            }
                          }}
                        />
                      </label>
                      {currentVal && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/10 text-primary text-xs font-medium">
                          <FileCheck className="w-4 h-4 shrink-0" />
                          <span className="truncate">{currentVal.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Validation Error Message */}
                  {err && (
                    <p className="text-xs font-semibold text-destructive flex items-center gap-1 animate-in fade-in">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{err}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation & Submit Footer */}
          <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-between">
            {currentSectionIndex > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrevSection}
                className="text-xs gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? "السابق" : "Back"}</span>
              </Button>
            ) : (
              <div />
            )}

            {!isLastSection ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNextSection}
                className="text-xs gap-1.5 px-5"
              >
                <span>{isAr ? "التالي" : "Next"}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="text-xs font-bold gap-1.5 px-6 bg-primary text-white hover:bg-primary/90"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال النموذج" : "Submit Form")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Footer Badge */}
        <div className="text-center text-[11px] text-muted-foreground space-y-1">
          <p>
            {isAr
              ? "منظومة الاستمارات الرقمية — GDG on Campus NCTU"
              : "GDG on Campus NCTU Management Platform • Native Forms Module"}
          </p>
        </div>
      </div>
    </div>
  );
}
