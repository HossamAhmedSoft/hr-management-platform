// ============================================================
// GDG NCTU HR Platform — Admin Actions & Member Sync Test Runner
// ============================================================

const testResults = [];

function assert(id, name, condition, details) {
  testResults.push({ id, name, passed: Boolean(condition), details });
  const status = condition ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} [${id}] ${name} -> ${details}`);
}

console.log("=================================================");
console.log("RUNNING ADMIN-MEMBER SYNCHRONIZATION TESTS");
console.log("=================================================\n");

// Mock matching helper matching the exact logic in tasks/page.tsx & page.tsx
function isTaskAssignedToUser(task, user, availableUsers = []) {
  if (!user) return false;
  if (task.created_by === user.id) return true;

  if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
    for (const a of task.assignees) {
      if (!a) continue;
      if (a.profile_id === user.id || a.profile?.id === user.id) return true;
      if (
        user.email &&
        a.profile?.email &&
        a.profile.email.toLowerCase() === user.email.toLowerCase()
      ) {
        return true;
      }
      const matched = availableUsers.find((u) => u.id === a.profile_id);
      if (matched) {
        if (matched.id === user.id) return true;
        if (
          user.email &&
          matched.email &&
          matched.email.toLowerCase() === user.email.toLowerCase()
        ) {
          return true;
        }
      }
    }
    return false;
  }

  return false;
}

const mockAvailableUsers = [
  { id: "usr_member_1", email: "member@gdgnctu.com", full_name: "Youssef Ibrahim", role: "member", team_id: "team_web" },
  { id: "00000000-0000-0000-0000-000000000005", email: "member@gdgnctu.com", full_name: "Youssef Ibrahim", role: "member", team_id: "team_web" },
  { id: "usr_admin_1", email: "admin@gdgnctu.com", full_name: "Super Admin", role: "super_admin", team_id: "team_core" },
  { id: "usr_other_2", email: "other@gdgnctu.com", full_name: "Other Member", role: "member", team_id: "team_ai" }
];

// TEST 1: Task Matching via Direct Profile ID
try {
  const task1 = {
    id: "task_001",
    title: "Implement Header Dropdown",
    team_id: "team_web",
    created_by: "usr_admin_1",
    assignees: [{ id: "as_1", profile_id: "usr_member_1" }]
  };
  const memberUser = mockAvailableUsers[0];
  const matched = isTaskAssignedToUser(task1, memberUser, mockAvailableUsers);
  assert("TEST-01", "Task Assignment via Direct Profile ID", matched, `Direct ID matched for ${memberUser.full_name}`);
} catch (e) {
  assert("TEST-01", "Task Assignment via Direct Profile ID", false, e.message);
}

// TEST 2: Task Matching via Supabase UUID to Local User Email
try {
  const task2 = {
    id: "task_002",
    title: "Fix Task Matching Logic",
    team_id: "team_general",
    created_by: "usr_admin_1",
    assignees: [{ id: "as_2", profile_id: "00000000-0000-0000-0000-000000000005" }]
  };
  // Logged-in session has local ID 'usr_member_1' but same email 'member@gdgnctu.com'
  const loggedInLocalUser = { id: "usr_member_1", email: "member@gdgnctu.com", role: "member" };
  const matched = isTaskAssignedToUser(task2, loggedInLocalUser, mockAvailableUsers);
  assert("TEST-02", "Task Assignment via Email Cross-Lookup", matched, "Matched member via email cross-lookup despite UUID/local ID difference");
} catch (e) {
  assert("TEST-02", "Task Assignment via Email Cross-Lookup", false, e.message);
}

// TEST 3: Peer Task Isolation (Task Assigned to Member 1 is Hidden from Member 2 in Same Team)
try {
  const task3 = {
    id: "task_003",
    title: "Web Frontend Architecture Refactor",
    team_id: "team_web",
    created_by: "usr_admin_1",
    assignees: [{ id: "as_3", profile_id: "usr_member_1" }]
  };
  // Member 2 is also in team_web, but not an assignee of task3
  const otherWebMember = { id: "usr_member_2", email: "othermember@gdgnctu.com", full_name: "Omar Member", role: "member", team_id: "team_web" };
  const matched = isTaskAssignedToUser(task3, otherWebMember, mockAvailableUsers);
  assert("TEST-03", "Peer Task Isolation in Same Team", !matched, `Task assigned to Youssef is strictly hidden from peer Omar in same team (${!matched})`);
} catch (e) {
  assert("TEST-03", "Peer Task Isolation in Same Team", false, e.message);
}

// TEST 4: Unrelated Task Is Correctly Hidden from Member
try {
  const task4 = {
    id: "task_004",
    title: "AI Track Model Evaluation",
    team_id: "team_ai",
    created_by: "usr_admin_1",
    assignees: [{ id: "as_4", profile_id: "usr_other_2" }]
  };
  const memberUser = mockAvailableUsers[0];
  const matched = isTaskAssignedToUser(task4, memberUser, mockAvailableUsers);
  assert("TEST-04", "Unrelated Task Isolation", !matched, `AI task correctly hidden from Web member (${matched === false})`);
} catch (e) {
  assert("TEST-04", "Unrelated Task Isolation", false, e.message);
}

// TEST 5: Live Notification Simulation (Task Assigned -> Unread -> Read)
try {
  let notifications = [];
  function addNotification(n) {
    const created = { ...n, id: `notif_${Date.now()}_${Math.random()}`, is_read: false, created_at: new Date().toISOString() };
    notifications.unshift(created);
    return created;
  }
  function markAsRead(id) {
    notifications = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
  }

  // Admin creates notification
  const n1 = addNotification({
    user_id: "usr_member_1",
    title: "مهمة عمل جديدة مسندة إليك",
    message: "تم تكليفك بمهمة: تطوير الواجهة",
    type: "task_assigned",
    link: "/ar/tasks"
  });

  const unreadCount1 = notifications.filter(n => n.user_id === "usr_member_1" && !n.is_read).length;
  assert("TEST-05", "Notification Dispatch & Unread Count", unreadCount1 === 1, `Unread notifications = ${unreadCount1}`);

  // Member marks as read
  markAsRead(n1.id);
  const unreadCount2 = notifications.filter(n => n.user_id === "usr_member_1" && !n.is_read).length;
  assert("TEST-06", "Notification Mark As Read", unreadCount2 === 0, `Unread notifications after click = ${unreadCount2}`);
} catch (e) {
  assert("TEST-05", "Notification Lifecycle", false, e.message);
}

// TEST 6: Points Award Notification & Balance Reflection
try {
  const pointsLedger = [];
  function addPointEvent(evt) {
    const created = { ...evt, id: `pt_${Date.now()}` };
    pointsLedger.push(created);
    return created;
  }

  // Admin awards points to member
  const p1 = addPointEvent({
    member_id: "usr_member_1",
    direction: "positive",
    value: 15,
    status: "approved",
    explanation: "Outstanding project delivery"
  });

  // Calculate member net balance
  const memberNet = pointsLedger
    .filter(p => p.member_id === "usr_member_1" && p.status === "approved")
    .reduce((sum, p) => sum + (p.direction === "positive" ? p.value : -p.value), 0);

  assert("TEST-07", "Points Ledger Net Calculation for Member", memberNet === 15, `Member net points = ${memberNet} pts`);
} catch (e) {
  assert("TEST-07", "Points Ledger Net Calculation", false, e.message);
}

console.log("\n=================================================");
const totalPassed = testResults.filter(r => r.passed).length;
console.log(`TOTAL PASSED: ${totalPassed} / ${testResults.length}`);
console.log("=================================================");

if (totalPassed === testResults.length) {
  process.exit(0);
} else {
  process.exit(1);
}
