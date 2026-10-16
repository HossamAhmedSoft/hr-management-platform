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
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Download,
  Check,
  X,
  Eye,
  Star,
  ChevronRight,
  Printer,
  Bell,
  Code,
  Smartphone,
  Cpu,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  // Prevent SSR Hydration Mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // ── State Collections ────────────────────────────────────
  const [tracks, setTracks] = useState<TechnicalTrack[]>(() => tracksService.getTracks());
  const [participants, setParticipants] = useState<Participant[]>(() => tracksService.getParticipants());
  const [enrollments, setEnrollments] = useState<TrackEnrollment[]>(() => tracksService.getEnrollments());
  const [sessions, setSessions] = useState<TrackSession[]>(() => tracksService.getSessions());
  const [attendance, setAttendance] = useState<TrackAttendanceRecord[]>(() => tracksService.getAttendanceRecords());
  const [assignments, setAssignments] = useState<TrackAssignment[]>(() => tracksService.getAssignments());
  const [submissions, setSubmissions] = useState<TrackSubmission[]>(() => tracksService.getSubmissions());
  const [bonuses, setBonuses] = useState<TrackBonus[]>(() => tracksService.getBonusRecords());
  const [evaluations, setEvaluations] = useState<TrackEvaluation[]>(() => tracksService.getEvaluations());
  const [certificates, setCertificates] = useState<TrackCertificate[]>(() => tracksService.getCertificates());
  const [followUps, setFollowUps] = useState<TrackFollowUp[]>(() => tracksService.getFollowUps());

  // ── Simplified & Intuitive UI Tabs ───────────────────────
  // We streamline into 5 clear, high-level workspaces instead of 10 fragmented tabs:
  const [activeTab, setActiveTab] = useState<
    "tracks" | "participants" | "sessions" | "assignments" | "insights"
  >("tracks");

  const [selectedTrackId, setSelectedTrackId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [participantStatusFilter, setParticipantStatusFilter] = useState<"all" | "eligible" | "at_risk">("all");
  const [insightsSubTab, setInsightsSubTab] = useState<"certificates" | "at_risk" | "reminders" | "reports">("certificates");

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
    university: "جامعة مصر التكنولوجية الدولية (NCTU)",
    faculty_department: "كلية تكنولوجيا الصناعة والطاقة",
    academic_year: "الفرقة الثانية",
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

  // ── Filtered Collections ──────────────────────────────────
  const activeTracksList = useMemo(() => {
    return tracks.filter((t) => t.status !== "archived");
  }, [tracks]);

  // Memoized Participant Metrics to prevent multiple recalculations in render cycles
  const participantMetricsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof tracksService.calculateParticipantMetrics>>();
    enrollments.forEach((e) => {
      const key = `${e.participant_id}_${e.track_id}`;
      map.set(key, tracksService.calculateParticipantMetrics(e.participant_id, e.track_id));
    });
    return map;
  }, [enrollments, sessions, attendance, assignments, submissions, bonuses]);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (selectedTrackId !== "all" && e.track_id !== selectedTrackId) return false;
      const metrics = participantMetricsMap.get(`${e.participant_id}_${e.track_id}`);
      
      if (participantStatusFilter === "eligible" && !metrics?.isEligibleForCertificate) return false;
      if (participantStatusFilter === "at_risk" && !metrics?.isAtRisk) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pName = e.participant?.full_name.toLowerCase() || "";
        const pEmail = e.participant?.email.toLowerCase() || "";
        const tName = e.track?.name.toLowerCase() || "";
        const tNameAr = e.track?.name_ar.toLowerCase() || "";
        if (!pName.includes(query) && !pEmail.includes(query) && !tName.includes(query) && !tNameAr.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [enrollments, selectedTrackId, searchQuery, participantStatusFilter, participantMetricsMap]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedTrackId !== "all" && s.track_id !== selectedTrackId) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return s.title.toLowerCase().includes(query) || (s.instructor_name && s.instructor_name.toLowerCase().includes(query));
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

    let totalAttendanceSum = 0;
    let eligibleCount = 0;
    let atRiskCount = 0;

    enrollments.forEach((e) => {
      const m = participantMetricsMap.get(`${e.participant_id}_${e.track_id}`);
      if (m) {
        totalAttendanceSum += m.attendancePercentage;
        if (m.isEligibleForCertificate) eligibleCount++;
        if (m.isAtRisk) atRiskCount++;
      }
    });

    const avgAttendance = enrollments.length > 0 ? Math.round(totalAttendanceSum / enrollments.length) : 0;
    const pendingSubmissions = submissions.filter(
      (s) => s.status === "submitted" || s.status === "resubmitted" || s.status === "under_review"
    ).length;

    return {
      totalParticipants,
      activeTracksCount,
      totalSessionsHeld,
      certifiedCount,
      eligibleCount,
      atRiskCount,
      avgAttendance,
      pendingSubmissions,
    };
  }, [participants, activeTracksList, sessions, certificates, enrollments, submissions, participantMetricsMap]);

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
      alert(res.error || (isAr ? "فشل تسجيل المتدرب بالمسار." : "Failed to enroll participant."));
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

  const handleIssueCertificate = (e: TrackEnrollment) => {
    const metrics = participantMetricsMap.get(`${e.participant_id}_${e.track_id}`);
    if (!metrics?.isEligibleForCertificate) {
      alert(
        isAr
          ? "المتدرب لم يستوفِ شروط الشهادة بعد (درجة التقييم ≥ 75 ونسبة الحضور ≥ 75%)."
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

  // Helper icons per track category
  const getTrackCategoryBadge = (category: TechnicalTrack["category"]) => {
    switch (category) {
      case "web":
        return { icon: Code, color: "text-[#1a73e8]", bg: "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border-[#d2e3fc] dark:border-[#1a73e8]/30", label: isAr ? "تطوير الويب" : "Web Dev" };
      case "mobile":
        return { icon: Smartphone, color: "text-[#34a853]", bg: "bg-[#e6f4ea] dark:bg-[#34a853]/20 border-[#ceead6] dark:border-[#34a853]/30", label: isAr ? "تطبيقات الموبايل" : "Mobile Apps" };
      case "cybersecurity":
        return { icon: ShieldCheck, color: "text-[#ea4335]", bg: "bg-[#fce8e6] dark:bg-[#ea4335]/20 border-[#fad2cf] dark:border-[#ea4335]/30", label: isAr ? "الأمن السيبراني" : "Cybersecurity" };
      case "embedded":
        return { icon: Cpu, color: "text-[#fbbc04]", bg: "bg-[#fef7e0] dark:bg-[#fbbc04]/20 border-[#feefc3] dark:border-[#fbbc04]/30", label: isAr ? "الأنظمة المدمجة" : "Embedded / IoT" };
      default:
        return { icon: Layers, color: "text-[#1a73e8]", bg: "bg-muted/40 border-border", label: category };
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-10 bg-muted/60 rounded-xl w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted/40 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-muted/30 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#1a73e8]/10 text-[#1a73e8] dark:text-[#8ab4f8] inline-flex items-center gap-1.5 border border-[#1a73e8]/20">
              <span className="w-2 h-2 rounded-full bg-[#1a73e8] animate-pulse" />
              {isAr ? "أكاديمية المسارات التقنية المتخصصة" : "GDG NCTU Technical Academy"}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              {isAr ? "نظام مستقل ومعتمد للتدريب" : "Official Trainee & Track Hub"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            {isAr ? "إدارة المسارات التقنية والمتدربين" : "Technical Tracks & Trainees Management"}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? "متابعة ورش العمل، رصد الحضور التراكمي (40%)، المهام التطبيقية (30%)، التفاعل (20%)، السلوك (10%)، وإصدار الشهادات الرقمية المعتمدة (≥75%)."
              : "Track sessions, log weighted attendance (40%), assignment delivery (30%), engagement (20%), conduct (10%), and issue digital certificates (≥75%)."}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isHRorAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewParticipantModalOpen(true)}
                className="gap-2 text-xs font-bold border-[#34a853]/40 text-[#34a853] hover:bg-[#34a853]/10 h-9 px-3.5 rounded-xl shadow-2xs"
              >
                <Users className="w-4 h-4" />
                {isAr ? "تسجيل متدرب جديد" : "New Trainee"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEnrollModalOpen(true)}
                className="gap-2 text-xs font-bold border-[#1a73e8]/40 text-[#1a73e8] hover:bg-[#1a73e8]/10 h-9 px-3.5 rounded-xl shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                {isAr ? "تنسيب لمسار" : "Enroll Trainee"}
              </Button>

              <Button
                size="sm"
                onClick={() => setIsNewTrackModalOpen(true)}
                className="gap-2 text-xs font-black bg-[#1a73e8] hover:bg-[#1a73e8]/90 text-white h-9 px-4 rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {isAr ? "إنشاء مسار تقني" : "Create Track"}
              </Button>
            </>
          )}

          {isInstructor && !isHRorAdmin && (
            <Button
              size="sm"
              onClick={() => setIsNewAssignmentModalOpen(true)}
              className="gap-2 text-xs font-black bg-[#1a73e8] hover:bg-[#1a73e8]/90 text-white h-9 px-4 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              {isAr ? "إضافة مهمة جديدة" : "New Assignment"}
            </Button>
          )}
        </div>
      </div>

      {/* ── 4 High-Impact KPI Summary Cards ───────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 border-border/80 bg-gradient-to-br from-card to-[#1a73e8]/5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold mb-1.5">
            <span>{isAr ? "إجمالي المتدربين" : "Total Trainees"}</span>
            <div className="w-7 h-7 rounded-lg bg-[#1a73e8]/15 text-[#1a73e8] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {overallMetrics.totalParticipants}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isAr ? "طلاب ملتحقين بالمسارات" : "Active enrolled students"}
          </p>
        </Card>

        <Card className="p-4 border-border/80 bg-gradient-to-br from-card to-[#34a853]/5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold mb-1.5">
            <span>{isAr ? "المسارات التقنية النشطة" : "Active Tracks"}</span>
            <div className="w-7 h-7 rounded-lg bg-[#34a853]/15 text-[#34a853] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#34a853]">
            {overallMetrics.activeTracksCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Web, Flutter, Cyber, Embedded
          </p>
        </Card>

        <Card className="p-4 border-border/80 bg-gradient-to-br from-card to-[#fbbc04]/5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold mb-1.5">
            <span>{isAr ? "متوسط الحضور العام" : "Avg Attendance"}</span>
            <div className="w-7 h-7 rounded-lg bg-[#fbbc04]/15 text-[#b06000] dark:text-[#fbbc04] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {overallMetrics.avgAttendance}%
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isAr ? "عبر كافة ورش العمل المنجزة" : "Across all logged sessions"}
          </p>
        </Card>

        <Card className="p-4 border-border/80 bg-gradient-to-br from-card to-[#34a853]/5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold mb-1.5">
            <span>{isAr ? "مؤهلين للشهادة (≥75%)" : "Certificate Eligible"}</span>
            <div className="w-7 h-7 rounded-lg bg-[#34a853]/15 text-[#34a853] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#34a853]">
            {overallMetrics.eligibleCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {overallMetrics.certifiedCount} {isAr ? "شهادة تم إصدارها بالفعل" : "issued certificates"}
          </p>
        </Card>
      </div>

      {/* ── Intuitive Navigation Tabs Bar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl border border-border/80 bg-muted/30">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "tracks", label: isAr ? "المسارات التقنية" : "Tracks", count: activeTracksList.length, icon: BookOpen },
            { id: "participants", label: isAr ? "سجل المتدربين" : "Trainees Directory", count: enrollments.length, icon: Users },
            { id: "sessions", label: isAr ? "الجلسات والتحضير" : "Sessions & Attendance", count: sessions.length, icon: Calendar },
            { id: "assignments", label: isAr ? "المهام والمشاريع" : "Assignments & Tasks", count: assignments.length, icon: FileCheck },
            { id: "insights", label: isAr ? "المتابعة والشهادات" : "Certificates & Insights", count: certificates.length, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#1a73e8] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Global Track Selector Filter */}
        <div className="flex items-center gap-2 shrink-0 px-2 sm:px-0">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <select
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">
              {isAr ? "🌟 جميع المسارات (All Tracks)" : "All Technical Tracks"}
            </option>
            {activeTracksList.map((t) => (
              <option key={t.id} value={t.id}>
                {isAr ? t.name_ar : t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: TRACKS OVERVIEW CARDS (EASY & INTUITIVE)             */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "tracks" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTracksList
              .filter((t) => selectedTrackId === "all" || t.id === selectedTrackId)
              .map((track) => {
                const badge = getTrackCategoryBadge(track.category);
                const IconComponent = badge.icon;
                const trackEnrs = enrollments.filter((e) => e.track_id === track.id);
                const trackSess = sessions.filter((s) => s.track_id === track.id);
                const trackAsgs = assignments.filter((a) => a.track_id === track.id);

                let avgAtt = 0;
                let avgScore = 0;
                let passCount = 0;

                if (trackEnrs.length > 0) {
                  let totalAtt = 0;
                  let totalSc = 0;
                  trackEnrs.forEach((e) => {
                    const m = participantMetricsMap.get(`${e.participant_id}_${track.id}`);
                    if (m) {
                      totalAtt += m.attendancePercentage;
                      totalSc += m.finalOfficialScore;
                      if (m.isEligibleForCertificate) passCount++;
                    }
                  });
                  avgAtt = Math.round(totalAtt / trackEnrs.length);
                  avgScore = Math.round((totalSc / trackEnrs.length) * 10) / 10;
                }

                const capacityPct = Math.min(100, Math.round((trackEnrs.length / track.max_capacity) * 100));

                return (
                  <Card
                    key={track.id}
                    className="p-5 border-border/80 hover:border-[#1a73e8]/40 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${badge.bg} ${badge.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0">
                              {badge.label}
                            </Badge>
                            <h3 className="font-black text-base text-foreground mt-0.5 group-hover:text-[#1a73e8] transition-colors">
                              {isAr ? track.name_ar : track.name}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {track.description}
                      </p>

                      {/* Capacity & Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">{isAr ? "المسجلين في الدفعة" : "Enrolled Trainees"}</span>
                          <span className="text-foreground">
                            {trackEnrs.length} / {track.max_capacity} ({capacityPct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              capacityPct >= 90 ? "bg-[#ea4335]" : "bg-[#1a73e8]"
                            }`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Track Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/60 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-semibold">{isAr ? "الحضور" : "Attendance"}</span>
                          <span className="font-black text-sm text-[#34a853]">{avgAtt}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-semibold">{isAr ? "متوسط التقييم" : "Avg Score"}</span>
                          <span className="font-black text-sm text-[#1a73e8]">{avgScore}/100</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-semibold">{isAr ? "المؤهلين" : "Passing"}</span>
                          <span className="font-black text-sm text-foreground">{passCount}</span>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 text-muted-foreground pt-1">
                        <div className="flex items-center justify-between">
                          <span>{isAr ? "المدرب المسؤول:" : "Lead Instructor:"}</span>
                          <span className="font-bold text-foreground">{track.lead_name || "Instructor"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{isAr ? "الجلسات / المهام:" : "Sessions / Tasks:"}</span>
                          <span className="font-semibold text-foreground">
                            {trackSess.length} {isAr ? "جلسة" : "sessions"} • {trackAsgs.length} {isAr ? "مهمة" : "tasks"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTrackId(track.id);
                          setActiveTab("participants");
                        }}
                        className="text-xs font-bold gap-1.5 flex-1 rounded-xl h-8"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{isAr ? "عرض المتدربين" : "View Trainees"}</span>
                      </Button>

                      {isHRorAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSessionFormData({ ...sessionFormData, track_id: track.id });
                            setIsNewSessionModalOpen(true);
                          }}
                          className="text-xs font-bold gap-1 text-[#1a73e8] rounded-xl h-8 px-2.5"
                          title={isAr ? "إضافة جلسة تدريبية" : "Schedule session"}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAr ? "جلسة" : "Session"}</span>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: TRAINEES DIRECTORY (CLEAN & POWERFUL SEARCH)         */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "participants" && (
        <Card className="border-border/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input & Filter Pills */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[220px] max-w-sm flex-1">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={isAr ? "بحث باسم المتدرب، البريد، أو التخصص..." : "Search trainee name or email..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs h-9 pl-3 pr-9 rounded-xl"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => setParticipantStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    participantStatusFilter === "all" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isAr ? "الكل" : "All"} ({enrollments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setParticipantStatusFilter("eligible")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    participantStatusFilter === "eligible" ? "bg-[#34a853] text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isAr ? "مؤهل للشهادة (≥75%)" : "Eligible"}
                </button>
                <button
                  type="button"
                  onClick={() => setParticipantStatusFilter("at_risk")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    participantStatusFilter === "at_risk" ? "bg-[#ea4335] text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isAr ? "بحاجة لمتابعة" : "At-Risk"}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            {isHRorAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="gap-1.5 text-xs font-bold bg-[#1a73e8] text-white rounded-xl h-8.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? "تنسيب متدرب" : "Enroll"}
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {filteredEnrollments.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
                <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="font-bold text-sm text-foreground">
                  {isAr ? "لا يوجد متدربون يطابقون خيارات البحث" : "No trainees match current filters"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "جرّب تغيير مسار البحث أو إلغاء تصفية الحالة." : "Try clearing filters."}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold">
                    <th className="p-3.5 text-start">{isAr ? "المتدرب" : "Trainee"}</th>
                    <th className="p-3.5 text-start">{isAr ? "المسار والدفعة" : "Track & Cohort"}</th>
                    <th className="p-3.5 text-center">{isAr ? "الحضور (40%)" : "Attendance (40%)"}</th>
                    <th className="p-3.5 text-center">{isAr ? "المشاريع (30%)" : "Projects (30%)"}</th>
                    <th className="p-3.5 text-center">{isAr ? "الدرجة الرسمية (100)" : "Official Score"}</th>
                    <th className="p-3.5 text-center">{isAr ? "حالة الشهادة" : "Certificate"}</th>
                    <th className="p-3.5 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEnrollments.map((enr) => {
                    const p = enr.participant;
                    if (!p) return null;
                    const metrics = participantMetricsMap.get(`${p.id}_${enr.track_id}`);
                    if (!metrics) return null;
                    const isCert = metrics.isEligibleForCertificate;

                    return (
                      <tr key={enr.id} className="hover:bg-muted/15 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#1a73e8]/10 text-[#1a73e8] font-black flex items-center justify-center shrink-0 text-xs">
                              {p.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-foreground">{p.full_name}</div>
                              <div className="text-[11px] text-muted-foreground font-mono">{p.email}</div>
                              <div className="text-[10px] text-muted-foreground">{p.university} • {p.academic_year}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[11px] font-bold">
                            {isAr ? enr.track?.name_ar || enr.track?.name : enr.track?.name}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{enr.cohort}</div>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="font-black text-sm text-foreground">
                            {metrics.attendancePercentage}%
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            ({metrics.attendanceScore} / 40 {isAr ? "درجة" : "pts"})
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="font-black text-sm text-foreground">
                            {metrics.assignmentAveragePct}%
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            ({metrics.assignmentScore} / 30 {isAr ? "درجة" : "pts"})
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                              metrics.finalOfficialScore >= 75
                                ? "bg-[#34a853]/15 text-[#34a853] border border-[#34a853]/30"
                                : "bg-[#ea4335]/15 text-[#ea4335] border border-[#ea4335]/30"
                            }`}
                          >
                            {metrics.finalOfficialScore} / 100
                          </span>
                          {metrics.totalBonus > 0 && (
                            <span className="block text-[10px] font-bold text-amber-600 mt-0.5">
                              +{metrics.totalBonus} {isAr ? "تميز" : "bonus"}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          {isCert ? (
                            <Badge variant="success" className="text-[10px] gap-1 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              {isAr ? "مؤهل للاعتماد" : "Eligible"}
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              {isAr ? "قيد المتطلبات" : "In Progress"}
                            </Badge>
                          )}
                        </td>

                        <td className="p-3.5 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenParticipantProfile(p, enr.track_id)}
                              className="h-8 text-xs font-bold gap-1 rounded-xl text-primary"
                              title={isAr ? "عرض الملف الأكاديمي المفصل" : "View profile"}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{isAr ? "الملف" : "Profile"}</span>
                            </Button>

                            {isHRorAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setBonusFormData({
                                    ...bonusFormData,
                                    participant_id: p.id,
                                    track_id: enr.track_id,
                                  });
                                  setIsBonusModalOpen(true);
                                }}
                                className="h-8 text-xs font-bold gap-1 text-amber-600 border-amber-500/30 rounded-xl"
                                title={isAr ? "منح نقاط تميز" : "Award bonus"}
                              >
                                <Star className="w-3 h-3" />
                                <span className="hidden sm:inline">{isAr ? "تميز" : "Bonus"}</span>
                              </Button>
                            )}

                            {isHRorAdmin && isCert && (
                              <Button
                                size="sm"
                                onClick={() => handleIssueCertificate(enr)}
                                className="h-8 text-xs font-bold gap-1 bg-[#34a853] hover:bg-[#34a853]/90 text-white rounded-xl shadow-2xs"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>{isAr ? "إصدار الشهادة" : "Issue Cert"}</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 3: SESSIONS & ATTENDANCE ROSTER                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "sessions" && (
        <Card className="border-border/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-foreground">
                {isAr ? "جدول الجلسات ورصد الحضور" : "Sessions & Attendance Roster"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "تسجيل حضور المتدربين (حاضر 100%، متأخر 75%، عذر مقبول، غياب)."
                  : "Track sessions schedule and mark live roster attendance."}
              </p>
            </div>

            {isHRorAdmin && (
              <Button
                size="sm"
                onClick={() => setIsNewSessionModalOpen(true)}
                className="gap-1.5 text-xs font-bold bg-[#1a73e8] text-white rounded-xl h-8.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? "جدولة جلسة جديدة" : "Schedule Session"}
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            {filteredSessions.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="font-bold text-sm text-foreground">
                  {isAr ? "لا توجد جلسات مجدولة لهذا المسار" : "No sessions found for this track"}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold">
                    <th className="p-3.5 text-start">{isAr ? "الجلسة والموضوع" : "Session & Topic"}</th>
                    <th className="p-3.5 text-start">{isAr ? "المسار" : "Track"}</th>
                    <th className="p-3.5 text-start">{isAr ? "التاريخ والتوقيت" : "Date & Time"}</th>
                    <th className="p-3.5 text-start">{isAr ? "المدرب / المحاضر" : "Instructor"}</th>
                    <th className="p-3.5 text-center">{isAr ? "حالة الرصد" : "Roster Status"}</th>
                    <th className="p-3.5 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSessions.map((sess) => {
                    const trk = tracks.find((t) => t.id === sess.track_id);
                    const isDone = sess.status === "completed";

                    return (
                      <tr key={sess.id} className="hover:bg-muted/15 transition-colors">
                        <td className="p-3.5">
                          <span className="font-black text-foreground text-sm block">{sess.title}</span>
                          <span className="text-[11px] text-muted-foreground line-clamp-1">{sess.location_or_link}</span>
                        </td>

                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {isAr ? trk?.name_ar || trk?.name : trk?.name}
                          </Badge>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-foreground">{sess.date}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {sess.start_time} - {sess.end_time}
                          </div>
                        </td>

                        <td className="p-3.5 font-bold text-foreground">
                          {sess.instructor_name}
                        </td>

                        <td className="p-3.5 text-center">
                          {isDone ? (
                            <Badge variant="success" className="text-[10px] font-bold gap-1">
                              <Check className="w-3 h-3" />
                              {isAr ? "تم الرصد والتوثيق" : "Recorded"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground font-semibold">
                              {isAr ? "مجدولة" : "Scheduled"}
                            </Badge>
                          )}
                        </td>

                        <td className="p-3.5 text-end">
                          <Button
                            size="sm"
                            onClick={() => handleOpenAttendanceModal(sess)}
                            className={`h-8 text-xs font-bold gap-1.5 rounded-xl ${
                              isDone
                                ? "bg-muted text-foreground hover:bg-muted/80"
                                : "bg-[#1a73e8] hover:bg-[#1a73e8]/90 text-white shadow-2xs"
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{isDone ? (isAr ? "تعديل الحضور" : "Edit Attendance") : (isAr ? "رصد الحضور" : "Take Attendance")}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 4: ASSIGNMENTS & GRADING                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "assignments" && (
        <Card className="border-border/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-foreground">
                {isAr ? "المهام التطبيقية ومشاريع التخرج" : "Assignments & Capstone Projects"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "متابعة تسليمات المتدربين، رصد الدرجات (30% من التقييم العام)، وإبداء الملاحظات التوجيهية."
                  : "Review deliverables, grade capstone projects (30% of final score), and manage revisions."}
              </p>
            </div>

            {(isHRorAdmin || isInstructor) && (
              <Button
                size="sm"
                onClick={() => setIsNewAssignmentModalOpen(true)}
                className="gap-1.5 text-xs font-bold bg-[#1a73e8] text-white rounded-xl h-8.5"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? "إضافة تكليف جديد" : "New Assignment"}
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            {filteredAssignments.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
                <FileCheck className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="font-bold text-sm text-foreground">
                  {isAr ? "لا توجد تكليفات منشورة لهذا المسار" : "No assignments published for this track"}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-start border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold">
                    <th className="p-3.5 text-start">{isAr ? "التكليف" : "Assignment"}</th>
                    <th className="p-3.5 text-start">{isAr ? "المسار" : "Track"}</th>
                    <th className="p-3.5 text-start">{isAr ? "الموعد النهائي" : "Deadline"}</th>
                    <th className="p-3.5 text-center">{isAr ? "الدرجة القصوى" : "Max Score"}</th>
                    <th className="p-3.5 text-center">{isAr ? "التسليمات" : "Submissions"}</th>
                    <th className="p-3.5 text-end">{isAr ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAssignments.map((asg) => {
                    const trk = tracks.find((t) => t.id === asg.track_id);
                    const asgSubs = submissions.filter((s) => s.assignment_id === asg.id);
                    const gradedSubs = asgSubs.filter((s) => s.status === "graded");

                    return (
                      <tr key={asg.id} className="hover:bg-muted/15 transition-colors">
                        <td className="p-3.5">
                          <span className="font-black text-foreground text-sm block">{asg.title}</span>
                          <span className="text-[11px] text-muted-foreground line-clamp-1">{asg.required_deliverables}</span>
                        </td>

                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {isAr ? trk?.name_ar || trk?.name : trk?.name}
                          </Badge>
                        </td>

                        <td className="p-3.5 font-bold text-foreground">
                          {asg.deadline.replace("T", " ")}
                        </td>

                        <td className="p-3.5 text-center font-black text-sm text-[#1a73e8]">
                          {asg.max_score} {isAr ? "درجة" : "pts"}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-bold text-foreground">
                            {gradedSubs.length} / {asgSubs.length} {isAr ? "تم تصحيحه" : "graded"}
                          </span>
                        </td>

                        <td className="p-3.5 text-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const firstSub = asgSubs[0];
                              if (firstSub) {
                                setActiveAssignmentForAttempts(asg);
                                setActiveSubmissionForAttempts(firstSub);
                                setIsAttemptsManagerOpen(true);
                              } else {
                                alert(isAr ? "لا توجد تسليمات مسجلة بعد لهذا التكليف." : "No submissions recorded yet for this assignment.");
                              }
                            }}
                            className="h-8 text-xs font-bold gap-1 rounded-xl text-primary"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isAr ? "مراجعة التسليمات" : "Review Submissions"}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 5: CERTIFICATES, INSIGHTS & REPORTS HUB                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          {/* Sub-Tabs Switcher */}
          <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
            {[
              { id: "certificates", label: isAr ? "الشهادات الرقمية المعتمدة" : "Issued Certificates", icon: Award },
              { id: "at_risk", label: isAr ? "المتعثرين ومؤشرات الخطر" : "At-Risk Support Hub", icon: AlertTriangle },
              { id: "reminders", label: isAr ? "التنبيهات الذكية" : "Smart Reminders", icon: Bell },
              { id: "reports", label: isAr ? "تصدير التقارير (CSV)" : "Exports & CSV", icon: Download },
            ].map((sub) => {
              const Icon = sub.icon;
              const isSubActive = insightsSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setInsightsSubTab(sub.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSubActive
                      ? "bg-foreground text-background shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SubTab 1: Issued Certificates */}
          {insightsSubTab === "certificates" && (
            <Card className="border-border/80 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-border bg-card">
                <h3 className="font-black text-base text-foreground">
                  {isAr ? "سجل الشهادات الرقمية الصادرة والمعتمدة" : "Official Issued Certificates"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr
                    ? "الشهادات الصادرة للمتدربين الذين حققوا نسبة نجاح ≥ 75% وحضور ≥ 75% وفقاً للائحة الرسمية."
                    : "Digital credentials issued to qualifying trainees (≥75% score and ≥75% attendance)."}
                </p>
              </div>

              <div className="overflow-x-auto">
                {certificates.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs space-y-2">
                    <Award className="w-10 h-10 mx-auto text-muted-foreground/40" />
                    <p className="font-bold text-sm text-foreground">
                      {isAr ? "لم تصدر أي شهادات بعد" : "No certificates issued yet"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "يمكنك إصدار الشهادات مباشرة من سجل المتدربين للمستوفين للشروط." : "Issue certificates from the Trainees Directory."}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-start border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold">
                        <th className="p-3.5 text-start">{isAr ? "كود الشهادة" : "Certificate Code"}</th>
                        <th className="p-3.5 text-start">{isAr ? "اسم المتدرب" : "Trainee"}</th>
                        <th className="p-3.5 text-start">{isAr ? "المسار" : "Track"}</th>
                        <th className="p-3.5 text-center">{isAr ? "الدرجة النهائية" : "Score"}</th>
                        <th className="p-3.5 text-center">{isAr ? "تاريخ الإصدار" : "Date"}</th>
                        <th className="p-3.5 text-end">{isAr ? "معاينة" : "Preview"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {certificates.map((cert) => {
                        const p = participants.find((part) => part.id === cert.participant_id);
                        const t = tracks.find((trk) => trk.id === cert.track_id);

                        return (
                          <tr key={cert.id} className="hover:bg-muted/15 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-foreground">
                              {cert.certificate_code}
                            </td>
                            <td className="p-3.5 font-black text-foreground">
                              {p?.full_name || cert.participant_id}
                            </td>
                            <td className="p-3.5">
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {isAr ? t?.name_ar || t?.name : t?.name}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="font-black text-sm text-[#34a853]">
                                {cert.official_score} / 100
                              </span>
                            </td>
                            <td className="p-3.5 text-center text-muted-foreground">
                              {cert.issue_date}
                            </td>
                            <td className="p-3.5 text-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setActiveCertificateToView(cert);
                                  setIsCertificatePreviewOpen(true);
                                }}
                                className="h-8 text-xs font-bold gap-1 rounded-xl"
                              >
                                <Eye className="w-3.5 h-3.5 text-primary" />
                                <span>{isAr ? "معاينة الشهادة" : "Preview"}</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          )}

          {/* SubTab 2: At-Risk Hub Component */}
          {insightsSubTab === "at_risk" && (
            <AtRiskDashboard
              isAr={isAr}
              canManage={isHRorAdmin || isInstructor}
              currentUser={currentUser}
              selectedTrackId={selectedTrackId}
              onRefresh={reloadData}
            />
          )}

          {/* SubTab 3: Smart Reminders Component */}
          {insightsSubTab === "reminders" && (
            <SmartRemindersPanel
              isAr={isAr}
              canManage={isHRorAdmin || isInstructor}
              currentUser={currentUser}
              selectedTrackId={selectedTrackId}
              onRefresh={reloadData}
            />
          )}

          {/* SubTab 4: Reports & CSV Export */}
          {insightsSubTab === "reports" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 border-border/80 rounded-2xl shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {isAr ? "سجل المتدربين (Roster CSV)" : "Participants Roster CSV"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? "تصدير بيانات المتدربين المسجلين، الكلية، والبريد." : "Export complete trainee directory for the track."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCSV("roster")}
                  className="w-full text-xs font-bold rounded-xl h-8.5 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? "تحميل Roster.csv" : "Download CSV"}</span>
                </Button>
              </Card>

              <Card className="p-5 border-border/80 rounded-2xl shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#34a853]/10 text-[#34a853] flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {isAr ? "تقرير الحضور والغياب (Attendance CSV)" : "Attendance Sheet CSV"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? "تقرير تفصيلي بنسب الحضور ورصد الورش (40%)." : "Export attendance records and punctuality rates."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCSV("attendance")}
                  className="w-full text-xs font-bold rounded-xl h-8.5 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? "تحميل Attendance.csv" : "Download CSV"}</span>
                </Button>
              </Card>

              <Card className="p-5 border-border/80 rounded-2xl shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#fbbc04]/10 text-[#b06000] dark:text-[#fbbc04] flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {isAr ? "كشف الدرجات الشامل (Grades 100pts CSV)" : "Official 100-Point Grades CSV"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? "حساب درجات التقييم الرسمية واستحقاق الشهادات." : "Export calculated weighted grades and certificate eligibility."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadCSV("grades")}
                  className="w-full text-xs font-bold rounded-xl h-8.5 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? "تحميل Grades.csv" : "Download CSV"}</span>
                </Button>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODALS SECTION (CLEAN, ACCESSIBLE, ERGONOMIC)              */}
      {/* ──────────────────────────────────────────────────────────── */}

      {/* 1. New Track Modal */}
      <Dialog open={isNewTrackModalOpen} onOpenChange={setIsNewTrackModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "إنشاء مسار تقني جديد" : "Create Technical Track"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr ? "إضافة مسار تدريبي جديد وتحديد السعة والمدرب المسؤول." : "Configure a new educational track."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "اسم المسار (عربي)" : "Track Name (Arabic)"}</Label>
                <Input
                  value={trackFormData.name_ar}
                  onChange={(e) => setTrackFormData({ ...trackFormData, name_ar: e.target.value })}
                  placeholder="تطوير الويب الحديث"
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "اسم المسار (English)" : "Track Name (English)"}</Label>
                <Input
                  value={trackFormData.name}
                  onChange={(e) => setTrackFormData({ ...trackFormData, name: e.target.value })}
                  placeholder="Web Development"
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "الوصف ومحتوى التدريب" : "Description"}</Label>
              <Textarea
                value={trackFormData.description}
                onChange={(e) => setTrackFormData({ ...trackFormData, description: e.target.value })}
                placeholder="أهداف ومخرجات المسار..."
                className="text-xs h-18 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "الفئة" : "Category"}</Label>
                <select
                  value={trackFormData.category}
                  onChange={(e) => setTrackFormData({ ...trackFormData, category: e.target.value as any })}
                  className="w-full text-xs h-8.5 px-3 rounded-xl border border-border bg-background"
                >
                  <option value="web">Web Development</option>
                  <option value="mobile">Flutter / Mobile</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="embedded">Embedded Systems</option>
                  <option value="uiux">UI/UX Design</option>
                  <option value="ai_ml">AI / Data Science</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "الدفعة / الموسم" : "Cohort"}</Label>
                <Input
                  value={trackFormData.cohort}
                  onChange={(e) => setTrackFormData({ ...trackFormData, cohort: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "المدرب المسؤول" : "Lead Instructor"}</Label>
                <Input
                  value={trackFormData.lead_name}
                  onChange={(e) => setTrackFormData({ ...trackFormData, lead_name: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "السعة القصوى" : "Capacity Limit"}</Label>
                <Input
                  type="number"
                  value={trackFormData.max_capacity}
                  onChange={(e) => setTrackFormData({ ...trackFormData, max_capacity: Number(e.target.value) })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewTrackModalOpen(false)} className="rounded-xl">
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateTrack} className="bg-[#1a73e8] text-white rounded-xl">
              {isAr ? "حفظ المسار" : "Create Track"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. New Trainee Modal */}
      <Dialog open={isNewParticipantModalOpen} onOpenChange={setIsNewParticipantModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "تسجيل متدرب جديد" : "Register Trainee"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr ? "إضافة بيانات الطالب الأكاديمية بالأكاديمية التقنية." : "Add participant profile for technical tracks."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "الاسم الرباعي" : "Full Name"}</Label>
              <Input
                value={participantFormData.full_name}
                onChange={(e) => setParticipantFormData({ ...participantFormData, full_name: e.target.value })}
                placeholder="أحمد محمود حسن"
                className="h-8.5 text-xs rounded-xl"
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
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "رقم الهاتف" : "Phone"}</Label>
                <Input
                  value={participantFormData.phone}
                  onChange={(e) => setParticipantFormData({ ...participantFormData, phone: e.target.value })}
                  placeholder="+20 100 ..."
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "الجامعة والكلية" : "University"}</Label>
              <Input
                value={participantFormData.university}
                onChange={(e) => setParticipantFormData({ ...participantFormData, university: e.target.value })}
                className="h-8.5 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "التخصص / القسم" : "Department"}</Label>
                <Input
                  value={participantFormData.faculty_department}
                  onChange={(e) => setParticipantFormData({ ...participantFormData, faculty_department: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "الفرقة الدراسية" : "Academic Year"}</Label>
                <Input
                  value={participantFormData.academic_year}
                  onChange={(e) => setParticipantFormData({ ...participantFormData, academic_year: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewParticipantModalOpen(false)} className="rounded-xl">
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateParticipant} className="bg-[#34a853] text-white rounded-xl">
              {isAr ? "حفظ المتدرب" : "Save Trainee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Enroll Modal */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "تنسيب متدرب لمسار تقني" : "Enroll Trainee to Track"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr ? "ربط المتدرب بمسار محدد (يمنع التكرار لنفس الدفعة)." : "Connect student to track cohort."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "اختر المتدرب" : "Select Trainee"}</Label>
              <select
                value={enrollFormData.participant_id}
                onChange={(e) => setEnrollFormData({ ...enrollFormData, participant_id: e.target.value })}
                className="w-full text-xs h-8.5 px-3 rounded-xl border border-border bg-background"
              >
                <option value="">{isAr ? "-- اختر من القائمة --" : "-- Select trainee --"}</option>
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
                className="w-full text-xs h-8.5 px-3 rounded-xl border border-border bg-background"
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
                className="h-8.5 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEnrollModalOpen(false)} className="rounded-xl">
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleEnrollParticipant} className="bg-[#1a73e8] text-white rounded-xl">
              {isAr ? "تأكيد التنسيب" : "Confirm Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Session Attendance Modal */}
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>{isAr ? "رصد حضور الجلسة" : "Record Session Attendance"}</span>
              <span className="text-xs font-normal text-muted-foreground">{activeSessionForAttendance?.date}</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-foreground">
              {activeSessionForAttendance?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border text-xs">
              <span className="font-bold text-muted-foreground">
                {isAr ? "قائمة المتدربين المسجلين بالمسار" : "Enrolled Trainees"}
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
                className="text-[11px] h-7 text-[#34a853] border-[#34a853]/40 rounded-lg font-bold"
              >
                {isAr ? "✓ تحديد الكل: حاضر (100%)" : "Mark All Present"}
              </Button>
            </div>

            {activeSessionForAttendance &&
              tracksService.getEnrollmentsByTrack(activeSessionForAttendance.track_id).map((e) => {
                const p = e.participant;
                const currentStatus = attendanceSheet[e.participant_id]?.status || "present";

                return (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl border border-border/70 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{p?.full_name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{p?.email}</span>
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === st
                              ? st === "present"
                                ? "bg-[#34a853] text-white shadow-2xs"
                                : st === "late"
                                ? "bg-amber-600 text-white shadow-2xs"
                                : st === "excused"
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-[#ea4335] text-white shadow-2xs"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {st === "present"
                            ? isAr ? "حاضر" : "Present"
                            : st === "late"
                            ? isAr ? "متأخر" : "Late"
                            : st === "excused"
                            ? isAr ? "بعذر" : "Excused"
                            : isAr ? "غياب" : "Absent"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          <DialogFooter className="border-t border-border pt-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAttendanceModalOpen(false)} className="rounded-xl">
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleSaveAttendance} className="bg-[#34a853] text-white rounded-xl font-bold">
              {isAr ? "حفظ واعتماد الحضور" : "Save Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Participant Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>{inspectedParticipant?.full_name}</span>
              <Badge variant="outline" className="text-xs">
                {inspectedParticipant?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {inspectedParticipant?.email} • {inspectedParticipant?.university} • {inspectedParticipant?.academic_year}
            </DialogDescription>
          </DialogHeader>

          {inspectedParticipant && (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
                <span className="font-bold text-foreground">
                  {isAr ? "عرض نتائج المسار:" : "Inspect Track Enrollment:"}
                </span>
                <select
                  value={inspectedParticipantTrackId}
                  onChange={(e) => setInspectedParticipantTrackId(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-border bg-background"
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

              {(() => {
                const metrics = tracksService.calculateParticipantMetrics(
                  inspectedParticipant.id,
                  inspectedParticipantTrackId
                );

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="p-3.5 rounded-xl border border-border/60 bg-card">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          {isAr ? "الحضور (40%)" : "Attendance (40%)"}
                        </span>
                        <span className="text-xl font-black text-primary">
                          {metrics.attendanceScore} / 40
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {metrics.attendancePercentage}% ({metrics.presentCount} حاضر / {metrics.lateCount} متأخر)
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border/60 bg-card">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          {isAr ? "المشاريع (30%)" : "Projects (30%)"}
                        </span>
                        <span className="text-xl font-black text-[#34a853]">
                          {metrics.assignmentScore} / 30
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Avg {metrics.assignmentAveragePct}%
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border/60 bg-card">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          {isAr ? "التفاعل (20%)" : "Participation (20%)"}
                        </span>
                        <span className="text-xl font-black text-[#fbbc04]">
                          {metrics.participationScore} / 20
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          تفاعل إيجابي
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-border/60 bg-card">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          {isAr ? "السلوك (10%)" : "Conduct (10%)"}
                        </span>
                        <span className="text-xl font-black text-[#1a73e8]">
                          {metrics.conductScore} / 10
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          التزام مهني
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-muted-foreground block font-bold">
                          {isAr ? "الدرجة الرسمية الإجمالية (من 100):" : "Final Official Score (100 pts):"}
                        </span>
                        <span className="text-2xl font-black text-foreground">
                          {metrics.finalOfficialScore} / 100
                        </span>
                        {metrics.totalBonus > 0 && (
                          <span className="text-[10px] font-bold text-amber-600 block mt-0.5">
                            +{metrics.totalBonus} {isAr ? "درجات تميز إضافية" : "bonus points"}
                          </span>
                        )}
                      </div>

                      <div className="text-end">
                        {metrics.isEligibleForCertificate ? (
                          <Badge variant="success" className="text-xs font-bold gap-1 px-3 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isAr ? "مؤهل للاعتماد الرسمي" : "Eligible for Certificate"}
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-xs px-3 py-1">
                            {isAr ? "قيد استيفاء المتطلبات" : "In Progress"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <DialogFooter className="border-t border-border pt-3">
            <Button size="sm" onClick={() => setIsProfileModalOpen(false)} className="rounded-xl">
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Certificate Preview Modal */}
      <Dialog open={isCertificatePreviewOpen} onOpenChange={setIsCertificatePreviewOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
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

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">
              GDG on Campus NCTU Academic Committee
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1 text-xs rounded-xl"
              >
                <Printer className="w-3.5 h-3.5" />
                {isAr ? "طباعة" : "Print"}
              </Button>
              <Button size="sm" onClick={() => setIsCertificatePreviewOpen(false)} className="rounded-xl">
                {isAr ? "إغلاق" : "Close"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. New Session Creation Modal */}
      <Dialog open={isNewSessionModalOpen} onOpenChange={setIsNewSessionModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "جدولة جلسة تدريبية جديدة" : "Schedule New Session"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "المسار التقني" : "Track"}</Label>
              <select
                value={sessionFormData.track_id}
                onChange={(e) => setSessionFormData({ ...sessionFormData, track_id: e.target.value })}
                className="w-full text-xs h-8.5 px-3 rounded-xl border border-border bg-background"
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
                placeholder="Session 4: Responsive UI with Tailwind"
                className="h-8.5 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>{isAr ? "التاريخ" : "Date"}</Label>
                <Input
                  type="date"
                  value={sessionFormData.date}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, date: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "البدء" : "Start"}</Label>
                <Input
                  type="time"
                  value={sessionFormData.start_time}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, start_time: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "الانتهاء" : "End"}</Label>
                <Input
                  type="time"
                  value={sessionFormData.end_time}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, end_time: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "المكان أو رابط الاجتماع" : "Location or Link"}</Label>
              <Input
                value={sessionFormData.location_or_link}
                onChange={(e) => setSessionFormData({ ...sessionFormData, location_or_link: e.target.value })}
                className="h-8.5 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewSessionModalOpen(false)} className="rounded-xl">
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateSession} className="bg-[#1a73e8] text-white rounded-xl">
              {isAr ? "جدولة الجلسة" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. New Assignment Modal */}
      <Dialog open={isNewAssignmentModalOpen} onOpenChange={setIsNewAssignmentModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "نشر تكليف أو مشروع جديد" : "Create New Assignment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>{isAr ? "المسار التقني" : "Track"}</Label>
              <select
                value={assignmentFormData.track_id}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, track_id: e.target.value })}
                className="w-full text-xs h-8.5 px-3 rounded-xl border border-border bg-background"
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
                placeholder="Capstone Project 1"
                className="h-8.5 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "الموعد النهائي" : "Deadline"}</Label>
                <Input
                  type="datetime-local"
                  value={assignmentFormData.deadline}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, deadline: e.target.value })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "الدرجة القصوى" : "Max Score"}</Label>
                <Input
                  type="number"
                  value={assignmentFormData.max_score}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, max_score: Number(e.target.value) })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "المخرجات المطلوبة" : "Required Deliverables"}</Label>
              <Input
                value={assignmentFormData.required_deliverables}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, required_deliverables: e.target.value })}
                className="h-8.5 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewAssignmentModalOpen(false)} className="rounded-xl">
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateAssignment} className="bg-[#1a73e8] text-white rounded-xl">
              {isAr ? "نشر التكليف" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 9. Bonus Recommendation Modal */}
      <Dialog open={isBonusModalOpen} onOpenChange={setIsBonusModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isAr ? "منح نقاط تميز للمتدرب" : "Award Trainee Bonus Points"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isAr ? "نقاط تميز خاصة بالمسار التقني (مستقلة تماماً عن نقاط اللجان الداخلية)." : "Track bonus points tracked separately."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{isAr ? "النقاط الممنوحة (1-15)" : "Bonus Amount"}</Label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  value={bonusFormData.amount}
                  onChange={(e) => setBonusFormData({ ...bonusFormData, amount: Number(e.target.value) })}
                  className="h-8.5 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>{isAr ? "سبب التميز" : "Category"}</Label>
                <select
                  value={bonusFormData.category}
                  onChange={(e) => setBonusFormData({ ...bonusFormData, category: e.target.value as any })}
                  className="w-full text-xs h-8.5 px-3 rounded-xl border border-border bg-background"
                >
                  <option value="exceptional_project">{isAr ? "مشروع تطبيقي متميز" : "Exceptional Project"}</option>
                  <option value="peer_mentoring">{isAr ? "مساعدة وتوجيه الزملاء" : "Peer Mentoring"}</option>
                  <option value="active_participation">{isAr ? "تفاعل استثنائي بالورش" : "Active Participation"}</option>
                  <option value="hackathon_winner">{isAr ? "فوز في هاكاثون" : "Hackathon Achievement"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>{isAr ? "تفاصيل الإنجاز" : "Description"}</Label>
              <Textarea
                value={bonusFormData.description}
                onChange={(e) => setBonusFormData({ ...bonusFormData, description: e.target.value })}
                placeholder="تفاصيل المساهمة المتميزة..."
                className="text-xs h-20 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBonusModalOpen(false)} className="rounded-xl">
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleCreateBonus} className="bg-amber-600 text-white rounded-xl">
              {isAr ? "منح النقاط" : "Award Bonus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 10. Assignment Attempts & Review Manager */}
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
