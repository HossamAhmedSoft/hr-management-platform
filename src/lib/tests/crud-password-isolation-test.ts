import { internalDB } from "../internal-db";
import { Profile, Task, PointEvent, Evaluation, Incident } from "@/types";

console.log("==================================================================");
console.log("RUNNING CRUD, PASSWORD RESET & MEMBER ISOLATION TEST SUITE");
console.log("==================================================================");

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testId: string, description: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ PASS [${testId}] ${description}`);
  } else {
    console.error(`❌ FAIL [${testId}] ${description}`);
    process.exit(1);
  }
}

// 1. Password Reset & Verification Tests
console.log("\n--- TEST GROUP 1: PASSWORD RESET & SECURITY ---");
const testEmail = "member.omar@gdgnctu.com";
internalDB.setPassword(testEmail, "newSecret2026!");
const storedPw = internalDB.getPassword(testEmail);
assert(storedPw === "newSecret2026!", "TEST-01", "Super Admin can set member password");
assert(internalDB.verifyPassword(testEmail, "newSecret2026!"), "TEST-02", "Correct password verifies successfully");
assert(!internalDB.verifyPassword(testEmail, "wrongPass"), "TEST-03", "Incorrect password fails verification");

// 2. Member Profile CRUD Tests
console.log("\n--- TEST GROUP 2: MEMBER PROFILE CRUD ---");
const testMember: Profile = {
  id: "test_member_99",
  full_name: "Yasmine Adel",
  email: "yasmine.adel@gdgnctu.com",
  role: "member",
  team_id: "team-web",
  status: "active",
  join_date: "2026-09-15",
  phone: "+20 100 123 4567",
  bio: "Faculty of Computers & AI, Web Track",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
internalDB.createProfile(testMember);
const fetchedProfile = internalDB.getProfileByEmail("yasmine.adel@gdgnctu.com");
assert(!!fetchedProfile && fetchedProfile.id === "test_member_99", "TEST-04", "Profile created and retrievable");

const updatedProfile = internalDB.updateProfile("test_member_99", {
  full_name: "Yasmine Adel (Updated)",
  phone: "+20 109 999 8888",
  bio: "Full Stack Web Track Leader Candidate",
});
assert(
  updatedProfile?.full_name === "Yasmine Adel (Updated)" &&
  updatedProfile?.phone === "+20 109 999 8888",
  "TEST-05",
  "Profile updated successfully with personal info"
);

// 3. Task Isolation & CRUD Tests
console.log("\n--- TEST GROUP 3: TASK ISOLATION & CRUD ---");
const taskForOmar: Task = {
  id: "task_omar_01",
  title: "Build Login Page",
  description: "Implement responsive login with Google OAuth",
  team_id: "team-web",
  created_by: "hossam_super_admin",
  status: "assigned",
  priority: "high",
  deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
  assignees: [
    {
      id: "as_omar",
      task_id: "task_omar_01",
      profile_id: "member_omar_id",
      assigned_at: new Date().toISOString(),
      assigned_by: "hossam_super_admin",
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const taskForYasmine: Task = {
  id: "task_yasmine_01",
  title: "Design Marketing Assets",
  description: "Create Instagram stories for orientation day",
  team_id: "team-media",
  created_by: "hossam_super_admin",
  status: "assigned",
  priority: "medium",
  deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
  assignees: [
    {
      id: "as_yasmine",
      task_id: "task_yasmine_01",
      profile_id: "test_member_99",
      assigned_at: new Date().toISOString(),
      assigned_by: "hossam_super_admin",
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

internalDB.createTask(taskForOmar);
internalDB.createTask(taskForYasmine);

const allTasks = internalDB.getTasks();
const omarTasks = allTasks.filter((t) => t.assignees?.some((a) => a.profile_id === "member_omar_id"));
const yasmineTasks = allTasks.filter((t) => t.assignees?.some((a) => a.profile_id === "test_member_99"));

assert(omarTasks.some((t) => t.id === "task_omar_01"), "TEST-06", "Omar's tasks contain task_omar_01");
assert(!omarTasks.some((t) => t.id === "task_yasmine_01"), "TEST-07", "Omar's task view DOES NOT contain Yasmine's tasks (Strict Isolation)");
assert(yasmineTasks.some((t) => t.id === "task_yasmine_01"), "TEST-08", "Yasmine's tasks contain task_yasmine_01");

// Task Update & Delete
const updatedTask = internalDB.updateTask("task_omar_01", {
  title: "Build Login Page (Completed)",
  status: "completed",
});
assert(updatedTask?.status === "completed", "TEST-09", "Task updated successfully");

internalDB.deleteTask("task_omar_01");
const tasksAfterDelete = internalDB.getTasks();
assert(!tasksAfterDelete.some((t) => t.id === "task_omar_01"), "TEST-10", "Task deleted successfully");

// 4. Points Per Member Independence & CRUD Tests
console.log("\n--- TEST GROUP 4: POINTS INDEPENDENCE & CRUD ---");
const eventOmar1: PointEvent = {
  id: "pe_omar_1",
  member_id: "member_omar_id",
  team_id: "team-web",
  event_date: "2026-10-01",
  category_id: "core_task",
  direction: "positive",
  value: 5,
  explanation: "Delivered web workshop demo early",
  recorded_by: "hossam_super_admin",
  status: "approved",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const eventYasmine1: PointEvent = {
  id: "pe_yasmine_1",
  member_id: "test_member_99",
  team_id: "team-web",
  event_date: "2026-10-02",
  category_id: "unexcused_absence",
  direction: "negative",
  value: -2,
  explanation: "Late notice for meeting",
  recorded_by: "hossam_super_admin",
  status: "approved",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

internalDB.createPointEvent(eventOmar1);
internalDB.createPointEvent(eventYasmine1);

const allEvents = internalDB.getPointEvents();
const omarPoints = allEvents
  .filter((p) => p.member_id === "member_omar_id" && p.status === "approved")
  .reduce((sum, p) => sum + p.value, 0);

const yasminePoints = allEvents
  .filter((p) => p.member_id === "test_member_99" && p.status === "approved")
  .reduce((sum, p) => sum + p.value, 0);

assert(omarPoints === 5, "TEST-11", "Omar's balance is strictly +5 pts");
assert(yasminePoints === -2, "TEST-12", "Yasmine's balance is strictly -2 pts (Balances NEVER mixed)");

// Point Event Update & Delete
const updatedPoint = internalDB.updatePointEvent("pe_omar_1", {
  value: 7,
  explanation: "Exceptional core task delivery with mentoring",
});
assert(updatedPoint?.value === 7, "TEST-13", "Point event updated successfully");

internalDB.deletePointEvent("pe_omar_1");
const eventsAfterDelete = internalDB.getPointEvents();
assert(!eventsAfterDelete.some((p) => p.id === "pe_omar_1"), "TEST-14", "Point event deleted successfully");

// 5. Monthly Evaluation CRUD Tests
console.log("\n--- TEST GROUP 5: MONTHLY EVALUATION CRUD ---");
const testEval: Evaluation = {
  id: "eval_test_01",
  member_id: "test_member_99",
  evaluator_id: "hossam_super_admin",
  period_id: "cycle_oct_2026",
  template_id: "standard_rubric",
  status: "finalized",
  total_score: 92.5,
  performance_band: "Distinguished",
  ratings: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
internalDB.createEvaluation(testEval);
const evals = internalDB.getEvaluations();
assert(evals.some((e) => e.id === "eval_test_01"), "TEST-15", "Evaluation created successfully");

const updatedEval = internalDB.updateEvaluation("eval_test_01", {
  total_score: 96.0,
  performance_band: "Exceptional / Role Model",
});
assert(updatedEval?.total_score === 96.0, "TEST-16", "Evaluation updated with new score & band");

internalDB.deleteEvaluation("eval_test_01");
const evalsAfterDelete = internalDB.getEvaluations();
assert(!evalsAfterDelete.some((e) => e.id === "eval_test_01"), "TEST-17", "Evaluation deleted successfully");

// 6. Escalation Incident CRUD Tests
console.log("\n--- TEST GROUP 6: ESCALATION INCIDENT CRUD ---");
const testIncident: Incident = {
  id: "inc_test_01",
  member_id: "test_member_99",
  target_member_id: "test_member_99",
  reported_by: "hossam_super_admin",
  title: "Unresolved milestone roadblock",
  description: "Requires supportive alignment with team vice lead",
  level: 1,
  escalation_level: 1,
  status: "open",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
internalDB.createIncident(testIncident);
const incidents = internalDB.getIncidents();
assert(incidents.some((i) => i.id === "inc_test_01"), "TEST-18", "Incident logged successfully");

const updatedIncident = internalDB.updateIncident("inc_test_01", {
  decision_notes: "Settled amicably after 1-on-1 dialogue",
  status: "resolved",
});
assert(updatedIncident?.status === "resolved", "TEST-19", "Incident updated and resolved");

internalDB.deleteIncident("inc_test_01");
const incidentsAfterDelete = internalDB.getIncidents();
assert(!incidentsAfterDelete.some((i) => i.id === "inc_test_01"), "TEST-20", "Incident deleted successfully");

// Profile Deletion
internalDB.deleteProfile("test_member_99");
const profilesAfterDelete = internalDB.getProfiles();
assert(!profilesAfterDelete.some((p) => p.id === "test_member_99"), "TEST-21", "Member profile deleted successfully");

console.log("\n==================================================================");
console.log(`TOTAL CRUD, PASSWORD & ISOLATION TESTS PASSED: ${passedCount} / ${totalCount}`);
console.log("==================================================================");
