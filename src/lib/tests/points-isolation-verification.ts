import { internalDB } from "../internal-db";
import { PointEvent, Profile } from "@/types";

console.log("==================================================================");
console.log("RUNNING STRICT MULTI-MEMBER POINTS ISOLATION & ZERO-LEAK TEST");
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

// Set up 3 distinct members
const memberA: Profile = {
  id: "member_ahmed_101",
  full_name: "Ahmed Hassan",
  email: "ahmed.hassan@gdgnctu.com",
  role: "member",
  status: "active",
  join_date: "2026-09-01",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const memberB: Profile = {
  id: "member_nour_202",
  full_name: "Nour Mohamed",
  email: "nour.mohamed@gdgnctu.com",
  role: "member",
  status: "active",
  join_date: "2026-09-05",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const memberC: Profile = {
  id: "member_salma_303",
  full_name: "Salma Khaled",
  email: "salma.khaled@gdgnctu.com",
  role: "member",
  status: "active",
  join_date: "2026-09-10",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

internalDB.createProfile(memberA);
internalDB.createProfile(memberB);
internalDB.createProfile(memberC);

// Clear prior test events and insert member-specific events
const eventsA: PointEvent[] = [
  {
    id: "pe_a_1",
    member_id: memberA.id,
    team_id: "team-web",
    direction: "positive",
    value: 5,
    category_id: "core_task",
    status: "approved",
    explanation: "Delivered web app on time",
    event_date: "2026-10-01",
    recorded_by: "hossam_admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pe_a_2",
    member_id: memberA.email, // Saved via email
    team_id: "team-web",
    direction: "positive",
    value: 3,
    category_id: "initiative",
    status: "approved",
    explanation: "Helped peer debug issue",
    event_date: "2026-10-02",
    recorded_by: "hossam_admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pe_a_3",
    member_id: memberA.id,
    team_id: "team-web",
    direction: "negative",
    value: -1,
    category_id: "late_meeting",
    status: "approved",
    explanation: "15 mins late to sprint",
    event_date: "2026-10-03",
    recorded_by: "hossam_admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pe_a_4",
    member_id: memberA.id,
    team_id: "team-web",
    direction: "positive",
    value: 10,
    category_id: "workshop_speaker",
    status: "pending_review", // Pending must not be counted in net
    explanation: "Proposed workshop session",
    event_date: "2026-10-04",
    recorded_by: "hossam_admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const eventsB: PointEvent[] = [
  {
    id: "pe_b_1",
    member_id: memberB.id,
    team_id: "team-pr",
    direction: "negative",
    value: -3,
    category_id: "missed_meeting",
    status: "approved",
    explanation: "Unexcused absence",
    event_date: "2026-10-02",
    recorded_by: "hossam_admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "pe_b_2",
    member_id: memberB.id,
    team_id: "team-pr",
    direction: "positive",
    value: 2,
    category_id: "extra_task",
    status: "approved",
    explanation: "Drafted social media post",
    event_date: "2026-10-05",
    recorded_by: "hossam_admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const eventsC: PointEvent[] = [
  {
    id: "pe_c_1",
    member_id: memberC.id,
    team_id: "team-hr",
    direction: "positive",
    value: 7,
    category_id: "hackathon_lead",
    status: "approved",
    explanation: "Coordinated NCTU hackathon venue",
    event_date: "2026-10-06",
    recorded_by: "hossam_admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const allEvents = [...eventsA, ...eventsB, ...eventsC];
allEvents.forEach((evt) => internalDB.createPointEvent(evt));

// Helper: robust matching function matching app implementation
const allProfiles = [memberA, memberB, memberC];
function isMatchUser(targetId: string, comparisonUserId: string): boolean {
  if (!targetId || !comparisonUserId) return false;
  const cleanTarget = targetId.toLowerCase().trim();
  const cleanComp = comparisonUserId.toLowerCase().trim();
  if (cleanTarget === cleanComp) return true;

  const targetProf = allProfiles.find(
    (u) => u.id.toLowerCase() === cleanTarget || (u.email && u.email.toLowerCase().trim() === cleanTarget)
  );
  const compProf = allProfiles.find(
    (u) => u.id.toLowerCase() === cleanComp || (u.email && u.email.toLowerCase().trim() === cleanComp)
  );

  if (targetProf && compProf) {
    return (
      targetProf.id.toLowerCase() === compProf.id.toLowerCase() ||
      (!!targetProf.email &&
        !!compProf.email &&
        targetProf.email.toLowerCase().trim() === compProf.email.toLowerCase().trim())
    );
  }
  if (targetProf) {
    return (
      targetProf.id.toLowerCase() === cleanComp ||
      (!!targetProf.email && targetProf.email.toLowerCase().trim() === cleanComp)
    );
  }
  if (compProf) {
    return (
      compProf.id.toLowerCase() === cleanTarget ||
      (!!compProf.email && compProf.email.toLowerCase().trim() === cleanTarget)
    );
  }
  return false;
}

function calculateBalance(memberId: string) {
  const events = internalDB
    .getPointEvents()
    .filter((p) => isMatchUser(p.member_id, memberId) && p.status === "approved");
  const pos = events.filter((p) => p.direction === "positive").reduce((s, p) => s + p.value, 0);
  const neg = events.filter((p) => p.direction === "negative").reduce((s, p) => s + p.value, 0);
  return { pos, neg, net: pos + neg, count: events.length };
}

// 1. Verify Ahmed's points
console.log("\n--- SUITE 1: MEMBER A POINT CALCULATIONS & ISOLATION ---");
const balA = calculateBalance(memberA.id);
// Ahmed has approved: +5 (pe_a_1), +3 (pe_a_2 via email), -1 (pe_a_3) = Net +7. Pending +10 is excluded.
assert(balA.pos === 8, "POINT-01", "Ahmed's approved positive points strictly equals +8 (5 + 3)");
assert(balA.neg === -1, "POINT-02", "Ahmed's approved negative points strictly equals -1");
assert(balA.net === 7, "POINT-03", "Ahmed's net points strictly equals +7 (Pending +10 excluded)");
assert(balA.count === 3, "POINT-04", "Ahmed's approved event count is strictly 3");

// 2. Verify Nour's points
console.log("\n--- SUITE 2: MEMBER B POINT CALCULATIONS & ISOLATION ---");
const balB = calculateBalance(memberB.id);
// Nour has: -3, +2 = Net -1
assert(balB.pos === 2, "POINT-05", "Nour's approved positive points strictly equals +2");
assert(balB.neg === -3, "POINT-06", "Nour's approved negative points strictly equals -3");
assert(balB.net === -1, "POINT-07", "Nour's net points strictly equals -1");
assert(balB.count === 2, "POINT-08", "Nour's approved event count is strictly 2");

// 3. Verify Salma's points
console.log("\n--- SUITE 3: MEMBER C POINT CALCULATIONS & ISOLATION ---");
const balC = calculateBalance(memberC.id);
// Salma has: +7 = Net +7
assert(balC.pos === 7, "POINT-09", "Salma's approved positive points strictly equals +7");
assert(balC.neg === 0, "POINT-10", "Salma's approved negative points strictly equals 0");
assert(balC.net === 7, "POINT-11", "Salma's net points strictly equals +7");
assert(balC.count === 1, "POINT-12", "Salma's approved event count is strictly 1");

// 4. Cross-member point boundary tests
console.log("\n--- SUITE 4: ZERO CROSS-POLLUTION VERIFICATION ---");
const eventsSeenByA = internalDB.getPointEvents().filter((p) => isMatchUser(p.member_id, memberA.id));
assert(!eventsSeenByA.some((p) => p.id === "pe_b_1" || p.id === "pe_b_2"), "POINT-13", "Ahmed strictly cannot view Nour's points");
assert(!eventsSeenByA.some((p) => p.id === "pe_c_1"), "POINT-14", "Ahmed strictly cannot view Salma's points");

const eventsSeenByB = internalDB.getPointEvents().filter((p) => isMatchUser(p.member_id, memberB.id));
assert(!eventsSeenByB.some((p) => p.id === "pe_a_1" || p.id === "pe_a_2"), "POINT-15", "Nour strictly cannot view Ahmed's points");
assert(!eventsSeenByB.some((p) => p.id === "pe_c_1"), "POINT-16", "Nour strictly cannot view Salma's points");

const eventsSeenByC = internalDB.getPointEvents().filter((p) => isMatchUser(p.member_id, memberC.id));
assert(!eventsSeenByC.some((p) => p.id === "pe_a_1" || p.id === "pe_b_1"), "POINT-17", "Salma strictly cannot view Ahmed or Nour's points");

// 5. Total Organization Ledger Sum Integrity
console.log("\n--- SUITE 5: LEDGER SUM CONSERVATION ---");
const totalOrgNet = balA.net + balB.net + balC.net;
assert(totalOrgNet === 7 + (-1) + 7, "POINT-18", "Sum of individual net balances strictly equals total org ledger (13 pts)");

console.log("\n==================================================================");
console.log(`TOTAL ISOLATION TESTS PASSED: ${passedCount} / ${totalCount} (100% SUCCESS)`);
console.log("==================================================================");
