import {
  MeetingAttendanceEvent,
  MeetingExcuse,
  MemberAttendanceRecord,
  MeetingExcuseReasonType,
  MeetingExcuseStatus,
} from "@/types";

const STORAGE_MEETINGS_KEY = "gdg_nctu_db_attendance_events";
const STORAGE_EXCUSES_KEY = "gdg_nctu_db_meeting_excuses";

export const INITIAL_MEETINGS: MeetingAttendanceEvent[] = [
  {
    id: "mtg_01_kickoff",
    title: "اجتماع الجمعية العمومية الافتتاحي - الموسم 2026 (Kick-off Assembly)",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    location: "Main Auditorium - NCTU Campus & Google Meet",
    type: "General Assembly",
    target_team_id: "all",
    target_team_name: "اجتماع عام - جميع اللجان والأعضاء",
    status: "completed",
    created_by: "hossam_super_admin",
    attendance_taken: true,
    presentCount: 14,
    absentCount: 1,
    excusedCount: 2,
    records: [
      {
        member_id: "usr_member_1",
        member_name: "Youssef Ibrahim",
        member_email: "member@gdgnctu.com",
        team_name: "Web Development",
        status: "present",
        notes: "حضور كامل والمشاركة في النقاش العام.",
      },
      {
        member_id: "usr_lead_web",
        member_name: "Ahmed Tarek",
        member_email: "web.lead@gdgnctu.com",
        team_name: "Web Development",
        status: "present",
        notes: "عرض خطة مسار الويب.",
      },
      {
        member_id: "usr_member_omar",
        member_name: "Omar Taha",
        member_email: "omar.taha@gdgnctu.com",
        team_name: "Web Development",
        status: "excused",
        notes: "عذر مسبق معتمد: ارتباط أكاديمي وامتحانات فصلية.",
        excuse_id: "exc_01",
      },
      {
        member_id: "usr_member_absent_1",
        member_name: "Karim Hassan",
        member_email: "karim.hassan@gdgnctu.com",
        team_name: "Mobile App Development",
        status: "absent",
        notes: "غياب غير مبرر دون تقديم أي عذر مسبق.",
        penalty_applied: true,
      },
    ],
  },
  {
    id: "mtg_02_tech_orientation",
    title: "ورشة العمل التنسيقية للجان والمسارات التقنية (Tech Tracks Sync)",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    location: "Hall 3B - Engineering Labs",
    type: "Workshop",
    target_team_id: "team_web",
    target_team_name: "مسار تطوير الويب (Web Track)",
    status: "completed",
    created_by: "hossam_super_admin",
    attendance_taken: true,
    presentCount: 15,
    absentCount: 0,
    excusedCount: 1,
    records: [
      {
        member_id: "usr_member_1",
        member_name: "Youssef Ibrahim",
        member_email: "member@gdgnctu.com",
        team_name: "Web Development",
        status: "present",
      },
      {
        member_id: "usr_member_nour",
        member_name: "Nourhan Ali",
        member_email: "nourhan@gdgnctu.com",
        team_name: "UI/UX Design",
        status: "excused",
        notes: "عذر مرضي طارئ موثق.",
        excuse_id: "exc_02",
      },
    ],
  },
  {
    id: "mtg_03_upcoming_general",
    title: "الاجتماع الشهري العام وتقييم المخرجات (Monthly Assembly Review)",
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    location: "Google Meet Room / Hall 1A",
    type: "General Assembly",
    target_team_id: "all",
    target_team_name: "اجتماع عام - جميع اللجان والأعضاء",
    status: "scheduled",
    created_by: "hossam_super_admin",
    attendance_taken: false,
    presentCount: 0,
    absentCount: 0,
    excusedCount: 1,
    records: [],
  },
  {
    id: "mtg_04_hr_internal_sync",
    title: "الاجتماع الأسبوعي لفريق الموارد البشرية ومراجعة الأداء (HR Internal Sync)",
    date: new Date(Date.now() + 86400000 * 4).toISOString(),
    location: "HR Meeting Room & Google Meet",
    type: "Team Meeting",
    target_team_id: "team_hr",
    target_team_name: "الموارد البشرية (Human Resources)",
    status: "scheduled",
    created_by: "hossam_super_admin",
    attendance_taken: false,
    presentCount: 0,
    absentCount: 0,
    excusedCount: 0,
    records: [],
  },
];

