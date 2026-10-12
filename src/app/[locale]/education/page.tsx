"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  Award,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  FileCheck,
  Search,
  Filter,
  Plus,
  Edit,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  FileText,
  Download,
  Check,
  X,
  Eye,
  Star,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Send,
  Layers,
  HelpCircle,
  Printer,
  UserCheck,
  CheckSquare,
  Bell,
  History,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/app-context";
import {
  tracksService,
  INITIAL_TRACKS,
  INITIAL_PARTICIPANTS,
} from "@/lib/tracks-service";
import {
  TechnicalTrack,
  Participant,
  TrackEnrollment,
  TrackSession,
  TrackAttendanceRecord,
  TrackAssignment,
  TrackSubmission,
  TrackBonus,
  TrackEvaluation,
  TrackCertificate,
  TrackFollowUp,
} from "@/types";
import { AssignmentAttemptsManager } from "@/components/education/assignment-attempts-manager";
import { AtRiskDashboard } from "@/components/education/at-risk-dashboard";
import { SmartRemindersPanel } from "@/components/education/smart-reminders-panel";

export default function EducationPage() {
  const { locale, currentUser, logUserAction } = useApp();
  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";

  // Check roles:
  const isHRorAdmin =
    userRole === "super_admin" ||
    userRole === "hr_admin" ||
    userRole === "hr_reviewer" ||
    userRole === "team_lead";
  const isInstructor =
    userRole === "track_lead" ||
    userRole === "lead_instructor" ||
    userRole === "ta_mentor";
  const isAttendee = userRole === "attendee";

  // ── State Collections ────────────────────────────────────
  const [tracks, setTracks] = useState<TechnicalTrack[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [enrollments, setEnrollments] = useState<TrackEnrollment[]>([]);
  const [sessions, setSessions] = useState<TrackSession[]>([]);
  const [attendance, setAttendance] = useState<TrackAttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<TrackAssignment[]>([]);
  const [submissions, setSubmissions] = useState<TrackSubmission[]>([]);
  const [bonuses, setBonuses] = useState<TrackBonus[]>([]);
  const [evaluations, setEvaluations] = useState<TrackEvaluation[]>([]);
  const [certificates, setCertificates] = useState<TrackCertificate[]>([]);
  const [followUps, setFollowUps] = useState<TrackFollowUp[]>([]);

  // ── UI Filters & Active Tabs ─────────────────────────────
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "tracks"
    | "participants"
    | "sessions"
    | "assignments"
    | "bonus"
    | "at_risk"
    | "reminders"
    | "certificates"
    | "exports"
  >("overview");

  const [selectedTrackId, setSelectedTrackId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ── Modals State ─────────────────────────────────────────
  const [isNewTrackModalOpen, setIsNewTrackModalOpen] = useState(false);
  const [isNewParticipantModalOpen, setIsNewParticipantModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [activeSessionForAttendance, setActiveSessionForAttendance] = useState<TrackSession | null>(null);
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [activeSubmissionForGrading, setActiveSubmissionForGrading] = useState<TrackSubmission | null>(null);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [inspectedParticipant, setInspectedParticipant] = useState<Participant | null>(null);
  const [inspectedParticipantTrackId, setInspectedParticipantTrackId] = useState<string>("");
  const [isCertificatePreviewOpen, setIsCertificatePreviewOpen] = useState(false);
  const [activeCertificateToView, setActiveCertificateToView] = useState<TrackCertificate | null>(null);

  // Attempts History & Feedback Modal
  const [activeSubmissionForAttempts, setActiveSubmissionForAttempts] = useState<TrackSubmission | null>(null);
  const [activeAssignmentForAttempts, setActiveAssignmentForAttempts] = useState<TrackAssignment | null>(null);
  const [isAttemptsManagerOpen, setIsAttemptsManagerOpen] = useState(false);

  // Form State Buffers
  const [trackFormData, setTrackFormData] = useState({
    name: "",
    name_ar: "",
    description: "",
    category: "web" as TechnicalTrack["category"],
    cohort: "Season 2026 - Cohort 1",
    start_date: "2026-02-01",
    end_date: "2026-05-15",
    lead_name: "Eng. Ahmed Tarek",
    max_capacity: 40,
    attendance_requirements: 75,
  });

  const [participantFormData, setParticipantFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    university: "New Cairo Technological University (NCTU)",
    faculty_department: "Faculty of Industry & Energy",
    academic_year: "Year 2",
    notes: "",
  });

  const [enrollFormData, setEnrollFormData] = useState({
    participant_id: "",
    track_id: "",
    cohort: "Season 2026 - Cohort 1",
  });

  const [sessionFormData, setSessionFormData] = useState({
    track_id: "",
    cohort: "Season 2026 - Cohort 1",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "18:00",
    end_time: "20:30",
    instructor_name: "Eng. Ahmed Tarek",
    location_or_link: "NCTU Tech Hall B & Google Meet",
    materials_url: "",
    recording_url: "",
  });

  const [attendanceSheet, setAttendanceSheet] = useState<
    Record<string, { status: TrackAttendanceRecord["status"]; notes: string }>
  >({});

  const [assignmentFormData, setAssignmentFormData] = useState({
    track_id: "",
    cohort: "Season 2026 - Cohort 1",
    title: "",
    description: "",
    instructions: "",
    resources_url: "",
    deadline: "2026-03-15T23:59:00",
    max_score: 100,
    required_deliverables: "GitHub Repository URL + Live Demo",
    submission_format: "GitHub URL",
    late_policy: "10% deduction per 24 hours.",
    revision_policy: "One resubmission permitted.",
  });

  const [gradingFormData, setGradingFormData] = useState({
    score: 85,
    feedback: "",
  });

  const [extensionFormData, setExtensionFormData] = useState({
    new_deadline: "2026-03-20T23:59:00",
    reason: "",
  });

  const [bonusFormData, setBonusFormData] = useState({
    participant_id: "",
    track_id: "",
    amount: 5,
    category: "exceptional_project" as TrackBonus["category"],
    description: "",
    evidence_url: "",
  });

  const [followUpFormData, setFollowUpFormData] = useState({
    participant_id: "",
    track_id: "",
    responsible_person_name: "Eng. Nour (Mentor)",
    action_plan: "Conduct 1-on-1 coaching session and review missing assignments.",
    due_date: "2026-03-10",
  });

  // ── Initial Data Load ─────────────────────────────────────
  const reloadData = () => {
    setTracks(tracksService.getTracks());
    setParticipants(tracksService.getParticipants());
    setEnrollments(tracksService.getEnrollments());
    setSessions(tracksService.getSessions());
    setAttendance(tracksService.getAttendanceRecords());
    setAssignments(tracksService.getAssignments());
    setSubmissions(tracksService.getSubmissions());
    setBonuses(tracksService.getBonusRecords());
    setEvaluations(tracksService.getEvaluations());
    setCertificates(tracksService.getCertificates());
    setFollowUps(tracksService.getFollowUps());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // ── Filtered Collections ──────────────────────────────────
  const activeTracksList = useMemo(() => {
    return tracks.filter((t) => t.status !== "archived");
  }, [tracks]);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (selectedTrackId !== "all" && e.track_id !== selectedTrackId) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pName = e.participant?.full_name.toLowerCase() || "";
        const pEmail = e.participant?.email.toLowerCase() || "";
        const tName = e.track?.name.toLowerCase() || "";
        if (!pName.includes(query) && !pEmail.includes(query) && !tName.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [enrollments, selectedTrackId, searchQuery]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedTrackId !== "all" && s.track_id !== selectedTrackId) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return s.title.toLowerCase().includes(query);
      }
      return true;
    });
  }, [sessions, selectedTrackId, searchQuery]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (selectedTrackId !== "all" && a.track_id !== selectedTrackId) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return a.title.toLowerCase().includes(query);
      }
      return true;
    });
  }, [assignments, selectedTrackId, searchQuery]);

  // ── Metrics Summary ───────────────────────────────────────
  const overallMetrics = useMemo(() => {
    const totalParticipants = participants.length;
    const activeTracksCount = activeTracksList.length;
    const totalSessionsHeld = sessions.filter((s) => s.status === "completed").length;
    const certifiedCount = certificates.filter((c) => c.status === "issued").length;
    const atRiskCount = enrollments.filter((e) => {
      const m = tracksService.calculateParticipantMetrics(e.participant_id, e.track_id);
      return m.isAtRisk;
    }).length;
    const pendingSubmissions = submissions.filter(
      (s) => s.status === "submitted" || s.status === "resubmitted" || s.status === "under_review"
    ).length;

    return {
      totalParticipants,
      activeTracksCount,
      totalSessionsHeld,
      certifiedCount,
      atRiskCount,
      pendingSubmissions,
    };
  }, [participants, activeTracksList, sessions, certificates, enrollments, submissions]);

  // ── Handlers ──────────────────────────────────────────────

  const handleCreateTrack = () => {
    if (!trackFormData.name || !trackFormData.name_ar) return;
    tracksService.createTrack({
      name: trackFormData.name,
      name_ar: trackFormData.name_ar,
      description: trackFormData.description,
      category: trackFormData.category,
      cohort: trackFormData.cohort,
      start_date: trackFormData.start_date,
      end_date: trackFormData.end_date,
      lead_name: trackFormData.lead_name,
      max_capacity: Number(trackFormData.max_capacity) || 40,
      attendance_requirements: Number(trackFormData.attendance_requirements) || 75,
      attendance_weight: 40,
      assignment_weight: 30,
      participation_weight: 20,
      conduct_weight: 10,
      certificate_min_score: 75,
      status: "active",
      syllabus: ["Core fundamentals", "Intermediate frameworks", "Production capstone"],
    });

    if (logUserAction) {
      logUserAction({
        action: "TRACK_CREATED",
        entity_type: "technical_track",
        entity_id: `track_${Date.now()}`,
        reason: `إنشاء مسار تقني جديد: "${trackFormData.name_ar} (${trackFormData.name})"`,
        details: `Category: ${trackFormData.category}, Cohort: ${trackFormData.cohort}, Lead: ${trackFormData.lead_name}.`,
        after_value: { name: trackFormData.name, cohort: trackFormData.cohort },
      });
    }

    setIsNewTrackModalOpen(false);
    reloadData();
  };

  const handleCreateParticipant = () => {
    if (!participantFormData.full_name || !participantFormData.email) return;
    tracksService.createParticipant({
      full_name: participantFormData.full_name,
      email: participantFormData.email,
      phone: participantFormData.phone,
      university: participantFormData.university,
      faculty_department: participantFormData.faculty_department,
      academic_year: participantFormData.academic_year,
      registration_date: new Date().toISOString().split("T")[0],
      status: "active",
      notes: participantFormData.notes,
    });

    if (logUserAction) {
      logUserAction({
        action: "PARTICIPANT_REGISTERED",
        entity_type: "participant",
        entity_id: `p_${Date.now()}`,
        reason: `تسجيل متدرب جديد: "${participantFormData.full_name}"`,
        details: `Email: ${participantFormData.email}, University: ${participantFormData.university}.`,
        after_value: { full_name: participantFormData.full_name, email: participantFormData.email },
      });
    }

    setIsNewParticipantModalOpen(false);
    reloadData();
  };

  const handleEnrollParticipant = () => {
    if (!enrollFormData.participant_id || !enrollFormData.track_id) return;
    const res = tracksService.createEnrollment(
      enrollFormData.participant_id,
      enrollFormData.track_id,
      enrollFormData.cohort
    );
    if (!res.success) {
      alert(res.error || "Failed to enroll participant.");
      return;
    }

    if (logUserAction) {
      logUserAction({
        action: "PARTICIPANT_ENROLLED",
        entity_type: "track_enrollment",
        entity_id: res.enrollment?.id || `enr_${Date.now()}`,
        reason: `تسجيل المتدرب في المسار التقني (${enrollFormData.track_id})`,
        details: `Cohort: ${enrollFormData.cohort}.`,
        after_value: { participant_id: enrollFormData.participant_id, track_id: enrollFormData.track_id },
      });
    }

    setIsEnrollModalOpen(false);
    reloadData();
  };

  const handleCreateSession = () => {
    if (!sessionFormData.track_id || !sessionFormData.title) return;
    tracksService.createSession({
      track_id: sessionFormData.track_id,
      cohort: sessionFormData.cohort,
      title: sessionFormData.title,
      description: sessionFormData.description,
      date: sessionFormData.date,
      start_time: sessionFormData.start_time,
      end_time: sessionFormData.end_time,
      instructor_name: sessionFormData.instructor_name,
      location_or_link: sessionFormData.location_or_link,
      materials_url: sessionFormData.materials_url,
      recording_url: sessionFormData.recording_url,
      status: "scheduled",
    });
    setIsNewSessionModalOpen(false);
    reloadData();
  };

  const handleOpenAttendanceModal = (session: TrackSession) => {
    setActiveSessionForAttendance(session);
    const existing = tracksService.getAttendanceBySession(session.id);
    const enrs = tracksService.getEnrollmentsByTrack(session.track_id);
    const sheet: Record<string, { status: TrackAttendanceRecord["status"]; notes: string }> = {};

    enrs.forEach((e) => {
      const rec = existing.find((r) => r.participant_id === e.participant_id);
      sheet[e.participant_id] = {
        status: rec ? rec.status : "present",
        notes: rec?.notes || "",
      };
    });

    setAttendanceSheet(sheet);
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendance = () => {
    if (!activeSessionForAttendance) return;
    const enrs = tracksService.getEnrollmentsByTrack(activeSessionForAttendance.track_id);

    const records = enrs.map((e) => ({
      participantId: e.participant_id,
      enrollmentId: e.id,
      status: attendanceSheet[e.participant_id]?.status || "present",
      notes: attendanceSheet[e.participant_id]?.notes || "",
    }));

    tracksService.bulkRecordAttendance(
      activeSessionForAttendance.id,
      activeSessionForAttendance.track_id,
      records,
      currentUser?.id || "admin_user",
      currentUser?.full_name || "HR Admin"
    );

    // Update session status to completed
    tracksService.updateSession(activeSessionForAttendance.id, { status: "completed" });

    if (logUserAction) {
      logUserAction({
        action: "SESSION_ATTENDANCE_LOGGED",
        entity_type: "track_session",
        entity_id: activeSessionForAttendance.id,
        reason: `توثيق ورصد حضور الجلسة التقنية: "${activeSessionForAttendance.title}"`,
        details: `Track: ${activeSessionForAttendance.track_id}, Records logged: ${records.length}.`,
        after_value: { session_id: activeSessionForAttendance.id, count: records.length },
      });
    }

    setIsAttendanceModalOpen(false);
    reloadData();
  };

  const handleCreateAssignment = () => {
    if (!assignmentFormData.track_id || !assignmentFormData.title) return;
    tracksService.createAssignment({
      track_id: assignmentFormData.track_id,
      cohort: assignmentFormData.cohort,
      title: assignmentFormData.title,
      description: assignmentFormData.description,
      instructions: assignmentFormData.instructions,
      resources_url: assignmentFormData.resources_url,
      publication_date: new Date().toISOString().split("T")[0],
      deadline: assignmentFormData.deadline,
      max_score: Number(assignmentFormData.max_score) || 100,
      required_deliverables: assignmentFormData.required_deliverables,
      submission_format: assignmentFormData.submission_format,
      late_policy: assignmentFormData.late_policy,
      revision_policy: assignmentFormData.revision_policy,
    });
    setIsNewAssignmentModalOpen(false);
    reloadData();
  };

  const handleGradeSubmission = () => {
    if (!activeSubmissionForGrading) return;
    tracksService.gradeSubmission(
      activeSubmissionForGrading.id,
      Number(gradingFormData.score),
      gradingFormData.feedback,
      currentUser?.full_name || "Lead Instructor"
    );

    if (logUserAction) {
      logUserAction({
        action: "SUBMISSION_GRADED",
        entity_type: "track_submission",
        entity_id: activeSubmissionForGrading.id,
        reason: `رصد وتوثيق درجة التكليف (${gradingFormData.score}/100) للمتدرب`,
        details: `Graded by ${currentUser?.full_name || "Lead Instructor"}. Feedback: ${gradingFormData.feedback || "Evaluated."}`,
        after_value: { score: gradingFormData.score, feedback: gradingFormData.feedback },
      });
    }

    setIsGradeModalOpen(false);
    reloadData();
  };

  const handleGrantExtension = () => {
    if (!activeSubmissionForGrading) return;
    tracksService.grantDeadlineExtension(
      activeSubmissionForGrading.id,
      extensionFormData.new_deadline,
      currentUser?.full_name || "Lead Instructor",
      extensionFormData.reason
    );
    setIsExtensionModalOpen(false);
    reloadData();
  };

  const handleCreateBonus = () => {
    if (!bonusFormData.participant_id || !bonusFormData.track_id) return;
    const enr = enrollments.find(
      (e) => e.participant_id === bonusFormData.participant_id && e.track_id === bonusFormData.track_id
    );
    if (!enr) return;

    tracksService.createBonusRecommendation(
      enr.id,
      bonusFormData.track_id,
      bonusFormData.participant_id,
      Number(bonusFormData.amount) || 5,
      bonusFormData.category,
      bonusFormData.description,
      currentUser?.full_name || "Instructor / Mentor",
      bonusFormData.evidence_url
    );
    setIsBonusModalOpen(false);
    reloadData();
  };

  const handleReviewBonus = (bonusId: string, decision: "approved" | "rejected") => {
    tracksService.reviewBonus(
      bonusId,
      decision,
      currentUser?.full_name || "HR Admin",
      decision === "approved" ? "Verified objective contribution." : "Does not meet policy guidelines."
    );
    reloadData();
  };

  const handleCreateFollowUp = () => {
    if (!followUpFormData.participant_id || !followUpFormData.track_id) return;
    const enr = enrollments.find(
      (e) => e.participant_id === followUpFormData.participant_id && e.track_id === followUpFormData.track_id
    );
    if (!enr) return;

    tracksService.createFollowUp({
      enrollment_id: enr.id,
      participant_id: followUpFormData.participant_id,
      track_id: followUpFormData.track_id,
      risk_factors: ["low_attendance", "academic_struggles"],
      responsible_person_id: currentUser?.id || "mentor_nour",
      responsible_person_name: followUpFormData.responsible_person_name,
      action_plan: followUpFormData.action_plan,
      due_date: followUpFormData.due_date,
      status: "open",
    });
    setIsFollowUpModalOpen(false);
    reloadData();
  };

  const handleIssueCertificate = (e: TrackEnrollment) => {
    const metrics = tracksService.calculateParticipantMetrics(e.participant_id, e.track_id);
    if (!metrics.isEligibleForCertificate) {
      alert(
        isAr
          ? "المتدرب لم يستوفِ شروط الشهادة (درجة التقييم ≥ 75 ونسبة الحضور ≥ 75%)."
          : "Participant is not eligible for certificate (requires score ≥ 75 and attendance ≥ 75%)."
      );
      return;
    }

    const cert = tracksService.issueCertificate(
      e.id,
      e.participant_id,
      e.track_id,
      e.cohort,
      metrics.finalOfficialScore,
      "GDG on Campus NCTU Academic Board"
    );

    if (logUserAction) {
      logUserAction({
        action: "CERTIFICATE_ISSUED",
        entity_type: "track_certificate",
        entity_id: cert.id,
        reason: `إصدار وتوثيق شهادة إتمام المسار التقني (${cert.certificate_code}) بنتيجة ${metrics.finalOfficialScore}%`,
        details: `Participant: ${e.participant?.full_name || e.participant_id}, Track: ${e.track?.name_ar || e.track_id}.`,
        after_value: { code: cert.certificate_code, score: metrics.finalOfficialScore },
      });
    }

    reloadData();
    setActiveCertificateToView(cert);
    setIsCertificatePreviewOpen(true);
  };

  const handleOpenParticipantProfile = (participant: Participant, trackId?: string) => {
    setInspectedParticipant(participant);
    const pEnrs = tracksService.getEnrollmentsByParticipant(participant.id);
    setInspectedParticipantTrackId(trackId || (pEnrs[0]?.track_id || tracks[0]?.id || ""));
    setIsProfileModalOpen(true);
  };

  const handleDownloadCSV = (type: "roster" | "attendance" | "grades") => {
    const trackId = selectedTrackId === "all" ? tracks[0]?.id || "" : selectedTrackId;
    if (!trackId) return;

    let csvContent = "";
    let filename = "";

    if (type === "roster") {
      csvContent = tracksService.exportRosterToCSV(trackId);
      filename = `GDG_NCTU_${trackId}_Roster.csv`;
    } else if (type === "attendance") {
      csvContent = tracksService.exportAttendanceToCSV(trackId);
      filename = `GDG_NCTU_${trackId}_Attendance.csv`;
    } else {
      csvContent = tracksService.exportGradesToCSV(trackId);
      filename = `GDG_NCTU_${trackId}_Grades_100pts.csv`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* ── Top Header Strip ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1a73e8]/10 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse" />
              {isAr ? "أكاديمية المسارات التقنية المتخصصة" : "GDG NCTU Technical Academy"}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              {isAr ? "منفصلة تماماً عن نقاط اللجان الداخلية" : "Separate from Core HR Ledger"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {isAr ? "إدارة المسارات التقنية والمتدربين" : "Technical Tracks & Participants System"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            {isAr
              ? "نظام تدريبي معتمد لإدارة ورش العمل، رصد الحضور التراكمي (40%)، المهام التطبيقية (30%)، التفاعل (20%)، السلوك (10%)، ومنح الشهادات الرقمية المعتمدة (≥75%)."
              : "Comprehensive system for tracking technical tracks, weighted attendance (40 pts), project grading (30 pts), interaction (20 pts), conduct (10 pts), and certified credentials (≥75%)."}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isHRorAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewParticipantModalOpen(true)}
                className="gap-1.5 text-xs font-semibold shadow-2xs"
              >
                <Users className="w-3.5 h-3.5 text-[#34a853]" />
                {isAr ? "تسجيل متدرب جديد" : "New Participant"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEnrollModalOpen(true)}
                className="gap-1.5 text-xs font-semibold shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#1a73e8]" />
                {isAr ? "تنسيب لمسار" : "Enroll to Track"}
              </Button>

              <Button
                size="sm"
                onClick={() => setIsNewTrackModalOpen(true)}
                className="gap-1.5 text-xs font-bold bg-[#1a73e8] hover:bg-[#1a73e8]/90 text-white shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? "إنشاء مسار تقني" : "Create Track"}
              </Button>
            </>
          )}

          {isInstructor && !isHRorAdmin && (
            <Button
              size="sm"
              onClick={() => setIsNewAssignmentModalOpen(true)}
              className="gap-1.5 text-xs font-bold bg-[#1a73e8] hover:bg-[#1a73e8]/90 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAr ? "إضافة مهمة جديدة" : "New Assignment"}
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI Metrics Cards Strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 border-border/70 bg-card/60 backdrop-blur-2xs shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "إجمالي المتدربين" : "Participants"}</span>
            <Users className="w-4 h-4 text-[#1a73e8]" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {overallMetrics.totalParticipants}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "طلاب بجامعة NCTU" : "Enrolled NCTU Students"}
          </p>
        </Card>

        <Card className="p-3.5 border-border/70 bg-card/60 backdrop-blur-2xs shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "المسارات النشطة" : "Active Tracks"}</span>
            <Layers className="w-4 h-4 text-[#34a853]" />
          </div>
          <div className="text-2xl font-black text-[#34a853]">
            {overallMetrics.activeTracksCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Web, Flutter, Cyber, etc.
          </p>
        </Card>

        <Card className="p-3.5 border-border/70 bg-card/60 backdrop-blur-2xs shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "جلسات منجزة" : "Completed Sessions"}</span>
            <Calendar className="w-4 h-4 text-[#fbbc04]" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {overallMetrics.totalSessionsHeld}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "حضور ورصد موثق" : "Logged in Roster"}
          </p>
        </Card>

        <Card className="p-3.5 border-border/70 bg-card/60 backdrop-blur-2xs shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "تصحيحات معلقة" : "Pending Reviews"}</span>
            <Clock className="w-4 h-4 text-[#ea4335]" />
          </div>
          <div className="text-2xl font-black text-[#ea4335]">
            {overallMetrics.pendingSubmissions}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "تسليمات بانتظار التقييم" : "Awaiting Feedback"}
          </p>
        </Card>

        <Card className="p-3.5 border-border/70 bg-card/60 backdrop-blur-2xs shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "شهادات صادرة" : "Certificates Issued"}</span>
            <Award className="w-4 h-4 text-[#34a853]" />
          </div>
          <div className="text-2xl font-black text-[#34a853]">
            {overallMetrics.certifiedCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "معدل استحقاق ≥ 75%" : "Passing (≥ 75%)"}
          </p>
        </Card>

        <Card className="p-3.5 border-border/70 bg-card/60 backdrop-blur-2xs shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] font-semibold mb-1">
            <span>{isAr ? "بحاجة لمتابعة" : "At-Risk Support"}</span>
            <AlertTriangle className="w-4 h-4 text-[#ea4335]" />
          </div>
          <div className="text-2xl font-black text-[#ea4335]">
            {overallMetrics.atRiskCount}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isAr ? "غياب أو تعثر تسليمات" : "Attendance / Task Alerts"}
          </p>
        </Card>
      </div>

      {/* ── Official Evaluation Rubric Banner ───────────────────── */}
      <Card className="border-border/80 bg-muted/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {isAr
                    ? "معايير التقييم الرسمية المعتمدة للشهادة (100 درجة)"
                    : "Official 100-Point Evaluation Rubric & Certificate Threshold"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr
                    ? "وفقاً للائحة الرسمية لـ GDG on Campus NCTU: الحضور (40%) + التطبيقات (30%) + التفاعل (20%) + السلوك (10%) — شرط الشهادة ≥ 75%"
                    : "Strictly aligned with official policy: Attendance (40%) + Projects (30%) + Interaction (20%) + Conduct (10%) — Passing ≥ 75%"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#34a853]/10 text-[#34a853] border border-[#34a853]/20">
                {isAr ? "حد الاعتماد ≥ 75%" : "Passing Score ≥ 75%"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-[#1a73e8]/10 text-[#1a73e8] border border-[#1a73e8]/20">
                {isAr ? "حد الحضور ≥ 75%" : "Attendance ≥ 75%"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Interactive Workspace Controls Strip ───────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/80">
        {/* Track Selector & Search */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="all">
                {isAr ? "جميع المسارات التقنية (All Tracks)" : "All Technical Tracks"}
              </option>
              {activeTracksList.map((t) => (
                <option key={t.id} value={t.id}>
                  {isAr ? t.name_ar : t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isAr ? "بحث بالاسم، البريد، أو الموضوع..." : "Search name, email, or topic..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-8 pl-3 pr-8"
            />
          </div>
        </div>

        {/* Workspace Sub-Tabs Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "overview", label: isAr ? "لوحة المتابعة" : "Overview", icon: Layers },
            { id: "tracks", label: isAr ? "دليل المسارات" : "Tracks Catalog", icon: BookOpen },
            { id: "participants", label: isAr ? "سجل المتدربين" : "Participants", icon: Users },
            { id: "sessions", label: isAr ? "الجلسات والتحضير" : "Sessions & Attendance", icon: Calendar },
            { id: "assignments", label: isAr ? "المهام والتصحيح" : "Assignments & Grading", icon: FileCheck },
            { id: "bonus", label: isAr ? "نقاط التميز" : "Track Bonus", icon: Star },
            { id: "at_risk", label: isAr ? "المتابعة والدعم" : "At-Risk Support", icon: AlertTriangle },
            { id: "reminders", label: isAr ? "التنبيهات الذكية" : "Smart Reminders", icon: Bell },
            { id: "certificates", label: isAr ? "الشهادات والاعتماد" : "Certificates", icon: Award },
            { id: "exports", label: isAr ? "التقارير والتصدير" : "Reports & Exports", icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#1a73e8] text-white shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: OVERVIEW & TRACK HEALTH DASHBOARD                   */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeTracksList.map((track) => {
              const trackEnrs = tracksService.getEnrollmentsByTrack(track.id);
              const trackSess = tracksService.getSessionsByTrack(track.id);
              const trackAsgs = tracksService.getAssignmentsByTrack(track.id);

              let avgAttendance = 0;
              let avgScore = 0;
              let eligibleCerts = 0;

              if (trackEnrs.length > 0) {
                const totalAtt = trackEnrs.reduce((acc, e) => {
                  const m = tracksService.calculateParticipantMetrics(e.participant_id, track.id);
                  return acc + m.attendancePercentage;
                }, 0);
                avgAttendance = Math.round(totalAtt / trackEnrs.length);

                const totalSc = trackEnrs.reduce((acc, e) => {
                  const m = tracksService.calculateParticipantMetrics(e.participant_id, track.id);
                  if (m.isEligibleForCertificate) eligibleCerts++;
                  return acc + m.finalOfficialScore;
                }, 0);
                avgScore = Math.round((totalSc / trackEnrs.length) * 10) / 10;
              }

              return (
                <Card
                  key={track.id}
                  className="p-5 border-border/80 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                          {track.category.toUpperCase()}
                        </span>
                        <h3 className="font-bold text-base text-foreground mt-1">
                          {isAr ? track.name_ar : track.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {track.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/20 border border-border/60 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {isAr ? "المسجلين" : "Enrolled"}
                        </span>
                        <span className="font-black text-sm text-foreground">
                          {trackEnrs.length} / {track.max_capacity}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {isAr ? "متوسط الحضور" : "Avg Attendance"}
                        </span>
                        <span className="font-black text-sm text-[#34a853]">
                          {avgAttendance}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {isAr ? "متوسط الدرجة" : "Avg Score"}
                        </span>
                        <span className="font-black text-sm text-[#1a73e8]">
                          {avgScore} / 100
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>{isAr ? "المدرب المسؤول:" : "Lead Instructor:"}</span>
                        <span className="font-semibold text-foreground">
                          {track.lead_name || "Lead Instructor"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{isAr ? "الدفعة / الموسم:" : "Cohort:"}</span>
                        <span className="font-semibold text-foreground">{track.cohort}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{isAr ? "الجلسات المجدولة:" : "Sessions:"}</span>
                        <span className="font-semibold text-foreground">
                          {trackSess.length} sessions
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{isAr ? "المهام والمشاريع:" : "Assignments:"}</span>
                        <span className="font-semibold text-foreground">
                          {trackAsgs.length} projects
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#34a853] flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {eligibleCerts} {isAr ? "مؤهل للشهادة" : "Eligible"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTrackId(track.id);
                        setActiveTab("participants");
                      }}
                      className="text-xs h-7 gap-1"
                    >
                      <span>{isAr ? "عرض المشاركين" : "View Roster"}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: TRACKS CATALOG & CONFIGURATION                      */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "tracks" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                {isAr ? "دليل المسارات التقنية وهيكل المنهج" : "Technical Tracks Catalog & Syllabus"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr
                  ? "إدارة اللجان التقنية، أوزان التقييم (40/30/20/10)، المدربين المعينين، والسعة القصوى."
                  : "Manage technical tracks, evaluation weighting (40/30/20/10), instructors, and capacities."}
              </CardDescription>
            </div>
            {isHRorAdmin && (
              <Button
                size="sm"
                onClick={() => setIsNewTrackModalOpen(true)}
                className="gap-1.5 text-xs font-bold bg-[#1a73e8] text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? "إضافة مسار جديد" : "New Track"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <th className="p-3 text-start">{isAr ? "المسار" : "Track Name"}</th>
                    <th className="p-3 text-start">{isAr ? "الفئة" : "Category"}</th>
                    <th className="p-3 text-start">{isAr ? "الدفعة" : "Cohort"}</th>
                    <th className="p-3 text-start">{isAr ? "المدرب المسؤول" : "Lead Instructor"}</th>
                    <th className="p-3 text-center">{isAr ? "السعة" : "Capacity"}</th>
                    <th className="p-3 text-center">{isAr ? "أوزان التقييم" : "Weighting (100)"}</th>
                    <th className="p-3 text-center">{isAr ? "الحالة" : "Status"}</th>
                    <th className="p-3 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeTracksList.map((tr) => (
                    <tr key={tr.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-foreground block">
                          {isAr ? tr.name_ar : tr.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                          {tr.description}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {tr.category}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-foreground">{tr.cohort}</td>
                      <td className="p-3 font-semibold text-foreground">
                        {tr.lead_name || "Assigned Instructor"}
                      </td>
                      <td className="p-3 text-center font-bold text-foreground">
                        {tr.max_capacity} seats
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold">
                          <span className="px-1.5 py-0.5 rounded bg-[#1a73e8]/10 text-[#1a73e8]" title="Attendance">
                            40% حضـور
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#34a853]/10 text-[#34a853]" title="Projects">
                            30% مشاريع
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#fbbc04]/10 text-[#fbbc04]" title="Interaction">
                            20% تفاعل
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-muted text-foreground" title="Conduct">
                            10% سلوك
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="success" className="text-[10px]">
                          {tr.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedTrackId(tr.id);
                            setActiveTab("participants");
                          }}
                          className="h-7 text-xs font-semibold text-primary"
                        >
                          {isAr ? "إدارة المسار" : "Manage"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 3: PARTICIPANTS DIRECTORY & PROFILES                   */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "participants" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                {isAr ? "دليل المتدربين والملفات الأكاديمية" : "Participants Roster & Academic Profiles"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr
                  ? "متابعة مسار كل متدرب، سجل الحضور، تقييم المشاريع، ونقاط التميز المستقلة (غير مرتبطة بـ HR core team)."
                  : "Inspect each participant's track journey, attendance rate, project scores, and independent bonus points."}
              </CardDescription>
            </div>
            {isHRorAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsNewParticipantModalOpen(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? "متدرب جديد" : "New Participant"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="gap-1 text-xs bg-[#1a73e8] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? "تنسيب لمسار" : "Enroll"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredEnrollments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                <p className="font-semibold">
                  {isAr ? "لا توجد تسجيلات مطابقة للمسار أو البحث المحدد" : "No enrollments found for current filters"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <th className="p-3 text-start">{isAr ? "المتدرب" : "Participant"}</th>
                      <th className="p-3 text-start">{isAr ? "الكلية / الجامعة" : "University / Faculty"}</th>
                      <th className="p-3 text-start">{isAr ? "المسار التقني" : "Track"}</th>
                      <th className="p-3 text-center">{isAr ? "نسبة الحضور (40%)" : "Attendance (40%)"}</th>
                      <th className="p-3 text-center">{isAr ? "المشاريع (30%)" : "Assignments (30%)"}</th>
                      <th className="p-3 text-center">{isAr ? "الدرجة الرسمية (100)" : "Official Score (100)"}</th>
                      <th className="p-3 text-center">{isAr ? "نقاط التميز" : "Bonus Pts"}</th>
                      <th className="p-3 text-center">{isAr ? "حالة الشهادة" : "Certificate"}</th>
                      <th className="p-3 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEnrollments.map((enr) => {
                      const p = enr.participant;
                      if (!p) return null;
                      const metrics = tracksService.calculateParticipantMetrics(p.id, enr.track_id);
                      const isCert = metrics.isEligibleForCertificate;

                      return (
                        <tr key={enr.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-foreground">{p.full_name}</div>
                            <div className="text-[10px] text-muted-foreground">{p.email}</div>
                          </td>
                          <td className="p-3">
                            <span className="text-foreground font-medium block">
                              {p.faculty_department || "Faculty of Industry & Energy"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {p.academic_year || "Undergraduate"}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {isAr ? enr.track?.name_ar || enr.track?.name : enr.track?.name}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <div className="font-bold text-foreground">
                              {metrics.attendancePercentage}%
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              ({metrics.attendanceScore} / 40 pts)
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="font-bold text-foreground">
                              {metrics.assignmentAveragePct}%
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              ({metrics.assignmentScore} / 30 pts)
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`text-sm font-black px-2 py-0.5 rounded-full ${
                                metrics.finalOfficialScore >= 75
                                  ? "bg-[#34a853]/10 text-[#34a853]"
                                  : "bg-[#ea4335]/10 text-[#ea4335]"
                              }`}
                            >
                              {metrics.finalOfficialScore} / 100
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {metrics.totalBonus > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-600">
                                +{metrics.totalBonus} pts
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isCert ? (
                              <Badge variant="success" className="text-[10px] gap-1 font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                {isAr ? "مؤهل للشهادة" : "Eligible"}
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-[10px]">
                                {isAr ? "قيد المتطلبات" : "In Progress"}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenParticipantProfile(p, enr.track_id)}
                                className="h-7 text-xs font-semibold"
                                title="View detailed profile"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary" />
                              </Button>

                              {isHRorAdmin && isCert && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleIssueCertificate(enr)}
                                  className="h-7 text-[10px] gap-1 text-[#34a853] border-[#34a853]/30"
                                >
                                  <Award className="w-3 h-3" />
                                  {isAr ? "إصدار الشهادة" : "Issue Cert"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 4: SESSIONS & ATTENDANCE ROSTER                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "sessions" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                {isAr ? "جدول الجلسات وسجل رصد الحضور التراكمي" : "Sessions Schedule & Roster Attendance"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr
                  ? "تسجيل حضور المتدربين (حاضر 100%، متأخر 75%، غياب بعذر لا يؤثر سلباً، غياب بدون عذر)."
                  : "Record roster attendance per session with weighted punctual rates and excused absence handling."}
              </CardDescription>
            </div>
            {isHRorAdmin && (
              <Button
                size="sm"
                onClick={() => setIsNewSessionModalOpen(true)}
                className="gap-1.5 text-xs font-bold bg-[#1a73e8] text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? "جدولة جلسة جديدة" : "Schedule Session"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {filteredSessions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                <p className="font-semibold">
                  {isAr ? "لا توجد جلسات مجدولة لهذا المسار حالياً" : "No sessions found"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((sess) => {
                  const trackObj = tracks.find((t) => t.id === sess.track_id);
                  const sessAttendance = tracksService.getAttendanceBySession(sess.id);
                  const presentCnt = sessAttendance.filter((a) => a.status === "present").length;
                  const lateCnt = sessAttendance.filter((a) => a.status === "late").length;
                  const excusedCnt = sessAttendance.filter((a) => a.status === "excused").length;
                  const absentCnt = sessAttendance.filter((a) => a.status === "absent").length;

                  return (
                    <div
                      key={sess.id}
                      className="p-4 rounded-xl border border-border/80 bg-card/60 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                            {isAr ? trackObj?.name_ar || trackObj?.name : trackObj?.name}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {sess.title}
                          </span>
                          <Badge
                            variant={sess.status === "completed" ? "success" : "outline"}
                            className="text-[10px]"
                          >
                            {sess.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {sess.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Calendar className="w-3.5 h-3.5 text-[#1a73e8]" />
                            {sess.date} ({sess.start_time} - {sess.end_time})
                          </span>
                          <span>•</span>
                          <span>{sess.location_or_link}</span>
                          <span>•</span>
                          <span>{sess.instructor_name || "Instructor"}</span>
                        </div>
                      </div>

                      {/* Attendance Breakdown & Action */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 text-center text-[10px]">
                          <span className="px-2 py-1 rounded bg-[#34a853]/10 text-[#34a853] font-bold">
                            {presentCnt} حاضر
                          </span>
                          <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 font-bold">
                            {lateCnt} متأخر
                          </span>
                          <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 font-bold">
                            {excusedCnt} بعذر
                          </span>
                          <span className="px-2 py-1 rounded bg-red-500/10 text-red-600 font-bold">
                            {absentCnt} غياب
                          </span>
                        </div>

                        {(isHRorAdmin || isInstructor) && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenAttendanceModal(sess)}
                            className="h-8 text-xs font-bold bg-[#1a73e8] text-white gap-1"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            {isAr ? "رصد الحضور" : "Mark Roster"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 5: ASSIGNMENTS, SUBMISSIONS & GRADING                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "assignments" && (
        <div className="space-y-6">
          <Card className="border-border/80">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  {isAr ? "المهام والمشاريع التطبيقية (30 درجة)" : "Assignments & Deliverables (30 pts)"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAr
                    ? "إدارة مواعيد التسليم، تمديد المهل، التصحيح وإعطاء التغذية الراجعة البناءة."
                    : "Manage deadlines, extensions, submissions grading, and constructive feedback."}
                </CardDescription>
              </div>
              {(isHRorAdmin || isInstructor) && (
                <Button
                  size="sm"
                  onClick={() => setIsNewAssignmentModalOpen(true)}
                  className="gap-1.5 text-xs font-bold bg-[#1a73e8] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? "نشر تكليف جديد" : "New Assignment"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredAssignments.map((asg) => {
                  const asgSubmissions = submissions.filter((s) => s.assignment_id === asg.id);
                  const gradedCount = asgSubmissions.filter((s) => s.status === "graded").length;

                  return (
                    <div
                      key={asg.id}
                      className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{asg.title}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1a73e8]/10 text-[#1a73e8]">
                              Max {asg.max_score} pts
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34a853]/10 text-[#34a853]">
                              Policy: {asg.final_grade_policy || "highest_approved"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{asg.description}</p>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground font-semibold">
                            {isAr ? "الموعد النهائي:" : "Deadline:"}
                          </span>
                          <span className="font-bold text-[#ea4335]">{asg.deadline}</span>
                        </div>
                      </div>

                      {/* Submissions Table for this assignment */}
                      <div className="pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-foreground">
                            {isAr ? "تسليمات المتدربين" : "Participant Submissions"} ({asgSubmissions.length} submitted, {gradedCount} graded)
                          </span>
                        </div>

                        {asgSubmissions.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground py-2">
                            {isAr ? "لا توجد تسليمات مسجلة حتى الآن." : "No submissions logged yet."}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {asgSubmissions.map((sub) => {
                              const part = participants.find((p) => p.id === sub.participant_id);
                              return (
                                <div
                                  key={sub.id}
                                  className="p-2.5 rounded-lg border border-border/60 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-foreground">
                                        {part?.full_name}
                                      </span>
                                      <Badge
                                        variant={
                                          sub.status === "graded" || sub.status === "accepted"
                                            ? "success"
                                            : sub.status === "revision_requested"
                                            ? "warning"
                                            : sub.status === "submitted_late"
                                            ? "danger"
                                            : "outline"
                                        }
                                        className="text-[10px]"
                                      >
                                        {sub.status}
                                      </Badge>
                                    </div>
                                    <a
                                      href={sub.submission_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5 font-mono"
                                    >
                                      {sub.submission_url}
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {sub.score !== null && (
                                      <span className="font-black text-sm text-[#34a853]">
                                        {sub.score} / {asg.max_score}
                                      </span>
                                    )}

                                    {/* Attempt History & Review Workflow Button */}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setActiveAssignmentForAttempts(asg);
                                        setActiveSubmissionForAttempts(sub);
                                        setIsAttemptsManagerOpen(true);
                                      }}
                                      className="h-7 text-[10px] font-bold text-[#1a73e8] border-[#1a73e8]/30 gap-1"
                                    >
                                      <History className="w-3 h-3" />
                                      {isAr ? "سجل المحاولات والملاحظات" : "Attempts & History"}
                                    </Button>

                                    {(isHRorAdmin || isInstructor) && (
                                      <div className="flex items-center gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setActiveSubmissionForGrading(sub);
                                            setIsExtensionModalOpen(true);
                                          }}
                                          className="h-7 text-[10px] text-amber-600"
                                        >
                                          {isAr ? "مهلة إضافية" : "Extension"}
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setActiveSubmissionForGrading(sub);
                                            setGradingFormData({
                                              score: sub.score !== null ? sub.score : 90,
                                              feedback: sub.reviewer_feedback || "",
                                            });
                                            setIsGradeModalOpen(true);
                                          }}
                                          className="h-7 text-[10px] font-bold bg-[#1a73e8] text-white"
                                        >
                                          {sub.status === "graded" || sub.status === "accepted"
                                            ? isAr
                                              ? "تعديل الدرجة"
                                              : "Edit Grade"
                                            : isAr
                                            ? "تصحيح واعتماد"
                                            : "Grade"}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 6: TRACK BONUS MANAGEMENT (SEPARATE MODULE)            */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "bonus" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold">
                  {isAr ? "وحدة نقاط التميز للمسارات التقنية" : "Dedicated Track Bonus Points Module"}
                </CardTitle>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">
                  {isAr ? "منفصلة تماماً عن تقييم HR" : "Separate from HR Points"}
                </span>
              </div>
              <CardDescription className="text-xs">
                {isAr
                  ? "تُمنح للمشاريع الاستثنائية، مساعدة الزملاء، والجهد الإضافي وفق مسار اعتماد ومراجعة موثق."
                  : "Awarded for exceptional project quality, peer support, or competitions through approval workflow."}
              </CardDescription>
            </div>
            {(isHRorAdmin || isInstructor) && (
              <Button
                size="sm"
                onClick={() => setIsBonusModalOpen(true)}
                className="gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Star className="w-3.5 h-3.5" />
                {isAr ? "اقتراح نقاط تميز" : "Recommend Bonus"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {bonuses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="font-semibold">
                  {isAr ? "لا توجد سجلات نقاط تميز حالياً" : "No bonus records found"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                      <th className="p-3 text-start">{isAr ? "المتدرب" : "Participant"}</th>
                      <th className="p-3 text-start">{isAr ? "المسار" : "Track"}</th>
                      <th className="p-3 text-center">{isAr ? "النقاط" : "Amount"}</th>
                      <th className="p-3 text-start">{isAr ? "الفئة والسبب" : "Category & Description"}</th>
                      <th className="p-3 text-start">{isAr ? "الموثق" : "Recorded By"}</th>
                      <th className="p-3 text-center">{isAr ? "الحالة" : "Status"}</th>
                      <th className="p-3 text-end">{isAr ? "إجراءات الاعتماد" : "Decision"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bonuses.map((b) => {
                      const part = participants.find((p) => p.id === b.participant_id);
                      const trk = tracks.find((t) => t.id === b.track_id);
                      return (
                        <tr key={b.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-foreground block">{part?.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">{part?.email}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px]">
                              {isAr ? trk?.name_ar || trk?.name : trk?.name}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-sm font-black text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                              +{b.amount} pts
                            </span>
                          </td>
                          <td className="p-3 max-w-xs">
                            <span className="font-bold text-foreground block capitalize">
                              {b.category.replace(/_/g, " ")}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {b.description}
                            </span>
                            {b.evidence_url && (
                              <a
                                href={b.evidence_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                              >
                                {isAr ? "رابط الإثبات" : "Evidence Link"}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground font-medium">
                            {b.recorded_by}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant={
                                b.approval_status === "approved"
                                  ? "success"
                                  : b.approval_status === "rejected"
                                  ? "danger"
                                  : "warning"
                              }
                              className="text-[10px]"
                            >
                              {b.approval_status}
                            </Badge>
                          </td>
                          <td className="p-3 text-end">
                            {b.approval_status === "pending" && isHRorAdmin ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReviewBonus(b.id, "approved")}
                                  className="h-6 text-[10px] text-[#34a853] border-[#34a853]/30"
                                >
                                  {isAr ? "قبول" : "Approve"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReviewBonus(b.id, "rejected")}
                                  className="h-6 text-[10px] text-[#ea4335] border-[#ea4335]/30"
                                >
                                  {isAr ? "رفض" : "Reject"}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {b.approved_by ? `By ${b.approved_by}` : "Finalized"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 7: AT-RISK PARTICIPANTS & ACADEMIC SUPPORT             */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "at_risk" && (
        <AtRiskDashboard
          isAr={isAr}
          canManage={isHRorAdmin || isInstructor}
          currentUser={currentUser}
          selectedTrackId={selectedTrackId}
          onRefresh={reloadData}
        />
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 8: SMART REMINDERS & NOTIFICATION POLICIES             */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "reminders" && (
        <SmartRemindersPanel
          isAr={isAr}
          canManage={isHRorAdmin || isInstructor}
          onRefresh={reloadData}
        />
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 8: CERTIFICATES & CREDENTIAL VERIFICATION              */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "certificates" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-[#34a853]" />
                <span>{isAr ? "سجل الشهادات الرقمية المعتمدة" : "Verified Credentials & Certification"}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {isAr
                  ? "إصدار الشهادات الرسمية لمن حققوا 75 درجة فأعلى مع كود تحقق مشفر."
                  : "Issue and verify official certificates for students qualifying with ≥ 75% score."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#34a853]" />
                <p className="font-semibold">
                  {isAr ? "لم تصدر شهادات رسمية بعد" : "No certificates issued yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.map((cert) => {
                  const part = participants.find((p) => p.id === cert.participant_id);
                  const trk = tracks.find((t) => t.id === cert.track_id);
                  return (
                    <Card
                      key={cert.id}
                      className="p-4 border-[#34a853]/40 bg-card hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34a853]/10 text-[#34a853]">
                            VERIFIED CREDENTIAL
                          </span>
                          <span className="text-[11px] font-mono font-bold text-muted-foreground">
                            {cert.certificate_code}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-foreground">{part?.full_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {isAr ? trk?.name_ar : trk?.name}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between text-xs">
                          <span>{isAr ? "الدرجة النهائية:" : "Official Score:"}</span>
                          <span className="font-black text-sm text-[#34a853]">
                            {cert.official_score} / 100
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {isAr ? "تاريخ الإصدار:" : "Issued:"} {cert.issue_date}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveCertificateToView(cert);
                            setIsCertificatePreviewOpen(true);
                          }}
                          className="h-7 text-xs font-semibold gap-1 text-primary"
                        >
                          <Eye className="w-3 h-3" />
                          {isAr ? "عرض الشهادة" : "Preview"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 9: REPORTS & CSV EXPORTS                               */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === "exports" && (
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              {isAr ? "تصدير التقارير الإدارية والأكاديمية (CSV / Excel)" : "Reports & Data Export Center"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr
                ? "تصدير فوري لكشوف المتدربين، سجلات الحضور لكل جلسة، وجدول الدرجات مع احترام الفلتر المحدد."
                : "Instant CSV downloads for roster, per-session attendance logs, and weighted grade sheets."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-border/60 bg-muted/10 space-y-3">
                <div className="p-2.5 w-fit rounded-xl bg-primary/10 text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {isAr ? "كشف المتدربين والبيانات الأكاديمية" : "Participant Roster Export"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr
                      ? "يتضمن الأسماء، البريد، الكلية، الحالة، ونسب الإنجاز."
                      : "Includes full profile data, college info, and overall completion rate."}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownloadCSV("roster")}
                  className="w-full text-xs font-bold gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isAr ? "تحميل كشف المتدربين (CSV)" : "Download Roster CSV"}
                </Button>
              </Card>

              <Card className="p-4 border-border/60 bg-muted/10 space-y-3">
                <div className="p-2.5 w-fit rounded-xl bg-[#34a853]/10 text-[#34a853]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {isAr ? "سجل الحضور التفصيلي للجلسات" : "Attendance Matrix Export"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr
                      ? "جدول كامل بحالة كل متدرب في كل جلسة مع حساب النسبة المئوية."
                      : "Matrix showing present, late, excused, absent per session with percentages."}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownloadCSV("attendance")}
                  className="w-full text-xs font-bold gap-1.5 bg-[#34a853] hover:bg-[#34a853]/90 text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isAr ? "تحميل سجل الحضور (CSV)" : "Download Attendance CSV"}
                </Button>
              </Card>

              <Card className="p-4 border-border/60 bg-muted/10 space-y-3">
                <div className="p-2.5 w-fit rounded-xl bg-[#ea4335]/10 text-[#ea4335]">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {isAr ? "كشف الدرجات الرسمية والشهادات" : "Grades & Certification Export"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr
                      ? "الدرجات وفق معادلة الـ 100 درجة (40/30/20/10) ونقاط التميز المستقلة."
                      : "Official 100-pt formula outputs, separate bonus points, and eligibility."}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownloadCSV("grades")}
                  className="w-full text-xs font-bold gap-1.5 bg-[#ea4335] hover:bg-[#ea4335]/90 text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isAr ? "تحميل كشف الدرجات (CSV)" : "Download Grades CSV"}
                </Button>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREATE TECHNICAL TRACK                            */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isNewTrackModalOpen} onOpenChange={setIsNewTrackModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "إنشاء مسار تقني جديد" : "Create Technical Track"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "إضافة مسار تدريبي جديد بجدول مواعيد وسعة محددة."
                : "Configure a new educational track and cohort requirements."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "اسم المسار (English)" : "Track Name (English)"}</Label>
                <Input
                  value={trackFormData.name}
                  onChange={(e) => setTrackFormData({ ...trackFormData, name: e.target.value })}
                  placeholder="e.g. Flutter Mobile Development"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "اسم المسار (عربي)" : "Track Name (Arabic)"}</Label>
                <Input
                  value={trackFormData.name_ar}
                  onChange={(e) => setTrackFormData({ ...trackFormData, name_ar: e.target.value })}
                  placeholder="مثال: تطوير تطبيقات الموبايل"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "الوصف ومحتوى التدريب" : "Description & Overview"}</Label>
              <Textarea
                value={trackFormData.description}
                onChange={(e) => setTrackFormData({ ...trackFormData, description: e.target.value })}
                placeholder="Overview of syllabus, tools, and outcomes..."
                className="text-xs h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "الفئة" : "Category"}</Label>
                <select
                  value={trackFormData.category}
                  onChange={(e) => setTrackFormData({ ...trackFormData, category: e.target.value as any })}
                  className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
                >
                  <option value="web">Web Development</option>
                  <option value="mobile">Flutter / Mobile</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="embedded">Embedded Systems</option>
                  <option value="uiux">UI/UX Design</option>
                  <option value="ai_ml">AI / Machine Learning</option>
                  <option value="other">Other Track</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "الدفعة / الموسم" : "Cohort"}</Label>
                <Input
                  value={trackFormData.cohort}
                  onChange={(e) => setTrackFormData({ ...trackFormData, cohort: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "المدرب المسؤول" : "Lead Instructor"}</Label>
                <Input
                  value={trackFormData.lead_name}
                  onChange={(e) => setTrackFormData({ ...trackFormData, lead_name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "السعة القصوى" : "Capacity Limit"}</Label>
                <Input
                  type="number"
                  value={trackFormData.max_capacity}
                  onChange={(e) => setTrackFormData({ ...trackFormData, max_capacity: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewTrackModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateTrack} className="bg-[#1a73e8] text-white">
              {isAr ? "حفظ وإنشاء المسار" : "Create Track"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 2: REGISTER NEW PARTICIPANT                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isNewParticipantModalOpen} onOpenChange={setIsNewParticipantModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "تسجيل متدرب جديد بالأكاديمية" : "Register Participant"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "تسجيل طالب في قاعدة بيانات المشاركين بالمسارات (منفصل عن ميمبرز GDG)."
                : "Add participant profile for technical tracks (independent of core team)."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "الاسم الرباعي" : "Full Name"}</Label>
              <Input
                value={participantFormData.full_name}
                onChange={(e) => setParticipantFormData({ ...participantFormData, full_name: e.target.value })}
                placeholder="e.g. Karim Mahmoud Mostafa"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                <Input
                  type="email"
                  value={participantFormData.email}
                  onChange={(e) => setParticipantFormData({ ...participantFormData, email: e.target.value })}
                  placeholder="student@nctu.edu.eg"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
                <Input
                  value={participantFormData.phone}
                  onChange={(e) => setParticipantFormData({ ...participantFormData, phone: e.target.value })}
                  placeholder="+20 100 ..."
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "الجامعة والكلية" : "University / Faculty"}</Label>
              <Input
                value={participantFormData.university}
                onChange={(e) => setParticipantFormData({ ...participantFormData, university: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "القسم أو التخصص" : "Department"}</Label>
                <Input
                  value={participantFormData.faculty_department}
                  onChange={(e) => setParticipantFormData({ ...participantFormData, faculty_department: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "السنة الدراسية" : "Academic Year"}</Label>
                <Input
                  value={participantFormData.academic_year}
                  onChange={(e) => setParticipantFormData({ ...participantFormData, academic_year: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewParticipantModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateParticipant} className="bg-[#1a73e8] text-white">
              {isAr ? "حفظ المتدرب" : "Save Participant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 3: ENROLL PARTICIPANT TO TRACK                       */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "تنسيب متدرب لمسار تقني" : "Enroll Participant to Track"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "ربط المتدرب بمسار محدد. يُمنع التسجيل المزدوج في نفس المسار للدفعة ذاتها."
                : "Connect student to track cohort. Enforces unique enrollment per cohort."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "اختر المتدرب" : "Select Participant"}</Label>
              <select
                value={enrollFormData.participant_id}
                onChange={(e) => setEnrollFormData({ ...enrollFormData, participant_id: e.target.value })}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر من القائمة --" : "-- Select participant --"}</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "اختر المسار التقني" : "Select Track"}</Label>
              <select
                value={enrollFormData.track_id}
                onChange={(e) => setEnrollFormData({ ...enrollFormData, track_id: e.target.value })}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر المسار --" : "-- Select track --"}</option>
                {activeTracksList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name} ({t.cohort})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "الدفعة" : "Cohort"}</Label>
              <Input
                value={enrollFormData.cohort}
                onChange={(e) => setEnrollFormData({ ...enrollFormData, cohort: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsEnrollModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleEnrollParticipant} className="bg-[#1a73e8] text-white">
              {isAr ? "تأكيد التنسيب" : "Confirm Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 4: RECORD SESSION ATTENDANCE ROSTER                  */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "رصد حضور الجلسة" : "Record Session Attendance"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {activeSessionForAttendance?.title} ({activeSessionForAttendance?.date})
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
              <span className="font-semibold text-muted-foreground">
                {isAr ? "قائمة المسجلين بالمسار" : "Enrolled Roster"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!activeSessionForAttendance) return;
                  const enrs = tracksService.getEnrollmentsByTrack(activeSessionForAttendance.track_id);
                  const newSheet = { ...attendanceSheet };
                  enrs.forEach((e) => {
                    newSheet[e.participant_id] = { status: "present", notes: "" };
                  });
                  setAttendanceSheet(newSheet);
                }}
                className="text-[10px] h-6 text-[#34a853]"
              >
                {isAr ? "تحديد الكل: حاضر (100%)" : "Mark All Present"}
              </Button>
            </div>

            {activeSessionForAttendance &&
              tracksService.getEnrollmentsByTrack(activeSessionForAttendance.track_id).map((e) => {
                const p = e.participant;
                const currentStatus = attendanceSheet[e.participant_id]?.status || "present";

                return (
                  <div
                    key={e.id}
                    className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{p?.full_name}</span>
                      <span className="text-[10px] text-muted-foreground">{p?.email}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(["present", "late", "excused", "absent"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setAttendanceSheet({
                              ...attendanceSheet,
                              [e.participant_id]: {
                                status: st,
                                notes: attendanceSheet[e.participant_id]?.notes || "",
                              },
                            });
                          }}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            currentStatus === st
                              ? st === "present"
                                ? "bg-[#34a853] text-white"
                                : st === "late"
                                ? "bg-amber-600 text-white"
                                : st === "excused"
                                ? "bg-blue-600 text-white"
                                : "bg-[#ea4335] text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {st === "present"
                            ? isAr
                              ? "حاضر"
                              : "Present"
                            : st === "late"
                            ? isAr
                              ? "متأخر"
                              : "Late"
                            : st === "excused"
                            ? isAr
                              ? "بعذر"
                              : "Excused"
                            : isAr
                            ? "غياب"
                            : "Absent"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsAttendanceModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleSaveAttendance} className="bg-[#34a853] text-white">
              {isAr ? "حفظ واعتماد الكشف" : "Save Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 5: GRADE SUBMISSION & FEEDBACK                       */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isGradeModalOpen} onOpenChange={setIsGradeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "تصحيح المهمة والتغذية الراجعة" : "Grade Submission & Feedback"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "تقييم المشروع وتقديم ملاحظات توجيهية للمتدرب."
                : "Assign score and constructive reviewer notes."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-[10px] text-muted-foreground block font-medium">
                {isAr ? "رابط المشروع المسلّم:" : "Submitted Deliverable:"}
              </span>
              <a
                href={activeSubmissionForGrading?.submission_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-mono hover:underline flex items-center gap-1 mt-0.5"
              >
                {activeSubmissionForGrading?.submission_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "الدرجة المستحقة (من 100)" : "Score (out of 100)"}</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={gradingFormData.score}
                onChange={(e) => setGradingFormData({ ...gradingFormData, score: Number(e.target.value) })}
                className="h-8 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "ملاحظات التقييم والتوجيه" : "Constructive Reviewer Feedback"}</Label>
              <Textarea
                value={gradingFormData.feedback}
                onChange={(e) => setGradingFormData({ ...gradingFormData, feedback: e.target.value })}
                placeholder="Highlight strengths, architecture advice, and areas for improvement..."
                className="text-xs h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsGradeModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleGradeSubmission} className="bg-[#1a73e8] text-white">
              {isAr ? "اعتماد الدرجة" : "Save Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 6: GRANT DEADLINE EXTENSION                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isExtensionModalOpen} onOpenChange={setIsExtensionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "تمديد مهلة التسليم بموافقة المدرب" : "Grant Deadline Extension"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "تسجيل تمديد رسمي مع توثيق السبب لتجنب خصم التأخير."
                : "Approve deadline extension with documented rationale."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "الموعد النهائي الجديد" : "New Deadline"}</Label>
              <Input
                type="datetime-local"
                value={extensionFormData.new_deadline}
                onChange={(e) => setExtensionFormData({ ...extensionFormData, new_deadline: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "مبرر التمديد المعتمد" : "Extension Rationale"}</Label>
              <Textarea
                value={extensionFormData.reason}
                onChange={(e) => setExtensionFormData({ ...extensionFormData, reason: e.target.value })}
                placeholder="Medical or academic university conflict..."
                className="text-xs h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsExtensionModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleGrantExtension} className="bg-[#1a73e8] text-white">
              {isAr ? "اعتماد التمديد" : "Grant Extension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 7: RECOMMEND TRACK BONUS                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isBonusModalOpen} onOpenChange={setIsBonusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "اقتراح نقاط تميز للمتدرب" : "Recommend Track Bonus"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "نقاط تشجيعية منفصلة عن نقاط HR Core Team وتخضع لموافقة الإدارة."
                : "Dedicated bonus points module subject to review workflow."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "المتدرب" : "Participant"}</Label>
              <select
                value={bonusFormData.participant_id}
                onChange={(e) => setBonusFormData({ ...bonusFormData, participant_id: e.target.value })}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر المتدرب --" : "-- Select participant --"}</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "المسار التقني" : "Track"}</Label>
              <select
                value={bonusFormData.track_id}
                onChange={(e) => setBonusFormData({ ...bonusFormData, track_id: e.target.value })}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر المسار --" : "-- Select track --"}</option>
                {activeTracksList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "مقدار النقاط (1-15)" : "Bonus Amount (1-15)"}</Label>
                <Input
                  type="number"
                  min="1"
                  max="15"
                  value={bonusFormData.amount}
                  onChange={(e) => setBonusFormData({ ...bonusFormData, amount: Number(e.target.value) })}
                  className="h-8 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "الفئة" : "Category"}</Label>
                <select
                  value={bonusFormData.category}
                  onChange={(e) => setBonusFormData({ ...bonusFormData, category: e.target.value as any })}
                  className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
                >
                  <option value="exceptional_project">Exceptional Project</option>
                  <option value="helping_peers">Helping Peers in Lab</option>
                  <option value="additional_effort">Additional Effort</option>
                  <option value="competition">Hackathon / Competition</option>
                  <option value="voluntary_contribution">Voluntary Contribution</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "الوصف الموضوعي" : "Objective Description"}</Label>
              <Textarea
                value={bonusFormData.description}
                onChange={(e) => setBonusFormData({ ...bonusFormData, description: e.target.value })}
                placeholder="Explain the specific contribution..."
                className="text-xs h-20"
              />
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "رابط الإثبات أو المشروع (اختياري)" : "Evidence URL (Optional)"}</Label>
              <Input
                value={bonusFormData.evidence_url}
                onChange={(e) => setBonusFormData({ ...bonusFormData, evidence_url: e.target.value })}
                placeholder="https://github.com/..."
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBonusModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateBonus} className="bg-amber-600 text-white">
              {isAr ? "إرسال للمراجعة" : "Submit Recommendation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 8: PARTICIPANT PROFILE DETAILED INSPECTOR            */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>{inspectedParticipant?.full_name}</span>
              <Badge variant="outline" className="text-[10px]">
                {inspectedParticipant?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {inspectedParticipant?.email} • {inspectedParticipant?.university} • {inspectedParticipant?.academic_year}
            </DialogDescription>
          </DialogHeader>

          {inspectedParticipant && (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs">
              {/* Multi-Track Selector Strip */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {isAr ? "عرض نتائج المسار:" : "Inspect Track Enrollment:"}
                </span>
                <select
                  value={inspectedParticipantTrackId}
                  onChange={(e) => setInspectedParticipantTrackId(e.target.value)}
                  className="text-xs font-bold px-3 py-1 rounded-md border border-border bg-background"
                >
                  {tracksService
                    .getEnrollmentsByParticipant(inspectedParticipant.id)
                    .map((enr) => {
                      const t = tracks.find((tr) => tr.id === enr.track_id);
                      return (
                        <option key={enr.id} value={enr.track_id}>
                          {isAr ? t?.name_ar || t?.name : t?.name}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* 100-Point Formula Metric Strip */}
              {(() => {
                const metrics = tracksService.calculateParticipantMetrics(
                  inspectedParticipant.id,
                  inspectedParticipantTrackId
                );

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-3 rounded-xl border border-border/60 bg-card">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {isAr ? "الحضور (40%)" : "Attendance (40%)"}
                        </span>
                        <span className="text-lg font-black text-primary">
                          {metrics.attendanceScore} / 40
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {metrics.attendancePercentage}% ({metrics.presentCount} P / {metrics.lateCount} L)
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-border/60 bg-card">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {isAr ? "المشاريع (30%)" : "Projects (30%)"}
                        </span>
                        <span className="text-lg font-black text-[#34a853]">
                          {metrics.assignmentScore} / 30
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Avg {metrics.assignmentAveragePct}%
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-border/60 bg-card">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {isAr ? "التفاعل (20%)" : "Participation (20%)"}
                        </span>
                        <span className="text-lg font-black text-[#fbbc04]">
                          {metrics.participationScore} / 20
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Active Engagement
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-border/60 bg-card">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {isAr ? "السلوك (10%)" : "Conduct (10%)"}
                        </span>
                        <span className="text-lg font-black text-[#1a73e8]">
                          {metrics.conductScore} / 10
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Collaboration
                        </span>
                      </div>
                    </div>

                    {/* Official Score & Certificate Status Banner */}
                    <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          {isAr ? "الدرجة الرسمية الإجمالية (من 100):" : "Final Official Score (out of 100):"}
                        </span>
                        <span className="text-2xl font-black text-foreground">
                          {metrics.finalOfficialScore} / 100
                        </span>
                        {metrics.totalBonus > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 block">
                            +{metrics.totalBonus} points Track Bonus awarded separately
                          </span>
                        )}
                      </div>

                      <div className="text-end">
                        {metrics.isEligibleForCertificate ? (
                          <div className="space-y-1">
                            <Badge variant="success" className="text-xs font-bold gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isAr ? "مؤهل للاعتماد الرسمي" : "Certificate Eligible (≥75%)"}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="warning" className="text-xs">
                            {isAr ? "لم يستوفِ النسبة (75%)" : "Below 75% Passing Threshold"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Instructor / Mentor Notes */}
                    <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
                      <span className="font-bold text-foreground block">
                        {isAr ? "ملاحظات التوجيه والمتابعة الأكاديمية:" : "Academic Mentorship Notes:"}
                      </span>
                      <p className="text-muted-foreground">
                        {inspectedParticipant.notes || "No special notes recorded."}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="border-t border-border pt-3">
            <Button size="sm" onClick={() => setIsProfileModalOpen(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 9: CERTIFICATE PREVIEW & PRINT                       */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isCertificatePreviewOpen} onOpenChange={setIsCertificatePreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "معاينة الشهادة الرقمية المعتمدة" : "Official Certificate Preview"}
            </DialogTitle>
          </DialogHeader>

          {activeCertificateToView && (() => {
            const part = participants.find((p) => p.id === activeCertificateToView.participant_id);
            const trk = tracks.find((t) => t.id === activeCertificateToView.track_id);

            return (
              <div className="p-8 rounded-2xl border-4 border-double border-[#1a73e8]/30 bg-gradient-to-b from-card to-muted/20 text-center space-y-4 shadow-xl">
                {/* Google Developer Groups Symbol Dots */}
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1a73e8]" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#ea4335]" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#fbbc04]" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#34a853]" />
                </div>

                <div>
                  <h3 className="font-black text-xl text-foreground tracking-tight">
                    Google Developer Groups on Campus
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    New Cairo Technological University (NCTU)
                  </p>
                </div>

                <div className="py-2">
                  <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider block">
                    Certificate of Technical Achievement
                  </span>
                  <h2 className="text-2xl font-black text-primary mt-1">
                    {part?.full_name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                    Has successfully completed all academic requirements, hands-on lab sessions, and capstone project milestones for:
                  </p>
                  <h4 className="text-base font-black text-foreground mt-1">
                    {trk?.name} ({trk?.cohort})
                  </h4>
                </div>

                <div className="flex items-center justify-center gap-6 pt-3 text-xs border-t border-border/60">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Score</span>
                    <span className="font-black text-emerald-600 text-sm">
                      {activeCertificateToView.official_score} / 100
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Verification Code</span>
                    <span className="font-mono font-bold text-foreground text-xs">
                      {activeCertificateToView.certificate_code}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Issue Date</span>
                    <span className="font-bold text-foreground text-xs">
                      {activeCertificateToView.issue_date}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-[10px] text-muted-foreground">
              Verified by GDG on Campus NCTU Academic Committee
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                {isAr ? "طباعة" : "Print"}
              </Button>
              <Button size="sm" onClick={() => setIsCertificatePreviewOpen(false)}>
                {isAr ? "إغلاق" : "Close"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 10: NEW SESSION CREATION                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isNewSessionModalOpen} onOpenChange={setIsNewSessionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "جدولة جلسة تدريبية جديدة" : "Schedule New Session"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr ? "إضافة ورشة عمل أو جلسة للمسار." : "Add upcoming track session."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "المسار التقني" : "Track"}</Label>
              <select
                value={sessionFormData.track_id}
                onChange={(e) => setSessionFormData({ ...sessionFormData, track_id: e.target.value })}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر المسار --" : "-- Select track --"}</option>
                {activeTracksList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "عنوان الجلسة" : "Session Title"}</Label>
              <Input
                value={sessionFormData.title}
                onChange={(e) => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                placeholder="e.g. Session 5: Next.js App Router & SSR"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>{isAr ? "التاريخ" : "Date"}</Label>
                <Input
                  type="date"
                  value={sessionFormData.date}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, date: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "البدء" : "Start"}</Label>
                <Input
                  type="time"
                  value={sessionFormData.start_time}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, start_time: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "الانتهاء" : "End"}</Label>
                <Input
                  type="time"
                  value={sessionFormData.end_time}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, end_time: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "المكان أو رابط الاجتماع" : "Location or Meeting Link"}</Label>
              <Input
                value={sessionFormData.location_or_link}
                onChange={(e) => setSessionFormData({ ...sessionFormData, location_or_link: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewSessionModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateSession} className="bg-[#1a73e8] text-white">
              {isAr ? "جدولة الجلسة" : "Schedule Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 11: NEW ASSIGNMENT CREATION                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isNewAssignmentModalOpen} onOpenChange={setIsNewAssignmentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "نشر تكليف أو مشروع جديد" : "Create New Assignment"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr ? "تحديد مواصفات وموعد تسليم المشروع." : "Define assignment deliverables and deadline."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "المسار التقني" : "Track"}</Label>
              <select
                value={assignmentFormData.track_id}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, track_id: e.target.value })}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر المسار --" : "-- Select track --"}</option>
                {activeTracksList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "عنوان التكليف" : "Assignment Title"}</Label>
              <Input
                value={assignmentFormData.title}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, title: e.target.value })}
                placeholder="e.g. Capstone: E-Commerce Storefront"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "الموعد النهائي" : "Deadline"}</Label>
                <Input
                  type="datetime-local"
                  value={assignmentFormData.deadline}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, deadline: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "الدرجة القصوى" : "Max Score"}</Label>
                <Input
                  type="number"
                  value={assignmentFormData.max_score}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, max_score: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "المخرجات المطلوبة" : "Required Deliverables"}</Label>
              <Input
                value={assignmentFormData.required_deliverables}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, required_deliverables: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsNewAssignmentModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateAssignment} className="bg-[#1a73e8] text-white">
              {isAr ? "نشر التكليف" : "Publish Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 12: CREATE AT-RISK FOLLOW-UP PLAN                    */}
      {/* ────────────────────────────────────────────────────────── */}
      <Dialog open={isFollowUpModalOpen} onOpenChange={setIsFollowUpModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "إنشاء خطة متابعة ودعم أكاديمي" : "Create Support Follow-Up Plan"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr
                ? "تدخل توجيهي لدعم المتدرب المتعثر وتفادي الانقطاع."
                : "Supportive 1-on-1 intervention plan."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "المتدرب" : "Participant"}</Label>
              <select
                value={followUpFormData.participant_id}
                onChange={(e) => setFollowUpFormData({ ...followUpFormData, participant_id: e.target.value })}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر المتدرب --" : "-- Select participant --"}</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "المسار التقني" : "Track"}</Label>
              <select
                value={followUpFormData.track_id}
                onChange={(e) => setFollowUpFormData({ ...followUpFormData, track_id: e.target.value })}
                className="w-full text-xs h-8 px-2 rounded-md border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر المسار --" : "-- Select track --"}</option>
                {activeTracksList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "خطة التدخل والدعم" : "Intervention Action Plan"}</Label>
              <Textarea
                value={followUpFormData.action_plan}
                onChange={(e) => setFollowUpFormData({ ...followUpFormData, action_plan: e.target.value })}
                className="text-xs h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "المرشد المسؤول" : "Assigned Mentor"}</Label>
                <Input
                  value={followUpFormData.responsible_person_name}
                  onChange={(e) => setFollowUpFormData({ ...followUpFormData, responsible_person_name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "تاريخ المتابعة" : "Follow-Up Due Date"}</Label>
                <Input
                  type="date"
                  value={followUpFormData.due_date}
                  onChange={(e) => setFollowUpFormData({ ...followUpFormData, due_date: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsFollowUpModalOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateFollowUp} className="bg-[#ea4335] text-white">
              {isAr ? "حفظ خطة الدعم" : "Save Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Attempts & Review History Modal */}
      {activeAssignmentForAttempts && activeSubmissionForAttempts && (
        <AssignmentAttemptsManager
          assignment={activeAssignmentForAttempts}
          submission={activeSubmissionForAttempts}
          participantName={
            participants.find((p) => p.id === activeSubmissionForAttempts.participant_id)?.full_name ||
            "Participant"
          }
          isAr={isAr}
          canReview={isHRorAdmin || isInstructor}
          currentUser={currentUser}
          onRefresh={reloadData}
          isOpen={isAttemptsManagerOpen}
          onClose={() => setIsAttemptsManagerOpen(false)}
        />
      )}
    </div>
  );
}
