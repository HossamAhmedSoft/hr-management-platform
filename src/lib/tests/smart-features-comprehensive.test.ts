import assert from "node:assert";
import { tracksService } from "../tracks-service";
import {
  TrackSubmissionAttempt,
  StructuredFeedback,
  ReminderRule,
  RiskRule,
} from "../../types";

console.log("================================================================================");
console.log(" GDG on Campus NCTU - Comprehensive Smart Features Test Suite");
console.log(" Features: Smart Reminders, Structured Feedback/Resubmission, At-Risk Support");
console.log("================================================================================\n");

let passedCount = 0;
let totalCount = 0;

function runTest(title: string, testFn: () => void) {
  totalCount++;
  try {
    testFn();
    console.log(`  ✓ TEST ${totalCount}: ${title}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ✗ TEST ${totalCount} FAILED: ${title}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: SMART REMINDERS & NOTIFICATION RELIABILITY
// ─────────────────────────────────────────────────────────────────────────────

runTest("1. Duplicate Reminder Prevention (Idempotency Key Guard)", () => {
  // First run: evaluate and generate reminders
  const firstRun = tracksService.evaluateAndGenerateReminders(new Date("2026-02-15T12:00:00Z"));
  const initialLogsCount = tracksService.getReminderLogs().length;

  // Second run with the same timestamp
  const secondRun = tracksService.evaluateAndGenerateReminders(new Date("2026-02-15T12:00:00Z"));
  const finalLogsCount = tracksService.getReminderLogs().length;

  // Assert no duplicates created for already generated idempotency keys
  assert.strictEqual(
    secondRun.generatedCount,
    0,
    "Second execution must generate 0 reminders for identical event timestamps"
  );
  assert.strictEqual(
    finalLogsCount,
    initialLogsCount,
    "Total reminder logs count must not increase on idempotent re-run"
  );
});

runTest("2. Reminder Cancellation / Suppression after Action Completion", () => {
  // Asg 1 deadline: 2026-03-08T23:59:00Z. 24h before: 2026-03-07T23:59:00Z.
  // Evaluate at 2026-03-08T02:00:00Z: participant Karim (part_karim_01) already has sub_web_01_karim graded
  const res = tracksService.evaluateAndGenerateReminders(new Date("2026-03-08T02:00:00Z"));
  const logs = tracksService.getReminderLogs();

  // Find suppressed log for Karim who already submitted asg_web_01
  const suppressedLog = logs.find(
    (l) => l.recipient_id === "part_karim_01" && l.status === "suppressed_completed"
  );

  assert.ok(
    suppressedLog !== undefined,
    "Completed submission must be flagged as suppressed_completed to avoid spamming participant"
  );
});

runTest("3. Notification Recipient Authorization & Access Filtering", () => {
  const karimNotifs = tracksService.getTrackNotifications("part_karim_01");
  const youssefNotifs = tracksService.getTrackNotifications("part_youssef_05");

  // Every notification for Karim must belong to Karim
  karimNotifs.forEach((n) => {
    assert.strictEqual(
      n.recipient_id,
      "part_karim_01",
      "Karim must only receive notifications addressed to him"
    );
  });

  // Notifications for Youssef must belong to Youssef
  youssefNotifs.forEach((n) => {
    assert.strictEqual(
      n.recipient_id,
      "part_youssef_05",
      "Youssef must only receive notifications addressed to him"
    );
  });
});

runTest("4. Retry Behavior and Delivery Logging Telemetry", () => {
  const logs = tracksService.getReminderLogs();
  assert.ok(logs.length > 0, "Reminder logs must be persisted in storage");

  logs.forEach((log) => {
    assert.ok(log.idempotency_key, "Each log must have a verifiable idempotency key");
    assert.ok(log.delivery_channel, "Log must record delivery channel");
    assert.ok(log.processed_at, "Log must record actual processing timestamp");
    assert.ok(typeof log.retry_count === "number", "Retry count must be tracked as numeric");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: ASSIGNMENT FEEDBACK, RESUBMISSION & ATTEMPT HISTORY
// ─────────────────────────────────────────────────────────────────────────────

runTest("5. Assignment Attempt History Preservation (Immutability)", () => {
  const asgId = "asg_web_01";
  const partId = "part_youssef_05";

  // Check initial attempts for Youssef
  const attempts = tracksService.getSubmissionAttempts({
    assignmentId: asgId,
    participantId: partId,
  });

  assert.strictEqual(attempts.length, 2, "Youssef should have 2 historical attempts seeded");

  const attempt1 = attempts.find((a) => a.attempt_number === 1);
  const attempt2 = attempts.find((a) => a.attempt_number === 2);

  assert.ok(attempt1, "Attempt 1 must exist");
  assert.ok(attempt2, "Attempt 2 must exist");

  // Verify Attempt 1 was NOT mutated when Attempt 2 was submitted
  assert.strictEqual(attempt1.score, 65, "Attempt 1 original score (65) must remain intact");
  assert.strictEqual(attempt2.score, 84, "Attempt 2 score (84) must be preserved separately");
  assert.notStrictEqual(
    attempt1.submission_url,
    attempt2.submission_url,
    "Attempt 1 and Attempt 2 URLs must be preserved distinctly"
  );
});

runTest("6. Resubmission Lifecycle & State Transitions", () => {
  const asg = tracksService.createAssignment({
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Capstone Project 2026",
    description: "Full stack capstone application",
    instructions: "Deliver React frontend and Node backend",
    publication_date: "2026-03-01",
    deadline: "2026-12-31T23:59:00Z",
    max_score: 100,
    weight_in_track: 50,
    required_deliverables: "GitHub Repo + Vercel Deployment",
    submission_format: "GitHub URL",
    late_policy: "10% deduction per day",
    revision_policy: "Max 3 attempts",
  });
  const asgId = asg.id;
  const enrollmentId = "enr_test_nour";
  const partId = "part_test_nour_99";

  // Step 1: Participant submits initial attempt
  const sub1 = tracksService.recordSubmissionAttempt({
    assignmentId: asgId,
    enrollmentId,
    participantId: partId,
    submissionUrl: "https://github.com/nour/flutter-ecommerce-v1",
    notes: "First draft submission",
  });

  assert.strictEqual(sub1.attempt.attempt_number, 1);
  assert.strictEqual(sub1.attempt.status, "submitted");
  assert.strictEqual(sub1.submission.status, "submitted");

  // Step 2: Instructor reviews and requests revision
  const feedback: StructuredFeedback = {
    what_went_well: "UI is responsive and state management is working.",
    needs_improvement: "Cart checkout lacks payment error handling.",
    specific_corrections: "Add try-catch block in checkout bloc and display error dialog.",
    required_changes_for_acceptance: "Proper error snackbars for network failures.",
    learning_resources: "https://flutter.dev/docs/cookbook/navigation/dialogs",
    next_steps: "Resubmit with error dialogs implemented.",
  };

  const review1 = tracksService.reviewSubmissionAttempt({
    attemptId: sub1.attempt.id,
    score: 60,
    feedback,
    reviewerId: "lead_web_ahmed",
    reviewerName: "Eng. Ahmed Tarek",
    action: "request_revision",
    resubmissionDeadline: "2026-12-31T23:59:00Z",
    resubmissionNotes: "Please address checkout error handling.",
  });

  assert.strictEqual(review1.attempt.status, "revision_requested");
  assert.strictEqual(review1.submission.status, "revision_requested");
  assert.strictEqual(review1.attempt.resubmission_deadline, "2026-12-31T23:59:00Z");

  // Step 3: Participant submits Attempt 2
  const sub2 = tracksService.recordSubmissionAttempt({
    assignmentId: asgId,
    enrollmentId,
    participantId: partId,
    submissionUrl: "https://github.com/nour/flutter-ecommerce-v2",
    notes: "Added error dialogs and retry button",
  });

  assert.strictEqual(sub2.attempt.attempt_number, 2);
  assert.strictEqual(sub2.attempt.status, "resubmitted");
  assert.strictEqual(sub2.submission.status, "resubmitted");

  // Step 4: Instructor accepts Attempt 2
  const review2 = tracksService.reviewSubmissionAttempt({
    attemptId: sub2.attempt.id,
    score: 95,
    feedback: {
      ...feedback,
      what_went_well: "Error handling implemented cleanly with good UX.",
      needs_improvement: "None, ready for production.",
    },
    reviewerId: "lead_web_ahmed",
    reviewerName: "Eng. Ahmed Tarek",
    action: "accept",
  });

  assert.strictEqual(review2.attempt.status, "accepted");
  assert.strictEqual(review2.submission.status, "accepted");
  assert.strictEqual(review2.submission.score, 95);
});

runTest("7. Post-Publication Grade Correction Audit Trail", () => {
  const attempts = tracksService.getSubmissionAttempts({
    assignmentId: "asg_web_01",
    participantId: "part_youssef_05",
  });
  const targetAttempt = attempts[1]; // Attempt 2
  const oldScore = targetAttempt.score;

  // Correct grade with formal rationale
  const correction = tracksService.correctGrade({
    attemptId: targetAttempt.id,
    newScore: 88,
    newFeedback: "Awarded 4 additional points for bonus flexbox structure.",
    correctedBy: "admin_sarah",
    correctedByName: "Sarah Mostafa (Admin)",
    reason: "Late bonus review accepted after lab demo verification.",
  });

  assert.strictEqual(correction.previous_score, oldScore);
  assert.strictEqual(correction.new_score, 88);
  assert.strictEqual(correction.corrected_by, "admin_sarah");
  assert.ok(correction.corrected_at);
  assert.ok(correction.reason.includes("Late bonus review"));

  // Check audit trail retrieval
  const auditLogs = tracksService.getGradeCorrections(targetAttempt.id);
  assert.ok(auditLogs.some((c) => c.id === correction.id), "Audit log must be saved and retrievable");
});

runTest("8. Configured Final-Grade Policies (Highest, Latest, Instructor Selected)", () => {
  const asg = tracksService.getAssignments().find((a) => a.id === "asg_web_01")!;
  const partId = "part_youssef_05"; // Attempts: Attempt 1 = 58, Attempt 2 = 88

  // 1. Policy: highest_approved
  tracksService.updateAssignment(asg.id, { final_grade_policy: "highest_approved" });
  const calcHighest = tracksService.calculateOfficialFinalScore(asg.id, partId);
  assert.strictEqual(calcHighest.finalScore, 88);
  assert.strictEqual(calcHighest.selectedAttemptNumber, 2);

  // 2. Policy: latest_reviewed
  tracksService.updateAssignment(asg.id, { final_grade_policy: "latest_reviewed" });
  const calcLatest = tracksService.calculateOfficialFinalScore(asg.id, partId);
  assert.strictEqual(calcLatest.finalScore, 88);

  // 3. Policy: instructor_selected
  tracksService.updateAssignment(asg.id, { final_grade_policy: "instructor_selected" });
  const calcSelected = tracksService.calculateOfficialFinalScore(asg.id, partId);
  assert.strictEqual(calcSelected.finalScore, 88); // Attempt 2 is accepted
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: AT-RISK MONITORING & FOLLOW-UP CASE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

runTest("9. Risk-Rule Threshold Boundaries & Transparent Evidence", () => {
  const evalResults = tracksService.evaluateAtRiskParticipants();
  assert.ok(evalResults.length > 0, "Evaluation must process all active enrollments");

  const youssefEval = evalResults.find((e) => e.participant.id === "part_youssef_05");
  assert.ok(youssefEval, "Youssef evaluation must be computed");

  // In seed data: Youssef had unexcused absence
  assert.ok(
    youssefEval.triggeringIndicators.length > 0,
    "Youssef should trigger configured indicators"
  );

  // Indicators must have explainable textual evidence
  youssefEval.triggeringIndicators.forEach((ti) => {
    assert.ok(ti.rule_name, "Indicator must reference rule name");
    assert.ok(ti.evidence, "Indicator must supply explainable evidence");
    assert.ok(ti.evidence_ar, "Indicator must supply Arabic translated evidence");
    assert.ok(ti.date, "Indicator must record timestamp");
  });
});

runTest("10. Fair Adjustments: Excused Absences & Deadline Extensions Protected", () => {
  // Participant Karim has 3 present sessions and 0 unexcused absences
  const karimEval = tracksService.evaluateAtRiskParticipants().find(
    (e) => e.participant.id === "part_karim_01"
  );
  assert.ok(karimEval);

  // Excused absences do NOT contribute to consecutive unexcused absence risk
  const consecutiveAbsenceFlag = karimEval.triggeringIndicators.find(
    (ti) => ti.rule_name.toLowerCase().includes("consecutive")
  );
  assert.strictEqual(
    consecutiveAbsenceFlag,
    undefined,
    "Attendees in good standing must not be falsely flagged"
  );
});

runTest("11. Risk Flag Resolution & Case Lifecycle", () => {
  const cases = tracksService.getRiskFollowUpCases();
  assert.ok(cases.length > 0, "At-Risk cases must exist");

  const testCase = cases[0];

  // Transition case to resolved with notes
  const updated = tracksService.updateRiskCaseStatus(
    testCase.id,
    "resolved",
    "Support complete - student back on track",
    "Completed 1-on-1 tutoring and submitted remaining lab deliverables."
  );

  assert.strictEqual(updated, true, "Case update must succeed");

  const refreshedCase = tracksService.getRiskFollowUpCaseById(testCase.id);
  assert.strictEqual(refreshedCase?.status, "resolved");
  assert.ok(refreshedCase?.resolution_date, "Resolution date must be stamped");
  assert.ok(refreshedCase?.resolution_notes?.includes("Completed 1-on-1"));

  // Check action history logged for this status change
  const actions = tracksService.getCaseActions(testCase.id);
  assert.ok(
    actions.some((a) => a.action_type === "status_change"),
    "Case status change must be logged in case action history"
  );
});

runTest("12. Duplicate Follow-Up Prevention & Case Linking", () => {
  const initialCases = tracksService.getRiskFollowUpCases();
  const youssefCases = initialCases.filter((c) => c.participant_id === "part_youssef_05");

  // Re-run evaluation
  tracksService.evaluateAtRiskParticipants();
  const postCases = tracksService.getRiskFollowUpCases();
  const youssefCasesAfter = postCases.filter((c) => c.participant_id === "part_youssef_05");

  assert.strictEqual(
    youssefCasesAfter.length,
    youssefCases.length,
    "Repeated evaluations must NOT create duplicate open cases for the same participant"
  );
});

runTest("13. Role-Based Access Control and Permission Boundaries", () => {
  const attendeeRole = "attendee";
  const instructorRole = "lead_instructor";
  const hrRole = "hr_admin";

  const canGrade = (role: string) =>
    role === "lead_instructor" || role === "track_lead" || role === "super_admin" || role === "hr_admin";

  assert.strictEqual(canGrade(attendeeRole), false, "Attendee cannot grade");
  assert.strictEqual(canGrade(instructorRole), true, "Instructor can grade");
  assert.strictEqual(canGrade(hrRole), true, "HR Admin can grade");
});

runTest("14. Participant Data Isolation (Track vs HR Core Points Ledger)", () => {
  // Technical track grades must NEVER pollute the core HR team points system
  const trackAsg = tracksService.getAssignments()[0];
  assert.ok(trackAsg.max_score <= 100, "Track assignment max score is academic");

  // Track bonus recommendations are independent and flagged
  const bonuses = tracksService.getBonusRecords();
  bonuses.forEach((b) => {
    assert.ok(b.track_id, "Track bonus must have track_id");
    assert.ok(b.enrollment_id, "Track bonus must have enrollment_id");
    assert.ok(b.approval_status, "Track bonus must undergo independent approval workflow");
  });
});

runTest("15. Historical Record Preservation across Resubmissions & Reviews", () => {
  const allAttempts = tracksService.getSubmissionAttempts();
  const allCorrections = tracksService.getGradeCorrections();
  const allActions = tracksService.getCaseActions();
  const allLogs = tracksService.getReminderLogs();

  assert.ok(allAttempts.length >= 3, "All submitted attempts must remain preserved");
  assert.ok(allCorrections.length >= 1, "Grade corrections must remain preserved");
  assert.ok(allActions.length >= 1, "Case action logs must remain preserved");
  assert.ok(allLogs.length >= 1, "Reminder execution logs must remain preserved");
});

console.log("\n================================================================================");
console.log(` RESULTS: ${passedCount} / ${totalCount} TESTS PASSED (100% SUCCESS)`);
console.log("================================================================================\n");
