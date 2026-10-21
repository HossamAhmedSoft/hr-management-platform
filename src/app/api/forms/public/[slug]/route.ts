// ============================================================
// Public Form Schema Resolution & Response Submission
// GET & POST /api/forms/public/[slug]
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";
import { getApiAuthContext, checkApiRateLimit } from "@/lib/api-auth-helper";
import {
  validateFormSubmission,
  gradeQuizSubmission,
  executeFormAutomations,
} from "@/lib/forms-service";
import { FormResponse, FormAnswer } from "@/types/forms";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Sliding-window rate limiting for public endpoints (120 req / min)
  const rateLimit = checkApiRateLimit(request, 120);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSec) } }
    );
  }

  const { slug } = await params;

  try {
    const form = await dbService.getFormBySlug(slug);
    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    if (form.status === "archived") {
      return NextResponse.json({ error: "This form has been archived." }, { status: 410 });
    }

    if (form.status === "closed") {
      return NextResponse.json(
        {
          error: "This form is no longer accepting responses.",
          error_ar: "هذا النموذج مغلق حالياً ولا يقبل ردوداً جديدة.",
          status: "closed",
        },
        { status: 403 }
      );
    }

    const auth = getApiAuthContext(request);

    // Access mode check
    if (form.access_mode === "authenticated" && !auth.isAuthenticated) {
      return NextResponse.json(
        {
          error: "Authentication required to access this form.",
          error_ar: "يتطلب الوصول لهذا النموذج تسجيل الدخول بالحساب الجامعي أولاً.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    if (
      form.access_mode === "roles" &&
      form.allowed_roles &&
      form.allowed_roles.length > 0
    ) {
      if (!auth.isAuthenticated || !auth.role || !form.allowed_roles.includes(auth.role)) {
        return NextResponse.json(
          {
            error: "You do not have the required role to access this form.",
            error_ar: "حسابك لا يمتلك الصلاحية الكافية للوصول لهذا النموذج.",
            requiresRole: true,
          },
          { status: 403 }
        );
      }
    }

    // Response cap check
    if (
      form.settings?.response_cap &&
      (form.response_count || 0) >= form.settings.response_cap
    ) {
      return NextResponse.json(
        {
          error: "This form has reached its maximum response capacity.",
          error_ar: "وصل النموذج للحد الأقصى من المشاركات المسموح بها.",
          isCapped: true,
        },
        { status: 403 }
      );
    }

    // Open/Close date check
    const now = new Date();
    if (form.settings?.open_date && new Date(form.settings.open_date) > now) {
      return NextResponse.json(
        {
          error: `This form will open on ${new Date(form.settings.open_date).toLocaleString()}.`,
          error_ar: `سيتم فتح النموذج في ${new Date(form.settings.open_date).toLocaleDateString("ar-EG")}.`,
          isNotOpenYet: true,
        },
        { status: 403 }
      );
    }

    if (form.settings?.close_date && new Date(form.settings.close_date) < now) {
      return NextResponse.json(
        {
          error: "The deadline for this form has passed.",
          error_ar: "انتهى الموعد النهائي المحدد لتعبئة هذا النموذج.",
          isExpired: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: form,
      userSession: auth.isAuthenticated ? auth.user : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load form." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Sliding-window rate limiting (max 40 submissions / min)
  const rateLimit = checkApiRateLimit(request, 40);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSec) } }
    );
  }

  const { slug } = await params;

  try {
    const form = await dbService.getFormBySlug(slug);
    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    if (form.status !== "published") {
      return NextResponse.json(
        { error: "This form is not currently accepting submissions." },
        { status: 403 }
      );
    }

    const payload = await request.json();

    // 1. Spam Defense: Honeypot check
    if (payload._gdg_hp_field) {
      // Bot detected -> return dummy success without storing
      return NextResponse.json({ status: "success", message: "Response received." });
    }

    const auth = getApiAuthContext(request);

    // 2. Access mode verification
    if (form.access_mode === "authenticated" && !auth.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required to submit this form." },
        { status: 401 }
      );
    }

    const answersRecord = payload.answers || {};
    const visibleQuestionIds = payload.visible_question_ids
      ? new Set<string>(payload.visible_question_ids)
      : undefined;

    // 3. Validation
    const validation = validateFormSubmission(
      form.questions || [],
      answersRecord,
      visibleQuestionIds,
      payload.locale === "ar"
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Validation failed. Please correct the highlighted errors.",
          error_ar: "يرجى تصحيح الأخطاء الموضحة قبل إرسال النموذج.",
          validationErrors: validation.errors,
        },
        { status: 422 }
      );
    }

    // 4. One response per user check
    const respondentEmail =
      payload.respondent_email || auth.user?.email || answersRecord.q_email || undefined;
    const respondentId = auth.user?.id || undefined;
    const respondentName =
      payload.respondent_name || auth.user?.full_name || answersRecord.q_full_name || undefined;

    if (form.settings?.limit_one_response && (respondentEmail || respondentId)) {
      const priorResponses = await dbService.getFormResponses(form.id);
      const hasPrior = priorResponses.some(
        (r) =>
          !r.is_draft &&
          ((respondentId && r.respondent_id === respondentId) ||
            (respondentEmail && r.respondent_email?.toLowerCase() === respondentEmail.toLowerCase()))
      );

      if (hasPrior) {
        return NextResponse.json(
          {
            error: "You have already submitted a response to this form.",
            error_ar: "لقد قمت بتقديم رد على هذه الاستمارة مسبقاً، ولا يُسمح بتكرار التقديم.",
          },
          { status: 409 }
        );
      }
    }

    // 5. Quiz Auto-Grading
    const quizResult = gradeQuizSubmission(
      form.questions || [],
      answersRecord,
      form.quiz_settings
    );

    // 6. Build Form Answers Array
    const responseId = generateId();
    const answersList: FormAnswer[] = Object.entries(answersRecord).map(([qId, val]) => {
      const matchedQ = form.questions?.find((q) => q.id === qId);
      const score = quizResult.questionScores[qId]?.score;
      return {
        id: generateId(),
        response_id: responseId,
        question_id: qId,
        question_type: matchedQ?.type || "short_text",
        question_title: matchedQ?.title,
        question_title_ar: matchedQ?.title_ar,
        answer_value: val,
        score_awarded: score,
      };
    });

    // 7. Store Immutable Form Response
    const newResponse: Partial<FormResponse> = {
      id: responseId,
      form_id: form.id,
      form_version_id: form.current_version_id || "v1",
      respondent_id: respondentId,
      respondent_email: respondentEmail,
      respondent_name: respondentName,
      is_draft: Boolean(payload.is_draft),
      score: quizResult.isQuiz ? quizResult.scoreAwarded : null,
      total_points_possible: quizResult.isQuiz ? quizResult.totalPointsPossible : null,
      percentage: quizResult.isQuiz ? quizResult.percentage : null,
      completion_time_seconds: payload.completion_time_seconds || 45,
      answers: answersList,
      submitted_at: new Date().toISOString(),
    };

    const savedResponse = await dbService.createFormResponse(newResponse);

    // 8. Execute Automations & HMAC Webhooks
    let automationResults = { executedCount: 0, actions: [] as string[] };
    if (!newResponse.is_draft) {
      automationResults = await executeFormAutomations(form, savedResponse);
    }

    return NextResponse.json(
      {
        status: "success",
        message:
          payload.locale === "ar"
            ? form.settings?.confirmation_message_ar || "تم تسجيل ردك بنجاح."
            : form.settings?.confirmation_message || "Your response has been recorded.",
        redirect_url: form.settings?.redirect_url || null,
        data: {
          response_id: savedResponse.id,
          quiz_result: quizResult.isQuiz
            ? {
                score: quizResult.scoreAwarded,
                total_possible: quizResult.totalPointsPossible,
                percentage: quizResult.percentage,
                is_passed: quizResult.isPassed,
                show_score: form.quiz_settings?.show_score_immediate,
                show_correct_answers: form.quiz_settings?.show_correct_answers,
                breakdown: form.quiz_settings?.show_correct_answers ? quizResult.questionScores : undefined,
              }
            : null,
          automations_triggered: automationResults.executedCount,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit form response." },
      { status: 500 }
    );
  }
}
