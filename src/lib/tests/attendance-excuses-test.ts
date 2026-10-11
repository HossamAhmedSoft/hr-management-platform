import { attendanceService, INITIAL_MEETINGS, INITIAL_EXCUSES } from "../attendance-service";
import { MemberAttendanceRecord } from "@/types";

console.log("==================================================================");
console.log("RUNNING ATTENDANCE & EXCUSES WORKFLOW VERIFICATION SUITE");
console.log("==================================================================");

let passed = 0;
let total = 0;

function assert(desc: string, condition: boolean) {
  total++;
  if (condition) {
    console.log(`✅ PASS [ATTENDANCE] [TEST-${total < 10 ? "0" + total : total}] ${desc}`);
    passed++;
  } else {
    console.error(`❌ FAIL [ATTENDANCE] [TEST-${total < 10 ? "0" + total : total}] ${desc}`);
    process.exit(1);
  }
}

// 1. Initial seed check
const meetings = attendanceService.getMeetings();
assert("Initial seed has at least 3 meetings", meetings.length >= 3);
assert("Includes completed assembly meeting", meetings.some((m) => m.id === "mtg_01_kickoff" && m.attendance_taken));
assert("Includes scheduled upcoming meeting", meetings.some((m) => m.id === "mtg_03_upcoming_general" && !m.attendance_taken));

// 2. Initial excuses check
const excuses = attendanceService.getExcuses();
assert("Initial seed has documented excuses", excuses.length >= 3);
assert("Includes pending excuse for Youssef Ibrahim", excuses.some((e) => e.member_name === "Youssef Ibrahim" && e.status === "pending"));
assert("Includes approved academic excuse for Omar Taha", excuses.some((e) => e.member_name === "Omar Taha" && e.status === "approved"));

// 3. Member submits a new excuse
const newExcuse = attendanceService.submitExcuse({
  meeting_id: "mtg_03_upcoming_general",
  meeting_title: "الاجتماع الشهري العام وتقييم المخرجات",
  member_id: "usr_test_member",
  member_name: "Tariq Ziyad",
  member_email: "tariq@gdgnctu.com",
  reason_type: "academic_exam",
  description: "امتحان منتصف الفصل الدراسي بقسم هندسة البرمجيات.",
  evidence_url: "https://faculty.nctu.edu.eg/exam-schedule.pdf",
});

assert("Member can submit new excuse with pending status", newExcuse.status === "pending");
assert("Excuse is retrievable by member ID", attendanceService.getExcusesByMember("usr_test_member").length >= 1);
assert("Excuse is retrievable by meeting ID", attendanceService.getExcusesByMeeting("mtg_03_upcoming_general").some((e) => e.id === newExcuse.id));

// 4. Admin reviews and approves the excuse
const approvedExcuse = attendanceService.reviewExcuse(
  newExcuse.id,
  "approved",
  "hossam_super_admin",
  "Hossam Ahmed (Super Admin)",
  "تم التحقق من جدول الامتحانات واعتماد العذر رسمياً."
);

assert("Admin can approve excuse with notes", approvedExcuse !== null && approvedExcuse.status === "approved");
assert("Reviewer name and determination are recorded", approvedExcuse?.reviewer_name === "Hossam Ahmed (Super Admin)");

// 5. Create new meeting and finalize attendance with automated penalties
const testMeeting = attendanceService.createMeeting({
  title: "اجتماع طوارئ إداري للتنسيق الفصلي",
  date: new Date().toISOString(),
  location: "Google Meet",
  type: "Executive Review",
  status: "scheduled",
  created_by: "hossam_super_admin",
  presentCount: 0,
  absentCount: 0,
  excusedCount: 0,
  attendance_taken: false,
});

assert("Admin can schedule a new meeting", testMeeting.id.startsWith("mtg_"));

const rosterSheet: MemberAttendanceRecord[] = [
  {
    member_id: "usr_member_1",
    member_name: "Youssef Ibrahim",
    status: "present",
    notes: "حضور كامل ومشاركة متميزة.",
  },
  {
    member_id: "usr_member_omar",
    member_name: "Omar Taha",
    status: "excused",
    notes: "عذر معتمد: امتحانات جامعية.",
    excuse_id: "exc_01",
  },
  {
    member_id: "usr_member_absent_1",
    member_name: "Karim Hassan",
    status: "absent",
    notes: "غياب غير مبرر دون إخطار مسبق.",
  },
  {
    member_id: "usr_member_absent_2",
    member_name: "Mahmoud Reda",
    status: "absent",
    notes: "تغيب عن الجلسة الإلزامية.",
  },
];

const finalizeResult = attendanceService.finalizeAttendance(
  testMeeting.id,
  rosterSheet,
  "Hossam Ahmed (Super Admin)"
);

assert("Attendance finalization marks meeting as completed", finalizeResult.meeting?.status === "completed");
assert("Present count matches roster (1)", finalizeResult.meeting?.presentCount === 1);
assert("Excused count matches roster (1)", finalizeResult.meeting?.excusedCount === 1);
assert("Absent count matches roster (2)", finalizeResult.meeting?.absentCount === 2);
assert("Identifies exactly 2 unexcused absent members for penalty enforcement", finalizeResult.penalizedMembers.length === 2);
assert("Penalty flag is set on penalized members", finalizeResult.penalizedMembers.every((m) => m.penalty_applied));

console.log("==================================================================");
console.log(`TOTAL ATTENDANCE & EXCUSES TESTS PASSED: ${passed} / ${total}`);
console.log("==================================================================");
