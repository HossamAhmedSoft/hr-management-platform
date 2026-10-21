// ============================================================
// GDG NCTU HR Management Platform — AI Agent Forms Module Tools
// Callable Tool Definitions & Executable Functions for Autonomous Agents
// ============================================================

import { Form, FormQuestion, FormResponse } from "@/types/forms";
import { internalDB } from "./internal-db";
import { dbService } from "./db-service";
import { computeFormAnalytics } from "./forms-service";
import { generateId } from "./utils";

/**
 * Tool Definition 1: create_form_from_description
 * Enables the AI Agent to build a complete form with questions from a natural language description.
 */
export async function createFormFromDescription(params: {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  category?: string;
  questions: Array<{
    type: FormQuestion["type"];
    title: string;
    title_ar: string;
    is_required?: boolean;
    options?: Array<{ label: string; label_ar?: string; value: string }>;
  }>;
  isQuiz?: boolean;
  creatorId?: string;
}): Promise<Form> {
  const formId = generateId();
  const secId = `sec_${Date.now().toString(36)}`;
  const slug = `${params.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

  const questions: FormQuestion[] = params.questions.map((q, idx) => ({
    id: `q_${Date.now().toString(36)}_${idx}`,
    form_id: formId,
    section_id: secId,
    type: q.type,
    title: q.title,
    title_ar: q.title_ar,
    is_required: Boolean(q.is_required),
    order_index: idx,
    options: q.options?.map((opt, oIdx) => ({
      id: `opt_${oIdx}`,
      label: opt.label,
      label_ar: opt.label_ar,
      value: opt.value,
    })),
  }));

  const newForm: Partial<Form> = {
    id: formId,
    slug,
    title: params.title,
    title_ar: params.title_ar,
    description: params.description,
    description_ar: params.description_ar,
    status: "published",
    access_mode: "public",
    created_by: params.creatorId || "agent_ai",
    theme_config: {
      primaryColor: "#1a73e8",
      accentColor: "#4285F4",
      backgroundColor: "#f8f9fa",
      font: "Inter",
      rounded: "rounded-xl",
    },
    settings: {
      limit_one_response: false,
      allow_edit: false,
      show_progress_bar: true,
      shuffle_questions: false,
      collect_email: true,
      auto_collect_user_profile: true,
      confirmation_message: "Your response has been recorded.",
      confirmation_message_ar: "تم تسجيل ردك بنجاح.",
    },
    quiz_settings: {
      is_quiz: Boolean(params.isQuiz),
      total_points: params.isQuiz ? questions.length * 10 : 0,
      show_score_immediate: true,
      show_correct_answers: true,
    },
    sections: [
      {
        id: secId,
        form_id: formId,
        title: "Main Section",
        title_ar: "القسم الرئيسي",
        order_index: 0,
      },
    ],
    questions,
    logic_rules: [],
  };

  return dbService.createForm(newForm);
}

/**
 * Tool Definition 2: list_system_forms
 * Queries forms with status and search filtering.
 */
export async function listSystemForms(params: {
  status?: string;
  search?: string;
}): Promise<Array<{ id: string; slug: string; title: string; status: string; responses: number }>> {
  let forms = await dbService.getForms();

  if (params.status) {
    forms = forms.filter((f) => f.status === params.status);
  }
  if (params.search) {
    const q = params.search.toLowerCase().trim();
    forms = forms.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.title_ar.toLowerCase().includes(q) ||
        f.slug.toLowerCase().includes(q)
    );
  }

  return forms.map((f) => ({
    id: f.id,
    slug: f.slug,
    title: f.title,
    status: f.status,
    responses: f.response_count || 0,
  }));
}

/**
 * Tool Definition 3: get_form_summary_and_responses
 * Returns full analytics, response count, completion rates, and question distributions.
 */
export async function getFormSummaryAndResponses(formId: string) {
  const form = await dbService.getFormById(formId);
  if (!form) throw new Error(`Form not found: ${formId}`);

  const responses = await dbService.getFormResponses(form.id);
  const analytics = computeFormAnalytics(form, responses);

  return {
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      status: form.status,
      quiz_mode: form.quiz_settings?.is_quiz,
    },
    analytics,
    recent_responses: responses.slice(0, 5).map((r) => ({
      id: r.id,
      respondent: r.respondent_name || "Anonymous",
      email: r.respondent_email,
      score: r.score,
      submitted_at: r.submitted_at,
    })),
  };
}
