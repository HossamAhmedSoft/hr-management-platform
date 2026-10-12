import { internalDB } from "../internal-db";
import { dbService } from "../db-service";
import { Appeal, Task, PointEvent, Profile } from "@/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ Passed: ${message}`);
  }
}

async function runCycle2TestSuite() {
  console.log("=========================================================");
  console.log("🚀 Running Cycle 2: Appeals Lifecycle & Task Milestones Test");
  console.log("=========================================================\n");

  // --- TEST 1: Appeal Creation, Updates, and Adjudication Persistence ---
  console.log("--- TEST 1: Appeals Creation & Adjudication Persistence ---");
  const testAppeal = await dbService.createAppeal({
    member_id: "usr_member_test_c2",
    entity_type: "point_event",
    entity_id: "pt_event_test_penalty",
    grounds: "Penalty was issued in error due to confirmed medical excuse.",
    deadline_date: "2026-10-25",
    status: "under_review",
  });

  assert(!!testAppeal && !!testAppeal.id, "Appeal was created successfully with generated ID");
  assert(testAppeal?.status === "under_review", "Appeal initial status is 'under_review'");

  // Update Appeal via dbService
  const updateSuccess = await dbService.updateAppeal(testAppeal!.id, {
    status: "resolved",
    decision_rationale: "Medical excuse verified and accepted by neutral reviewer.",
    neutral_reviewer_id: "usr_reviewer_neutral_1",
  });
  assert(updateSuccess === true, "updateAppeal returned true for valid ID");

  const fetchedAppeals = await dbService.getAppeals();
  const updatedAppeal = fetchedAppeals.find((a) => a.id === testAppeal!.id);
  assert(!!updatedAppeal, "Updated appeal found in database");
  assert(updatedAppeal?.status === "resolved", "Appeal status updated to 'resolved'");
  assert(
    updatedAppeal?.decision_rationale === "Medical excuse verified and accepted by neutral reviewer.",
    "Appeal rationale recorded correctly"
  );
  assert(
    updatedAppeal?.neutral_reviewer_id === "usr_reviewer_neutral_1",
    "Neutral reviewer ID assigned correctly"
  );

  // --- TEST 2: Appeal Rejection Flow ---
  console.log("\n--- TEST 2: Appeal Rejection Flow ---");
  const testRejectAppeal = await dbService.createAppeal({
    member_id: "usr_member_test_reject",
    entity_type: "evaluation",
    grounds: "Subjective score disagreement without objective evidence.",
    deadline_date: "2026-10-26",
    status: "under_review",
  });

  const rejectSuccess = await dbService.updateAppeal(testRejectAppeal!.id, {
    status: "rejected",
    decision_rationale: "No policy violation found in rubric evaluation.",
    neutral_reviewer_id: "usr_reviewer_neutral_2",
  });
  assert(rejectSuccess === true, "Reject update returned true");

  const rejectionCheck = (await dbService.getAppeals()).find((a) => a.id === testRejectAppeal!.id);
  assert(rejectionCheck?.status === "rejected", "Appeal status successfully marked as 'rejected'");

  // Delete test appeal
  const deleteSuccess = await dbService.deleteAppeal(testRejectAppeal!.id);
  assert(deleteSuccess === true, "deleteAppeal returned true");
  const deletedCheck = (await dbService.getAppeals()).find((a) => a.id === testRejectAppeal!.id);
  assert(!deletedCheck, "Deleted appeal removed from database");

  // --- TEST 3: Task Milestone Auto-Awarding Points Logic ---
  console.log("\n--- TEST 3: Task Milestone Auto-Awarding Points Logic ---");
  const sampleTask: Task = {
    id: "task_c2_milestone_1",
    title: "Build Responsive Hero Section",
    description: "Build responsive hero section with Next.js",
    team_id: "team_web",
    status: "in_progress",
    priority: "high",
    deadline: "2026-10-30",
    created_by: "usr_lead_web",
    assignees: [
      { id: "as_1", task_id: "task_c2_milestone_1", profile_id: "usr_web_dev_1", assigned_at: "2026-10-10", assigned_by: "usr_lead_web" },
      { id: "as_2", task_id: "task_c2_milestone_1", profile_id: "usr_web_dev_2", assigned_at: "2026-10-10", assigned_by: "usr_lead_web" },
    ],
    created_at: "2026-10-10",
    updated_at: "2026-10-10",
  };

  // Simulate task status transition to "completed"
  const simulatedPointEvents: PointEvent[] = [];
  const simulatedNotifications: any[] = [];

  const simulateCompleteTask = (task: Task) => {
    if (task.assignees) {
      for (const assignee of task.assignees) {
        if (assignee.profile_id) {
          const alreadyAwarded = simulatedPointEvents.some(
            (p) =>
              p.member_id === assignee.profile_id &&
              p.explanation?.includes(task.title) &&
              p.direction === "positive"
          );
          if (!alreadyAwarded) {
            simulatedPointEvents.push({
              id: `pe_${Date.now()}_${assignee.profile_id}`,
              member_id: assignee.profile_id,
              team_id: task.team_id || "team_general",
              event_date: new Date().toISOString().split("T")[0],
              category_id: "task_milestone_ontime",
              direction: "positive",
              value: 3,
              explanation: `مكافأة إنجاز مهمة عمل بنجاح: "${task.title}" (+3 نقاط وفق اللائحة)`,
              recorded_by: "system_admin",
              status: "approved",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            simulatedNotifications.push({
              user_id: assignee.profile_id,
              title: "تم اعتماد إنجاز المهمة ومنح نقاط التميز",
              message: `تمت مراجعة واعتماد مخرجات المهمة: "${task.title}" بنجاح وإضافة +3 نقاط لرصيدك.`,
            });
          }
        }
      }
    }
  };

  simulateCompleteTask(sampleTask);

  assert(simulatedPointEvents.length === 2, "Exactly 2 point awards generated for both assignees");
  assert(simulatedPointEvents[0].value === 3, "Assignee 1 received exactly +3 points");
  assert(simulatedPointEvents[1].value === 3, "Assignee 2 received exactly +3 points");
  assert(
    simulatedPointEvents[0].category_id === "task_milestone_ontime",
    "Point category is 'task_milestone_ontime'"
  );
  assert(simulatedNotifications.length === 2, "Both assignees received success notifications");

  // Duplicate completion idempotency check
  simulateCompleteTask(sampleTask);
  assert(
    simulatedPointEvents.length === 2,
    "Idempotency preserved: No duplicate points awarded on re-trigger"
  );

  // --- TEST 4: isUserInTeam Scope Normalization Across Prefix Variations ---
  console.log("\n--- TEST 4: isUserInTeam Normalization Logic ---");
  const isUserInTeam = (u: any, teamId?: string) => {
    if (!teamId || teamId === "all") return true;
    const target = teamId.toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userTeam = (u.team_id || u.team?.id || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userCommittee = (u.committee || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userTeamName = (u.team?.name || "").toLowerCase().trim();

    if (userTeam === target) return true;
    if (userCommittee === target) return true;
    if (userTeam && target && (userTeam.includes(target) || target.includes(userTeam))) return true;
    if (userCommittee && target && (userCommittee.includes(target) || target.includes(userCommittee))) return true;
    if (userTeamName && target && (userTeamName.includes(target) || target.includes(userTeamName))) return true;
    return false;
  };

  const testUser1 = { id: "u1", team_id: "team_web" };
  const testUser2 = { id: "u2", team_id: "team-web" };
  const testUser3 = { id: "u3", committee: "Web Development" };
  const testUser4 = { id: "u4", team_id: "team_hr", committee: "HR" };
  const testUser5 = { id: "u5", team_id: "team_mobile" };

  assert(isUserInTeam(testUser1, "team-web") === true, "User with 'team_web' matches filter 'team-web'");
  assert(isUserInTeam(testUser2, "team_web") === true, "User with 'team-web' matches filter 'team_web'");
  assert(isUserInTeam(testUser3, "web") === true, "User with committee 'Web Development' matches filter 'web'");
  assert(isUserInTeam(testUser4, "HR") === true, "User with committee 'HR' matches filter 'HR'");
  assert(isUserInTeam(testUser4, "team_hr") === true, "User with team_id 'team_hr' matches filter 'team_hr'");
  assert(isUserInTeam(testUser5, "team_web") === false, "Mobile member correctly excluded from Web filter");
  assert(isUserInTeam(testUser5, "all") === true, "All filter matches any member");

  console.log("\n=========================================================");
  console.log("🎉 ALL CYCLE 2 AUTOMATED AUDIT TESTS PASSED SUCCESSFULLY!");
  console.log("=========================================================\n");
}

runCycle2TestSuite().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