export const INITIAL_EXCUSES: MeetingExcuse[] = [
  {
    id: "exc_01",
    meeting_id: "mtg_01_kickoff",
    meeting_title: "اجتماع الجمعية العمومية الافتتاحي - الموسم 2026 (Kick-off Assembly)",
    member_id: "usr_member_omar",
    member_name: "Omar Taha",
    member_email: "omar.taha@gdgnctu.com",
    reason_type: "academic_exam",
    description: "لدي امتحان عملي بالكلية في نفس موعد انعقاد الاجتماع من 4 لـ 6 مساءً.",
    evidence_url: "https://drive.google.com/exam_schedule_oct2026.pdf",
    status: "approved",
    reviewer_id: "hossam_super_admin",
    reviewer_name: "Hossam Ahmed (Super Admin)",
    review_notes: "تم التحقق من جدول الكلية واعتماد العذر رسمياً.",
    submitted_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    reviewed_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "exc_02",
    meeting_id: "mtg_02_tech_orientation",
    meeting_title: "ورشة العمل التنسيقية للجان والمسارات التقنية (Tech Tracks Sync)",
    member_id: "usr_member_nour",
    member_name: "Nourhan Ali",
    member_email: "nourhan@gdgnctu.com",
    reason_type: "medical_emergency",
    description: "وعكة صحية مفاجئة وتمت مراجعة المستشفى.",
    evidence_url: "https://drive.google.com/medical_report.pdf",
    status: "approved",
    reviewer_id: "hossam_super_admin",
    reviewer_name: "Hossam Ahmed (Super Admin)",
    review_notes: "عذر صحي معتمد، نتمنى لكِ السلامة.",
    submitted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "exc_03",
    meeting_id: "mtg_03_upcoming_general",
    meeting_title: "الاجتماع الشهري العام وتقييم المخرجات (Monthly Assembly Review)",
    member_id: "usr_member_1",
    member_name: "Youssef Ibrahim",
    member_email: "member@gdgnctu.com",
    reason_type: "academic_exam",
    description: "تسليم مشروع التخرج العملي في الجامعة ومناقشة المعمل المقررة في ذات التوقيت.",
    evidence_url: "https://nctu.edu.eg/faculty/calendar-milestone.pdf",
    status: "pending",
    submitted_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const inMemoryCache: Record<string, unknown[]> = {};

function getStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") {
    if (!inMemoryCache[key]) {
      inMemoryCache[key] = [...fallback];
    }
    return inMemoryCache[key] as T[];
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T[]): void {
  inMemoryCache[key] = data;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to localStorage (${key}):`, e);
  }
}

export const attendanceService = {
  // ── Meetings ─────────────────────────────────────────────
  getMeetings(): MeetingAttendanceEvent[] {
    return getStorage<MeetingAttendanceEvent>(STORAGE_MEETINGS_KEY, INITIAL_MEETINGS);
  },

  createMeeting(
    meeting: Omit<
      MeetingAttendanceEvent,
      "id" | "records" | "presentCount" | "absentCount" | "excusedCount" | "attendance_taken"
    > & {
      id?: string;
      records?: MemberAttendanceRecord[];
      presentCount?: number;
      absentCount?: number;
      excusedCount?: number;
      attendance_taken?: boolean;
    }
  ): MeetingAttendanceEvent {
    const meetings = this.getMeetings();
    const newMeeting: MeetingAttendanceEvent = {
      ...meeting,
      id: meeting.id || `mtg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      records: meeting.records || [],
      presentCount: meeting.presentCount || 0,
      absentCount: meeting.absentCount || 0,
      excusedCount: meeting.excusedCount || 0,
      attendance_taken: meeting.attendance_taken || false,
    };
    const updated = [newMeeting, ...meetings];
    setStorage(STORAGE_MEETINGS_KEY, updated);
    return newMeeting;
  },

  updateMeeting(
    id: string,
    updates: Partial<MeetingAttendanceEvent>
  ): MeetingAttendanceEvent | null {
    const meetings = this.getMeetings();
    let updatedMeeting: MeetingAttendanceEvent | null = null;
    const updated = meetings.map((m) => {
      if (m.id === id) {
        updatedMeeting = { ...m, ...updates };
        return updatedMeeting;
      }
      return m;
    });
    setStorage(STORAGE_MEETINGS_KEY, updated);
    return updatedMeeting;
  },

  deleteMeeting(id: string): boolean {
    const meetings = this.getMeetings();
    const updated = meetings.filter((m) => m.id !== id);
    setStorage(STORAGE_MEETINGS_KEY, updated);
    return true;
  },

  // ── Excuses ──────────────────────────────────────────────
  getExcuses(): MeetingExcuse[] {
    return getStorage<MeetingExcuse>(STORAGE_EXCUSES_KEY, INITIAL_EXCUSES);
  },

  getExcusesByMember(memberId: string): MeetingExcuse[] {
    const excuses = this.getExcuses();
    return excuses.filter(
      (e) => e.member_id === memberId || (e.member_email && e.member_email.toLowerCase() === memberId.toLowerCase())
    );
  },

  getExcusesByMeeting(meetingId: string): MeetingExcuse[] {
    const excuses = this.getExcuses();
    return excuses.filter((e) => e.meeting_id === meetingId);
  },

  submitExcuse(
    excuse: Omit<MeetingExcuse, "id" | "submitted_at" | "status">
  ): MeetingExcuse {
    const excuses = this.getExcuses();
    const newExcuse: MeetingExcuse = {
      ...excuse,
      id: `exc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: "pending",
      submitted_at: new Date().toISOString(),
    };
    const updated = [newExcuse, ...excuses];
    setStorage(STORAGE_EXCUSES_KEY, updated);

    // If meeting exists, check if excusedCount needs an update
    const meeting = this.getMeetings().find((m) => m.id === excuse.meeting_id);
    if (meeting) {
      // Keep in sync
    }

    return newExcuse;
  },

  reviewExcuse(
    id: string,
    decision: "approved" | "rejected",
    reviewerId: string,
    reviewerName: string,
    notes?: string
  ): MeetingExcuse | null {
    const excuses = this.getExcuses();
    let target: MeetingExcuse | null = null;
    const updated = excuses.map((e) => {
      if (e.id === id) {
        target = {
          ...e,
          status: decision,
          reviewer_id: reviewerId,
          reviewer_name: reviewerName,
          review_notes: notes || (decision === "approved" ? "عذر رسمي مقبول" : "عذر غير مستوفٍ للشروط"),
          reviewed_at: new Date().toISOString(),
        };
        return target;
      }
      return e;
    });
    setStorage(STORAGE_EXCUSES_KEY, updated);

    // If approved, also reflect in meeting records if existing
    if (target && decision === "approved") {
      const meetings = this.getMeetings();
      const updatedMeetings = meetings.map((m) => {
        if (m.id === (target as MeetingExcuse).meeting_id && m.records) {
          const updatedRecs = m.records.map((r) => {
            if (r.member_id === (target as MeetingExcuse).member_id) {
              return {
                ...r,
                status: "excused" as const,
                notes: (target as MeetingExcuse).description,
                excuse_id: (target as MeetingExcuse).id,
              };
            }
            return r;
          });
          const excusedCount = updatedRecs.filter((r) => r.status === "excused").length;
          const presentCount = updatedRecs.filter((r) => r.status === "present").length;
          const absentCount = updatedRecs.filter((r) => r.status === "absent").length;
          return {
            ...m,
            records: updatedRecs,
            excusedCount,
            presentCount,
            absentCount,
          };
        }
        return m;
      });
      setStorage(STORAGE_MEETINGS_KEY, updatedMeetings);
    }

    return target;
  },

  // ── Finalize Attendance with Enforcement ─────────────────
  finalizeAttendance(
    meetingId: string,
    records: MemberAttendanceRecord[],
    finalizedBy: string
  ): {
    meeting: MeetingAttendanceEvent | null;
    penalizedMembers: MemberAttendanceRecord[];
  } {
    const meetings = this.getMeetings();
    const targetMeeting = meetings.find((m) => m.id === meetingId);
    if (!targetMeeting) return { meeting: null, penalizedMembers: [] };

    const presentCount = records.filter((r) => r.status === "present").length;
    const excusedCount = records.filter((r) => r.status === "excused").length;
    const absentCount = records.filter((r) => r.status === "absent").length;

    // Identify absent members who will receive policy penalties & warnings
    const penalizedMembers = records
      .filter((r) => r.status === "absent")
      .map((r) => ({ ...r, penalty_applied: true }));

    const updatedRecords = records.map((r) => ({
      ...r,
      penalty_applied: r.status === "absent" ? true : r.penalty_applied,
    }));

    const updatedMeeting: MeetingAttendanceEvent = {
      ...targetMeeting,
      status: "completed",
      attendance_taken: true,
      presentCount,
      excusedCount,
      absentCount,
      records: updatedRecords,
    };

    const updatedMeetings = meetings.map((m) => (m.id === meetingId ? updatedMeeting : m));
    setStorage(STORAGE_MEETINGS_KEY, updatedMeetings);

    return {
      meeting: updatedMeeting,
      penalizedMembers,
    };
  },

  // ── Meeting Audience Scope Validator ───────────────────────
  isMemberInMeetingScope(
    member: { team_id?: string; committee?: string; team?: { id?: string; name?: string } },
    meeting: MeetingAttendanceEvent
  ): boolean {
    if (!meeting.target_team_id || meeting.target_team_id === "all" || meeting.target_team_id === "public") {
      return true;
    }
    const target = meeting.target_team_id.toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userTeamId = (member.team_id || member.team?.id || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userCommittee = (member.committee || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userTeamName = (member.team?.name || "").toLowerCase().trim();

    if (userTeamId === target) return true;
    if (userCommittee === target) return true;
    if (userTeamId && target && (userTeamId.includes(target) || target.includes(userTeamId))) return true;
    if (userCommittee && target && (userCommittee.includes(target) || target.includes(userCommittee))) return true;
    if (userTeamName && target && (userTeamName.includes(target) || target.includes(userTeamName))) return true;
    if (meeting.target_team_name && userTeamId && meeting.target_team_name.toLowerCase().includes(userTeamId)) return true;
    if (meeting.target_team_name && userCommittee && meeting.target_team_name.toLowerCase().includes(userCommittee)) return true;

    return false;
  },
};
