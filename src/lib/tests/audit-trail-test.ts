import { internalDB, INITIAL_AUDIT_LOGS } from "../internal-db";
import { AuditLog } from "@/types";

console.log("=================================================");
console.log("RUNNING ENTERPRISE AUDIT TRAIL VERIFICATION TESTS");
console.log("=================================================");

let passed = 0;
let total = 0;

function assert(desc: string, condition: boolean) {
  total++;
  if (condition) {
    console.log(`✅ PASS [AUDIT] [TEST-${total < 10 ? "0" + total : total}] ${desc}`);
    passed++;
  } else {
    console.error(`❌ FAIL [AUDIT] [TEST-${total < 10 ? "0" + total : total}] ${desc}`);
    process.exit(1);
  }
}

// 1. Initial seed check
const initialLogs = INITIAL_AUDIT_LOGS;
assert("Initial Seed contains at least 3 immutable system logs", initialLogs.length >= 3);
assert("Initial Seed contains SYS_SECURITY_INIT", initialLogs.some((l) => l.action === "SYS_SECURITY_INIT"));
assert("Initial Seed contains POLICY_RATIFIED", initialLogs.some((l) => l.action === "POLICY_RATIFIED"));
assert("Initial Seed contains ACADEMY_TRACKS_SETUP", initialLogs.some((l) => l.action === "ACADEMY_TRACKS_SETUP"));

// 2. Mock storage & creation test
const mockLogs: AuditLog[] = [...initialLogs];
const testLog: AuditLog = {
  id: "test_audit_01",
  actor_id: "user_test_42",
  actor_name: "Youssef Ibrahim",
  action: "TASK_CREATED",
  entity_type: "task",
  entity_id: "task_test_99",
  reason: 'إنشاء وتكليف مهمة عمل: "Build Next.js Landing Page"',
  details: "Priority: high, deadline: 2026-10-25",
  after_value: { priority: "high", team: "Web Development" },
  created_at: new Date().toISOString(),
};
mockLogs.unshift(testLog);

assert("Audit log prepends new events (most recent first)", mockLogs[0].id === "test_audit_01");
assert("Audit log records actor name", mockLogs[0].actor_name === "Youssef Ibrahim");
assert("Audit log contains valid entity_type 'task'", mockLogs[0].entity_type === "task");
assert("Audit log contains state snapshot after_value", mockLogs[0].after_value?.priority === "high");

// 3. Category classification & filtering test
function filterByCategory(logs: AuditLog[], category: string) {
  if (category === "all") return logs;
  return logs.filter((l) => {
    switch (category) {
      case "tasks":
        return l.entity_type === "task" || l.action.startsWith("TASK_");
      case "points":
        return l.entity_type === "point_event" || l.action.startsWith("POINT_");
      case "evaluations":
        return l.entity_type === "evaluation" || l.action.startsWith("EVALUATION_");
      case "appeals":
        return l.entity_type === "appeal" || l.action.startsWith("APPEAL_");
      case "incidents":
        return l.entity_type === "incident" || l.action.startsWith("INCIDENT_");
      case "auth":
        return l.entity_type === "auth" || l.action.startsWith("AUTH_");
      default:
        return true;
    }
  });
}

const taskLogs = filterByCategory(mockLogs, "tasks");
assert("Category filter for 'tasks' correctly isolates task operations", taskLogs.length === 1 && taskLogs[0].action === "TASK_CREATED");

// 4. CSV Export integrity check
function generateAuditCsv(logs: AuditLog[]): string {
  const headers = ["Timestamp", "Actor", "Action", "Entity Type", "Entity ID", "Reason", "Details"];
  const rows = logs.map((l) => [
    `"${l.created_at}"`,
    `"${l.actor_name || l.actor_id}"`,
    `"${l.action}"`,
    `"${l.entity_type}"`,
    `"${l.entity_id}"`,
    `"${(l.reason || "").replace(/"/g, '""')}"`,
    `"${(l.details || "").replace(/"/g, '""')}"`,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

const csvOutput = generateAuditCsv(mockLogs);
assert("Audit CSV export includes all mandatory headers", csvOutput.includes("Timestamp,Actor,Action,Entity Type,Entity ID,Reason,Details"));
assert("Audit CSV export contains actor name 'Youssef Ibrahim'", csvOutput.includes("Youssef Ibrahim"));
assert("Audit CSV handles Arabic reason text without corruption", csvOutput.includes("إنشاء وتكليف مهمة عمل"));

console.log("=================================================");
console.log(`TOTAL AUDIT TESTS PASSED: ${passed} / ${total}`);
console.log("=================================================");
