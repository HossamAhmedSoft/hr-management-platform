// ============================================================
// GDG NCTU HR Platform — Admin Actions & Member Sync Test Suite
// ============================================================

import { internalDB } from "../internal-db";
import { dbService } from "../db-service";
import { Profile } from "@/types";

interface TestRecord {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const testResults: TestRecord[] = [];

function assert(id: string, name: string, condition: boolean, details: string) {
  testResults.push({ id, name, passed: Boolean(condition), details });
  const status = condition ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} [${id}] ${name} -> ${details}`);
}

console.log("=================================================");
console.log("RUNNING ADMIN-MEMBER SYNCHRONIZATION TESTS");
console.log("=================================================\n");

const memberProfile: Profile = {
  id: "mem_test_101",
  email: "member101@gdgnctu.com",
  full_name: "Youssef Ibrahim",
  role: "member",
  team_id: "team_web_dev",
  status: "active",
  join_date: "2026-09-01",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const adminProfile: Profile = {
  id: "admin_test_001",
  email: "admin@gdgnctu.com",
  full_name: "Dr. Ahmed SuperAdmin",
  role: "super_admin",
  team_id: "team_core",
  status: "active",
  join_date: "2026-01-01",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function runTests() {
  internalDB.clearAll();
  internalDB.createProfile(memberProfile);
  internalDB.createProfile(adminProfile);

  // 1. Task Assignment & Persistence
  try {
    const createdTask = await dbService.createTask({
      title: "Build Responsive Hero Section",
      description: "Implement modern glassmorphic hero for GDG portal",
      team_id: memberProfile.team_id || "team_web_dev",
      created_by: adminProfile.id,
      status: "assigned",
      priority: "high",
      deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
      assignees: [
        {
          id: "assignee_101",
          task_id: "",
          profile_id: memberProfile.id,
          profile: memberProfile,
          assigned_at: new Date().toISOString(),
          assigned_by: adminProfile.id,
        },
      ],
    });

    const allTasks = await dbService.getTasks();
    const foundTask = allTasks.find((t) => t.id === createdTask?.id);
    const hasAssignee = foundTask?.assignees?.[0]?.profile_id === memberProfile.id;

    assert(
      "TEST-01",
      "Task Assignment & Assignee Persistence",
      Boolean(createdTask?.id && hasAssignee),
      `Task created: ${createdTask?.id}, Assignee: ${foundTask?.assignees?.[0]?.profile_id}`
    );
  } catch (e: any) {
    assert("TEST-01", "Task Assignment & Assignee Persistence", false, e.message);
  }

  // 2. Notification Dispatch & Read Status
  try {
    const notif = await dbService.createNotification({
      user_id: memberProfile.id,
      title: "New Task Assigned",
      message: "You have been assigned: Build Responsive Hero Section",
      type: "task_assigned",
      link: "/en/tasks",
      is_read: false,
    });

    const notifs = await dbService.getNotifications(memberProfile.id);
    const hasNotif = notifs.some((n) => n.id === notif.id && !n.is_read);

    await dbService.markNotificationAsRead(notif.id);
    const updated = await dbService.getNotifications(memberProfile.id);
    const isNowRead = updated.find((n) => n.id === notif.id)?.is_read === true;

    assert(
      "TEST-02",
      "Notification Creation & Mark As Read",
      Boolean(hasNotif && isNowRead),
      `Notification dispatched (${notif.id}) and marked read`
    );
  } catch (e: any) {
    assert("TEST-02", "Notification Creation & Mark As Read", false, e.message);
  }

  // 3. Point Event Reflection
  try {
    const pt = await dbService.createPointEvent({
      member_id: memberProfile.id,
      team_id: memberProfile.team_id || "",
      event_date: new Date().toISOString().split("T")[0],
      category_id: "point-tech-deliverable",
      direction: "positive",
      value: 10,
      explanation: "Early deliverable delivery with clean code",
      recorded_by: adminProfile.id,
      status: "approved",
    });

    const allPoints = await dbService.getPointEvents();
    const foundPt = allPoints.find((p) => p.id === pt?.id);
    assert(
      "TEST-03",
      "Point Event Reflection for Member",
      Boolean(foundPt && foundPt.value === 10),
      `Point event confirmed with ${foundPt?.value} pts`
    );
  } catch (e: any) {
    assert("TEST-03", "Point Event Reflection for Member", false, e.message);
  }

  console.log("\n=================================================");
  const totalPassed = testResults.filter((r) => r.passed).length;
  console.log(`TOTAL PASSED: ${totalPassed} / ${testResults.length}`);
  console.log("=================================================");
}

runTests();
