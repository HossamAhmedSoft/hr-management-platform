import { isUserInTrack, SUPABASE_TEAM_UUIDS, TRACK_KEYWORDS } from "../utils";
import { Team, Profile } from "@/types";

console.log("==================================================================");
console.log("RUNNING TRACKS & COMMITTEES DIRECTORY COUNT VERIFICATION TEST");
console.log("==================================================================");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testId: string, message: string) {
  if (condition) {
    console.log(`✅ PASS [${testId}] ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL [${testId}] ${message}`);
    testsFailed++;
  }
}

// Mock Teams from Supabase
const mockDbTeams: Team[] = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    name: "Human Resources",
    name_ar: "الموارد البشرية",
    type: "non_technical",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    name: "Public Relations & Marketing",
    name_ar: "العلاقات العامة والتسويق",
    type: "non_technical",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "11111111-1111-1111-1111-111111111103",
    name: "Operations & Logistics",
    name_ar: "العمليات واللوجستيات",
    type: "non_technical",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "11111111-1111-1111-1111-111111111104",
    name: "Media & Content",
    name_ar: "الإعلام والمحتوى",
    type: "non_technical",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "11111111-1111-1111-1111-111111111105",
    name: "Web Development Track",
    name_ar: "مسار تطوير الويب",
    type: "technical",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "11111111-1111-1111-1111-111111111106",
    name: "Mobile Development Track",
    name_ar: "مسار تطوير الموبايل",
    type: "technical",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "11111111-1111-1111-1111-111111111107",
    name: "AI & Machine Learning Track",
    name_ar: "مسار الذكاء الاصطناعي",
    type: "technical",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
  {
    id: "11111111-1111-1111-1111-111111111108",
    name: "Cyber Security Track",
    name_ar: "مسار الأمن السيبراني",
    type: "technical",
    status: "active",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  },
];

// Mock Users with different team representations
const mockUsers: Partial<Profile>[] = [
  // 1. User with database UUID for HR (like Hossam)
  {
    id: "user-1",
    full_name: "Hossam HR",
    team_id: "11111111-1111-1111-1111-111111111101",
    role: "member",
  },
  // 2. User with database UUID for Web Dev
  {
    id: "user-2",
    full_name: "Alice Web",
    team_id: "11111111-1111-1111-1111-111111111105",
    role: "member",
  },
  // 3. User with slug team_id
  {
    id: "user-3",
    full_name: "Bob Mobile",
    team_id: "team_mobile",
    role: "member",
  },
  // 4. User with committee text (Arabic)
  {
    id: "user-4",
    full_name: "Carla PR",
    committee: "العلاقات العامة والتسويق",
    role: "member",
  },
  // 5. User with committee text (English)
  {
    id: "user-5",
    full_name: "David Cyber",
    committee: "Cyber Security",
    role: "member",
  },
  // 6. User unassigned
  {
    id: "user-6",
    full_name: "Eve Unassigned",
    role: "member",
  },
];

console.log("\n--- SUITE 1: TRACK MATCHING VIA SUPABASE UUIDS ---");
assert(
  isUserInTrack(mockUsers[0], "hr", mockDbTeams),
  "TRACK-01",
  "User with UUID for HR matches 'hr' track"
);
assert(
  !isUserInTrack(mockUsers[0], "web", mockDbTeams),
  "TRACK-02",
  "User with UUID for HR does NOT match 'web' track"
);
assert(
  isUserInTrack(mockUsers[1], "web", mockDbTeams),
  "TRACK-03",
  "User with UUID for Web Dev matches 'web' track"
);

console.log("\n--- SUITE 2: SLUG & COMMITTEE TEXT MATCHING ---");
assert(
  isUserInTrack(mockUsers[2], "mobile", mockDbTeams),
  "TRACK-04",
  "User with 'team_mobile' matches 'mobile' track"
);
assert(
  isUserInTrack(mockUsers[3], "pr", mockDbTeams),
  "TRACK-05",
  "User with Arabic committee 'العلاقات العامة والتسويق' matches 'pr' track"
);
assert(
  isUserInTrack(mockUsers[4], "cyber", mockDbTeams),
  "TRACK-06",
  "User with English committee 'Cyber Security' matches 'cyber' track"
);
assert(
  !isUserInTrack(mockUsers[5], "hr", mockDbTeams),
  "TRACK-07",
  "Unassigned user does NOT match any track"
);

console.log("\n--- SUITE 3: MEMBER COUNT PER TRACK ---");
const trackCountHR = mockUsers.filter((u) => isUserInTrack(u, "hr", mockDbTeams)).length;
assert(trackCountHR === 1, "COUNT-01", "HR track has strictly 1 member (Hossam HR)");

const trackCountWeb = mockUsers.filter((u) => isUserInTrack(u, "web", mockDbTeams)).length;
assert(trackCountWeb === 1, "COUNT-02", "Web track has strictly 1 member (Alice Web)");

const trackCountMobile = mockUsers.filter((u) => isUserInTrack(u, "mobile", mockDbTeams)).length;
assert(trackCountMobile === 1, "COUNT-03", "Mobile track has strictly 1 member (Bob Mobile)");

const trackCountPR = mockUsers.filter((u) => isUserInTrack(u, "pr", mockDbTeams)).length;
assert(trackCountPR === 1, "COUNT-04", "PR track has strictly 1 member (Carla PR)");

const trackCountAI = mockUsers.filter((u) => isUserInTrack(u, "ai", mockDbTeams)).length;
assert(trackCountAI === 0, "COUNT-05", "AI track has strictly 0 members when empty");

console.log("\n--- SUITE 4: REVERSE UUID MATCHING (FOR FILTERS) ---");
// When a dropdown filter has the UUID e.g. "11111111-1111-1111-1111-111111111101"
assert(
  isUserInTrack(mockUsers[0], "11111111-1111-1111-1111-111111111101", mockDbTeams),
  "REV-01",
  "User matches exact UUID filter"
);
assert(
  isUserInTrack({ team_id: "team_hr" }, "11111111-1111-1111-1111-111111111101", mockDbTeams),
  "REV-02",
  "User with slug matches mapped UUID filter"
);

console.log("==================================================================");
console.log(`TOTAL TRACKS DIRECTORY TESTS: ${testsPassed} / ${testsPassed + testsFailed} PASSED`);
console.log("==================================================================");

if (testsFailed > 0) {
  process.exit(1);
}
