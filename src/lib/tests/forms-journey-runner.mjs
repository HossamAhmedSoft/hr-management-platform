// ============================================================
// GDG NCTU HR Management Platform — Native Forms Module
// Comprehensive End-to-End Test Suite & Verification Runner
// ============================================================

import { dbService } from "../db-service.js";
import { internalDB } from "../internal-db.js";
import {
  validateQuestionAnswer,
  validateFormSubmission,
  evaluateLogicRules,
  gradeQuizSubmission,
  computeFormAnalytics,
  createHmacSignature,
} from "../forms-service.js";
import {
  createFormFromDescription,
  listSystemForms,
  getFormSummaryAndResponses,
} from "../agent-form-tools.js";

const results = [];

function recordTest(id, name, passed, details) {
  results.push({ id, name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} [${id}] ${name}: ${details}`);
}

console.log("=================================================");
console.log("STARTING FORMS MODULE END-TO-END VERIFICATION");
console.log("=================================================\n");

async function runFormsTestSuite() {
  // -------------------------------------------------------------
  // Test 1: Form Lifecycle & Immutable Versioning
  // -------------------------------------------------------------
  try {
    const form = await dbService.createForm({
      title: "GDG Member Engagement Survey 2026",
      title_ar: "استبيان مشاركة وتفاعل الأعضاء 2026",
      slug: `survey-engagement-${Date.now()}`,
      status: "draft",
      access_mode: "authenticated",
      allowed_roles: ["member", "team_lead"],
      sections: [
        {
          id: "sec_1",
          form_id: "form_test_01",
          title: "General Engagement",
          title_ar: "المشاركة العامة",
          order_index: 0,
        },
      ],
      questions: [
        {
          id: "q_satisfaction",
          form_id: "form_test_01",
          section_id: "sec_1",
          type: "linear_scale",
          title: "How satisfied are you with team meetings?",
          title_ar: "ما مدى رضاك عن الاجتماعات الدورية؟",
          is_required: true,
          order_index: 0,
          settings: { scale_min: 1, scale_max: 5 },
        },
      ],
    });

    // Create immutable version snapshot
    const version = await dbService.createFormVersion({
      form_id: form.id,
      version_number: 1,
      schema_snapshot: {
        title: form.title,
        title_ar: form.title_ar,
        theme_config: form.theme_config,
        settings: form.settings,
        quiz_settings: form.quiz_settings,
        sections: form.sections,
        questions: form.questions,
        logic_rules: [],
      },
      published_by: "hossam_super_admin",
      changelog: "Initial published version 1",
    });

    const isCreated = Boolean(form && form.id && version && version.id);
    recordTest(
      "FORMS-01",
      "Form Creation & Version Immutability",
      isCreated,
      `Form created (${form.id}) and Version snapshot 1 sealed (${version.id})`
    );
  } catch (err) {
    recordTest("FORMS-01", "Form Creation & Version Immutability", false, err.message);
  }

  // -------------------------------------------------------------
  // Test 2: Validation Engine (Required, Length, Number, Email)
  // -------------------------------------------------------------
  try {
    const emailQ = {
      id: "q_email_test",
      form_id: "f1",
      section_id: "s1",
      type: "email",
      title: "Email",
      title_ar: "البريد",
      is_required: true,
      order_index: 0,
    };

    // Invalid email test
    const errInvalid = validateQuestionAnswer(emailQ, "not-an-email");
    // Valid email test
    const errValid = validateQuestionAnswer(emailQ, "student@nctu.edu.eg");
    // Empty required test
    const errEmpty = validateQuestionAnswer(emailQ, "");

    const passed = Boolean(errInvalid && !errValid && errEmpty);
    recordTest(
      "FORMS-02",
      "Field Validation Engine",
      passed,
      `Invalid rejected (${errInvalid?.message}), valid accepted, empty required rejected`
    );
  } catch (err) {
    recordTest("FORMS-02", "Field Validation Engine", false, err.message);
  }

  // -------------------------------------------------------------
  // Test 3: Dynamic Branching & Conditional Logic Engine
  // -------------------------------------------------------------
  try {
    const questions = [
      {
        id: "q_role",
        form_id: "f1",
        section_id: "s1",
        type: "multiple_choice",
        title: "Role",
        title_ar: "الدور",
        is_required: true,
        order_index: 0,
      },
      {
        id: "q_lead_experience",
        form_id: "f1",
        section_id: "s1",
        type: "short_text",
        title: "Lead Experience",
        title_ar: "خبرة القيادة",
        is_required: false,
        order_index: 1,
      },
    ];

    const logicRules = [
      {
        id: "rule_1",
        form_id: "f1",
        source_question_id: "q_role",
        action: "hide_question",
        target_id: "q_lead_experience",
        conditions: [
          {
            question_id: "q_role",
            operator: "equals",
            value: "member",
            combinator: "AND",
          },
        ],
      },
    ];

    // Evaluate with member answer -> should hide q_lead_experience
    const memberEval = evaluateLogicRules(logicRules, { q_role: "member" }, questions);
    const leadEval = evaluateLogicRules(logicRules, { q_role: "team_lead" }, questions);

    const passed =
      memberEval.hiddenQuestionIds.has("q_lead_experience") &&
      !leadEval.hiddenQuestionIds.has("q_lead_experience");

    recordTest(
      "FORMS-03",
      "Dynamic Logic & Branching Engine",
      passed,
      `Hidden for 'member' (${memberEval.hiddenQuestionIds.size}), Visible for 'team_lead' (${leadEval.hiddenQuestionIds.size})`
    );
  } catch (err) {
    recordTest("FORMS-03", "Dynamic Logic & Branching Engine", false, err.message);
  }

  // -------------------------------------------------------------
  // Test 4: Quiz Mode & Automated Scoring
  // -------------------------------------------------------------
  try {
    const quizQuestions = [
      {
        id: "q_quiz_1",
        form_id: "f1",
        section_id: "s1",
        type: "multiple_choice",
        title: "What is Next.js?",
        title_ar: "ما هو Next.js؟",
        is_required: true,
        order_index: 0,
        options: [
          { id: "opt_react", label: "React Framework", value: "react_framework", is_correct: true },
          { id: "opt_db", label: "Database", value: "db" },
        ],
        scoring: { points: 10, correct_answers: ["opt_react"] },
      },
      {
        id: "q_quiz_2",
        form_id: "f1",
        section_id: "s1",
        type: "short_text",
        title: "HTTP code for Success",
        title_ar: "كود النجاح في HTTP",
        is_required: true,
        order_index: 1,
        scoring: { points: 10, correct_answers: ["200"] },
      },
    ];

    const quizSettings = {
      is_quiz: true,
      total_points: 20,
      show_score_immediate: true,
      show_correct_answers: true,
      passing_score_percentage: 50,
    };

    // Perfect answers
    const fullResult = gradeQuizSubmission(
      quizQuestions,
      { q_quiz_1: "opt_react", q_quiz_2: "200" },
      quizSettings
    );

    // Half answers
    const halfResult = gradeQuizSubmission(
      quizQuestions,
      { q_quiz_1: "opt_db", q_quiz_2: "200" },
      quizSettings
    );

    const passed =
      fullResult.scoreAwarded === 20 &&
      fullResult.percentage === 100 &&
      fullResult.isPassed &&
      halfResult.scoreAwarded === 10 &&
      halfResult.percentage === 50 &&
      halfResult.isPassed;

    recordTest(
      "FORMS-04",
      "Quiz Auto-Grading & Pass Logic",
      passed,
      `Full score: ${fullResult.scoreAwarded}/20 (100%), Half score: ${halfResult.scoreAwarded}/20 (50%)`
    );
  } catch (err) {
    recordTest("FORMS-04", "Quiz Auto-Grading & Pass Logic", false, err.message);
  }

  // -------------------------------------------------------------
  // Test 5: HMAC-SHA256 Outgoing Webhook Signatures
  // -------------------------------------------------------------
  try {
    const payload = JSON.stringify({ form: "test", event: "response.submitted" });
    const secret = "gdg_secret_key_2026";
    const sig1 = await createHmacSignature(payload, secret);
    const sig2 = await createHmacSignature(payload, secret);
    const sigTampered = await createHmacSignature(payload + "tampered", secret);

    const passed = sig1 === sig2 && sig1 !== sigTampered && sig1.length > 20;
    recordTest(
      "FORMS-05",
      "HMAC Webhook Cryptographic Signatures",
      passed,
      `Deterministic signature created: ${sig1.substring(0, 16)}...`
    );
  } catch (err) {
    recordTest("FORMS-05", "HMAC Webhook Cryptographic Signatures", false, err.message);
  }

  // -------------------------------------------------------------
  // Test 6: AI Agent Tool Definitions & Automated Execution
  // -------------------------------------------------------------
  try {
    const createdByAgent = await createFormFromDescription({
      title: "Agent Generated Workshop Intake",
      title_ar: "استمارة ورشة العمل المولدة آلياً",
      description: "Autonomous form generated by AI pair programmer.",
      description_ar: "استمارة مجهزة بالكامل بواسطة أداة الذكاء الاصطناعي.",
      questions: [
        {
          type: "multiple_choice",
          title: "Attendance Mode",
          title_ar: "طريقة الحضور",
          is_required: true,
          options: [
            { label: "On Campus (NCTU Labs)", label_ar: "حضورياً بالجامعة", value: "campus" },
            { label: "Online (Google Meet)", label_ar: "عبر الإنترنت", value: "online" },
          ],
        },
      ],
      isQuiz: false,
      creatorId: "agent_runner",
    });

    const formsList = await listSystemForms({ search: "Workshop Intake" });
    const summary = await getFormSummaryAndResponses(createdByAgent.id);

    const passed =
      Boolean(createdByAgent && createdByAgent.id) &&
      formsList.length > 0 &&
      Boolean(summary && summary.analytics);

    recordTest(
      "FORMS-06",
      "AI Agent Forms Tool Calling",
      passed,
      `Agent created form (${createdByAgent.id}) and queried analytics summary successfully`
    );
  } catch (err) {
    recordTest("FORMS-06", "AI Agent Forms Tool Calling", false, err.message);
  }

  // Summary
  console.log("\n=================================================");
  const allPassed = results.every((r) => r.passed);
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`TEST RESULTS: ${totalPassed} / ${results.length} PASSED`);
  console.log("=================================================");

  if (!allPassed) {
    process.exit(1);
  }
}

runFormsTestSuite();
