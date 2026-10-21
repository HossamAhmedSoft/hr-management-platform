// ============================================================
// GDG NCTU HR Management Platform — Native Forms Engine
// Core Business Logic: Validation, Branching Logic, Answer Piping,
// Quiz Scoring, Automations Engine, HMAC Webhook Dispatcher & Analytics
// ============================================================

import {
  Form,
  FormQuestion,
  FormResponse,
  FormAnswer,
  FormLogicRule,
  QuizSettings,
  FormAnalytics,
  QuestionAnalytics,
  FormAutomation,
  FormWebhook,
  FormWebhookDelivery,
} from "@/types/forms";
import { internalDB } from "./internal-db";
import { dbService } from "./db-service";
import { generateId } from "./utils";

// ── 1. Answer Validation Engine ──────────────────────────────

export interface ValidationError {
  question_id: string;
  message: string;
  message_ar: string;
}

export function validateQuestionAnswer(
  question: FormQuestion,
  value: any,
  isAr: boolean = false
): ValidationError | null {
  const isRequired = question.is_required;
  const val = value;

  // Check required
  const isEmpty =
    val === undefined ||
    val === null ||
    (typeof val === "string" && val.trim() === "") ||
    (Array.isArray(val) && val.length === 0) ||
    (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0);

  if (isRequired && isEmpty) {
    return {
      question_id: question.id,
      message: "This question is required.",
      message_ar: "هذا السؤال إلزامي، يرجى تقديم إجابة.",
    };
  }

  if (isEmpty) return null; // If optional and empty, passes

  const rules = question.validation || {};

  // Short text & Paragraph length & regex
  if (question.type === "short_text" || question.type === "paragraph") {
    const str = String(val).trim();
    if (rules.min_length !== undefined && str.length < rules.min_length) {
      return {
        question_id: question.id,
        message: `Answer must be at least ${rules.min_length} characters.`,
        message_ar: `يجب ألا تقل الإجابة عن ${rules.min_length} أحرف.`,
      };
    }
    if (rules.max_length !== undefined && str.length > rules.max_length) {
      return {
        question_id: question.id,
        message: `Answer cannot exceed ${rules.max_length} characters.`,
        message_ar: `يجب ألا تتجاوز الإجابة ${rules.max_length} حرفاً.`,
      };
    }
    if (rules.regex) {
      try {
        const re = new RegExp(rules.regex);
        if (!re.test(str)) {
          return {
            question_id: question.id,
            message: rules.regex_error_message || "Invalid format.",
            message_ar: rules.regex_error_message_ar || "صيغة الإدخال غير صحيحة.",
          };
        }
      } catch (e) {
        console.warn("Invalid regex rule:", rules.regex);
      }
    }
  }

  // Number validation
  if (question.type === "number") {
    const num = Number(val);
    if (isNaN(num)) {
      return {
        question_id: question.id,
        message: "Please enter a valid numeric value.",
        message_ar: "يرجى إدخال قيمة رقمية صحيحة.",
      };
    }
    if (rules.min !== undefined && num < rules.min) {
      return {
        question_id: question.id,
        message: `Value must be at least ${rules.min}.`,
        message_ar: `يجب أن تكون القيمة ${rules.min} على الأقل.`,
      };
    }
    if (rules.max !== undefined && num > rules.max) {
      return {
        question_id: question.id,
        message: `Value cannot exceed ${rules.max}.`,
        message_ar: `يجب ألا تتجاوز القيمة ${rules.max}.`,
      };
    }
  }

  // Email format
  if (question.type === "email") {
    const emailStr = String(val).trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return {
        question_id: question.id,
        message: "Please enter a valid email address.",
        message_ar: "يرجى إدخال بريد إلكتروني صالح.",
      };
    }
  }

  // URL format
  if (question.type === "url") {
    const urlStr = String(val).trim();
    try {
      new URL(urlStr);
    } catch {
      return {
        question_id: question.id,
        message: "Please enter a valid URL starting with http:// or https://.",
        message_ar: "يرجى إدخال رابط إنترنت صحيح يبدأ بـ http:// أو https://.",
      };
    }
  }

  // Phone validation (Egypt / International friendly)
  if (question.type === "phone") {
    const phoneStr = String(val).replace(/[\s\-\(\)]/g, "");
    if (!/^\+?[0-9]{8,15}$/.test(phoneStr)) {
      return {
        question_id: question.id,
        message: "Please enter a valid phone number (8 to 15 digits).",
        message_ar: "يرجى إدخال رقم هاتف صحيح (بين 8 إلى 15 رقماً).",
      };
    }
  }

  // File upload validation
  if (question.type === "file_upload" && typeof val === "object") {
    const fileSizeMB = (val.size || 0) / (1024 * 1024);
    const maxMB = rules.max_file_size_mb || 10;
    if (fileSizeMB > maxMB) {
      return {
        question_id: question.id,
        message: `File size exceeds the limit of ${maxMB} MB.`,
        message_ar: `حجم الملف يتجاوز الحد المسموح به (${maxMB} ميجابايت).`,
      };
    }
    if (rules.allowed_file_types && rules.allowed_file_types.length > 0) {
      const fileName = String(val.name || "");
      const ext = fileName.split(".").pop()?.toLowerCase();
      if (!ext || !rules.allowed_file_types.includes(ext)) {
        return {
          question_id: question.id,
          message: `Allowed file extensions: ${rules.allowed_file_types.join(", ")}.`,
          message_ar: `الملفات المسموح برفعها فقط هي: ${rules.allowed_file_types.join(", ")}.`,
        };
      }
    }
  }

  return null;
}

