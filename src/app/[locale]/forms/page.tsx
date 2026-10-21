"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Form, FormTemplate } from "@/types/forms";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Share2,
  BarChart3,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Layers,
  GraduationCap,
  HeartHandshake,
  CalendarCheck,
  LayoutGrid,
  List,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShareFormModal } from "@/components/forms/share-form-modal";
import { internalDB } from "@/lib/internal-db";
import { cn } from "@/lib/utils";

export default function FormsHubPage() {
  const { locale, forms, addForm, deleteForm } = useApp();
  const router = useRouter();
  const isAr = locale === "ar";

  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "published" | "draft" | "templates">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // New Form Modal
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState(false);
  const [templates, setTemplates] = useState<FormTemplate[]>(() => internalDB.getFormTemplates());

  // Share Modal State
  const [shareTargetForm, setShareTargetForm] = useState<Form | null>(null);

  // Stats
  const totalForms = forms.length;
  const publishedForms = forms.filter((f) => f.status === "published").length;
  const totalResponses = forms.reduce((acc, curr) => acc + (curr.response_count || 0), 0);
  const quizCount = forms.filter((f) => f.quiz_settings?.is_quiz).length;

  // Filtered Forms
  const filteredForms = forms.filter((f) => {
    if (filterTab === "published" && f.status !== "published") return false;
    if (filterTab === "draft" && f.status !== "draft") return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        f.title.toLowerCase().includes(q) ||
        f.title_ar.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Create Form from Scratch
  const handleCreateBlankForm = async () => {
    setIsNewFormModalOpen(false);
    const newForm = await addForm({
      title: isAr ? "استمارة جديدة بدون عنوان" : "Untitled Form",
      title_ar: "استمارة جديدة بدون عنوان",
      slug: `form-${Date.now().toString(36)}`,
      status: "draft",
      access_mode: "public",
      sections: [
        {
          id: `sec_${Date.now()}`,
          form_id: "",
          title: "General Section",
          title_ar: "القسم العام",
          order_index: 0,
        },
      ],
      questions: [
        {
          id: `q_${Date.now()}`,
          form_id: "",
          section_id: "",
          type: "multiple_choice",
          title: "Question 1",
          title_ar: "السؤال الأول",
          is_required: false,
          order_index: 0,
          options: [
            { id: "opt_1", label: "Option 1", label_ar: "الخيار 1", value: "opt_1" },
            { id: "opt_2", label: "Option 2", label_ar: "الخيار 2", value: "opt_2" },
          ],
        },
      ],
    });
    router.push(`/${locale}/forms/${newForm.id}/builder`);
  };

  // Instantiate from Template
  const handleUseTemplate = async (tpl: FormTemplate) => {
    setIsNewFormModalOpen(false);
    const snapshot = tpl.schema_snapshot;
    const newForm = await addForm({
      title: snapshot.title,
      title_ar: snapshot.title_ar,
      description: snapshot.description,
      description_ar: snapshot.description_ar,
      slug: `${tpl.id}-${Date.now().toString(36)}`,
      status: "published",
      access_mode: "public",
      theme_config: snapshot.theme_config,
      settings: snapshot.settings,
      quiz_settings: snapshot.quiz_settings,
      sections: snapshot.sections,
      questions: snapshot.questions,
      logic_rules: snapshot.logic_rules,
    });
    router.push(`/${locale}/forms/${newForm.id}/builder`);
  };

  // Duplicate Form
  const handleDuplicateForm = async (f: Form) => {
    try {
      const res = await fetch(`/api/forms/${f.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.data) {
        window.location.reload();
      }
    } catch (e) {
      console.error("Duplicate error:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Google-Accent Strip */}
      <div className="google-accent-strip w-full rounded-full" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              {isAr ? "منظومة النماذج والاستبيانات" : "Native Forms & Surveys Hub"}
            </h1>
            <Badge className="bg-[#1a73e8]/10 text-[#1a73e8] dark:text-[#8ab4f8] border-0 text-xs font-bold">
              Google Forms Native
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {isAr
              ? "إنشاء وإدارة الاستمارات التفاعلية، الاختبارات التقييمية، واستطلاعات الرأي المرتبطة بمهام ولجان المنظومة."
              : "Create, manage, and distribute interactive forms, graded assessments, and surveys deeply integrated with GDG workflows."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsNewFormModalOpen(true)}
            className="text-xs font-bold gap-1.5 h-10 px-4 rounded-xl shadow-sm bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "إنشاء استمارة جديدة" : "Create New Form"}</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground block">
            {isAr ? "إجمالي النماذج" : "Total Forms"}
          </span>
          <div className="text-2xl font-black text-foreground">{totalForms}</div>
          <span className="text-[10px] text-muted-foreground">
            {isAr ? "استمارات نشطة ومسودات" : "Active & Draft forms"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
            {isAr ? "النماذج المنشورة" : "Published Forms"}
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {publishedForms}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isAr ? "تقبل ردوداً حية حالياً" : "Accepting live responses"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#1a73e8] dark:text-[#8ab4f8] block">
            {isAr ? "إجمالي الردود المسجلة" : "Total Submissions"}
          </span>
          <div className="text-2xl font-black text-[#1a73e8] dark:text-[#8ab4f8]">
            {totalResponses}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isAr ? "استجابات حقيقية موثقة" : "Recorded user submissions"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block">
            {isAr ? "اختبارات مصححة تلقائياً" : "Auto-Graded Quizzes"}
          </span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {quizCount}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isAr ? "تحتوي على درجات وتصحيح" : "With score & answer keys"}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-2xl border border-border">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Forms", label_ar: "كافة النماذج" },
            { id: "published", label: "Published", label_ar: "المنشورة" },
            { id: "draft", label: "Drafts", label_ar: "المسودات" },
            { id: "templates", label: "Template Gallery", label_ar: "معرض القوالب الجاهزة" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                filterTab === tab.id
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAr ? tab.label_ar : tab.label}
            </button>
          ))}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2">
          {filterTab !== "templates" && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? "بحث في النماذج..." : "Search forms..."}
                className="h-8 text-xs ps-8 rtl:ps-3 rtl:pe-8 bg-background"
              />
            </div>
          )}

          {filterTab !== "templates" && (
            <div className="flex items-center bg-background rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1 rounded cursor-pointer",
                  viewMode === "grid" ? "bg-muted text-primary" : "text-muted-foreground"
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-1 rounded cursor-pointer",
                  viewMode === "table" ? "bg-muted text-primary" : "text-muted-foreground"
                )}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TEMPLATE GALLERY VIEW                                    */}
      {/* ======================================================== */}
      {filterTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const getIcon = () => {
              if (tpl.icon === "GraduationCap") return GraduationCap;
              if (tpl.icon === "Award") return Award;
              if (tpl.icon === "HeartHandshake") return HeartHandshake;
              if (tpl.icon === "CalendarCheck") return CalendarCheck;
              return FileText;
            };
            const Icon = getIcon();

            return (
              <div
                key={tpl.id}
                className="bg-card border border-border hover:border-primary/50 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {tpl.category}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isAr ? tpl.title_ar : tpl.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {isAr ? tpl.description_ar : tpl.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {tpl.schema_snapshot.questions.length} {isAr ? "أسئلة" : "Questions"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUseTemplate(tpl)}
                    className="text-xs gap-1 h-8 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? "استخدام هذا القالب" : "Use Template"}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* GRID CARDS VIEW                                          */}
      {/* ======================================================== */}
      {filterTab !== "templates" && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredForms.map((formItem) => (
            <div
              key={formItem.id}
              className="bg-card border border-border hover:border-[#1a73e8]/60 dark:hover:border-[#8ab4f8]/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Color Stripe Top */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: formItem.theme_config.primaryColor }}
              />

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {isAr ? formItem.title_ar || formItem.title : formItem.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      /{formItem.slug}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] uppercase font-bold shrink-0",
                      formItem.status === "published"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    )}
                  >
                    {formItem.status}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {isAr ? formItem.description_ar || formItem.description : formItem.description || "No description provided."}
                </p>

                {/* Badges Bar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {formItem.questions?.length || 0} {isAr ? "أسئلة" : "Questions"}
                  </Badge>

                  {formItem.quiz_settings?.is_quiz && (
                    <Badge variant="outline" className="text-[10px] text-purple-600 bg-purple-500/10 border-purple-500/30">
                      <Award className="w-3 h-3 me-1" />
                      {isAr ? "اختبار مقيم" : "Graded Quiz"}
                    </Badge>
                  )}

                  <Badge variant="outline" className="text-[10px] text-[#1a73e8] bg-[#1a73e8]/10 border-[#1a73e8]/30">
                    <CheckCircle2 className="w-3 h-3 me-1" />
                    {formItem.response_count || 0} {isAr ? "ردود" : "Responses"}
                  </Badge>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-5 py-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Link href={`/${locale}/forms/${formItem.id}/builder`}>
                    <Button variant="ghost" size="sm" className="text-xs h-8 px-2 gap-1">
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      <span>{isAr ? "تعديل" : "Edit"}</span>
                    </Button>
                  </Link>

                  <Link href={`/${locale}/forms/${formItem.id}/responses`}>
                    <Button variant="ghost" size="sm" className="text-xs h-8 px-2 gap-1 text-muted-foreground hover:text-foreground">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{isAr ? "الردود" : "Responses"}</span>
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShareTargetForm(formItem)}
                    title={isAr ? "مشاركة وQR" : "Share & QR"}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`/${locale}/forms/p/${formItem.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    title={isAr ? "عرض كزائر" : "Open Public Form"}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDuplicateForm(formItem)}
                    title={isAr ? "نسخ" : "Duplicate"}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(isAr ? "هل أنت متأكد من حذف هذا النموذج؟" : "Delete this form?")) {
                        deleteForm(formItem.id);
                      }
                    }}
                    title={isAr ? "حذف" : "Delete"}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* TABLE VIEW                                               */}
      {/* ======================================================== */}
      {filterTab !== "templates" && viewMode === "table" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">{isAr ? "النموذج" : "Form"}</th>
                <th className="py-3 px-4">{isAr ? "الحالة" : "Status"}</th>
                <th className="py-3 px-4">{isAr ? "الوضع" : "Access"}</th>
                <th className="py-3 px-4">{isAr ? "الأسئلة" : "Questions"}</th>
                <th className="py-3 px-4">{isAr ? "الردود" : "Responses"}</th>
                <th className="py-3 px-4">{isAr ? "تاريخ الإنشاء" : "Created"}</th>
                <th className="py-3 px-4 text-center">{isAr ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredForms.map((formItem) => (
                <tr key={formItem.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: formItem.theme_config.primaryColor }}
                      />
                      <div>
                        <span className="block truncate max-w-xs font-bold">
                          {isAr ? formItem.title_ar || formItem.title : formItem.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          /{formItem.slug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase font-bold",
                        formItem.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      )}
                    >
                      {formItem.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground capitalize">
                    {formItem.access_mode}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formItem.questions?.length || 0}
                  </td>
                  <td className="py-3 px-4 font-bold text-primary">
                    {formItem.response_count || 0}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {new Date(formItem.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/${locale}/forms/${formItem.id}/builder`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Link href={`/${locale}/forms/${formItem.id}/responses`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <BarChart3 className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setShareTargetForm(formItem)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filterTab !== "templates" && filteredForms.length === 0 && (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">
            {isAr ? "لم يتم العثور على أي استمارات" : "No forms found"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {isAr
              ? "جرّب تغيير كلمات البحث أو أنشئ نموذجاً جديداً من الصفر أو باستخدام أحد القوالب الجاهزة."
              : "Try adjusting your search filters or create a new form using our template library."}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsNewFormModalOpen(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 me-1" />
            {isAr ? "إنشاء استمارة الآن" : "Create Form Now"}
          </Button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE FORM / PICK TEMPLATE                       */}
      {/* ======================================================== */}
      {isNewFormModalOpen && (
        <Dialog open={isNewFormModalOpen} onOpenChange={setIsNewFormModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {isAr ? "إنشاء نموذج جديد" : "Create New Form"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isAr
                  ? "ابدأ بنموذج فارغ أو اختر قالباً جاهزاً من قوالب المنظومة المعتمدة."
                  : "Start with a blank canvas or pick from pre-built system templates."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Option 1: Blank Form */}
              <button
                type="button"
                onClick={handleCreateBlankForm}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary bg-muted/20 hover:bg-muted/40 transition-all text-start flex items-center gap-3 group cursor-pointer"
              >
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    {isAr ? "استمارة فارغة من الصفر" : "Blank Form (Start from scratch)"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? "بناء نموذج مخصص بالكامل بإضافة الأسئلة والأقسام" : "Build a completely customized form with your own questions"}
                  </p>
                </div>
              </button>

              {/* Option 2: Templates List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  {isAr ? "أو اختر من القوالب المعتمدة:" : "Or Choose a Pre-built Template:"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.slice(0, 4).map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleUseTemplate(tpl)}
                      className="p-3 rounded-xl border border-border hover:border-primary bg-card hover:bg-muted/30 transition-all text-start space-y-1 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-foreground block truncate">
                        {isAr ? tpl.title_ar : tpl.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">
                        {isAr ? tpl.description_ar : tpl.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Modal */}
      {shareTargetForm && (
        <ShareFormModal
          isOpen={Boolean(shareTargetForm)}
          onClose={() => setShareTargetForm(null)}
          formId={shareTargetForm.id}
          slug={shareTargetForm.slug}
          title={isAr ? shareTargetForm.title_ar || shareTargetForm.title : shareTargetForm.title}
          locale={locale}
        />
      )}
    </div>
  );
}
