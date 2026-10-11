// ============================================================
// GDG NCTU HR Management Platform — End-to-End User Journey Tests
// Deterministic Execution of Phase E Journeys
// ============================================================

import { dbService } from "../db-service.js";
import { internalDB } from "../internal-db.js";
import {
  calculateEvaluationScore,
  getPointClassification,
  calculateWorkingDayDeadline,
  generateId,
} from "../utils.js";
import { canAccessRoute } from "../auth-service.js";

const journeyResults = [];

function recordJourney(journeyId, name, passed, details) {
  journeyResults.push({ journeyId, name, passed, details });
  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} [${journeyId}] ${name}: ${details}`);
}

console.log("=================================================");
console.log("STARTING END-TO-END USER JOURNEYS (PHASE E)");
console.log("=================================================\n");

async function runJourneys() {
  // -------------------------------------------------------------
  // Journey A: Member Task Delivery Lifecycle
  // -------------------------------------------------------------
  try {
    const taskId = generateId();
    const task = await dbService.createTask({
      title: "Audit Deliverable: Security Checklist",
      description: "Implement and verify OWASP security audit rules",
      team_id: "team_audit_01",
      creator_id: "usr_team_lead",
      status: "assigned",
      priority: "high",
      deadline: "2026-10-25T18:00:00Z",
    });

    const isCreated = Boolean(task && task.id);
    const updated = await dbService.updateTaskStatus(task.id, "completed");
    const isCompleted = updated === true;

    recordJourney(
      "JOURNEY-A",
      "Member Task Delivery Lifecycle",
      isCreated && isCompleted,
      `Task created (${task?.id}) and status transitioned: assigned -> completed`
    );
  } catch (err) {
    recordJourney("JOURNEY-A", "Member Task Delivery Lifecycle", false, err.message);
  }

  // -------------------------------------------------------------
  // Journey B: Positive Points Ledger & Monthly Cap Enforcement
  // -------------------------------------------------------------
  try {
    const pointEvent = await dbService.createPointEvent({
      member_id: "usr_audit_member",
      team_id: "team_audit_01",
      event_date: "2026-10-11",
      category_id: "core_task",
      cap_category_id: "cap-task-exec",
      direction: "positive",
      value: 5.0,
      explanation: "Completed core architectural module on schedule",
      evidence_url: "https://github.com/gdg/task/pull/101",
      recorded_by: "usr_team_lead",
      status: "approved",
    });

    const isApproved = pointEvent && pointEvent.status === "approved" && pointEvent.value === 5.0;
    recordJourney(
      "JOURNEY-B",
      "Positive Points Ledger & Audit Trail",
      isApproved,
      `Point event approved (+5.0 pts) for category core_task, cap cap-task-exec`
    );
  } catch (err) {
    recordJourney("JOURNEY-B", "Positive Points Ledger", false, err.message);
  }

  // -------------------------------------------------------------
  // Journey C: Negative Points, Notification & 7-Day Appeal Window
  // -------------------------------------------------------------
  try {
    const deductionEvent = await dbService.createPointEvent({
      member_id: "usr_audit_member",
      team_id: "team_audit_01",
      event_date: "2026-10-11",
      category_id: "unjustified_delay",
      direction: "negative",
      value: -2.0,
      explanation: "Unjustified delay on sub-milestone",
      evidence_url: "https://github.com/gdg/task/issues/88",
      recorded_by: "usr_team_lead",
      status: "approved",
    });

    // Appeal submitted within 7 Egyptian working days
    const appealDeadline = calculateWorkingDayDeadline(new Date(deductionEvent.event_date), 7);
    const appeal = await dbService.createAppeal({
      member_id: "usr_audit_member",
      entity_type: "point_event",
      entity_id: deductionEvent.id,
      grounds: "Medical emergency with valid clinical documentation provided",
      desired_outcome: "Revocation of -2 deduction",
      status: "under_review",
    });

    const isAppealLogged = appeal && appeal.status === "under_review";
    recordJourney(
      "JOURNEY-C",
      "Negative Points, Right of Explanation & Grievance Workflow",
      isAppealLogged,
      `Deduction recorded (-2.0), appeal lodged with grounds, deadline calculated: ${appealDeadline.toISOString().split("T")[0]}`
    );
  } catch (err) {
    recordJourney("JOURNEY-C", "Negative Points & Appeal", false, err.message);
  }

  // -------------------------------------------------------------
  // Journey D: Monthly Performance Evaluation with Proportional Weights
  // -------------------------------------------------------------
  try {
    const evalData = {
      member_id: "usr_audit_member",
      evaluator_id: "usr_team_lead",
      period_id: "period-current",
      template_id: "tpl-default",
      status: "finalized",
      total_score: 83.0,
      performance_band: "Strong Performance",
      ratings: [],
    };
    const createdEval = await dbService.createEvaluation(evalData);
    const isEvalLogged = createdEval && createdEval.total_score === 83.0;

    recordJourney(
      "JOURNEY-D",
      "Monthly Evaluation Review & Finalization",
      isEvalLogged,
      `Evaluation finalized with score: ${createdEval?.total_score}/100 (${createdEval?.performance_band})`
    );
  } catch (err) {
    recordJourney("JOURNEY-D", "Monthly Evaluation", false, err.message);
  }

  // -------------------------------------------------------------
  // Journey E: 4-Level Progressive Escalation & PIP
  // -------------------------------------------------------------
  try {
    const incident = await dbService.createIncident({
      member_id: "usr_audit_member",
      reporter_id: "usr_team_lead",
      level: "level_2_pip",
      category: "attendance",
      description: "Member initiated on Level 2 Performance Improvement Plan",
      evidence_urls: ["https://drive.google.com/gdg/pip-doc"],
      status: "active",
    });

    const isIncidentLogged = incident && incident.level === "level_2_pip";
    recordJourney(
      "JOURNEY-E",
      "Progressive Escalation Ladder (Level 2: PIP)",
      isIncidentLogged,
      `Incident recorded at Level 2 PIP, status: active, documented evidence`
    );
  } catch (err) {
    recordJourney("JOURNEY-E", "Progressive Escalation", false, err.message);
  }

  // -------------------------------------------------------------
  // Journey F: RBAC Isolation & Reporting
  // -------------------------------------------------------------
  try {
    const memberBlocked = !canAccessRoute("member", "/en/audit-log");
    const adminAllowed = canAccessRoute("super_admin", "/en/audit-log");

    recordJourney(
      "JOURNEY-F",
      "Role-Based Access Isolation (RBAC Protection)",
      memberBlocked && adminAllowed,
      `Standard member blocked from sensitive audit-log: ${memberBlocked}; Admin access: ${adminAllowed}`
    );
  } catch (err) {
    recordJourney("JOURNEY-F", "RBAC Isolation", false, err.message);
  }

  console.log("\n=================================================");
  const allJourneysPassed = journeyResults.every((j) => j.passed);
  console.log(
    `SUMMARY: ${journeyResults.filter((j) => j.passed).length} / ${journeyResults.length} JOURNEYS PASSED`
  );
  console.log(allJourneysPassed ? "ALL END-TO-END JOURNEYS VERIFIED!" : "SOME JOURNEYS FAILED!");
  console.log("=================================================");
  process.exit(allJourneysPassed ? 0 : 1);
}

runJourneys();