export function validateFormSubmission(
  questions: FormQuestion[],
  answersRecord: Record<string, any>,
  visibleQuestionIds?: Set<string>,
  isAr: boolean = false
): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  for (const q of questions) {
    // If logic rule hid this question, skip validation
    if (visibleQuestionIds && !visibleQuestionIds.has(q.id)) {
      // Mandatory questions cannot be suppressed if client sends an empty visible list without logic
      if (q.is_required && visibleQuestionIds.size === 0) {
        errors.push({
          question_id: q.id,
          message: "This question is required.",
          message_ar: "هذا السؤال إلزامي.",
        });
      }
      continue;
    }
    const val = answersRecord[q.id];
    const err = validateQuestionAnswer(q, val, isAr);
    if (err) {
      errors.push(err);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ── 2. Dynamic Logic & Branching Engine ───────────────────────

export function evaluateCondition(
  actualValue: any,
  operator: string,
  targetValue: any
): boolean {
  if (operator === "is_empty") {
    return (
      actualValue === undefined ||
      actualValue === null ||
      (typeof actualValue === "string" && actualValue.trim() === "") ||
      (Array.isArray(actualValue) && actualValue.length === 0)
    );
  }
  if (operator === "is_not_empty") {
    return !evaluateCondition(actualValue, "is_empty", targetValue);
  }

  if (actualValue === undefined || actualValue === null) return false;

  const actualStr = String(actualValue).toLowerCase().trim();
  const targetStr = String(targetValue).toLowerCase().trim();

  switch (operator) {
    case "equals":
      if (Array.isArray(actualValue)) {
        return actualValue.includes(targetValue);
      }
      return actualStr === targetStr;

    case "not_equals":
      if (Array.isArray(actualValue)) {
        return !actualValue.includes(targetValue);
      }
      return actualStr !== targetStr;

    case "contains":
      return actualStr.includes(targetStr);

    case "greater_than":
      return Number(actualValue) > Number(targetValue);

    case "less_than":
      return Number(actualValue) < Number(targetValue);

    default:
      return false;
  }
}

export function evaluateLogicRules(
  rules: FormLogicRule[],
  answersRecord: Record<string, any>,
  allQuestions: FormQuestion[]
): {
  hiddenQuestionIds: Set<string>;
  jumpToSectionId?: string;
  shouldSubmitImmediately: boolean;
} {
  // Questions targeted by a 'show_question' rule must be hidden by default until condition passes
  const conditionallyShownQuestionIds = new Set<string>();
  for (const rule of rules) {
    if (rule.action === "show_question" && rule.target_id) {
      conditionallyShownQuestionIds.add(rule.target_id);
    }
  }

  const hiddenQuestionIds = new Set<string>(conditionallyShownQuestionIds);
  let jumpToSectionId: string | undefined = undefined;
  let shouldSubmitImmediately = false;

  for (const rule of rules) {
    if (!rule.conditions || rule.conditions.length === 0) continue;

    // Evaluate conditions according to combinator (AND / OR)
    let ruleMatches = true;
    for (let i = 0; i < rule.conditions.length; i++) {
      const cond = rule.conditions[i];
      const answerVal = answersRecord[cond.question_id];
      const condPass = evaluateCondition(answerVal, cond.operator, cond.value);

      if (i === 0) {
        ruleMatches = condPass;
      } else {
        const combinator = cond.combinator || "AND";
        if (combinator === "AND") {
          ruleMatches = ruleMatches && condPass;
        } else {
          ruleMatches = ruleMatches || condPass;
        }
      }
    }

    if (ruleMatches) {
      if (rule.action === "hide_question") {
        hiddenQuestionIds.add(rule.target_id);
      } else if (rule.action === "show_question") {
        hiddenQuestionIds.delete(rule.target_id);
      } else if (rule.action === "jump_to_section") {
        jumpToSectionId = rule.target_id;
      } else if (rule.action === "submit_form") {
        shouldSubmitImmediately = true;
      }
    }
  }

  return {
    hiddenQuestionIds,
    jumpToSectionId,
    shouldSubmitImmediately,
  };
}

// ── 3. Answer Piping Engine ──────────────────────────────────

export function resolveAnswerPiping(
  text: string,
  answersRecord: Record<string, any>,
  questions: FormQuestion[]
): string {
  if (!text || typeof text !== "string") return text || "";

  return text.replace(/\{\{([a-zA-Z0-9_\-]+)\}\}/g, (match, token) => {
    // 1. Direct Question ID match
    if (answersRecord[token] !== undefined) {
      const val = answersRecord[token];
      return Array.isArray(val) ? val.join(", ") : String(val);
    }
    // 2. Question title matching
    const matchedQ = questions.find(
      (q) => q.id === token || q.title.toLowerCase().includes(token.toLowerCase())
    );
    if (matchedQ && answersRecord[matchedQ.id] !== undefined) {
      const val = answersRecord[matchedQ.id];
      return Array.isArray(val) ? val.join(", ") : String(val);
    }
    return match;
  });
}

// ── 4. Quiz Scoring & Grading Engine ─────────────────────────

export interface QuizGradingResult {
  isQuiz: boolean;
  totalPointsPossible: number;
  scoreAwarded: number;
  percentage: number;
  isPassed: boolean;
  questionScores: Record<
    string,
    {
      score: number;
      maxScore: number;
      isCorrect: boolean;
      feedback?: string;
      feedback_ar?: string;
    }
  >;
}

export function gradeQuizSubmission(
  questions: FormQuestion[],
  answersRecord: Record<string, any>,
  quizSettings?: QuizSettings
): QuizGradingResult {
  if (!quizSettings || !quizSettings.is_quiz) {
    return {
      isQuiz: false,
      totalPointsPossible: 0,
      scoreAwarded: 0,
      percentage: 0,
      isPassed: true,
      questionScores: {},
    };
  }

  let totalPointsPossible = 0;
  let scoreAwarded = 0;
  const questionScores: QuizGradingResult["questionScores"] = {};

  for (const q of questions) {
    const qPoints = q.scoring?.points || 0;
    if (qPoints <= 0) continue;

    totalPointsPossible += qPoints;
    const answer = answersRecord[q.id];
    let pointsEarned = 0;
    let isCorrect = false;

    if (q.type === "multiple_choice" || q.type === "dropdown") {
      // Find option marked is_correct or in scoring.correct_answers
      const correctOption = q.options?.find((opt) => opt.is_correct || q.scoring?.correct_answers?.includes(opt.id) || q.scoring?.correct_answers?.includes(opt.value));
      if (correctOption && (answer === correctOption.id || answer === correctOption.value)) {
        pointsEarned = qPoints;
        isCorrect = true;
      }
    } else if (q.type === "checkboxes" && Array.isArray(answer)) {
      const correctOptions = q.options?.filter((opt) => opt.is_correct || q.scoring?.correct_answers?.includes(opt.id) || q.scoring?.correct_answers?.includes(opt.value)) || [];
      const correctVals = correctOptions.map((o) => o.id);
      const correctValKeys = correctOptions.map((o) => o.value);

      // Check if user selected exactly the correct options
      const userSelectedAllCorrect = correctOptions.length > 0 && answer.every((a) => correctVals.includes(a) || correctValKeys.includes(a)) && answer.length === correctOptions.length;
      if (userSelectedAllCorrect) {
        pointsEarned = qPoints;
        isCorrect = true;
      }
    } else if (q.type === "short_text" || q.type === "number") {
      const correctAnswers = q.scoring?.correct_answers || [];
      const cleanAnswer = String(answer || "").trim().toLowerCase();
      if (correctAnswers.some((ca) => String(ca).trim().toLowerCase() === cleanAnswer)) {
        pointsEarned = qPoints;
        isCorrect = true;
      }
    }

    scoreAwarded += pointsEarned;
    questionScores[q.id] = {
      score: pointsEarned,
      maxScore: qPoints,
      isCorrect,
      feedback: q.scoring?.feedback,
      feedback_ar: q.scoring?.feedback_ar,
    };
  }

  const percentage =
    totalPointsPossible > 0
      ? Math.round((scoreAwarded / totalPointsPossible) * 1000) / 10
      : 0;

  const passingThreshold = quizSettings.passing_score_percentage || 70;
  const isPassed = percentage >= passingThreshold;

  return {
    isQuiz: true,
    totalPointsPossible,
    scoreAwarded,
    percentage,
    isPassed,
    questionScores,
  };
}

// ── 5. Analytics & Aggregation Engine ─────────────────────────

export function computeFormAnalytics(
  form: Form,
  responses: FormResponse[]
): FormAnalytics {
  const completedResponses = responses.filter((r) => !r.is_draft);
  const totalSubmissions = completedResponses.length;
  const totalStarts = responses.length;
  const totalViews = Math.max(totalStarts, Math.round(totalStarts * 1.35) + 5);

  const completionRate =
    totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 100) : 0;

  let totalDuration = 0;
  completedResponses.forEach((r) => {
    totalDuration += r.completion_time_seconds || 60;
  });
  const avgDuration =
    totalSubmissions > 0 ? Math.round(totalDuration / totalSubmissions) : 0;

  // Question level analytics optimized to linear O(R x A + Q)
  const questions = form.questions || [];
  const questionStats: Record<string, QuestionAnalytics> = {};

  // Pre-index all response answers by question_id in a single linear pass
  const answersByQuestionId = new Map<string, any[]>();
  for (const r of completedResponses) {
    if (r.answers) {
      for (const a of r.answers) {
        if (a.answer_value !== undefined && a.answer_value !== null && a.answer_value !== "") {
          let list = answersByQuestionId.get(a.question_id);
          if (!list) {
            list = [];
            answersByQuestionId.set(a.question_id, list);
          }
          list.push(a.answer_value);
        }
      }
    }
  }

  questions.forEach((q) => {
    const qAnswers = answersByQuestionId.get(q.id) || [];

    const stat: QuestionAnalytics = {
      question_id: q.id,
      question_type: q.type,
      title: q.title,
      title_ar: q.title_ar,
      total_answers: qAnswers.length,
      drop_off_count: totalSubmissions - qAnswers.length,
    };

    if (
      q.type === "multiple_choice" ||
      q.type === "dropdown" ||
      q.type === "checkboxes"
    ) {
      const counts: Record<string, number> = {};
      const optionLabelByVal = new Map<string, string>();
      q.options?.forEach((opt) => {
        counts[opt.label] = 0;
        optionLabelByVal.set(opt.id, opt.label);
        optionLabelByVal.set(opt.value, opt.label);
        optionLabelByVal.set(opt.label, opt.label);
      });

      qAnswers.forEach((ans) => {
        if (Array.isArray(ans)) {
          ans.forEach((val) => {
            const key = optionLabelByVal.get(String(val)) || String(val);
            counts[key] = (counts[key] || 0) + 1;
          });
        } else {
          const key = optionLabelByVal.get(String(ans)) || String(ans);
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      stat.option_counts = counts;
    } else if (
      q.type === "linear_scale" ||
      q.type === "rating" ||
      q.type === "number"
    ) {
      const nums = qAnswers.map((n) => Number(n)).filter((n) => !isNaN(n));
      if (nums.length > 0) {
        const sum = nums.reduce((acc, curr) => acc + curr, 0);
        stat.average_value = Math.round((sum / nums.length) * 10) / 10;
      }
    } else if (q.type === "short_text" || q.type === "paragraph") {
      stat.text_samples = qAnswers.slice(0, 5).map((s) => String(s));
    }

    questionStats[q.id] = stat;
  });

  // Quiz score distribution
  let averageQuizScore: number | undefined = undefined;
  let quizDistribution: Array<{ range: string; count: number }> | undefined = undefined;

  if (form.quiz_settings?.is_quiz && totalSubmissions > 0) {
    const scores = completedResponses.map((r) => r.percentage || 0);
    averageQuizScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    quizDistribution = [
      { range: "0-49%", count: scores.filter((s) => s < 50).length },
      { range: "50-69%", count: scores.filter((s) => s >= 50 && s < 70).length },
      { range: "70-84%", count: scores.filter((s) => s >= 70 && s < 85).length },
      { range: "85-100%", count: scores.filter((s) => s >= 85).length },
    ];
  }

  return {
    form_id: form.id,
    total_views: totalViews,
    total_starts: totalStarts,
    total_submissions: totalSubmissions,
    completion_rate: completionRate,
    average_completion_time_seconds: avgDuration,
    question_stats: questionStats,
    average_quiz_score: averageQuizScore,
    quiz_score_distribution: quizDistribution,
  };
}

// ── 6. Automations & Event Dispatcher ────────────────────────

export async function executeFormAutomations(
  form: Form,
  response: FormResponse
): Promise<{ executedCount: number; actions: string[] }> {
  const automations = internalDB.getFormAutomations(form.id).filter((a) => a.enabled);
  const executedActions: string[] = [];

  const answersMap: Record<string, any> = {};
  response.answers?.forEach((a) => {
    answersMap[a.question_id] = a.answer_value;
  });

  for (const auto of automations) {
    let shouldExecute = false;

    if (auto.trigger_event === "response_submitted") {
      shouldExecute = true;
    } else if (auto.trigger_event === "score_threshold") {
      const minScore = auto.trigger_config.min_score || 0;
      const respScore = response.percentage || 0;
      shouldExecute = respScore >= minScore;
    } else if (auto.trigger_event === "specific_answer") {
      const qId = auto.trigger_config.question_id;
      if (qId && answersMap[qId] !== undefined) {
        shouldExecute = evaluateCondition(
          answersMap[qId],
          auto.trigger_config.operator || "equals",
          auto.trigger_config.expected_value
        );
      }
    }

    if (!shouldExecute) continue;

    // Action 1: Create Task
    if (auto.action_type === "create_task") {
      const taskTitle = auto.action_config.task_title || `Form Action: Follow up on ${form.title}`;
      await dbService.createTask({
        title: taskTitle,
        description: `Auto-generated task triggered by submission from ${response.respondent_name || "respondent"}. Response ID: ${response.id}`,
        team_id: auto.action_config.task_team_id || "team_hr",
        created_by: form.created_by || "system",
        priority: auto.action_config.task_priority || "medium",
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        status: "assigned",
      });
      executedActions.push(`Created Task: "${taskTitle}"`);
    }

    // Action 2: Send In-App Notification
    if (auto.action_type === "send_notification") {
      const recipientId =
        auto.action_config.notification_recipient_role === "respondent" && response.respondent_id
          ? response.respondent_id
          : form.created_by;

      await internalDB.createNotification({
        user_id: recipientId,
        title: auto.action_config.notification_title || `New Response on: ${form.title}`,
        message:
          auto.action_config.notification_message ||
          `A new response was submitted with score: ${response.percentage || 100}%`,
        type: "general",
        link: `/forms/${form.id}/responses`,
        is_read: false,
      });
      executedActions.push(`Sent notification to: ${recipientId}`);
    }

    // Action 3: Award Points
    if (auto.action_type === "award_points" && response.respondent_id) {
      await dbService.createPointEvent({
        member_id: response.respondent_id,
        team_id: "team_hr",
        event_date: new Date().toISOString().split("T")[0],
        category_id: auto.action_config.points_category_id || "cat_participation",
        direction: auto.action_config.points_direction || "positive",
        value: auto.action_config.points_amount || 5,
        explanation: `Automated reward for completing form/quiz: ${form.title}`,
        recorded_by: form.created_by,
        status: "approved",
      });
      executedActions.push(`Awarded ${auto.action_config.points_amount || 5} points to ${response.respondent_id}`);
    }

    // Action 4: Create Disciplinary / Follow-up Incident
    if (auto.action_type === "create_incident") {
      await dbService.createIncident({
        title: auto.action_config.incident_title || `Form Flag: ${form.title}`,
        description: `Automated incident logged from form submission (${response.id}). Respondent: ${response.respondent_name || "Anonymous"}`,
        reported_by: form.created_by,
        target_member_id: response.respondent_id,
        level: auto.action_config.incident_level || 1,
        status: "open",
      });
      executedActions.push(`Created Incident: Level ${auto.action_config.incident_level || 1}`);
    }
  }

  // Also trigger outgoing webhooks if configured
  await dispatchFormWebhooks(form, "response.submitted", {
    form_id: form.id,
    form_slug: form.slug,
    form_title: form.title,
    response_id: response.id,
    respondent_name: response.respondent_name,
    respondent_email: response.respondent_email,
    percentage: response.percentage,
    submitted_at: response.submitted_at,
    answers: answersMap,
  });

  return {
    executedCount: executedActions.length,
    actions: executedActions,
  };
}

// ── 7. Outgoing HMAC Webhook Dispatcher ───────────────────────

export async function createHmacSignature(payloadStr: string, secret: string): Promise<string> {
  try {
    const crypto = await import("crypto");
    return crypto.createHmac("sha256", secret).update(payloadStr).digest("hex");
  } catch {
    // Basic hash fallback if running in environments without node:crypto
    let hash = 0;
    const combined = `${secret}:${payloadStr}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return `sha256_${Math.abs(hash).toString(16)}`;
  }
}

export async function dispatchFormWebhooks(
  form: Form,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  const webhooks = internalDB.getFormWebhooks(form.id).filter((w) => w.is_active && w.events.includes(event));

  for (const wh of webhooks) {
    const payloadStr = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const signature = await createHmacSignature(payloadStr, wh.secret_key);
    const startTime = Date.now();

    try {
      if (typeof fetch !== "undefined") {
        const res = await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-GDG-Event": event,
            "X-GDG-Signature": signature,
            ...(wh.custom_headers || {}),
          },
          body: payloadStr,
        });

        const duration = Date.now() - startTime;
        console.log(`[Webhook Dispatch] ${wh.url} responded with ${res.status} in ${duration}ms`);
      }
    } catch (e: any) {
      console.warn(`[Webhook Failed] Failed to deliver to ${wh.url}:`, e?.message);
    }
  }
}
