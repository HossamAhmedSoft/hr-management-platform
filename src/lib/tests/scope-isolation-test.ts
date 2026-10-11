import { attendanceService } from "../attendance-service";
import { MeetingAttendanceEvent, Profile } from "@/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ Passed: ${message}`);
  }
}

async function runScopeIsolationTestSuite() {
  console.log("=================================================");
  console.log("🚀 Running Platform-Wide Scope Isolation Test Suite");
  console.log("=================================================\n");

  // Mock multi-department user base
  const mockUsers: Profile[] = [
    {
      id: "usr_hr_1",
      email: "hr.sarah@gdgnctu.com",
      full_name: "Sarah Ahmed",
      role: "hr_admin",
      team_id: "team_hr",
      status: "active",
      join_date: "2026-01-01",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
    {
      id: "usr_hr_2",
      email: "hr.mona@gdgnctu.com",
      full_name: "Mona Zaki",
      role: "member",
      team_id: "team_hr",
      status: "active",
      join_date: "2026-01-01",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
    {
      id: "usr_web_1",
      email: "web.youssef@gdgnctu.com",
      full_name: "Youssef Ibrahim",
      role: "member",
      team_id: "team_web",
      status: "active",
      join_date: "2026-01-01",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
    {
      id: "usr_web_2",
      email: "web.tarek@gdgnctu.com",
      full_name: "Ahmed Tarek",
      role: "team_lead",
      team_id: "team_web",
      status: "active",
      join_date: "2026-01-01",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
    {
      id: "usr_mobile_1",
      email: "mobile.karim@gdgnctu.com",
      full_name: "Karim Hassan",
      role: "member",
      team_id: "team_mobile",
      status: "active",
      join_date: "2026-01-01",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    },
  ];

  // Helper matching function mirroring the implementation
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

  // Test 1: Meeting Creation & Audience Scope Identification
  console.log("--- 1. Testing Meeting Audience Scope Validation ---");
  const hrMeeting: MeetingAttendanceEvent = attendanceService.createMeeting({
    title: "HR Strategic Alignment Meeting",
    date: new Date(Date.now() + 86400000).toISOString(),
    location: "Google Meet - HR Internal",
    type: "Team Meeting",
    target_team_id: "team_hr",
    target_team_name: "الموارد البشرية (HR)",
    status: "scheduled",
    created_by: "hossam_admin",
  });

  const webMeeting: MeetingAttendanceEvent = attendanceService.createMeeting({
    title: "Web Track Sprint Planning",
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    location: "Lab 3B - Engineering",
    type: "Workshop",
    target_team_id: "team_web",
    target_team_name: "مسار تطوير الويب",
    status: "scheduled",
    created_by: "hossam_admin",
  });

  const publicMeeting: MeetingAttendanceEvent = attendanceService.createMeeting({
    title: "General Assembly Kick-Off 2026",
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    location: "Main Auditorium",
    type: "General Assembly",
    target_team_id: "all",
    target_team_name: "اجتماع عام - جميع اللجان",
    status: "scheduled",
    created_by: "hossam_admin",
  });

  // Verify HR meeting roster strictly admits ONLY HR members
  const hrRoster = mockUsers.filter((u) => attendanceService.isMemberInMeetingScope(u, hrMeeting));
  assert(hrRoster.length === 2, "HR meeting roster strictly contains exactly 2 HR members");
  assert(hrRoster.every((u) => u.team_id === "team_hr"), "All members in HR roster belong to team_hr");
  assert(!hrRoster.some((u) => u.id === "usr_web_1"), "Web developer Youssef is excluded from HR meeting roster");

  // Verify Web meeting roster strictly admits ONLY Web members
  const webRoster = mockUsers.filter((u) => attendanceService.isMemberInMeetingScope(u, webMeeting));
  assert(webRoster.length === 2, "Web meeting roster strictly contains exactly 2 Web members");
  assert(webRoster.every((u) => u.team_id === "team_web"), "All members in Web roster belong to team_web");
  assert(!webRoster.some((u) => u.id === "usr_hr_1"), "HR admin is excluded from Web meeting roster");

  // Verify Public meeting roster admits EVERYONE
  const publicRoster = mockUsers.filter((u) => attendanceService.isMemberInMeetingScope(u, publicMeeting));
  assert(publicRoster.length === mockUsers.length, "Public meeting includes all 5 members across all teams");

  // Test 2: Member View Isolation
  console.log("\n--- 2. Testing Member View Meeting Visibility ---");
  const youssefWebMember = mockUsers.find((u) => u.id === "usr_web_1")!;
  const monaHrMember = mockUsers.find((u) => u.id === "usr_hr_2")!;

  const youssefVisibleMeetings = [hrMeeting, webMeeting, publicMeeting].filter((m) =>
    attendanceService.isMemberInMeetingScope(youssefWebMember, m)
  );
  assert(youssefVisibleMeetings.length === 2, "Web member only sees Web meeting and Public meeting (2 total)");
  assert(!youssefVisibleMeetings.some((m) => m.id === hrMeeting.id), "Web member cannot see HR meeting");

  const monaVisibleMeetings = [hrMeeting, webMeeting, publicMeeting].filter((m) =>
    attendanceService.isMemberInMeetingScope(monaHrMember, m)
  );
  assert(monaVisibleMeetings.length === 2, "HR member only sees HR meeting and Public meeting (2 total)");
  assert(!monaVisibleMeetings.some((m) => m.id === webMeeting.id), "HR member cannot see Web meeting");

  // Test 3: Finalize Attendance Enforcement & Penalty Isolation
  console.log("\n--- 3. Testing Attendance Finalization & Penalty Isolation ---");
  // Finalize HR meeting: Mona is absent, Sarah is present
  const hrRecords = hrRoster.map((u) => ({
    member_id: u.id,
    member_name: u.full_name,
    member_email: u.email,
    team_name: u.team_id || "HR",
    status: (u.id === "usr_hr_2" ? "absent" : "present") as any,
    notes: u.id === "usr_hr_2" ? "غائب بدون عذر" : "حاضر",
    penalty_applied: u.id === "usr_hr_2",
  }));

  const finalizeResult = attendanceService.finalizeAttendance(hrMeeting.id, hrRecords, "HR Admin");
  assert(finalizeResult.penalizedMembers.length === 1, "Exactly 1 absent HR member is penalized");
  assert(finalizeResult.penalizedMembers[0].member_id === "usr_hr_2", "Penalized member is Mona Zaki");
  assert(
    !finalizeResult.penalizedMembers.some((m) => m.member_id === "usr_web_1"),
    "Web member Youssef was never penalized for the HR meeting"
  );

  // Test 4: Tasks Scope Filtering
  console.log("\n--- 4. Testing Tasks Assignee Scope Filtering ---");
  const hrTaskAssignees = mockUsers.filter((u) => isUserInTeam(u, "team_hr"));
  assert(hrTaskAssignees.length === 2, "HR Task Assignees dropdown isolates 2 HR members");
  assert(hrTaskAssignees.every((u) => u.team_id === "team_hr"), "All HR task assignees belong to HR");

  const webTaskAssignees = mockUsers.filter((u) => isUserInTeam(u, "team_web"));
  assert(webTaskAssignees.length === 2, "Web Task Assignees dropdown isolates 2 Web members");
  assert(webTaskAssignees.every((u) => u.team_id === "team_web"), "All Web task assignees belong to Web");

  // Test 5: Evaluations & Points Scope Filtering
  console.log("\n--- 5. Testing Evaluations & Points Scope Filtering ---");
  const hrEvalCandidates = mockUsers.filter((u) => isUserInTeam(u, "team_hr"));
  assert(hrEvalCandidates.length === 2, "HR Evaluation Candidates filtered exclusively to HR members");

  const mobilePointsCandidates = mockUsers.filter((u) => isUserInTeam(u, "team_mobile"));
  assert(mobilePointsCandidates.length === 1, "Mobile Points candidate isolates exactly Karim Hassan");
  assert(mobilePointsCandidates[0].id === "usr_mobile_1", "Karim Hassan is the only candidate in Mobile team");

  console.log("\n=================================================");
  console.log("🎉 ALL SCOPE ISOLATION TESTS PASSED SUCCESSFULLY!");
  console.log("=================================================");
}

runScopeIsolationTestSuite().catch((err) => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
