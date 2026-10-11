"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Users,
  MapPin,
  FileText,
  ShieldAlert,
  Award,
  AlertTriangle,
  Eye,
  Check,
  X,
  ExternalLink,
  Filter,
  Search,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/app-context";
import {
  attendanceService,
  INITIAL_MEETINGS,
  INITIAL_EXCUSES,
} from "@/lib/attendance-service";
import {
  MeetingAttendanceEvent,
  MeetingExcuse,
  MemberAttendanceRecord,
  MemberAttendanceStatus,
  MeetingExcuseReasonType,
} from "@/types";

export default function AttendancePage() {
  const {
    locale,
    availableUsers,
    currentUser,
    addPointEvent,
    addIncident,
    addNotification,
    logUserAction,
  } = useApp();
  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const isAdminOrLead =
    userRole === "super_admin" ||
    userRole === "hr_admin" ||
    userRole === "team_lead";

  // ── State ────────────────────────────────────────────────
  const [meetings, setMeetings] = useState<MeetingAttendanceEvent[]>([]);
  const [excuses, setExcuses] = useState<MeetingExcuse[]>([]);
  const [activeTab, setActiveTab] = useState<"meetings" | "excuses" | "my_record">("meetings");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Modals ───────────────────────────────────────────────
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [isSubmitExcuseOpen, setIsSubmitExcuseOpen] = useState(false);
  const [isTakeAttendanceOpen, setIsTakeAttendanceOpen] = useState(false);
  const [isReviewExcuseOpen, setIsReviewExcuseOpen] = useState(false);

  // ── Selected Entities ────────────────────────────────────
  const [activeMeetingForAttendance, setActiveMeetingForAttendance] = useState<MeetingAttendanceEvent | null>(null);
  const [activeExcuseForReview, setActiveExcuseForReview] = useState<MeetingExcuse | null>(null);

  // ── Form Buffers ─────────────────────────────────────────
  const [newMeetingData, setNewMeetingData] = useState({
    title: "",
    date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
    location: "Main Campus Auditorium / Google Meet",
    type: "General Assembly",
  });

  const [excuseFormData, setExcuseFormData] = useState({
    meeting_id: "",
    reason_type: "academic_exam" as MeetingExcuseReasonType,
    description: "",
    evidence_url: "",
  });

  const [reviewNotes, setReviewNotes] = useState("");

  // Roster attendance sheet for active meeting
  const [attendanceSheet, setAttendanceSheet] = useState<Record<string, { status: MemberAttendanceStatus; notes: string }>>({});

  // ── Load Data ────────────────────────────────────────────
  const reloadData = () => {
    setMeetings(attendanceService.getMeetings());
    setExcuses(attendanceService.getExcuses());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Set default meeting for excuse modal if meetings exist
  useEffect(() => {
    if (!excuseFormData.meeting_id && meetings.length > 0) {
      setExcuseFormData((prev) => ({ ...prev, meeting_id: meetings[0].id }));
    }
  }, [meetings, excuseFormData.meeting_id]);

  // ── Stats Calculations ───────────────────────────────────
  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter((m) => m.attendance_taken || m.status === "completed").length;
  const totalPresentCount = meetings.reduce((acc, m) => acc + (m.presentCount || 0), 0);
  const totalAbsentCount = meetings.reduce((acc, m) => acc + (m.absentCount || 0), 0);
  const totalExcusedCount = meetings.reduce((acc, m) => acc + (m.excusedCount || 0), 0);
  const pendingExcusesCount = excuses.filter((e) => e.status === "pending").length;

  const attendanceRate =
    totalPresentCount + totalAbsentCount > 0
      ? Math.round((totalPresentCount / (totalPresentCount + totalAbsentCount + totalExcusedCount)) * 100)
      : 100;

  // ── Filtered Collections ─────────────────────────────────
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [meetings, searchQuery]);

  const visibleExcuses = useMemo(() => {
    if (isMember && currentUser) {
      return excuses.filter(
        (e) =>
          e.member_id === currentUser.id ||
          (currentUser.email && e.member_email.toLowerCase() === currentUser.email.toLowerCase())
      );
    }
    return excuses;
  }, [excuses, isMember, currentUser]);

  // Personal user records
  const myAttendanceRecords = useMemo(() => {
    if (!currentUser) return [];
    const list: Array<{
      meeting: MeetingAttendanceEvent;
      record?: MemberAttendanceRecord;
      excuse?: MeetingExcuse;
    }> = [];

    meetings.forEach((m) => {
      const rec = m.records?.find(
        (r) =>
          r.member_id === currentUser.id ||
          (currentUser.email && r.member_email?.toLowerCase() === currentUser.email.toLowerCase())
      );
      const exc = excuses.find(
        (e) =>
          e.meeting_id === m.id &&
          (e.member_id === currentUser.id ||
            (currentUser.email && e.member_email.toLowerCase() === currentUser.email.toLowerCase()))
      );
      list.push({ meeting: m, record: rec, excuse: exc });
    });

    return list;
  }, [meetings, excuses, currentUser]);

  // ── Helper to find member status in meeting ──────────────
  const getMemberStatusInMeeting = (meeting: MeetingAttendanceEvent) => {
    if (!currentUser) return null;
    const rec = meeting.records?.find(
      (r) =>
        r.member_id === currentUser.id ||
        (currentUser.email && r.member_email?.toLowerCase() === currentUser.email.toLowerCase())
    );
    if (rec) return rec.status;

    // Check if user submitted an approved excuse
    const userExcuse = excuses.find(
      (e) =>
        e.meeting_id === meeting.id &&
        (e.member_id === currentUser.id ||
          (currentUser.email && e.member_email.toLowerCase() === currentUser.email.toLowerCase()))
    );
    if (userExcuse?.status === "approved") return "excused";
    if (userExcuse?.status === "pending") return "pending";

    return meeting.attendance_taken ? "absent" : null;
  };

  // ── Handler: Create New Meeting ──────────────────────────
  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingData.title.trim()) return;

    const created = attendanceService.createMeeting({
      title: newMeetingData.title.trim(),
      date: new Date(newMeetingData.date).toISOString(),
      location: newMeetingData.location.trim(),
      type: newMeetingData.type,
      status: "scheduled",
      created_by: currentUser?.id || "admin",
      presentCount: 0,
      absentCount: 0,
      excusedCount: 0,
      attendance_taken: false,
      records: [],
    });

    if (logUserAction) {
      logUserAction({
        action: "MEETING_CREATED",
        entity_type: "attendance_event",
        entity_id: created.id,
        reason: `إنشاء موعد اجتماع رسمي جديد: "${created.title}"`,
        details: `Type: ${created.type}, Location: ${created.location}, Date: ${created.date}.`,
        after_value: { title: created.title, type: created.type, location: created.location },
      });
    }

    // Notify all active members about the new meeting
    if (availableUsers && availableUsers.length > 0) {
      for (const u of availableUsers) {
        addNotification({
          user_id: u.id,
          recipient_email: u.email,
          title: isAr ? "دعوة لاجتماع رسمي جديد" : "Official Meeting Invitation",
          message: isAr
            ? `تم الإعلان عن "${created.title}" في موعد ${new Date(created.date).toLocaleString("ar-EG")}. يمكنك تقديم عذر مسبق عبر المنصة في حال التعذر.`
            : `New meeting scheduled: "${created.title}" on ${new Date(created.date).toLocaleDateString()}. Prior excuses can be lodged via portal.`,
          type: "general",
          link: `/${locale}/attendance`,
          is_read: false,
        });
      }
    }

    reloadData();
    setNewMeetingData({
      title: "",
      date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      location: "Main Campus Auditorium / Google Meet",
      type: "General Assembly",
    });
    setIsNewMeetingOpen(false);
  };

  // ── Handler: Submit Excuse (Member) ──────────────────────
  const handleSubmitExcuse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuseFormData.description.trim() || !currentUser) return;

    const targetMeeting = meetings.find((m) => m.id === excuseFormData.meeting_id);
    const meetingTitle = targetMeeting?.title || (isAr ? "اجتماع رسمي" : "Official Meeting");

    const created = attendanceService.submitExcuse({
      meeting_id: excuseFormData.meeting_id,
      meeting_title: meetingTitle,
      member_id: currentUser.id,
      member_name: currentUser.full_name,
      member_email: currentUser.email,
      reason_type: excuseFormData.reason_type,
      description: excuseFormData.description.trim(),
      evidence_url: excuseFormData.evidence_url.trim() || undefined,
    });

    if (logUserAction) {
      logUserAction({
        action: "MEETING_EXCUSE_SUBMITTED",
        entity_type: "meeting_excuse",
        entity_id: created.id,
        reason: `تقديم طلب عذر غياب عن اجتماع ("${meetingTitle}")`,
        details: `Reason Type: ${created.reason_type}, Description: ${created.description}.`,
        after_value: {
          meeting_id: created.meeting_id,
          member_id: created.member_id,
          reason_type: created.reason_type,
        },
      });
    }

    // Notify admins about the new excuse
    const admins = availableUsers.filter(
      (u) => u.role === "super_admin" || u.role === "hr_admin" || u.role === "team_lead"
    );
    for (const admin of admins) {
      addNotification({
        user_id: admin.id,
        recipient_email: admin.email,
        title: isAr ? "طلب عذر غياب جديد بانتظار المراجعة" : "New Absence Excuse Pending Review",
        message: isAr
          ? `قدم العضو (${currentUser.full_name}) عذر غياب عن "${meetingTitle}": ${created.description.slice(0, 60)}...`
          : `Member (${currentUser.full_name}) filed an absence excuse for "${meetingTitle}".`,
        type: "general",
        link: `/${locale}/attendance`,
        is_read: false,
      });
    }

    alert(
      isAr
        ? "تم تسجيل ورفع طلب العذر بنجاح إلى مسؤولي الموارد البشرية للمراجعة والاعتماد."
        : "Absence excuse successfully submitted for HR review."
    );

    reloadData();
    setExcuseFormData({
      meeting_id: meetings[0]?.id || "",
      reason_type: "academic_exam",
      description: "",
      evidence_url: "",
    });
    setIsSubmitExcuseOpen(false);
  };

  // ── Handler: Open Take Attendance Modal (Admin) ──────────
  const handleOpenTakeAttendance = (meeting: MeetingAttendanceEvent) => {
    setActiveMeetingForAttendance(meeting);

    // Build roster sheet pre-populated with existing records or approved excuses
    const sheet: Record<string, { status: MemberAttendanceStatus; notes: string }> = {};

    availableUsers.forEach((u) => {
      // Check if user already has an existing record for this meeting
      const existing = meeting.records?.find((r) => r.member_id === u.id);
      if (existing) {
        sheet[u.id] = { status: existing.status, notes: existing.notes || "" };
        return;
      }

      // Check if user has an approved excuse for this meeting
      const userExcuse = excuses.find(
        (e) =>
          e.meeting_id === meeting.id &&
          (e.member_id === u.id || (u.email && e.member_email.toLowerCase() === u.email.toLowerCase())) &&
          e.status === "approved"
      );

      if (userExcuse) {
        sheet[u.id] = { status: "excused", notes: `عذر معتمد: ${userExcuse.description}` };
      } else {
        sheet[u.id] = { status: "present", notes: "" };
      }
    });

    setAttendanceSheet(sheet);
    setIsTakeAttendanceOpen(true);
  };

  // ── Handler: Finalize Attendance & Apply Penalties ───────
  const handleFinalizeAttendance = async () => {
    if (!activeMeetingForAttendance) return;

    const records: MemberAttendanceRecord[] = availableUsers.map((u) => {
      const entry = attendanceSheet[u.id] || { status: "present", notes: "" };
      const matchedExcuse = excuses.find(
        (e) =>
          e.meeting_id === activeMeetingForAttendance.id &&
          (e.member_id === u.id || (u.email && e.member_email.toLowerCase() === u.email.toLowerCase())) &&
          e.status === "approved"
      );

      return {
        member_id: u.id,
        member_name: u.full_name,
        member_email: u.email,
        team_name: u.team_id || "General",
        status: entry.status,
        notes: entry.notes,
        excuse_id: matchedExcuse?.id,
        penalty_applied: entry.status === "absent",
      };
    });

    const result = attendanceService.finalizeAttendance(
      activeMeetingForAttendance.id,
      records,
      currentUser?.full_name || "HR Admin"
    );

    // Apply Penalties to Absent Members (ينزلهم الانذار ويطبق عليهم العقوبات)
    if (result.penalizedMembers.length > 0) {
      for (const absent of result.penalizedMembers) {
        // 1. Record Negative Points (-2 points under policy 'unexcused_meeting')
        await addPointEvent({
          member_id: absent.member_id,
          team_id: "team-general",
          event_date: new Date().toISOString().split("T")[0],
          category_id: "unexcused_meeting",
          direction: "negative",
          value: 2,
          explanation: isAr
            ? `خصم نقاط: غياب غير مبرر عن اجتماع رسمي (${activeMeetingForAttendance.title}) دون تقديم عذر مسبق معتمد.`
            : `Point deduction: Unexcused absence from official meeting (${activeMeetingForAttendance.title}).`,
          recorded_by: currentUser?.id || "admin",
          status: "approved",
        });

        // 2. Issue Incident Warning (Level 1: Notice / Warning)
        await addIncident({
          member_id: absent.member_id,
          target_member_id: absent.member_id,
          reported_by: currentUser?.id || "admin",
          level: 1,
          title: isAr
            ? `لفت نظر وإنذار: غياب غير مبرر عن اجتماع (${activeMeetingForAttendance.title})`
            : `Notice: Unexcused meeting absence (${activeMeetingForAttendance.title})`,
          description: isAr
            ? `تم رصد غيابك غير المبرر عن الاجتماع الرسمي المنعقد بتاريخ ${new Date(activeMeetingForAttendance.date).toLocaleDateString("ar-EG")}. تم تطبيق الجزاء بلائحة النقاط (-2) ولفت النظر، ويحق لك تقديم تظلم خلال 7 أيام عمل في حال وجود ظرف طارئ موثق.`
            : `Unexcused absence recorded for meeting on ${new Date(activeMeetingForAttendance.date).toLocaleDateString()}. Penalty applied under bylaws. Appeal allowed within 7 working days.`,
          status: "open",
        });

        // 3. Dispatch Notification
        await addNotification({
          user_id: absent.member_id,
          recipient_email: absent.member_email,
          title: isAr ? "إشعار غياب رسمي وتطبيق الجزاءات" : "Absence Notice & Penalty Enforcement",
          message: isAr
            ? `تم رصد غياب غير مبرر عن "${activeMeetingForAttendance.title}". طُبق خصم 2 نقاط وإنذار إداري. يحق لك الطعن والتظلم خلال 7 أيام عمل.`
            : `Unexcused absence registered for "${activeMeetingForAttendance.title}". -2 pts deduction and notice issued.`,
          type: "point_decision",
          link: `/${locale}/appeals`,
          is_read: false,
        });
      }
    }

    // Comprehensive Audit Trail
    if (logUserAction) {
      await logUserAction({
        action: "ATTENDANCE_FINALIZED_WITH_PENALTIES",
        entity_type: "attendance_event",
        entity_id: activeMeetingForAttendance.id,
        reason: `اعتماد رصد حضور الاجتماع ("${activeMeetingForAttendance.title}") وتطبيق الجزاءات على (${result.penalizedMembers.length}) غائبين`,
        details: `Present: ${result.meeting?.presentCount}, Excused: ${result.meeting?.excusedCount}, Absent/Penalized: ${result.penalizedMembers.length}.`,
        after_value: {
          meeting_id: activeMeetingForAttendance.id,
          present_count: result.meeting?.presentCount,
          excused_count: result.meeting?.excusedCount,
          penalized_count: result.penalizedMembers.length,
          penalized_members: result.penalizedMembers.map((m) => m.member_name),
        },
      });
    }

    alert(
      isAr
        ? `تم اعتماد وتوثيق الحضور بنجاح!\n- الحضور: ${result.meeting?.presentCount}\n- الأعذار: ${result.meeting?.excusedCount}\n- الغياب وتطبيق الجزاءات: ${result.penalizedMembers.length} عضو (تم خصم النقاط وإصدار الإنذارات تلقائياً).`
        : `Attendance finalized!\n- Present: ${result.meeting?.presentCount}\n- Excused: ${result.meeting?.excusedCount}\n- Penalized Absences: ${result.penalizedMembers.length} members.`
    );

    reloadData();
    setIsTakeAttendanceOpen(false);
    setActiveMeetingForAttendance(null);
  };

  // ── Handler: Review Excuse (Admin) ───────────────────────
  const handleReviewExcuse = (decision: "approved" | "rejected") => {
    if (!activeExcuseForReview || !currentUser) return;

    const reviewed = attendanceService.reviewExcuse(
      activeExcuseForReview.id,
      decision,
      currentUser.id,
      currentUser.full_name,
      reviewNotes.trim()
    );

    if (logUserAction) {
      logUserAction({
        action: decision === "approved" ? "MEETING_EXCUSE_APPROVED" : "MEETING_EXCUSE_REJECTED",
        entity_type: "meeting_excuse",
        entity_id: activeExcuseForReview.id,
        reason: `قرار ${decision === "approved" ? "اعتماد وقبول" : "رفض"} عذر الغياب للعضو (${activeExcuseForReview.member_name})`,
        details: `Review notes: ${reviewNotes || "Reviewed by HR"}.`,
        after_value: {
          excuse_id: activeExcuseForReview.id,
          decision,
          member_id: activeExcuseForReview.member_id,
        },
      });
    }

    // Notify the member about the decision
    addNotification({
      user_id: activeExcuseForReview.member_id,
      recipient_email: activeExcuseForReview.member_email,
      title: decision === "approved"
        ? (isAr ? "تم اعتماد عذر الغياب رسميًا" : "Absence Excuse Approved")
        : (isAr ? "إشعار بشأن عذر الغياب المقدم" : "Absence Excuse Rejected"),
      message: decision === "approved"
        ? (isAr
            ? `تم قبول عذرك بخصوص اجتماع "${activeExcuseForReview.meeting_title}" وإعفاؤك من أي خصومات أو إنذارات.`
            : `Your excuse for "${activeExcuseForReview.meeting_title}" was approved without penalties.`)
        : (isAr
            ? `تم رفض طلب العذر بخصوص "${activeExcuseForReview.meeting_title}". السبب: ${reviewNotes || "عدم استيفاء الشروط"}.`
            : `Your excuse for "${activeExcuseForReview.meeting_title}" was rejected: ${reviewNotes || "Does not meet policy"}.`),
      type: "general",
      link: `/${locale}/attendance`,
      is_read: false,
    });

    reloadData();
    setIsReviewExcuseOpen(false);
    setActiveExcuseForReview(null);
    setReviewNotes("");
  };

  // ── Render Reason Label ──────────────────────────────────
  const getReasonTypeLabel = (type: MeetingExcuseReasonType) => {
    switch (type) {
      case "academic_exam":
        return isAr ? "ارتباط أكاديمي / امتحانات" : "Academic Exam / Milestone";
      case "medical_emergency":
        return isAr ? "ظرف صحي / مرضي طارئ" : "Medical Emergency";
      case "family_emergency":
        return isAr ? "ظرف عائلي قاهر" : "Family Emergency";
      case "travel_work":
        return isAr ? "ارتباط عمل أو سفر رسمي" : "Work / Travel";
      default:
        return isAr ? "ظرف استثنائي آخر" : "Other Circumstances";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "الحضور والاجتماعات الرسمية" : "Attendance & Official Meetings"}
        description={
          isAr
            ? "نظام الحضور الشامل: تسجيل الاجتماعات، تقديم ومراجعة الأعذار المسبقة، والرصد الإداري مع التطبيق الآلي للجزاءات والإنذارات للغياب غير المبرر."
            : "Complete attendance governance: meeting logs, advance excuse workflows, and automatic policy penalties/warnings for unexcused absences."
        }
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Member can submit excuse */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSubmitExcuseOpen(true)}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Clock className="w-4 h-4" />
            {isAr ? "تقديم عذر غياب" : "Submit Absence Excuse"}
          </Button>

          {/* Admin can create meeting */}
          {isAdminOrLead && (
            <Button
              size="sm"
              onClick={() => setIsNewMeetingOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4" />
              {isAr ? "تسجيل اجتماع جديد" : "Record New Meeting"}
            </Button>
          )}
        </div>
      </PageHeader>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 border-border/70 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {isAr ? "إجمالي الاجتماعات" : "Total Meetings"}
              </p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {totalMeetings}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border/70 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {isAr ? "نسبة الحضور الإجمالية" : "Attendance Rate"}
              </p>
              <h3 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {attendanceRate}%
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border/70 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {isAr ? "الأعذار المعتمدة" : "Approved Excuses"}
              </p>
              <h3 className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {totalExcusedCount}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border/70 bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {isAr ? "عقوبات الغياب المطبقة" : "Penalized Absences"}
              </p>
              <h3 className="text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {totalAbsentCount}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-border/70 bg-card/60 backdrop-blur-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {isAr ? "أعذار قيد المراجعة" : "Pending Excuses"}
              </p>
              <h3 className="text-xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {pendingExcusesCount}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Button
            variant={activeTab === "meetings" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("meetings")}
            className="text-xs h-8 rounded-lg gap-2"
          >
            <Calendar className="w-3.5 h-3.5" />
            {isAr ? "الاجتماعات والجلسات" : "Meetings & Sessions"}
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-bold">
              {meetings.length}
            </span>
          </Button>

          <Button
            variant={activeTab === "excuses" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("excuses")}
            className="text-xs h-8 rounded-lg gap-2"
          >
            <Clock className="w-3.5 h-3.5" />
            {isAr ? (isAdminOrLead ? "إدارة ومراجعة الأعذار" : "أعذاري المقدمة") : (isAdminOrLead ? "Excuse Requests" : "My Excuses")}
            {pendingExcusesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                {pendingExcusesCount}
              </span>
            )}
          </Button>

          {isMember && (
            <Button
              variant={activeTab === "my_record" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("my_record")}
              className="text-xs h-8 rounded-lg gap-2"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isAr ? "سجل حضوري الشخصي" : "My Attendance History"}
            </Button>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? "بحث في الاجتماعات..." : "Search meetings..."}
            className="h-8 text-xs pl-9 rtl:pl-3 rtl:pr-9 bg-background/50"
          />
        </div>
      </div>

      {/* ── TAB 1: MEETINGS LIST ──────────────────────────────── */}
      {activeTab === "meetings" && (
        <div className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-40 text-primary" />
              <p className="text-sm font-semibold">
                {isAr ? "لا توجد اجتماعات مسجلة مطابقة" : "No meetings found"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAdminOrLead
                  ? (isAr ? "اضغط على 'تسجيل اجتماع جديد' بالأعلى لجدولة اجتماع للجمعية العمومية أو اللجان." : "Click 'Record New Meeting' to schedule a session.")
                  : (isAr ? "لم يتم الإعلان عن اجتماعات مجدولة حالياً." : "No upcoming meetings scheduled at this time.")}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredMeetings.map((ev) => {
                const memberStatus = isMember ? getMemberStatusInMeeting(ev) : null;
                const isCompleted = ev.attendance_taken || ev.status === "completed";

                return (
                  <Card
                    key={ev.id}
                    className="p-5 border-border/80 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {ev.type}
                            </span>
                            {isCompleted ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/15 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {isAr ? "مكتمل ورُصد الحضور" : "Attendance Verified"}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-blue-700 bg-blue-500/15 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {isAr ? "مجدول بانتظار الانعقاد" : "Scheduled"}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-base text-foreground mt-1.5 leading-snug">
                            {ev.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span dir="ltr">{new Date(ev.date).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span dir="ltr">{new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {ev.location}
                        </span>
                      </div>

                      {/* Member's Individual Attendance Badge */}
                      {isMember && (
                        <div className="p-2.5 rounded-xl border bg-muted/20 text-xs flex items-center justify-between">
                          <span className="font-semibold text-muted-foreground">
                            {isAr ? "حالة حضورك الشخصي:" : "Your Attendance Status:"}
                          </span>
                          {memberStatus === "present" && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {isAr ? "حاضر رسمياً" : "Present"}
                            </span>
                          )}
                          {memberStatus === "excused" && (
                            <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              {isAr ? "غياب بعذر معتمد" : "Excused"}
                            </span>
                          )}
                          {memberStatus === "absent" && (
                            <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {isAr ? "غياب غير مبرر (-2 نقاط + إنذار)" : "Unexcused (-2 pts & Notice)"}
                            </span>
                          )}
                          {memberStatus === "pending" && (
                            <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {isAr ? "عذر قيد مراجعة الإدارة" : "Excuse Under Review"}
                            </span>
                          )}
                          {!memberStatus && (
                            <span className="text-muted-foreground font-medium">
                              {isAr ? "بانتظار انعقاد الاجتماع" : "Awaiting Session"}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Admin Metrics Bar */}
                      {isCompleted ? (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center text-xs">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <span className="font-black text-lg block">{ev.presentCount}</span>
                            <span>{isAr ? "حضور" : "Present"}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            <span className="font-black text-lg block">{ev.excusedCount}</span>
                            <span>{isAr ? "أعذار معتمدة" : "Excused"}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            <span className="font-black text-lg block">{ev.absentCount}</span>
                            <span>{isAr ? "غياب معاقب" : "Penalized"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                          {isAr
                            ? "الاجتماع مجدول، يمكن للأعضاء تقديم أعذارهم المسبقة لحين انعقاد الجلسة ورصد الحضور."
                            : "Scheduled meeting. Members can lodge advance excuses prior to session."}
                        </div>
                      )}
                    </div>

                    {/* Actions Strip */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                      {/* Member: quick excuse button if not already present or excused */}
                      {isMember && memberStatus !== "present" && memberStatus !== "excused" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExcuseFormData((prev) => ({ ...prev, meeting_id: ev.id }));
                            setIsSubmitExcuseOpen(true);
                          }}
                          className="text-xs text-primary gap-1 h-8"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {isAr ? "تقديم عذر لهذا الاجتماع" : "File Excuse"}
                        </Button>
                      )}

                      {/* Admin: Take attendance button */}
                      {isAdminOrLead && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenTakeAttendance(ev)}
                          className={`gap-1.5 text-xs h-8 ml-auto ${
                            isCompleted
                              ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                              : "bg-primary text-white hover:bg-primary/90"
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          {isCompleted
                            ? (isAr ? "مراجعة وتعديل رصد الحضور" : "Review Attendance")
                            : (isAr ? "رصد الحضور وتطبيق العقوبات" : "Take Attendance & Apply Penalties")}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: EXCUSES LIST & REVIEW ──────────────────────── */}
      {activeTab === "excuses" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-bold">
                {isAr ? "لائحة الأعذار المسبقة وحماية الأعضاء من الجزاءات" : "Policy on Documented Advance Excuses"}
              </p>
              <p className="leading-relaxed opacity-90">
                {isAr
                  ? "وفقاً لميثاق الموارد البشرية، تقديم عذر موثق ومسبق قبل 24 ساعة من الاجتماع يعفي العضو تماماً من أي خصومات نقاط أو إنذارات إدارية. تراجع الإدارة كل طلب بدقة واستقلالية."
                  : "Under HR charter, lodging a documented excuse at least 24 hours prior grants full exemption from point penalties and warning notices."}
              </p>
            </div>
          </div>

          {visibleExcuses.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-primary" />
              <p className="text-sm font-semibold">
                {isAr ? "لا توجد طلبات أعذار مسجلة حالياً" : "No absence excuses on record"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleExcuses.map((exc) => {
                const isPending = exc.status === "pending";
                const isApproved = exc.status === "approved";

                return (
                  <Card key={exc.id} className="p-5 border-border/80 hover:shadow-md transition-all space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            {getReasonTypeLabel(exc.reason_type)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isApproved
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : isPending
                                ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 animate-pulse"
                                : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {isApproved
                              ? (isAr ? "عذر معتمد ومقبول" : "Approved")
                              : isPending
                              ? (isAr ? "قيد مراجعة الإدارة" : "Pending Review")
                              : (isAr ? "عذر مرفوض" : "Rejected")}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-1.5">
                          {exc.meeting_title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? "العضو:" : "Member:"} <strong className="text-foreground">{exc.member_name}</strong> ({exc.member_email})
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-foreground space-y-1">
                      <p className="font-semibold text-muted-foreground text-[10px]">
                        {isAr ? "تفاصيل ومبررات العذر:" : "Excuse Justification:"}
                      </p>
                      <p className="leading-relaxed">{exc.description}</p>
                    </div>

                    {exc.evidence_url && (
                      <div className="text-xs flex items-center gap-2">
                        <span className="text-muted-foreground">{isAr ? "المستند الداعم:" : "Evidence:"}</span>
                        <a
                          href={exc.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {isAr ? "عرض المرفق / الشهادة" : "View Attachment"}
                        </a>
                      </div>
                    )}

                    {exc.review_notes && (
                      <div className="p-2.5 rounded-lg bg-background border text-[11px] text-muted-foreground space-y-0.5">
                        <p className="font-semibold text-foreground">
                          {isAr ? "قرار وملاحظات المراجعة:" : "Reviewer Determination:"}
                        </p>
                        <p>{exc.review_notes}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {exc.reviewer_name} • {exc.reviewed_at ? new Date(exc.reviewed_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                    )}

                    {/* Admin Actions */}
                    {isAdminOrLead && isPending && (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveExcuseForReview(exc);
                            setReviewNotes("عذر غير مستوفٍ للشروط أو الدليل غير واضح.");
                            setIsReviewExcuseOpen(true);
                          }}
                          className="text-xs h-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          {isAr ? "رفض العذر" : "Reject"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveExcuseForReview(exc);
                            setReviewNotes("عذر رسمي معتمد ومستوفٍ للشروط.");
                            setIsReviewExcuseOpen(true);
                          }}
                          className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          {isAr ? "قبول واعتماد" : "Approve"}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: MY PERSONAL RECORD (MEMBER ONLY) ───────────── */}
      {activeTab === "my_record" && isMember && (
        <div className="space-y-4">
          <Card className="p-5 border-border/80">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>{isAr ? "سجل حضوري ومشاركتي في الاجتماعات" : "Personal Attendance Log"}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {currentUser?.full_name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {myAttendanceRecords.map((item, idx) => {
                  const status = item.record?.status || (item.excuse?.status === "approved" ? "excused" : item.meeting.attendance_taken ? "absent" : "pending");

                  return (
                    <div key={idx} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {item.meeting.title}
                        </h4>
                        <div className="flex items-center gap-3 text-muted-foreground mt-0.5">
                          <span>{new Date(item.meeting.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{item.meeting.location}</span>
                        </div>
                        {item.record?.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {isAr ? "ملاحظة الرصد:" : "Note:"} {item.record.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {status === "present" && (
                          <span className="font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            {isAr ? "حاضر رسمياً" : "Present"}
                          </span>
                        )}
                        {status === "excused" && (
                          <span className="font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            {isAr ? "غياب بعذر معتمد" : "Excused"}
                          </span>
                        )}
                        {status === "absent" && (
                          <div className="text-right">
                            <span className="font-bold text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4" />
                              {isAr ? "غياب غير مبرر (-2 نقاط)" : "Unexcused (-2 pts)"}
                            </span>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {isAr ? "تم إصدار لفت نظر إداري" : "Warning issued"}
                            </p>
                          </div>
                        )}
                        {status === "pending" && (
                          <span className="font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {isAr ? "بانتظار الانعقاد" : "Upcoming"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── MODAL 1: TAKE ATTENDANCE & APPLY PENALTIES (ADMIN) ── */}
      {isTakeAttendanceOpen && activeMeetingForAttendance && (
        <Dialog open={isTakeAttendanceOpen} onOpenChange={setIsTakeAttendanceOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <UserCheck className="w-5 h-5 text-primary" />
                {isAr ? "رصد الحضور وفرض الجزاءات والإنذارات" : "Take Attendance & Apply Penalties"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {activeMeetingForAttendance.title} • {new Date(activeMeetingForAttendance.date).toLocaleDateString()}
              </p>
            </DialogHeader>

            {/* Live Enforcement Banner */}
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  {isAr
                    ? "تطبيق آلي للائحة الجزاءات والإنذارات الإدارية:"
                    : "Automatic Enforcement of Penalties & Notices:"}
                </span>
              </div>
              <p className="leading-relaxed opacity-95">
                {isAr
                  ? "كل عضو يتم تحديده بـ [غياب غير مبرر] سيتم تلقائياً خصم 2 نقاط من رصيده (مخالفة غياب اجتماع أساسي)، وإصدار إخطار ولفت نظر إداري Level 1، وإرسال إشعار فوري بحقه في التظلم خلال 7 أيام عمل."
                  : "Every member marked as [Unexcused Absence] will automatically receive -2 points penalty, Level 1 administrative notice, and notification with 7-day appeal rights."}
              </p>
            </div>

            {/* Roster Sheet */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-foreground">
                {isAr ? "قائمة الأعضاء المكلفين بالحضور:" : "Invited Members Roster:"} ({availableUsers.length})
              </h4>

              <div className="divide-y divide-border/60 max-h-[46vh] overflow-y-auto pr-1">
                {availableUsers.map((u) => {
                  const entry = attendanceSheet[u.id] || { status: "present", notes: "" };
                  const userExcuse = excuses.find(
                    (e) =>
                      e.meeting_id === activeMeetingForAttendance.id &&
                      (e.member_id === u.id || (u.email && e.member_email.toLowerCase() === u.email.toLowerCase())) &&
                      e.status === "approved"
                  );

                  return (
                    <div key={u.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{u.full_name}</span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                            {u.role.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        {userExcuse && (
                          <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {isAr ? "لديه عذر مسبق معتمد" : "Approved excuse on record"}
                          </span>
                        )}
                      </div>

                      {/* 3 Status Selector Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant={entry.status === "present" ? "default" : "outline"}
                          onClick={() => {
                            setAttendanceSheet((prev) => ({
                              ...prev,
                              [u.id]: { ...prev[u.id], status: "present" },
                            }));
                          }}
                          className={`text-xs h-7 px-2.5 rounded-lg ${
                            entry.status === "present" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                          }`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {isAr ? "حاضر" : "Present"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={entry.status === "excused" ? "default" : "outline"}
                          onClick={() => {
                            setAttendanceSheet((prev) => ({
                              ...prev,
                              [u.id]: { ...prev[u.id], status: "excused" },
                            }));
                          }}
                          className={`text-xs h-7 px-2.5 rounded-lg ${
                            entry.status === "excused" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                          }`}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {isAr ? "عذر معتمد" : "Excused"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant={entry.status === "absent" ? "default" : "outline"}
                          onClick={() => {
                            setAttendanceSheet((prev) => ({
                              ...prev,
                              [u.id]: { ...prev[u.id], status: "absent" },
                            }));
                          }}
                          className={`text-xs h-7 px-2.5 rounded-lg ${
                            entry.status === "absent" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                          }`}
                        >
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          {isAr ? "غياب (عقوبة)" : "Absent (Penalized)"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTakeAttendanceOpen(false)}
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                size="sm"
                onClick={handleFinalizeAttendance}
                className="bg-primary text-white hover:bg-primary/90 gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {isAr ? "اعتماد الحضور وتطبيق العقوبات والإنذارات" : "Finalize & Enforce Penalties"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── MODAL 2: SUBMIT EXCUSE (MEMBER) ───────────────────── */}
      {isSubmitExcuseOpen && (
        <Dialog open={isSubmitExcuseOpen} onOpenChange={setIsSubmitExcuseOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {isAr ? "تقديم طلب عذر غياب عن اجتماع رسمي" : "Submit Meeting Absence Excuse"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitExcuse} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "اختر الاجتماع المستهدف:" : "Select Meeting:"}
                </label>
                <select
                  value={excuseFormData.meeting_id}
                  onChange={(e) => setExcuseFormData({ ...excuseFormData, meeting_id: e.target.value })}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({new Date(m.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "نوع وطبيعة العذر:" : "Excuse Category:"}
                </label>
                <select
                  value={excuseFormData.reason_type}
                  onChange={(e) =>
                    setExcuseFormData({
                      ...excuseFormData,
                      reason_type: e.target.value as MeetingExcuseReasonType,
                    })
                  }
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  <option value="academic_exam">{isAr ? "ارتباط أكاديمي أو امتحانات جامعية" : "Academic Exam / Milestone"}</option>
                  <option value="medical_emergency">{isAr ? "ظرف صحي أو طارئ مرضي" : "Medical Emergency"}</option>
                  <option value="family_emergency">{isAr ? "ظرف عائلي قاهر" : "Family Emergency"}</option>
                  <option value="travel_work">{isAr ? "ارتباط عمل أو سفر رسمي" : "Work / Travel"}</option>
                  <option value="other">{isAr ? "ظرف استثنائي آخر" : "Other Circumstances"}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "تفاصيل ومبررات العذر بالتفصيل:" : "Justification & Details:"}
                </label>
                <Textarea
                  required
                  rows={3}
                  placeholder={
                    isAr
                      ? "اشرح سبب تعذر الحضور بالتفصيل مع توضيح الوقت..."
                      : "Describe detailed reasons preventing your attendance..."
                  }
                  value={excuseFormData.description}
                  onChange={(e) => setExcuseFormData({ ...excuseFormData, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "رابط المستند الداعم (جدول امتحانات / تقرير / Drive):" : "Supporting Evidence URL (Optional):"}
                </label>
                <Input
                  placeholder="https://drive.google.com/..."
                  value={excuseFormData.evidence_url}
                  onChange={(e) => setExcuseFormData({ ...excuseFormData, evidence_url: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-900 dark:text-blue-200 text-[11px] leading-relaxed">
                {isAr
                  ? "💡 تنبيه: تقديم العذر المسبق قبل 24 ساعة من الاجتماع يحميك من أي خصومات نقاط (-2) أو إنذارات إدارية وفق اللائحة."
                  : "💡 Advance excuse submission protects you from point deductions and warning notices under policy."}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubmitExcuseOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-white">
                  {isAr ? "إرسال طلب العذر" : "Submit Excuse"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── MODAL 3: REVIEW EXCUSE (ADMIN) ────────────────────── */}
      {isReviewExcuseOpen && activeExcuseForReview && (
        <Dialog open={isReviewExcuseOpen} onOpenChange={setIsReviewExcuseOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "مراجعة واعتماد عذر الغياب" : "Review Absence Excuse"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {activeExcuseForReview.member_name} • {activeExcuseForReview.meeting_title}
              </p>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1">
                <p className="font-semibold text-muted-foreground text-[10px]">
                  {isAr ? "نوع العذر والوصف:" : "Excuse Description:"}
                </p>
                <p className="font-bold text-foreground">
                  {getReasonTypeLabel(activeExcuseForReview.reason_type)}
                </p>
                <p className="text-muted-foreground">{activeExcuseForReview.description}</p>
                {activeExcuseForReview.evidence_url && (
                  <a
                    href={activeExcuseForReview.evidence_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-bold mt-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {isAr ? "فتح المستند الداعم" : "Open Evidence Document"}
                  </a>
                )}
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "ملاحظات وتوجيهات المراجعة:" : "Review Notes / Rationale:"}
                </label>
                <Textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleReviewExcuse("rejected")}
                  className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 border-rose-300"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  {isAr ? "رفض العذر" : "Reject Excuse"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleReviewExcuse("approved")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {isAr ? "قبول واعتماد العذر رسمياً" : "Approve & Exempt"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── MODAL 4: CREATE MEETING (ADMIN) ──────────────────── */}
      {isNewMeetingOpen && (
        <Dialog open={isNewMeetingOpen} onOpenChange={setIsNewMeetingOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "تسجيل اجتماع رسمي جديد" : "Record New Meeting"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMeeting} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "عنوان الاجتماع أو الورشة:" : "Meeting Title:"}
                </label>
                <Input
                  required
                  placeholder={isAr ? "مثال: الاجتماع الشهري للجمعية العمومية" : "e.g., Monthly General Assembly"}
                  value={newMeetingData.title}
                  onChange={(e) => setNewMeetingData({ ...newMeetingData, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "الموعد وتاريخ الانعقاد:" : "Date & Time:"}
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={newMeetingData.date}
                  onChange={(e) => setNewMeetingData({ ...newMeetingData, date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "الموقع / القاعة / رابط الاجتماع:" : "Venue / Room / Link:"}
                </label>
                <Input
                  value={newMeetingData.location}
                  onChange={(e) => setNewMeetingData({ ...newMeetingData, location: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "نوع الاجتماع:" : "Meeting Type:"}
                </label>
                <select
                  value={newMeetingData.type}
                  onChange={(e) => setNewMeetingData({ ...newMeetingData, type: e.target.value })}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  <option value="General Assembly">{isAr ? "اجتماع عام إلزامي (General Assembly)" : "General Assembly (Mandatory)"}</option>
                  <option value="Track Sync">{isAr ? "جلسة مسار تقني (Track Sync)" : "Track Sync"}</option>
                  <option value="Executive Review">{isAr ? "اجتماع قيادة إداري (Executive Review)" : "Executive Review"}</option>
                  <option value="Workshop">{isAr ? "ورشة عمل تدريبية (Training Workshop)" : "Training Workshop"}</option>
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewMeetingOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-white">
                  {isAr ? "جدولة ونشر الدعوة" : "Schedule & Invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
