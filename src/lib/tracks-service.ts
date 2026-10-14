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
  FinalGradePolicy,
  RubricCriterion,
  StructuredFeedback,
  TrackSubmissionAttempt,
  GradeCorrectionLog,
  ReminderType,
  ReminderDeliveryChannel,
  ReminderRule,
  ReminderExecutionLog,
  TrackNotificationItem,
  NotificationPreference,
  RiskSeverity,
  RiskTriggerType,
  RiskRule,
  RiskIndicatorEvidence,
  RiskFollowUpCase,
  CaseActionLog,
} from "@/types";
import { sanitizeCSVCell, sanitizeUrl } from "./utils";

const STORAGE_PREFIX = "gdg_nctu_tracks_";
const inMemoryCache: Record<string, unknown[]> = {};

function getStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") {
    if (!inMemoryCache[key]) {
      inMemoryCache[key] = JSON.parse(JSON.stringify(fallback));
    }
    return inMemoryCache[key] as T[];
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T[]): void {
  inMemoryCache[key] = data;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write tracks storage for ${key}:`, err);
  }
}

// ── Default Seed Data for GDG NCTU Technical Tracks ──────────

export const INITIAL_TRACKS: TechnicalTrack[] = [
  {
    id: "track_web_2026",
    name: "Web Development (Frontend & Next.js)",
    name_ar: "تطوير الويب الشامل (Next.js & Frontend)",
    description:
      "Modern web architecture, TypeScript, React 19, Next.js App Router, Tailwind CSS, REST APIs, and full-stack integration.",
    category: "web",
    cohort: "Season 2026 - Cohort 1",
    start_date: "2026-02-01",
    end_date: "2026-05-15",
    reg_open_date: "2026-01-10",
    reg_close_date: "2026-01-28",
    lead_id: "lead_web_ahmed",
    lead_name: "Eng. Ahmed Tarek",
    mentor_ids: ["mentor_ta_nour", "mentor_ta_omar"],
    max_capacity: 45,
    attendance_requirements: 75,
    attendance_weight: 40,
    assignment_weight: 30,
    participation_weight: 20,
    conduct_weight: 10,
    certificate_min_score: 75,
    status: "active",
    syllabus: [
      "Modern HTML5, Semantic Web & Advanced CSS",
      "JavaScript Deep Dive (ESNext & Async)",
      "TypeScript Architecture & Type Safety",
      "React Essentials & Component Lifecycle",
      "Next.js App Router, SSR, Server Actions",
      "Database Integration & Supabase / PostgreSQL",
      "Production Deployment, CI/CD & Vercel",
    ],
    created_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-01-15T09:00:00Z",
  },
  {
    id: "track_flutter_2026",
    name: "Mobile App Development (Flutter & Dart)",
    name_ar: "تطوير تطبيقات الموبايل (Flutter & Dart)",
    description:
      "Cross-platform mobile apps for Android & iOS, state management with Bloc/Provider, clean architecture, and API integration.",
    category: "mobile",
    cohort: "Season 2026 - Cohort 1",
    start_date: "2026-02-05",
    end_date: "2026-05-20",
    reg_open_date: "2026-01-10",
    reg_close_date: "2026-01-30",
    lead_id: "lead_flutter_omar",
    lead_name: "Eng. Omar Khaled",
    mentor_ids: ["mentor_ta_salma"],
    max_capacity: 40,
    attendance_requirements: 75,
    attendance_weight: 40,
    assignment_weight: 30,
    participation_weight: 20,
    conduct_weight: 10,
    certificate_min_score: 75,
    status: "active",
    syllabus: [
      "Dart OOP Fundamentals & Null Safety",
      "Flutter UI Layouts & Material 3",
      "State Management (Bloc & Cubit)",
      "RESTful API & Local Caching",
      "Native device features & Camera/Sensors",
      "Publishing to Google Play Store",
    ],
    created_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-01-15T09:00:00Z",
  },
  {
    id: "track_cyber_2026",
    name: "Cybersecurity & Ethical Hacking",
    name_ar: "الأمن السيبراني واختبار الاختراق",
    description:
      "Network defense, web application penetration testing, OWASP Top 10, Linux security, cryptography, and CTF challenges.",
    category: "cybersecurity",
    cohort: "Season 2026 - Cohort 1",
    start_date: "2026-02-10",
    end_date: "2026-05-25",
    reg_open_date: "2026-01-10",
    reg_close_date: "2026-02-01",
    lead_id: "lead_cyber_ziad",
    lead_name: "Eng. Ziad Mahmoud",
    mentor_ids: ["mentor_ta_karim"],
    max_capacity: 35,
    attendance_requirements: 80,
    attendance_weight: 40,
    assignment_weight: 30,
    participation_weight: 20,
    conduct_weight: 10,
    certificate_min_score: 75,
    status: "active",
    syllabus: [
      "Linux Security & Command Line Mastery",
      "Networking Protocols & Wireshark Analysis",
      "Web App Vulnerabilities (OWASP Top 10)",
      "Reconnaissance, Nmap & Metasploit Basics",
      "Cryptography & Secure Coding Practices",
      "Final CTF Challenge Defense & Triage",
    ],
    created_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-01-15T09:00:00Z",
  },
  {
    id: "track_embedded_2026",
    name: "Embedded Systems & IoT",
    name_ar: "الأنظمة المدمجة وإنترنت الأشياء (IoT)",
    description:
      "Microcontroller programming (ARM Cortex / ESP32), C/C++, sensor interfacing, RTOS, and MQTT cloud telemetry.",
    category: "embedded",
    cohort: "Season 2026 - Cohort 1",
    start_date: "2026-02-12",
    end_date: "2026-05-28",
    reg_open_date: "2026-01-10",
    reg_close_date: "2026-02-05",
    lead_id: "lead_emb_mostafa",
    lead_name: "Eng. Mostafa Salem",
    mentor_ids: ["mentor_ta_mariam"],
    max_capacity: 30,
    attendance_requirements: 75,
    attendance_weight: 40,
    assignment_weight: 30,
    participation_weight: 20,
    conduct_weight: 10,
    certificate_min_score: 75,
    status: "active",
    syllabus: [
      "Embedded C Programming & Bit Manipulation",
      "Microcontroller Architecture & GPIOs",
      "Communication Protocols (UART, SPI, I2C)",
      "ESP32 Wi-Fi & MQTT Cloud Telemetry",
      "FreeRTOS Basics & Hardware Timers",
      "IoT Prototype Showcase",
    ],
    created_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-01-15T09:00:00Z",
  },
  {
    id: "track_uiux_2026",
    name: "UI/UX Product Design (Figma & Design Systems)",
    name_ar: "تصميم المنتجات وتجربة المستخدم (UI/UX)",
    description:
      "User research, wireframing, interactive prototyping in Figma, typography, color theory, design systems, and usability testing.",
    category: "uiux",
    cohort: "Season 2026 - Cohort 1",
    start_date: "2026-02-15",
    end_date: "2026-05-18",
    reg_open_date: "2026-01-10",
    reg_close_date: "2026-02-08",
    lead_id: "lead_ui_nouran",
    lead_name: "Eng. Nouran El-Sayed",
    mentor_ids: ["mentor_ta_hoda"],
    max_capacity: 35,
    attendance_requirements: 75,
    attendance_weight: 40,
    assignment_weight: 30,
    participation_weight: 20,
    conduct_weight: 10,
    certificate_min_score: 75,
    status: "active",
    syllabus: [
      "Design Thinking & User Research Methods",
      "Information Architecture & User Flows",
      "Figma Mastery (Components, Auto Layout, Variants)",
      "Typography, Color Systems & Accessibility",
      "Interactive Prototyping & Micro-interactions",
      "Usability Testing & Design Handoff",
    ],
    created_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-01-15T09:00:00Z",
  },
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: "part_karim_01",
    full_name: "Karim Mahmoud Mostafa",
    email: "karim.mahmoud@nctu.edu.eg",
    phone: "+20 102 345 6789",
    university: "New Cairo Technological University (NCTU)",
    faculty_department: "Faculty of Industry & Energy - ICT Department",
    academic_year: "Year 3",
    registration_date: "2026-01-18",
    status: "active",
    notes: "Top performer, active in sessions, preparing full-stack graduation project.",
    created_at: "2026-01-18T10:00:00Z",
    updated_at: "2026-01-18T10:00:00Z",
  },
  {
    id: "part_salma_02",
    full_name: "Salma Hassan Abdelrahman",
    email: "salma.hassan@nctu.edu.eg",
    phone: "+20 111 987 6543",
    university: "New Cairo Technological University (NCTU)",
    faculty_department: "Faculty of Industry & Energy - Software Tech",
    academic_year: "Year 2",
    registration_date: "2026-01-19",
    status: "active",
    notes: "Demonstrates high commitment in Flutter widgets and reactive UI.",
    created_at: "2026-01-19T11:00:00Z",
    updated_at: "2026-01-19T11:00:00Z",
  },
  {
    id: "part_omar_03",
    full_name: "Omar Sherif El-Gohary",
    email: "omar.sherif@nctu.edu.eg",
    phone: "+20 100 456 7890",
    university: "New Cairo Technological University (NCTU)",
    faculty_department: "Faculty of Industry & Energy - ICT Department",
    academic_year: "Year 4",
    registration_date: "2026-01-20",
    status: "active",
    notes: "Strong network background, participated in regional CTFs.",
    created_at: "2026-01-20T12:00:00Z",
    updated_at: "2026-01-20T12:00:00Z",
  },
  {
    id: "part_mariam_04",
    full_name: "Mariam Tarek El-Kady",
    email: "mariam.tarek@nctu.edu.eg",
    phone: "+20 122 345 1122",
    university: "New Cairo Technological University (NCTU)",
    faculty_department: "Faculty of Industry & Energy - Mechatronics",
    academic_year: "Year 2",
    registration_date: "2026-01-22",
    status: "active",
    notes: "Skilled with hardware soldering and ESP32 hardware boards.",
    created_at: "2026-01-22T09:30:00Z",
    updated_at: "2026-01-22T09:30:00Z",
  },
  {
    id: "part_youssef_05",
    full_name: "Youssef Ibrahim Soliman",
    email: "youssef.ibrahim@nctu.edu.eg",
    phone: "+20 106 789 1234",
    university: "New Cairo Technological University (NCTU)",
    faculty_department: "Faculty of Industry & Energy - ICT Department",
    academic_year: "Year 2",
    registration_date: "2026-01-23",
    status: "active",
    notes: "Struggling with late arrivals; follow-up action scheduled.",
    created_at: "2026-01-23T14:15:00Z",
    updated_at: "2026-01-23T14:15:00Z",
  },
  {
    id: "part_nouran_06",
    full_name: "Nouran Adel Mansour",
    email: "nouran.adel@nctu.edu.eg",
    phone: "+20 114 567 8901",
    university: "New Cairo Technological University (NCTU)",
    faculty_department: "Applied Design & Digital Media",
    academic_year: "Year 3",
    registration_date: "2026-01-24",
    status: "active",
    notes: "Cross-enrolled in Web & UI/UX; excellent cross-disciplinary projects.",
    created_at: "2026-01-24T16:00:00Z",
    updated_at: "2026-01-24T16:00:00Z",
  },
];

export const INITIAL_ENROLLMENTS: TrackEnrollment[] = [
  {
    id: "enr_karim_web",
    participant_id: "part_karim_01",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    enrollment_date: "2026-01-20",
    status: "active",
    current_progress: 85,
    final_result: 91,
    completion_status: "certified",
    notes: "Qualifies for official GDG verified completion certificate.",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "enr_karim_uiux",
    participant_id: "part_karim_01",
    track_id: "track_uiux_2026",
    cohort: "Season 2026 - Cohort 1",
    enrollment_date: "2026-01-22",
    status: "active",
    current_progress: 80,
    final_result: 86,
    completion_status: "certified",
    notes: "Multi-track enrollment verified.",
    created_at: "2026-01-22T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "enr_salma_flutter",
    participant_id: "part_salma_02",
    track_id: "track_flutter_2026",
    cohort: "Season 2026 - Cohort 1",
    enrollment_date: "2026-01-20",
    status: "active",
    current_progress: 90,
    final_result: 89,
    completion_status: "certified",
    created_at: "2026-01-20T11:00:00Z",
    updated_at: "2026-03-01T11:00:00Z",
  },
  {
    id: "enr_omar_cyber",
    participant_id: "part_omar_03",
    track_id: "track_cyber_2026",
    cohort: "Season 2026 - Cohort 1",
    enrollment_date: "2026-01-21",
    status: "active",
    current_progress: 82,
    final_result: 84,
    completion_status: "certified",
    created_at: "2026-01-21T12:00:00Z",
    updated_at: "2026-03-01T12:00:00Z",
  },
  {
    id: "enr_mariam_emb",
    participant_id: "part_mariam_04",
    track_id: "track_embedded_2026",
    cohort: "Season 2026 - Cohort 1",
    enrollment_date: "2026-01-23",
    status: "active",
    current_progress: 78,
    final_result: 82,
    completion_status: "certified",
    created_at: "2026-01-23T09:30:00Z",
    updated_at: "2026-03-01T09:30:00Z",
  },
  {
    id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    enrollment_date: "2026-01-24",
    status: "active",
    current_progress: 55,
    final_result: 68,
    completion_status: "in_progress",
    notes: "Below 75% threshold; requires assignment re-submission and attendance recovery.",
    created_at: "2026-01-24T14:15:00Z",
    updated_at: "2026-03-01T14:15:00Z",
  },
  {
    id: "enr_nouran_uiux",
    participant_id: "part_nouran_06",
    track_id: "track_uiux_2026",
    cohort: "Season 2026 - Cohort 1",
    enrollment_date: "2026-01-25",
    status: "active",
    current_progress: 95,
    final_result: 96,
    completion_status: "certified",
    created_at: "2026-01-25T16:00:00Z",
    updated_at: "2026-03-01T16:00:00Z",
  },
];

export const INITIAL_SESSIONS: TrackSession[] = [
  {
    id: "sess_web_01",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Session 1: Modern Web Foundations & Semantic HTML5",
    description: "Orientation, HTML5 semantic layout, DOM tree, accessibility (a11y), and Git setup.",
    date: "2026-02-03",
    start_time: "18:00",
    end_time: "20:30",
    instructor_name: "Eng. Ahmed Tarek",
    location_or_link: "NCTU Tech Hall B & Google Meet",
    materials_url: "https://drive.google.com/drive/folders/gdg-web-s1",
    recording_url: "https://youtu.be/gdg-nctu-web-s1",
    status: "completed",
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-02-03T21:00:00Z",
  },
  {
    id: "sess_web_02",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Session 2: Modern CSS, Flexbox, Grid & Responsive Layouts",
    description: "CSS Grid, Flexbox, media queries, CSS variables, and Tailwind utility concepts.",
    date: "2026-02-10",
    start_time: "18:00",
    end_time: "20:30",
    instructor_name: "Eng. Ahmed Tarek",
    location_or_link: "NCTU Tech Hall B",
    materials_url: "https://drive.google.com/drive/folders/gdg-web-s2",
    status: "completed",
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-02-10T21:00:00Z",
  },
  {
    id: "sess_web_03",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Session 3: JavaScript ESNext, Promises & Async/Await",
    description: "Scope, closures, prototypes, event loop, Fetch API, and asynchronous architecture.",
    date: "2026-02-17",
    start_time: "18:00",
    end_time: "20:30",
    instructor_name: "Eng. Ahmed Tarek",
    location_or_link: "Google Meet Live",
    materials_url: "https://drive.google.com/drive/folders/gdg-web-s3",
    status: "completed",
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-02-17T21:00:00Z",
  },
  {
    id: "sess_web_04",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Session 4: React 19 Components, State & Hooks Mastery",
    description: "JSX, useState, useEffect, custom hooks, and React performance optimization.",
    date: "2026-02-24",
    start_time: "18:00",
    end_time: "20:30",
    instructor_name: "Eng. Ahmed Tarek",
    location_or_link: "NCTU Tech Hall B",
    materials_url: "https://drive.google.com/drive/folders/gdg-web-s4",
    status: "completed",
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-02-24T21:00:00Z",
  },
  {
    id: "sess_web_05",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Session 5: Next.js App Router, SSR & Server Actions",
    description: "App directory, layout nesting, Server Components, client boundaries, routing.",
    date: "2026-03-03",
    start_time: "18:00",
    end_time: "20:30",
    instructor_name: "Eng. Ahmed Tarek",
    location_or_link: "NCTU Tech Hall B & Hybrid Stream",
    status: "scheduled",
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-01-25T10:00:00Z",
  },
  {
    id: "sess_flutter_01",
    track_id: "track_flutter_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Session 1: Dart Programming Fundamentals & OOP",
    description: "Dart syntax, classes, inheritance, mixins, and null safety guarantees.",
    date: "2026-02-06",
    start_time: "17:00",
    end_time: "19:30",
    instructor_name: "Eng. Omar Khaled",
    location_or_link: "NCTU Lab 402",
    status: "completed",
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-02-06T20:00:00Z",
  },
  {
    id: "sess_flutter_02",
    track_id: "track_flutter_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Session 2: Flutter Widgets Tree & Custom Layouts",
    description: "Stateless vs Stateful, Container, Column, Row, ListView, and theme customization.",
    date: "2026-02-13",
    start_time: "17:00",
    end_time: "19:30",
    instructor_name: "Eng. Omar Khaled",
    location_or_link: "NCTU Lab 402",
    status: "completed",
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-02-13T20:00:00Z",
  },
];

export const INITIAL_ATTENDANCE: TrackAttendanceRecord[] = [
  // Session 1 Web
  {
    id: "att_web_01_karim",
    session_id: "sess_web_01",
    track_id: "track_web_2026",
    enrollment_id: "enr_karim_web",
    participant_id: "part_karim_01",
    status: "present",
    recorded_by: "lead_web_ahmed",
    recorder_name: "Eng. Ahmed Tarek",
    created_at: "2026-02-03T18:15:00Z",
    updated_at: "2026-02-03T18:15:00Z",
  },
  {
    id: "att_web_01_youssef",
    session_id: "sess_web_01",
    track_id: "track_web_2026",
    enrollment_id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    status: "late",
    notes: "Arrived 35 minutes late due to university exam.",
    recorded_by: "lead_web_ahmed",
    recorder_name: "Eng. Ahmed Tarek",
    created_at: "2026-02-03T18:35:00Z",
    updated_at: "2026-02-03T18:35:00Z",
  },
  // Session 2 Web
  {
    id: "att_web_02_karim",
    session_id: "sess_web_02",
    track_id: "track_web_2026",
    enrollment_id: "enr_karim_web",
    participant_id: "part_karim_01",
    status: "present",
    recorded_by: "lead_web_ahmed",
    recorder_name: "Eng. Ahmed Tarek",
    created_at: "2026-02-10T18:15:00Z",
    updated_at: "2026-02-10T18:15:00Z",
  },
  {
    id: "att_web_02_youssef",
    session_id: "sess_web_02",
    track_id: "track_web_2026",
    enrollment_id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    status: "absent",
    notes: "Unexcused absence.",
    recorded_by: "lead_web_ahmed",
    recorder_name: "Eng. Ahmed Tarek",
    created_at: "2026-02-10T18:40:00Z",
    updated_at: "2026-02-10T18:40:00Z",
  },
  // Session 3 Web
  {
    id: "att_web_03_karim",
    session_id: "sess_web_03",
    track_id: "track_web_2026",
    enrollment_id: "enr_karim_web",
    participant_id: "part_karim_01",
    status: "present",
    recorded_by: "lead_web_ahmed",
    recorder_name: "Eng. Ahmed Tarek",
    created_at: "2026-02-17T18:10:00Z",
    updated_at: "2026-02-17T18:10:00Z",
  },
  {
    id: "att_web_03_youssef",
    session_id: "sess_web_03",
    track_id: "track_web_2026",
    enrollment_id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    status: "excused",
    excuse_reason: "Academic midterm conflict verified with faculty schedule.",
    recorded_by: "lead_web_ahmed",
    recorder_name: "Eng. Ahmed Tarek",
    created_at: "2026-02-17T18:10:00Z",
    updated_at: "2026-02-17T18:10:00Z",
  },
  // Session 4 Web
  {
    id: "att_web_04_karim",
    session_id: "sess_web_04",
    track_id: "track_web_2026",
    enrollment_id: "enr_karim_web",
    participant_id: "part_karim_01",
    status: "present",
    recorded_by: "lead_web_ahmed",
    recorder_name: "Eng. Ahmed Tarek",
    created_at: "2026-02-24T18:15:00Z",
    updated_at: "2026-02-24T18:15:00Z",
  },
  {
    id: "att_web_04_youssef",
    session_id: "sess_web_04",
    track_id: "track_web_2026",
    enrollment_id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    status: "present",
    recorded_by: "lead_web_ahmed",
    recorder_name: "Eng. Ahmed Tarek",
    created_at: "2026-02-24T18:15:00Z",
    updated_at: "2026-02-24T18:15:00Z",
  },
  // Flutter Session 1 & 2
  {
    id: "att_fl_01_salma",
    session_id: "sess_flutter_01",
    track_id: "track_flutter_2026",
    enrollment_id: "enr_salma_flutter",
    participant_id: "part_salma_02",
    status: "present",
    recorded_by: "lead_flutter_omar",
    recorder_name: "Eng. Omar Khaled",
    created_at: "2026-02-06T17:15:00Z",
    updated_at: "2026-02-06T17:15:00Z",
  },
  {
    id: "att_fl_02_salma",
    session_id: "sess_flutter_02",
    track_id: "track_flutter_2026",
    enrollment_id: "enr_salma_flutter",
    participant_id: "part_salma_02",
    status: "present",
    recorded_by: "lead_flutter_omar",
    recorder_name: "Eng. Omar Khaled",
    created_at: "2026-02-13T17:15:00Z",
    updated_at: "2026-02-13T17:15:00Z",
  },
];

export const INITIAL_ASSIGNMENTS: TrackAssignment[] = [
  {
    id: "asg_web_01",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Project 1: Responsive Developer Portfolio",
    description: "Build an accessible, responsive personal developer portfolio using Semantic HTML5 and modern CSS Grid.",
    instructions:
      "Requirements: 1) Lighthouse score > 90 across Performance & Accessibility. 2) Responsive on mobile, tablet, and desktop. 3) Deployed on Vercel or GitHub Pages.",
    resources_url: "https://developer.mozilla.org/en-US/docs/Learn",
    publication_date: "2026-02-11",
    deadline: "2026-02-20T23:59:00Z",
    max_score: 100,
    weight_in_track: 30,
    required_deliverables: "GitHub Repository Link + Live Demo URL",
    submission_format: "GitHub URL",
    late_policy: "Late submission deducts 10% per 24 hours up to 48 hours maximum.",
    revision_policy: "One resubmission allowed within 5 days of reviewer feedback.",
    reviewer_id: "lead_web_ahmed",
    created_at: "2026-02-11T10:00:00Z",
    updated_at: "2026-02-11T10:00:00Z",
  },
  {
    id: "asg_web_02",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Project 2: Interactive Task Management App (React & Hooks)",
    description: "Build a stateful React application implementing CRUD operations, localStorage persistence, and custom hooks.",
    instructions:
      "Implement filtering (active, completed, all), priority tagging, search bar, and unit tests for helper routines.",
    resources_url: "https://react.dev/reference/react",
    publication_date: "2026-02-25",
    deadline: "2026-03-08T23:59:00Z",
    max_score: 100,
    weight_in_track: 35,
    required_deliverables: "GitHub Repository + Deployed App on Vercel",
    submission_format: "GitHub URL",
    late_policy: "Deadline extension must be requested at least 24 hours prior to deadline.",
    revision_policy: "Resubmissions allowed if original score is below 70%.",
    reviewer_id: "lead_web_ahmed",
    created_at: "2026-02-25T10:00:00Z",
    updated_at: "2026-02-25T10:00:00Z",
  },
  {
    id: "asg_flutter_01",
    track_id: "track_flutter_2026",
    cohort: "Season 2026 - Cohort 1",
    title: "Milestone 1: E-Commerce UI & Catalog App",
    description: "Develop a multi-screen Flutter catalog featuring slivers, product grid, cart state, and custom Hero animations.",
    instructions: "Must run smoothly on both Android 34 and iOS simulator with zero overflow errors.",
    publication_date: "2026-02-14",
    deadline: "2026-02-28T23:59:00Z",
    max_score: 100,
    weight_in_track: 40,
    required_deliverables: "GitHub Repo + APK build file / recording link",
    submission_format: "GitHub URL",
    late_policy: "5 points deduction per 24 hours.",
    revision_policy: "One resubmission permitted.",
    reviewer_id: "lead_flutter_omar",
    created_at: "2026-02-14T10:00:00Z",
    updated_at: "2026-02-14T10:00:00Z",
  },
];

export const INITIAL_SUBMISSIONS: TrackSubmission[] = [
  {
    id: "sub_web_01_karim",
    assignment_id: "asg_web_01",
    enrollment_id: "enr_karim_web",
    participant_id: "part_karim_01",
    submission_url: "https://github.com/karim-m/dev-portfolio-nctu",
    submitted_at: "2026-02-18T20:15:00Z",
    status: "graded",
    score: 96,
    reviewer_feedback:
      "Outstanding structure and semantic accessibility. Fluid animations and clean Git commit history. Well done!",
    reviewed_by: "Eng. Ahmed Tarek",
    reviewed_at: "2026-02-21T14:00:00Z",
    created_at: "2026-02-18T20:15:00Z",
    updated_at: "2026-02-21T14:00:00Z",
  },
  {
    id: "sub_web_01_youssef",
    assignment_id: "asg_web_01",
    enrollment_id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    submission_url: "https://github.com/youssef-i/nctu-web-assignment1",
    submitted_at: "2026-02-21T10:30:00Z",
    status: "graded",
    score: 72,
    reviewer_feedback:
      "Submitted 10 hours past deadline (deducted 10%). Layout breaks on screens below 400px. Needs responsive CSS improvements.",
    reviewed_by: "Eng. Ahmed Tarek",
    reviewed_at: "2026-02-22T16:00:00Z",
    deadline_extension_date: undefined,
    created_at: "2026-02-21T10:30:00Z",
    updated_at: "2026-02-22T16:00:00Z",
  },
  {
    id: "sub_fl_01_salma",
    assignment_id: "asg_flutter_01",
    enrollment_id: "enr_salma_flutter",
    participant_id: "part_salma_02",
    submission_url: "https://github.com/salma-h/flutter-ecommerce-catalog",
    submitted_at: "2026-02-27T18:00:00Z",
    status: "graded",
    score: 94,
    reviewer_feedback: "Beautiful Material 3 design and smooth Hero transitions. Great separation of concerns.",
    reviewed_by: "Eng. Omar Khaled",
    reviewed_at: "2026-03-01T12:00:00Z",
    created_at: "2026-02-27T18:00:00Z",
    updated_at: "2026-03-01T12:00:00Z",
  },
];

export const INITIAL_BONUS: TrackBonus[] = [
  {
    id: "bon_karim_01",
    enrollment_id: "enr_karim_web",
    track_id: "track_web_2026",
    participant_id: "part_karim_01",
    amount: 5,
    category: "helping_peers",
    description: "Assisted 6 junior participants during the hands-on lab with Git conflicts and Tailwind setup.",
    evidence_url: "https://discord.com/channels/gdg-nctu/web-help/12345",
    recorded_by: "mentor_ta_nour",
    approval_status: "approved",
    approval_reason: "Verified by track instructor during Session 3 live lab.",
    approved_by: "lead_web_ahmed",
    approved_at: "2026-02-18T12:00:00Z",
    created_at: "2026-02-17T21:00:00Z",
    updated_at: "2026-02-18T12:00:00Z",
  },
  {
    id: "bon_salma_01",
    enrollment_id: "enr_salma_flutter",
    track_id: "track_flutter_2026",
    participant_id: "part_salma_02",
    amount: 5,
    category: "exceptional_project",
    description: "Contributed an open-source NCTU Flutter UI kit library for all cohort members to use.",
    evidence_url: "https://github.com/salma-h/nctu-flutter-widgets",
    recorded_by: "lead_flutter_omar",
    approval_status: "approved",
    approved_by: "lead_flutter_omar",
    approved_at: "2026-02-28T15:00:00Z",
    created_at: "2026-02-28T14:00:00Z",
    updated_at: "2026-02-28T15:00:00Z",
  },
  {
    id: "bon_nouran_01",
    enrollment_id: "enr_nouran_uiux",
    track_id: "track_uiux_2026",
    participant_id: "part_nouran_06",
    amount: 5,
    category: "competition",
    description: "Won 1st place in the internal GDG on Campus Hackathon design prototype round.",
    evidence_url: "https://figma.com/@nouran_hackathon_award",
    recorded_by: "lead_ui_nouran",
    approval_status: "approved",
    approved_by: "super_admin",
    approved_at: "2026-02-20T10:00:00Z",
    created_at: "2026-02-19T18:00:00Z",
    updated_at: "2026-02-20T10:00:00Z",
  },
];

export const INITIAL_EVALUATIONS: TrackEvaluation[] = [
  {
    id: "eval_karim_web",
    enrollment_id: "enr_karim_web",
    participant_id: "part_karim_01",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    evaluator_id: "lead_web_ahmed",
    evaluator_name: "Eng. Ahmed Tarek",
    attendance_score: 40, // 4/4 sessions = 100% * 40 = 40
    assignment_score: 28.8, // 96% * 30 = 28.8
    participation_score: 18, // out of 20
    conduct_score: 10, // out of 10
    raw_total: 96.8,
    bonus_points: 5,
    final_official_score: 97, // capped at 100
    is_certified: true,
    feedback_notes: "Exemplary participant, potential teaching assistant candidate for upcoming seasons.",
    private_instructor_notes: "Strong algorithmic reasoning and proactive peer leadership.",
    version: "2026.1-Official",
    created_at: "2026-02-25T11:00:00Z",
    updated_at: "2026-02-25T11:00:00Z",
  },
  {
    id: "eval_salma_flutter",
    enrollment_id: "enr_salma_flutter",
    participant_id: "part_salma_02",
    track_id: "track_flutter_2026",
    cohort: "Season 2026 - Cohort 1",
    evaluator_id: "lead_flutter_omar",
    evaluator_name: "Eng. Omar Khaled",
    attendance_score: 40,
    assignment_score: 28.2,
    participation_score: 19,
    conduct_score: 10,
    raw_total: 97.2,
    bonus_points: 5,
    final_official_score: 97,
    is_certified: true,
    feedback_notes: "Exceptional code quality and creative architecture.",
    version: "2026.1-Official",
    created_at: "2026-03-01T12:00:00Z",
    updated_at: "2026-03-01T12:00:00Z",
  },
];

export const INITIAL_CERTIFICATES: TrackCertificate[] = [
  {
    id: "cert_karim_web_2026",
    enrollment_id: "enr_karim_web",
    participant_id: "part_karim_01",
    track_id: "track_web_2026",
    cohort: "Season 2026 - Cohort 1",
    certificate_code: "GDG-NCTU-2026-WEB-001",
    issue_date: "2026-02-26",
    status: "issued",
    official_score: 97,
    issued_by: "GDG on Campus NCTU Leadership",
    verification_url: "https://gdg-nctu.org/verify/GDG-NCTU-2026-WEB-001",
    created_at: "2026-02-26T14:00:00Z",
    updated_at: "2026-02-26T14:00:00Z",
  },
  {
    id: "cert_salma_flutter_2026",
    enrollment_id: "enr_salma_flutter",
    participant_id: "part_salma_02",
    track_id: "track_flutter_2026",
    cohort: "Season 2026 - Cohort 1",
    certificate_code: "GDG-NCTU-2026-FLUTTER-002",
    issue_date: "2026-03-01",
    status: "issued",
    official_score: 97,
    issued_by: "GDG on Campus NCTU Leadership",
    verification_url: "https://gdg-nctu.org/verify/GDG-NCTU-2026-FLUTTER-002",
    created_at: "2026-03-01T15:00:00Z",
    updated_at: "2026-03-01T15:00:00Z",
  },
];

export const INITIAL_FOLLOW_UPS: TrackFollowUp[] = [
  {
    id: "follow_youssef_01",
    enrollment_id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    track_id: "track_web_2026",
    risk_factors: ["low_attendance", "late_submission", "score_below_threshold"],
    responsible_person_id: "mentor_ta_nour",
    responsible_person_name: "Eng. Nour (Mentor)",
    action_plan:
      "Schedule 1-on-1 tutoring on responsive CSS and review upcoming React assignments before deadline.",
    due_date: "2026-03-06",
    outcome: "Participant acknowledged; scheduled tutoring on Thursday at 4 PM.",
    status: "in_progress",
    created_at: "2026-02-23T10:00:00Z",
    updated_at: "2026-02-24T12:00:00Z",
  },
];

export const INITIAL_SUBMISSION_ATTEMPTS: TrackSubmissionAttempt[] = [
  {
    id: "attm_web_01_karim_1",
    submission_id: "sub_web_01_karim",
    assignment_id: "asg_web_01",
    enrollment_id: "enr_karim_web",
    participant_id: "part_karim_01",
    attempt_number: 1,
    submission_url: "https://github.com/karim-m/dev-portfolio-nctu",
    submitted_at: "2026-02-18T20:15:00Z",
    applicable_deadline: "2026-02-20T23:59:00Z",
    is_late: false,
    late_penalty_applied: 0,
    status: "accepted",
    score: 96,
    feedback: {
      what_went_well: "Outstanding semantic HTML5 structure, responsive layout across all breakpoints, perfect Lighthouse audit score (98/100).",
      needs_improvement: "Could add dark-mode CSS variables transition in next iterations.",
      specific_corrections: "None required. Production-ready quality.",
      required_changes_for_acceptance: "None.",
      learning_resources: "https://web.dev/learn/design",
      suggested_next_steps: "Proceed to React components project.",
      rubric_scores: { "rubric_code_quality": 38, "rubric_responsiveness": 30, "rubric_accessibility": 28 },
    },
    reviewer_id: "lead_web_ahmed",
    reviewer_name: "Eng. Ahmed Tarek",
    reviewed_at: "2026-02-21T14:00:00Z",
    created_at: "2026-02-18T20:15:00Z",
  },
  {
    id: "attm_web_01_youssef_1",
    submission_id: "sub_web_01_youssef",
    assignment_id: "asg_web_01",
    enrollment_id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    attempt_number: 1,
    submission_url: "https://github.com/youssef-i/nctu-web-assignment1-v1",
    submitted_at: "2026-02-21T10:30:00Z",
    applicable_deadline: "2026-02-20T23:59:00Z",
    is_late: true,
    late_penalty_applied: 10,
    status: "revision_requested",
    score: 65,
    feedback: {
      what_went_well: "Good color palette and typography choices.",
      needs_improvement: "Layout breaks on mobile viewport width < 420px. Flexbox container overflows.",
      specific_corrections: "Add viewport meta tag and CSS flex-wrap: wrap with media queries for max-width 480px.",
      required_changes_for_acceptance: "Fix mobile responsiveness so no horizontal scroll appears.",
      learning_resources: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
      suggested_next_steps: "Resubmit new attempt with mobile responsive fix.",
      rubric_scores: { "rubric_code_quality": 25, "rubric_responsiveness": 15, "rubric_accessibility": 25 },
    },
    reviewer_id: "lead_web_ahmed",
    reviewer_name: "Eng. Ahmed Tarek",
    reviewed_at: "2026-02-22T16:00:00Z",
    revision_requested_at: "2026-02-22T16:00:00Z",
    resubmission_deadline: "2026-03-05T23:59:00Z",
    resubmission_notes: "Please test with Chrome DevTools Device Mode before resubmitting.",
    created_at: "2026-02-21T10:30:00Z",
  },
  {
    id: "attm_web_01_youssef_2",
    submission_id: "sub_web_01_youssef",
    assignment_id: "asg_web_01",
    enrollment_id: "enr_youssef_web",
    participant_id: "part_youssef_05",
    attempt_number: 2,
    submission_url: "https://github.com/youssef-i/nctu-web-assignment1-v2",
    submitted_at: "2026-03-02T18:00:00Z",
    applicable_deadline: "2026-03-05T23:59:00Z",
    is_late: false,
    late_penalty_applied: 0,
    status: "accepted",
    score: 84,
    feedback: {
      what_went_well: "Mobile layout now works smoothly. Flex wrap fixed horizontal overflow. Excellent progress!",
      needs_improvement: "Image alt tags can be more descriptive.",
      specific_corrections: "Resolved.",
      required_changes_for_acceptance: "All requested revisions verified.",
      learning_resources: "https://developer.mozilla.org/en-US/docs/Web/Responsive_web_design",
      suggested_next_steps: "Ready for Project 2.",
      rubric_scores: { "rubric_code_quality": 30, "rubric_responsiveness": 28, "rubric_accessibility": 26 },
    },
    reviewer_id: "lead_web_ahmed",
    reviewer_name: "Eng. Ahmed Tarek",
    reviewed_at: "2026-03-03T11:00:00Z",
    created_at: "2026-03-02T18:00:00Z",
  },
  {
    id: "attm_fl_01_salma_1",
    submission_id: "sub_fl_01_salma",
    assignment_id: "asg_flutter_01",
    enrollment_id: "enr_salma_flutter",
    participant_id: "part_salma_02",
    attempt_number: 1,
    submission_url: "https://github.com/salma-h/flutter-ecommerce-catalog",
    submitted_at: "2026-02-27T18:00:00Z",
    applicable_deadline: "2026-02-28T23:59:00Z",
    is_late: false,
    status: "accepted",
    score: 94,
    feedback: {
      what_went_well: "Clean architecture, seamless hero animations, zero overflow errors.",
      needs_improvement: "Consider using Riverpod or Bloc for complex state.",
      specific_corrections: "None required.",
      required_changes_for_acceptance: "None.",
      rubric_scores: { "rubric_code_quality": 38, "rubric_responsiveness": 28, "rubric_architecture": 28 },
    },
    reviewer_id: "lead_flutter_omar",
    reviewer_name: "Eng. Omar Khaled",
    reviewed_at: "2026-03-01T10:00:00Z",
    created_at: "2026-02-27T18:00:00Z",
  },
];

export const INITIAL_GRADE_CORRECTIONS: GradeCorrectionLog[] = [];

export const INITIAL_REMINDER_RULES: ReminderRule[] = [
  {
    id: "rule_asg_72h",
    name: "Assignment Deadline Approaching (72h)",
    name_ar: "تذكير مبكر باقتراب موعد تسليم المهمة (72 ساعة)",
    reminder_type: "upcoming_deadline",
    trigger_condition: "hours_before_deadline",
    time_offset_hours: -72,
    recipient_role: "participant",
    delivery_channel: "in_app",
    message_template: "Reminder: Assignment '{title}' is due in 3 days ({deadline}).",
    message_template_ar: "تذكير: يتبقى 3 أيام على الموعد النهائي لتسليم المهمة '{title}'.",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 1,
    frequency_hours: 24,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "rule_asg_24h",
    name: "Assignment Deadline Approaching (24h)",
    name_ar: "تذكير حرج باقتراب موعد تسليم المهمة (24 ساعة)",
    reminder_type: "upcoming_deadline",
    trigger_condition: "hours_before_deadline",
    time_offset_hours: -24,
    recipient_role: "participant",
    delivery_channel: "in_app",
    message_template: "Urgent: Assignment '{title}' is due tomorrow at {deadline}!",
    message_template_ar: "عاجل: يتبقى 24 ساعة فقط على تسليم المهمة '{title}'!",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 1,
    frequency_hours: 24,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "rule_asg_3h",
    name: "Assignment Final Countdown (3h)",
    name_ar: "تنبيه الساعات الأخيرة لموعد التسليم (3 ساعات)",
    reminder_type: "upcoming_deadline",
    trigger_condition: "hours_before_deadline",
    time_offset_hours: -3,
    recipient_role: "participant",
    delivery_channel: "in_app",
    message_template: "Final Notice: Only 3 hours left to submit '{title}'.",
    message_template_ar: "فرصة أخيرة: يتبقى 3 ساعات فقط لإغلاق باب تسليم '{title}'.",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 1,
    frequency_hours: 24,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "rule_asg_overdue",
    name: "Assignment Overdue Notice",
    name_ar: "إشعار تأخر تسليم المهمة عن الموعد النهائي",
    reminder_type: "overdue_assignment",
    trigger_condition: "hours_after_deadline",
    time_offset_hours: 1,
    recipient_role: "participant",
    delivery_channel: "in_app",
    message_template: "Assignment '{title}' is now overdue. Submit as soon as possible or contact your mentor.",
    message_template_ar: "المهمة '{title}' متأخرة عن الموعد النهائي. يرجى المسارعة بالتسليم لتجنب الخصومات.",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 2,
    frequency_hours: 48,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "rule_sess_24h",
    name: "Upcoming Session Reminder (24h)",
    name_ar: "تذكير بموعد الجلسة التقنية القادمة (24 ساعة)",
    reminder_type: "upcoming_session",
    trigger_condition: "hours_before_session",
    time_offset_hours: -24,
    recipient_role: "participant",
    delivery_channel: "in_app",
    message_template: "Upcoming Session: '{title}' is scheduled tomorrow at {time}.",
    message_template_ar: "تذكير: الجلسة التقنية '{title}' غداً في تمام الساعة {time}.",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 1,
    frequency_hours: 24,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "rule_resubmit_req",
    name: "Feedback Revision Requested",
    name_ar: "إشعار طلب تعديل وإعادة تسليم المهمة",
    reminder_type: "feedback_resubmission_requested",
    trigger_condition: "immediate",
    time_offset_hours: 0,
    recipient_role: "participant",
    delivery_channel: "in_app",
    message_template: "Revision requested on '{title}'. Please check reviewer notes and resubmit before {resubmission_deadline}.",
    message_template_ar: "طلب مراجع المسار تعديلات على تسليمك للمهمة '{title}'. يرجى الاطلاع على الملاحظات وإعادة التسليم قبل {resubmission_deadline}.",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 1,
    frequency_hours: 24,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "rule_resubmit_24h",
    name: "Resubmission Deadline Approaching (24h)",
    name_ar: "تذكير باقتراب مهلة إعادة التسليم (24 ساعة)",
    reminder_type: "resubmission_deadline_approaching",
    trigger_condition: "hours_before_resubmission_deadline",
    time_offset_hours: -24,
    recipient_role: "participant",
    delivery_channel: "in_app",
    message_template: "Attention: Resubmission window for '{title}' closes in 24 hours.",
    message_template_ar: "تنبيه: يتبقى 24 ساعة على انتهاء مهلة إعادة تسليم التعديلات للمهمة '{title}'.",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 1,
    frequency_hours: 24,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "rule_grading_pending",
    name: "Submission Awaiting Review (48h)",
    name_ar: "تنبيه للمدرب: تسليم بانتظار المراجعة والتقييم (48 ساعة)",
    reminder_type: "assignment_awaiting_review",
    trigger_condition: "hours_after_submission",
    time_offset_hours: 48,
    recipient_role: "assigned_instructor",
    delivery_channel: "in_app",
    message_template: "Instructor Alert: Submission by {participant_name} for '{title}' is awaiting your evaluation.",
    message_template_ar: "تنبيه مدرب: تسليم المتدرب {participant_name} للمهمة '{title}' بانتظار التقييم ورصد الدرجة.",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 2,
    frequency_hours: 48,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "rule_risk_due",
    name: "At-Risk Follow-Up Action Due",
    name_ar: "تنبيه للمشرف: اقتراب موعد إجراء المتابعة والدعم للطلاب المتعثرين",
    reminder_type: "at_risk_follow_up_due",
    trigger_condition: "hours_before_followup_deadline",
    time_offset_hours: -24,
    recipient_role: "follow_up_owner",
    delivery_channel: "in_app",
    message_template: "Support Case Alert: Follow-up action for {participant_name} is due tomorrow ({deadline}).",
    message_template_ar: "تنبيه متابعة: موعد جلسة الدعم للمتدرب {participant_name} يحل غداً ({deadline}).",
    enabled: true,
    track_id: "all",
    max_reminders_per_event: 1,
    frequency_hours: 24,
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
];

export const INITIAL_REMINDER_LOGS: ReminderExecutionLog[] = [
  {
    id: "log_rem_01",
    rule_id: "rule_asg_72h",
    rule_name: "Assignment Deadline Approaching (72h)",
    event_id: "asg_web_01",
    event_type: "assignment",
    recipient_id: "part_karim_01",
    recipient_role: "participant",
    delivery_channel: "in_app",
    status: "delivered",
    scheduled_at: "2026-02-17T23:59:00Z",
    processed_at: "2026-02-17T23:59:05Z",
    retry_count: 0,
    idempotency_key: "rule_asg_72h:asg_web_01:part_karim_01:2026-02-17",
  },
  {
    id: "log_rem_02",
    rule_id: "rule_asg_24h",
    rule_name: "Assignment Deadline Approaching (24h)",
    event_id: "asg_web_01",
    event_type: "assignment",
    recipient_id: "part_karim_01",
    recipient_role: "participant",
    delivery_channel: "in_app",
    status: "suppressed_completed",
    scheduled_at: "2026-02-19T23:59:00Z",
    processed_at: "2026-02-19T23:59:05Z",
    retry_count: 0,
    idempotency_key: "rule_asg_24h:asg_web_01:part_karim_01:2026-02-19",
  },
];

export const INITIAL_TRACK_NOTIFICATIONS: TrackNotificationItem[] = [
  {
    id: "notif_trk_01",
    recipient_id: "part_youssef_05",
    recipient_email: "youssef.i@nctu.edu.eg",
    title: "Revision Feedback Published",
    title_ar: "تم نشر ملاحظات وتوجيهات المراجعة",
    message: "Eng. Ahmed Tarek reviewed your submission for 'Project 1' and requested minor mobile layout revisions.",
    message_ar: "قام المهندس أحمد طارق بمراجعة تسليمك للمشروع الأول وطلب تعديلات بسيطة على تجاوب الموبايل.",
    category: "feedback",
    related_track_id: "track_web_2026",
    related_entity_type: "assignment",
    related_entity_id: "asg_web_01",
    link: "/education?tab=assignments&asg=asg_web_01",
    is_read: false,
    created_at: "2026-02-22T16:00:00Z",
  },
  {
    id: "notif_trk_02",
    recipient_id: "lead_web_ahmed",
    recipient_email: "web.lead@gdgnctu.com",
    title: "New Resubmission Received",
    title_ar: "تم استلام محاولة إعادة تسليم جديدة",
    message: "Youssef Ibrahim submitted Attempt #2 for 'Project 1: Responsive Developer Portfolio'.",
    message_ar: "قام يوسف إبراهيم بتقديم المحاولة رقم 2 للمشروع الأول بانتظار اعتماد التقييم.",
    category: "assignments",
    related_track_id: "track_web_2026",
    related_entity_type: "submission",
    related_entity_id: "sub_web_01_youssef",
    link: "/education?tab=assignments&asg=asg_web_01",
    is_read: false,
    created_at: "2026-03-02T18:05:00Z",
  },
];

export const INITIAL_RISK_RULES: RiskRule[] = [
  {
    id: "risk_rule_att_75",
    name: "Low Attendance Rate (< 75%)",
    name_ar: "انخفاض نسبة الحضور التراكمي عن 75%",
    description: "Triggers when participant attendance rate falls below the 75% certificate threshold.",
    description_ar: "يتم التفعيل عندما تنخفض نسبة حضور المتدرب عن 75%، وهي الحد الأدنى لاستحقاق الشهادة.",
    trigger_type: "attendance_threshold",
    threshold_value: 75,
    severity: "needs_follow_up",
    track_id: "all",
    enabled: true,
    recommended_action: "Schedule academic check-in to review attendance recovery options.",
    recommended_action_ar: "التواصل الودي مع المتدرب لبحث أسباب الغياب وتقديم جلسة تعويضية.",
    version: "1.0",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "risk_rule_consec_abs",
    name: "Two Consecutive Unexcused Absences",
    name_ar: "غياب غير مبرر لجلستين متتاليتين",
    description: "Flagged when a participant misses 2 consecutive sessions without an approved excuse.",
    description_ar: "يتم التفعيل عند تسجيل غياب جلستين متتاليتين دون تقديم عذر رسمي معتمد.",
    trigger_type: "consecutive_absences",
    threshold_value: 2,
    severity: "urgent_support",
    track_id: "all",
    enabled: true,
    recommended_action: "Direct phone contact or urgent mentor meeting to resolve blockers.",
    recommended_action_ar: "إجراء اتصال مباشر وتحديد موعد مع الموجه الأكاديمي لحل المعوقات.",
    version: "1.0",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "risk_rule_miss_asg",
    name: "Two or More Missing Assignments",
    name_ar: "تراكم مهمتين أو أكثر دون تسليم",
    description: "Participant has 2 or more active assignments past deadline with no valid submission.",
    description_ar: "وجود مهمتين تطبيقيتين أو أكثر تجاوزتا الموعد النهائي دون تسليم.",
    trigger_type: "missing_assignments",
    threshold_value: 2,
    severity: "needs_follow_up",
    track_id: "all",
    enabled: true,
    recommended_action: "Offer assignment extension and technical clarification session.",
    recommended_action_ar: "منح مهلة إضافية وتوضيح متطلبات المهام عبر جلسة توجيه فردية.",
    version: "1.0",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "risk_rule_asg_pct_60",
    name: "Low Assignment Completion Rate (< 60%)",
    name_ar: "انخفاض معدل إنجاز المهام عن 60%",
    description: "Participant completed less than 60% of assigned track deliverables.",
    description_ar: "إنجاز أقل من 60% من إجمالي المهام والمخرجات المطلوبة في المسار.",
    trigger_type: "assignment_completion_threshold",
    threshold_value: 60,
    severity: "monitor",
    track_id: "all",
    enabled: true,
    recommended_action: "Monitor progress and recommend peer study group.",
    recommended_action_ar: "متابعة التقدم الأسبوعي واقتراح الانضمام لمجموعة دراسية للمسار.",
    version: "1.0",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
  {
    id: "risk_rule_resub_overdue",
    name: "Resubmission Deadline Overdue",
    name_ar: "انقضاء مهلة إعادة التسليم والتعديل",
    description: "A requested revision deadline has passed without a resubmitted attempt.",
    description_ar: "انقضاء المهلة المحددة لتعديل المهمة دون استلام المحاولة المعدلة.",
    trigger_type: "pending_resubmission_overdue",
    threshold_value: 0,
    severity: "urgent_support",
    track_id: "all",
    enabled: true,
    recommended_action: "Mentor to check in on technical blocker preventing resubmission.",
    recommended_action_ar: "تواصل الموجه للتعرف على العقبة التقنية التي حالت دون إعادة التسليم.",
    version: "1.0",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
  },
];

export const INITIAL_RISK_CASES: RiskFollowUpCase[] = [
  {
    id: "case_youssef_web_01",
    participant_id: "part_youssef_05",
    participant_name: "Youssef Ibrahim",
    participant_email: "youssef.i@nctu.edu.eg",
    track_id: "track_web_2026",
    track_name: "Web Development (Frontend & Next.js)",
    cohort: "Season 2026 - Cohort 1",
    risk_level: "needs_follow_up",
    triggering_indicators: [
      {
        rule_id: "risk_rule_att_75",
        rule_name: "Low Attendance Rate (< 75%)",
        evidence: "Current attendance is 67% (2 present out of 3 eligible completed sessions, 1 unexcused absence on Session 2)",
        evidence_ar: "نسبة الحضور الحالية 67% (حضور جلستين من أصل 3 جلسات، مع غياب غير مبرر في الجلسة الثانية)",
        date: "2026-02-10",
      },
    ],
    date_identified: "2026-02-23T10:00:00Z",
    assigned_owner_id: "mentor_ta_nour",
    assigned_owner_name: "Eng. Nour (Mentor)",
    recommended_action: "Conduct 1-on-1 tutoring on responsive CSS and review upcoming React assignments before deadline.",
    follow_up_deadline: "2026-03-25",
    status: "support_plan_active",
    next_action: "Follow up after Project 2 submission to confirm progress.",
    created_at: "2026-02-23T10:00:00Z",
    updated_at: "2026-03-03T11:00:00Z",
  },
];

export const INITIAL_CASE_ACTIONS: CaseActionLog[] = [
  {
    id: "action_case_01_1",
    case_id: "case_youssef_web_01",
    actor_id: "mentor_ta_nour",
    actor_name: "Eng. Nour (Mentor)",
    action_type: "supportive_reminder",
    notes: "Sent supportive message via portal offering technical office hours for responsive CSS.",
    timestamp: "2026-02-23T12:00:00Z",
  },
  {
    id: "action_case_01_2",
    case_id: "case_youssef_web_01",
    actor_id: "mentor_ta_nour",
    actor_name: "Eng. Nour (Mentor)",
    action_type: "office_hours",
    notes: "Conducted 45-min Zoom mentoring session to explain flexbox media queries and DevTools mobile emulator.",
    timestamp: "2026-02-27T16:30:00Z",
  },
];

// ============================================================
// Tracks Service Implementation & Calculation Engine
// ============================================================

export const tracksService = {
  // ── Tracks CRUD ──────────────────────────────────────────
  getTracks(): TechnicalTrack[] {
    return getStorage<TechnicalTrack>("tracks", INITIAL_TRACKS);
  },

  getTrackById(id: string): TechnicalTrack | null {
    return this.getTracks().find((t) => t.id === id) || null;
  },

  createTrack(data: Omit<TechnicalTrack, "id" | "created_at" | "updated_at">): TechnicalTrack {
    const list = this.getTracks();
    const newTrack: TechnicalTrack = {
      ...data,
      id: `track_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorage("tracks", [newTrack, ...list]);
    return newTrack;
  },

  updateTrack(id: string, updates: Partial<TechnicalTrack>): TechnicalTrack | null {
    const list = this.getTracks();
    let updated: TechnicalTrack | null = null;
    const next = list.map((t) => {
      if (t.id === id) {
        updated = { ...t, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return t;
    });
    setStorage("tracks", next);
    return updated;
  },

  archiveTrack(id: string): boolean {
    return !!this.updateTrack(id, { status: "archived" });
  },

  // ── Participants CRUD ────────────────────────────────────
  getParticipants(): Participant[] {
    return getStorage<Participant>("participants", INITIAL_PARTICIPANTS);
  },

  getParticipantById(id: string): Participant | null {
    return this.getParticipants().find((p) => p.id === id) || null;
  },

  createParticipant(data: Omit<Participant, "id" | "created_at" | "updated_at">): Participant {
    const list = this.getParticipants();
    const newPart: Participant = {
      ...data,
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorage("participants", [newPart, ...list]);
    return newPart;
  },

  updateParticipant(id: string, updates: Partial<Participant>): Participant | null {
    const list = this.getParticipants();
    let updated: Participant | null = null;
    const next = list.map((p) => {
      if (p.id === id) {
        updated = { ...p, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return p;
    });
    setStorage("participants", next);
    return updated;
  },

  // ── Enrollments CRUD ─────────────────────────────────────
  getEnrollments(): TrackEnrollment[] {
    const enrollments = getStorage<TrackEnrollment>("enrollments", INITIAL_ENROLLMENTS);
    const participants = this.getParticipants();
    const tracks = this.getTracks();

    return enrollments.map((e) => ({
      ...e,
      participant: participants.find((p) => p.id === e.participant_id),
      track: tracks.find((t) => t.id === e.track_id),
    }));
  },

  getEnrollmentsByTrack(trackId: string): TrackEnrollment[] {
    return this.getEnrollments().filter((e) => e.track_id === trackId);
  },

  getEnrollmentsByParticipant(participantId: string): TrackEnrollment[] {
    return this.getEnrollments().filter((e) => e.participant_id === participantId);
  },

  createEnrollment(
    participantId: string,
    trackId: string,
    cohort: string
  ): { success: boolean; enrollment?: TrackEnrollment; error?: string } {
    const list = this.getEnrollments();
    // Prevent duplicate enrollment for same track & cohort
    const exists = list.find(
      (e) => e.participant_id === participantId && e.track_id === trackId && e.cohort === cohort
    );
    if (exists) {
      return {
        success: false,
        error: "المشارك مسجل بالفعل في هذا المسار لنفس الدفعة (Duplicate Enrollment prevented).",
      };
    }

    const newEnr: TrackEnrollment = {
      id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      participant_id: participantId,
      track_id: trackId,
      cohort,
      enrollment_date: new Date().toISOString().split("T")[0],
      status: "active",
      current_progress: 0,
      final_result: 0,
      completion_status: "in_progress",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setStorage("enrollments", [newEnr, ...list]);
    return { success: true, enrollment: newEnr };
  },

  updateEnrollmentStatus(
    id: string,
    status: TrackEnrollment["status"],
    notes?: string
  ): boolean {
    const list = this.getEnrollments();
    const next = list.map((e) =>
      e.id === id
        ? {
            ...e,
            status,
            notes: notes || e.notes,
            ...(status === "withdrawn" ? { withdrawal_date: new Date().toISOString().split("T")[0] } : {}),
            updated_at: new Date().toISOString(),
          }
        : e
    );
    setStorage("enrollments", next);
    return true;
  },

  // ── Sessions & Attendance CRUD ───────────────────────────
  getSessions(): TrackSession[] {
    return getStorage<TrackSession>("sessions", INITIAL_SESSIONS);
  },

  getSessionsByTrack(trackId: string): TrackSession[] {
    return this.getSessions()
      .filter((s) => s.track_id === trackId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  createSession(data: Omit<TrackSession, "id" | "created_at" | "updated_at">): TrackSession {
    const list = this.getSessions();
    const newSession: TrackSession = {
      ...data,
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorage("sessions", [newSession, ...list]);
    return newSession;
  },

  updateSession(id: string, updates: Partial<TrackSession>): TrackSession | null {
    const list = this.getSessions();
    let updated: TrackSession | null = null;
    const next = list.map((s) => {
      if (s.id === id) {
        updated = { ...s, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return s;
    });
    setStorage("sessions", next);
    return updated;
  },

  getAttendanceRecords(): TrackAttendanceRecord[] {
    return getStorage<TrackAttendanceRecord>("attendance", INITIAL_ATTENDANCE);
  },

  getAttendanceBySession(sessionId: string): TrackAttendanceRecord[] {
    return this.getAttendanceRecords().filter((a) => a.session_id === sessionId);
  },

  recordAttendance(
    sessionId: string,
    trackId: string,
    participantId: string,
    enrollmentId: string,
    status: TrackAttendanceRecord["status"],
    recordedBy: string,
    recorderName: string,
    notes?: string,
    excuseReason?: string
  ): TrackAttendanceRecord {
    const list = this.getAttendanceRecords();
    const existingIndex = list.findIndex(
      (a) => a.session_id === sessionId && a.participant_id === participantId
    );

    if (existingIndex >= 0) {
      const updated: TrackAttendanceRecord = {
        ...list[existingIndex],
        status,
        notes: notes ?? list[existingIndex].notes,
        excuse_reason: excuseReason ?? list[existingIndex].excuse_reason,
        recorded_by: recordedBy,
        recorder_name: recorderName,
        updated_at: new Date().toISOString(),
      };
      list[existingIndex] = updated;
      setStorage("attendance", list);
      return updated;
    }

    const newRecord: TrackAttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: sessionId,
      track_id: trackId,
      enrollment_id: enrollmentId,
      participant_id: participantId,
      status,
      recorded_by: recordedBy,
      recorder_name: recorderName,
      notes,
      excuse_reason: excuseReason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorage("attendance", [newRecord, ...list]);
    return newRecord;
  },

  bulkRecordAttendance(
    sessionId: string,
    trackId: string,
    records: Array<{
      participantId: string;
      enrollmentId: string;
      status: TrackAttendanceRecord["status"];
      notes?: string;
    }>,
    recordedBy: string,
    recorderName: string
  ): void {
    records.forEach((r) => {
      this.recordAttendance(
        sessionId,
        trackId,
        r.participantId,
        r.enrollmentId,
        r.status,
        recordedBy,
        recorderName,
        r.notes
      );
    });
  },

  // ── Assignments & Submissions CRUD ───────────────────────
  getAssignments(): TrackAssignment[] {
    return getStorage<TrackAssignment>("assignments", INITIAL_ASSIGNMENTS);
  },

  getAssignmentsByTrack(trackId: string): TrackAssignment[] {
    return this.getAssignments()
      .filter((a) => a.track_id === trackId)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  },

  createAssignment(data: Omit<TrackAssignment, "id" | "created_at" | "updated_at">): TrackAssignment {
    const list = this.getAssignments();
    const newAsg: TrackAssignment = {
      ...data,
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorage("assignments", [newAsg, ...list]);
    return newAsg;
  },

  updateAssignment(id: string, updates: Partial<TrackAssignment>): TrackAssignment | null {
    const list = this.getAssignments();
    let updated: TrackAssignment | null = null;
    const next = list.map((a) => {
      if (a.id === id) {
        updated = { ...a, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return a;
    });
    setStorage("assignments", next);
    return updated;
  },

  getSubmissions(): TrackSubmission[] {
    return getStorage<TrackSubmission>("submissions", INITIAL_SUBMISSIONS);
  },

  getSubmissionsByAssignment(assignmentId: string): TrackSubmission[] {
    return this.getSubmissions().filter((s) => s.assignment_id === assignmentId);
  },

  submitAssignment(
    assignmentId: string,
    enrollmentId: string,
    participantId: string,
    submissionUrl: string,
    note?: string
  ): TrackSubmission {
    const list = this.getSubmissions();
    const assignment = this.getAssignments().find((a) => a.id === assignmentId);
    const now = new Date();
    const isLate = assignment ? now.getTime() > new Date(assignment.deadline).getTime() : false;

    const existingIndex = list.findIndex(
      (s) => s.assignment_id === assignmentId && s.participant_id === participantId
    );

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const history = existing.revision_history || [];
      history.push({
        date: existing.submitted_at,
        url: existing.submission_url,
        note: "Previous submission before revision",
      });

      const updated: TrackSubmission = {
        ...existing,
        submission_url: submissionUrl,
        submitted_at: now.toISOString(),
        status: isLate ? "submitted_late" : "resubmitted",
        revision_history: history,
        updated_at: now.toISOString(),
      };
      list[existingIndex] = updated;
      setStorage("submissions", list);
      return updated;
    }

    const newSub: TrackSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignment_id: assignmentId,
      enrollment_id: enrollmentId,
      participant_id: participantId,
      submission_url: submissionUrl,
      submitted_at: now.toISOString(),
      status: isLate ? "submitted_late" : "submitted",
      score: null,
      revision_history: note ? [{ date: now.toISOString(), url: submissionUrl, note }] : [],
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    setStorage("submissions", [newSub, ...list]);
    return newSub;
  },

  gradeSubmission(
    submissionId: string,
    score: number,
    feedback: string,
    reviewerName: string
  ): boolean {
    const list = this.getSubmissions();
    const next = list.map((s) =>
      s.id === submissionId
        ? {
            ...s,
            score: Math.min(100, Math.max(0, score)),
            reviewer_feedback: feedback,
            reviewed_by: reviewerName,
            reviewed_at: new Date().toISOString(),
            status: "graded" as const,
            updated_at: new Date().toISOString(),
          }
        : s
    );
    setStorage("submissions", next);
    return true;
  },

  grantDeadlineExtension(
    submissionId: string,
    newDeadline: string,
    extendedBy: string,
    reason: string
  ): boolean {
    const list = this.getSubmissions();
    const next = list.map((s) =>
      s.id === submissionId
        ? {
            ...s,
            deadline_extension_date: newDeadline,
            extended_by: extendedBy,
            extension_reason: reason,
            updated_at: new Date().toISOString(),
          }
        : s
    );
    setStorage("submissions", next);
    return true;
  },

  // ── Track Bonus Module CRUD (Separate from HR Points) ────
  getBonusRecords(): TrackBonus[] {
    return getStorage<TrackBonus>("bonuses", INITIAL_BONUS);
  },

  getBonusByTrack(trackId: string): TrackBonus[] {
    return this.getBonusRecords().filter((b) => b.track_id === trackId);
  },

  createBonusRecommendation(
    enrollmentId: string,
    trackId: string,
    participantId: string,
    amount: number,
    category: TrackBonus["category"],
    description: string,
    recordedBy: string,
    evidenceUrl?: string
  ): TrackBonus {
    const list = this.getBonusRecords();
    const newBonus: TrackBonus = {
      id: `bon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      enrollment_id: enrollmentId,
      track_id: trackId,
      participant_id: participantId,
      amount: Math.min(15, Math.max(1, amount)),
      category,
      description,
      evidence_url: sanitizeUrl(evidenceUrl),
      recorded_by: recordedBy,
      approval_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorage("bonuses", [newBonus, ...list]);
    return newBonus;
  },

  reviewBonus(
    bonusId: string,
    decision: "approved" | "rejected",
    reviewerName: string,
    reason?: string
  ): boolean {
    const list = this.getBonusRecords();
    const next = list.map((b) =>
      b.id === bonusId
        ? {
            ...b,
            approval_status: decision,
            approved_by: reviewerName,
            approved_at: new Date().toISOString(),
            ...(decision === "approved"
              ? { approval_reason: reason || "Approved by track supervisor" }
              : { rejection_reason: reason || "Rejected by track supervisor" }),
            updated_at: new Date().toISOString(),
          }
        : b
    );
    setStorage("bonuses", next);
    return true;
  },

  // ── Evaluations & Certificates CRUD ──────────────────────
  getEvaluations(): TrackEvaluation[] {
    return getStorage<TrackEvaluation>("evaluations", INITIAL_EVALUATIONS);
  },

  saveEvaluation(data: Omit<TrackEvaluation, "id" | "created_at" | "updated_at">): TrackEvaluation {
    const list = this.getEvaluations();
    const existingIndex = list.findIndex(
      (e) => e.track_id === data.track_id && e.participant_id === data.participant_id
    );

    if (existingIndex >= 0) {
      const updated: TrackEvaluation = {
        ...list[existingIndex],
        ...data,
        updated_at: new Date().toISOString(),
      };
      list[existingIndex] = updated;
      setStorage("evaluations", list);
      return updated;
    }

    const newEval: TrackEvaluation = {
      ...data,
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorage("evaluations", [newEval, ...list]);
    return newEval;
  },

  getCertificates(): TrackCertificate[] {
    return getStorage<TrackCertificate>("certificates", INITIAL_CERTIFICATES);
  },

  issueCertificate(
    enrollmentId: string,
    participantId: string,
    trackId: string,
    cohort: string,
    officialScore: number,
    issuedBy: string
  ): TrackCertificate {
    const list = this.getCertificates();
    const track = this.getTrackById(trackId);
    const trackCode = track ? track.category.toUpperCase() : "TECH";
    const certNumber = String(list.length + 1).padStart(3, "0");
    const code = `GDG-NCTU-2026-${trackCode}-${certNumber}`;

    const newCert: TrackCertificate = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      enrollment_id: enrollmentId,
      participant_id: participantId,
      track_id: trackId,
      cohort,
      certificate_code: code,
      issue_date: new Date().toISOString().split("T")[0],
      status: "issued",
      official_score: officialScore,
      issued_by: issuedBy,
      verification_url: `https://gdg-nctu.org/verify/${code}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setStorage("certificates", [newCert, ...list]);
    return newCert;
  },

  // ── Follow-Up / At-Risk Module CRUD ──────────────────────
  getFollowUps(): TrackFollowUp[] {
    return getStorage<TrackFollowUp>("followups", INITIAL_FOLLOW_UPS);
  },

  createFollowUp(data: Omit<TrackFollowUp, "id" | "created_at" | "updated_at">): TrackFollowUp {
    const list = this.getFollowUps();
    const newFollowUp: TrackFollowUp = {
      ...data,
      id: `follow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStorage("followups", [newFollowUp, ...list]);
    return newFollowUp;
  },

  updateFollowUpStatus(id: string, status: TrackFollowUp["status"], outcome?: string): boolean {
    const list = this.getFollowUps();
    const next = list.map((f) =>
      f.id === id
        ? {
            ...f,
            status,
            outcome: outcome || f.outcome,
            updated_at: new Date().toISOString(),
          }
        : f
    );
    setStorage("followups", next);
    return true;
  },

  // ============================================================
  // Official Mathematical Evaluation Engine (GDG NCTU Policy)
  // ============================================================

  calculateParticipantMetrics(participantId: string, trackId: string) {
    const track = this.getTrackById(trackId) || INITIAL_TRACKS[0];
    const sessions = this.getSessionsByTrack(trackId);
    const attendanceRecords = this.getAttendanceRecords().filter(
      (a) => a.track_id === trackId && a.participant_id === participantId
    );
    const assignments = this.getAssignmentsByTrack(trackId);
    const submissions = this.getSubmissions().filter((s) => s.participant_id === participantId);
    const approvedBonuses = this.getBonusRecords().filter(
      (b) => b.track_id === trackId && b.participant_id === participantId && b.approval_status === "approved"
    );

    // 1. Attendance Metrics (Only completed/logged sessions count; excludes cancelled and future scheduled sessions!)
    const eligibleSessions = sessions.filter(
      (s) =>
        s.status !== "cancelled" &&
        (s.status === "completed" ||
          s.status === "in_progress" ||
          attendanceRecords.some((a) => a.session_id === s.id && a.status !== "pending"))
    );
    const presentCount = attendanceRecords.filter((a) => a.status === "present").length;
    const lateCount = attendanceRecords.filter((a) => a.status === "late").length;
    const excusedCount = attendanceRecords.filter((a) => a.status === "excused").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "absent").length;

    // Documented Attendance Formula:
    // Present counts 100%, Late counts 75%
    // Denominator = eligibleSessions - excusedCount (excused sessions are not penalized)
    const effectiveDenominator = Math.max(1, eligibleSessions.length - excusedCount);
    const effectivePresent = presentCount + lateCount * 0.75;
    const attendanceRate =
      eligibleSessions.length === 0 ? 1 : Math.min(1, effectivePresent / effectiveDenominator);
    const attendancePercentage = Math.round(attendanceRate * 100);

    // Official Attendance Contribution (Max 40 points)
    const attendanceScore = Math.round(attendanceRate * (track.attendance_weight || 40) * 10) / 10;

    // 2. Assignment Metrics
    let totalMaxScore = 0;
    let totalEarnedScore = 0;
    let completedAssignmentsCount = 0;

    assignments.forEach((asg) => {
      const sub = submissions.find((s) => s.assignment_id === asg.id);
      totalMaxScore += asg.max_score;
      if (sub && sub.score !== null) {
        totalEarnedScore += sub.score;
        completedAssignmentsCount++;
      }
    });

    const assignmentAveragePct = totalMaxScore > 0 ? (totalEarnedScore / totalMaxScore) : 0;
    const assignmentCompletionRate = assignments.length > 0 ? (completedAssignmentsCount / assignments.length) : 0;

    // Official Assignment Contribution (Max 30 points)
    const assignmentScore = Math.round(assignmentAveragePct * (track.assignment_weight || 30) * 10) / 10;

    // 3. Bonus Points (Strictly tracked separately from core-team HR points)
    const totalBonus = approvedBonuses.reduce((sum, b) => sum + b.amount, 0);

    // 4. Default Participation & Conduct (from saved evaluation or standard base)
    const savedEval = this.getEvaluations().find(
      (e) => e.track_id === trackId && e.participant_id === participantId
    );
    const participationScore = savedEval ? savedEval.participation_score : 18;
    const conductScore = savedEval ? savedEval.conduct_score : 10;

    // 5. Total Official Score out of 100
    const rawTotal = Math.round((attendanceScore + assignmentScore + participationScore + conductScore) * 10) / 10;
    const finalOfficialScore = Math.min(100, rawTotal);

    // 6. Certificate Eligibility: Score >= 75% AND Attendance >= 75%
    const isEligibleForCertificate =
      finalOfficialScore >= (track.certificate_min_score || 75) &&
      attendancePercentage >= (track.attendance_requirements || 75);

    // 7. At-Risk Detection
    const isAtRisk = attendancePercentage < 75 || absentCount >= 2 || (assignments.length > 0 && completedAssignmentsCount < assignments.length / 2);

    return {
      eligibleSessionsCount: eligibleSessions.length,
      presentCount,
      lateCount,
      excusedCount,
      absentCount,
      attendanceRate,
      attendancePercentage,
      attendanceScore,
      totalAssignmentsCount: assignments.length,
      completedAssignmentsCount,
      assignmentAveragePct: Math.round(assignmentAveragePct * 100),
      assignmentCompletionRate: Math.round(assignmentCompletionRate * 100),
      assignmentScore,
      totalBonus,
      participationScore,
      conductScore,
      rawTotal,
      finalOfficialScore,
      isEligibleForCertificate,
      isAtRisk,
      track,
    };
  },

  // ── Export Utilities (CSV) ───────────────────────────────
  exportRosterToCSV(trackId: string): string {
    const track = this.getTrackById(trackId);
    const enrollments = this.getEnrollmentsByTrack(trackId);
    const rows = [
      ["Participant ID", "Full Name", "Email", "Phone", "University", "Status", "Progress %", "Score", "Certified"],
    ];

    enrollments.forEach((e) => {
      const p = e.participant;
      const metrics = this.calculateParticipantMetrics(e.participant_id, trackId);
      rows.push([
        e.participant_id,
        p?.full_name || "",
        p?.email || "",
        p?.phone || "",
        p?.university || "",
        e.status,
        `${metrics.assignmentCompletionRate}%`,
        `${metrics.finalOfficialScore}`,
        metrics.isEligibleForCertificate ? "Yes" : "No",
      ]);
    });

    return rows.map((r) => r.map((cell) => `"${sanitizeCSVCell(cell)}"`).join(",")).join("\n");
  },

  exportAttendanceToCSV(trackId: string): string {
    const sessions = this.getSessionsByTrack(trackId);
    const enrollments = this.getEnrollmentsByTrack(trackId);
    const records = this.getAttendanceRecords().filter((a) => a.track_id === trackId);

    const header = ["Participant Name", "Email", ...sessions.map((s) => `${s.title} (${s.date})`), "Attendance %"];
    const rows = [header];

    enrollments.forEach((e) => {
      const p = e.participant;
      const metrics = this.calculateParticipantMetrics(e.participant_id, trackId);
      const sessionStatuses = sessions.map((s) => {
        const rec = records.find((r) => r.session_id === s.id && r.participant_id === e.participant_id);
        return rec ? rec.status : "pending";
      });
      rows.push([p?.full_name || "", p?.email || "", ...sessionStatuses, `${metrics.attendancePercentage}%`]);
    });

    return rows.map((r) => r.map((cell) => `"${sanitizeCSVCell(cell)}"`).join(",")).join("\n");
  },

  exportGradesToCSV(trackId: string): string {
    const assignments = this.getAssignmentsByTrack(trackId);
    const enrollments = this.getEnrollmentsByTrack(trackId);
    const submissions = this.getSubmissions();

    const header = ["Participant Name", "Email", ...assignments.map((a) => `${a.title} (Max ${a.max_score})`), "Official Score (100)", "Certificate"];
    const rows = [header];

    enrollments.forEach((e) => {
      const p = e.participant;
      const metrics = this.calculateParticipantMetrics(e.participant_id, trackId);
      const asgScores = assignments.map((a) => {
        const sub = submissions.find((s) => s.assignment_id === a.id && s.participant_id === e.participant_id);
        return sub?.score !== null && sub?.score !== undefined ? String(sub.score) : "Pending";
      });
      rows.push([
        p?.full_name || "",
        p?.email || "",
        ...asgScores,
        `${metrics.finalOfficialScore}`,
        metrics.isEligibleForCertificate ? "Yes" : "No",
      ]);
    });

    return rows.map((r) => r.map((cell) => `"${sanitizeCSVCell(cell)}"`).join(",")).join("\n");
  },

  // ════════════════════════════════════════════════════════════
  // FEATURE 1: SMART REMINDERS & NOTIFICATION ENGINE
  // ════════════════════════════════════════════════════════════

  getReminderRules(): ReminderRule[] {
    return getStorage<ReminderRule>("reminder_rules", INITIAL_REMINDER_RULES);
  },

  getReminderRuleById(id: string): ReminderRule | null {
    return this.getReminderRules().find((r) => r.id === id) || null;
  },

  saveReminderRule(
    rule: Omit<ReminderRule, "id" | "created_at" | "updated_at"> & { id?: string }
  ): ReminderRule {
    const list = this.getReminderRules();
    const now = new Date().toISOString();
    if (rule.id) {
      const existingIdx = list.findIndex((r) => r.id === rule.id);
      if (existingIdx >= 0) {
        const updated: ReminderRule = {
          ...list[existingIdx],
          ...rule,
          updated_at: now,
        };
        list[existingIdx] = updated;
        setStorage("reminder_rules", list);
        return updated;
      }
    }

    const newRule: ReminderRule = {
      ...rule,
      id: rule.id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: now,
      updated_at: now,
    };
    setStorage("reminder_rules", [newRule, ...list]);
    return newRule;
  },

  toggleReminderRule(ruleId: string, enabled?: boolean): ReminderRule | null {
    const list = this.getReminderRules();
    let updated: ReminderRule | null = null;
    const next = list.map((r) => {
      if (r.id === ruleId) {
        updated = {
          ...r,
          enabled: typeof enabled === "boolean" ? enabled : !r.enabled,
          updated_at: new Date().toISOString(),
        };
        return updated;
      }
      return r;
    });
    setStorage("reminder_rules", next);
    return updated;
  },

  getReminderLogs(): ReminderExecutionLog[] {
    return getStorage<ReminderExecutionLog>("reminder_logs", INITIAL_REMINDER_LOGS);
  },

  getTrackNotifications(userId?: string): TrackNotificationItem[] {
    const notifs = getStorage<TrackNotificationItem>("track_notifications", INITIAL_TRACK_NOTIFICATIONS);
    if (!userId || userId === "all") return notifs;
    return notifs.filter(
      (n) => n.recipient_id === userId || (n.recipient_email && n.recipient_email.toLowerCase() === userId.toLowerCase())
    );
  },

  markTrackNotificationRead(id: string): boolean {
    const list = this.getTrackNotifications();
    const next = list.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setStorage("track_notifications", next);
    return true;
  },

  markAllTrackNotificationsRead(userId?: string): boolean {
    const list = this.getTrackNotifications();
    const next = list.map((n) => {
      if (!userId || n.recipient_id === userId || n.recipient_email?.toLowerCase() === userId?.toLowerCase()) {
        return { ...n, is_read: true };
      }
      return n;
    });
    setStorage("track_notifications", next);
    return true;
  },

  /**
   * Evaluates all active tracks, assignments, sessions, and at-risk cases against active rules.
   * Enforces idempotent execution, cancellation suppression when submitted/excused, and records logs.
   */
  evaluateAndGenerateReminders(nowOverride?: Date): {
    generatedCount: number;
    suppressedCount: number;
    logs: ReminderExecutionLog[];
  } {
    const now = nowOverride || new Date();
    const rules = this.getReminderRules().filter((r) => r.enabled);
    const assignments = this.getAssignments();
    const sessions = this.getSessions();
    const enrollments = this.getEnrollments();
    const submissions = this.getSubmissions();
    const attempts = this.getSubmissionAttempts();
    const followUps = this.getRiskFollowUpCases();
    const participants = this.getParticipants();

    const existingLogs = this.getReminderLogs();
    const existingNotifs = this.getTrackNotifications();
    const newLogs: ReminderExecutionLog[] = [];
    const newNotifs: TrackNotificationItem[] = [];

    let generatedCount = 0;
    let suppressedCount = 0;

    for (const rule of rules) {
      // 1. Upcoming Deadline Reminders (e.g. 72h, 24h, 3h before)
      if (rule.reminder_type === "upcoming_deadline") {
        const eligibleAssignments = assignments.filter(
          (a) => rule.track_id === "all" || a.track_id === rule.track_id
        );

        for (const asg of eligibleAssignments) {
          const deadlineTime = new Date(asg.deadline).getTime();
          const targetTriggerTime = deadlineTime + rule.time_offset_hours * 3600000;
          // Trigger if current time is within or past targetTriggerTime but before deadline
          if (now.getTime() >= targetTriggerTime && now.getTime() < deadlineTime) {
            const trackEnrs = enrollments.filter((e) => e.track_id === asg.track_id && e.status === "active");
            for (const enr of trackEnrs) {
              const idempotencyKey = `rem_${rule.id}_${asg.id}_${enr.participant_id}_${rule.time_offset_hours}`;
              if (existingLogs.some((l) => l.idempotency_key === idempotencyKey)) continue;

              const sub = submissions.find((s) => s.assignment_id === asg.id && s.participant_id === enr.participant_id);
              // Suppress if already completed/submitted!
              if (sub && (sub.status === "submitted" || sub.status === "graded" || sub.status === "accepted")) {
                const log: ReminderExecutionLog = {
                  id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  rule_id: rule.id,
                  rule_name: rule.name,
                  event_id: asg.id,
                  event_type: "assignment",
                  recipient_id: enr.participant_id,
                  recipient_role: "participant",
                  delivery_channel: rule.delivery_channel,
                  status: "suppressed_completed",
                  scheduled_at: new Date(targetTriggerTime).toISOString(),
                  processed_at: now.toISOString(),
                  retry_count: 0,
                  idempotency_key: idempotencyKey,
                };
                newLogs.push(log);
                suppressedCount++;
                continue;
              }

              // Deliver notification
              const part = participants.find((p) => p.id === enr.participant_id);
              const notif: TrackNotificationItem = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                recipient_id: enr.participant_id,
                recipient_email: part?.email,
                title: rule.name,
                title_ar: rule.name_ar,
                message: rule.message_template.replace("{title}", asg.title).replace("{deadline}", asg.deadline),
                message_ar: rule.message_template_ar.replace("{title}", asg.title),
                category: "assignments",
                related_track_id: asg.track_id,
                related_entity_type: "assignment",
                related_entity_id: asg.id,
                link: `/education?tab=assignments&asg=${asg.id}`,
                is_read: false,
                created_at: now.toISOString(),
              };
              newNotifs.push(notif);

              newLogs.push({
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                rule_id: rule.id,
                rule_name: rule.name,
                event_id: asg.id,
                event_type: "assignment",
                recipient_id: enr.participant_id,
                recipient_role: "participant",
                delivery_channel: rule.delivery_channel,
                status: "sent",
                scheduled_at: new Date(targetTriggerTime).toISOString(),
                processed_at: now.toISOString(),
                retry_count: 0,
                idempotency_key: idempotencyKey,
              });
              generatedCount++;
            }
          }
        }
      }

      // 2. Overdue Assignment Reminders
      else if (rule.reminder_type === "overdue_assignment") {
        const eligibleAssignments = assignments.filter(
          (a) => rule.track_id === "all" || a.track_id === rule.track_id
        );

        for (const asg of eligibleAssignments) {
          const deadlineTime = new Date(asg.deadline).getTime();
          if (now.getTime() > deadlineTime) {
            const trackEnrs = enrollments.filter((e) => e.track_id === asg.track_id && e.status === "active");
            for (const enr of trackEnrs) {
              const idempotencyKey = `rem_overdue_${asg.id}_${enr.participant_id}`;
              if (existingLogs.some((l) => l.idempotency_key === idempotencyKey)) continue;

              const sub = submissions.find((s) => s.assignment_id === asg.id && s.participant_id === enr.participant_id);
              if (sub && (sub.status === "submitted" || sub.status === "graded" || sub.status === "accepted")) {
                newLogs.push({
                  id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  rule_id: rule.id,
                  rule_name: rule.name,
                  event_id: asg.id,
                  event_type: "assignment",
                  recipient_id: enr.participant_id,
                  recipient_role: "participant",
                  delivery_channel: rule.delivery_channel,
                  status: "suppressed_completed",
                  scheduled_at: asg.deadline,
                  processed_at: now.toISOString(),
                  retry_count: 0,
                  idempotency_key: idempotencyKey,
                });
                suppressedCount++;
                continue;
              }

              const part = participants.find((p) => p.id === enr.participant_id);
              newNotifs.push({
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                recipient_id: enr.participant_id,
                recipient_email: part?.email,
                title: rule.name,
                title_ar: rule.name_ar,
                message: rule.message_template.replace("{title}", asg.title),
                message_ar: rule.message_template_ar.replace("{title}", asg.title),
                category: "assignments",
                related_track_id: asg.track_id,
                related_entity_type: "assignment",
                related_entity_id: asg.id,
                link: `/education?tab=assignments&asg=${asg.id}`,
                is_read: false,
                created_at: now.toISOString(),
              });

              newLogs.push({
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                rule_id: rule.id,
                rule_name: rule.name,
                event_id: asg.id,
                event_type: "assignment",
                recipient_id: enr.participant_id,
                recipient_role: "participant",
                delivery_channel: rule.delivery_channel,
                status: "sent",
                scheduled_at: asg.deadline,
                processed_at: now.toISOString(),
                retry_count: 0,
                idempotency_key: idempotencyKey,
              });
              generatedCount++;
            }
          }
        }
      }

      // 3. Upcoming Session Reminders (e.g. 24h before)
      else if (rule.reminder_type === "upcoming_session") {
        const eligibleSessions = sessions.filter(
          (s) => s.status === "scheduled" && (rule.track_id === "all" || s.track_id === rule.track_id)
        );

        for (const sess of eligibleSessions) {
          const sessionDateTime = new Date(`${sess.date}T${sess.start_time}:00`).getTime();
          const targetTriggerTime = sessionDateTime + rule.time_offset_hours * 3600000;
          if (now.getTime() >= targetTriggerTime && now.getTime() < sessionDateTime) {
            const trackEnrs = enrollments.filter((e) => e.track_id === sess.track_id && e.status === "active");
            for (const enr of trackEnrs) {
              const idempotencyKey = `rem_sess_${sess.id}_${enr.participant_id}`;
              if (existingLogs.some((l) => l.idempotency_key === idempotencyKey)) continue;

              const part = participants.find((p) => p.id === enr.participant_id);
              newNotifs.push({
                id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                recipient_id: enr.participant_id,
                recipient_email: part?.email,
                title: rule.name,
                title_ar: rule.name_ar,
                message: rule.message_template.replace("{title}", sess.title).replace("{time}", `${sess.date} ${sess.start_time}`),
                message_ar: rule.message_template_ar.replace("{title}", sess.title).replace("{time}", `${sess.date} ${sess.start_time}`),
                category: "sessions",
                related_track_id: sess.track_id,
                related_entity_type: "session",
                related_entity_id: sess.id,
                link: `/education?tab=sessions&sess=${sess.id}`,
                is_read: false,
                created_at: now.toISOString(),
              });

              newLogs.push({
                id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                rule_id: rule.id,
                rule_name: rule.name,
                event_id: sess.id,
                event_type: "session",
                recipient_id: enr.participant_id,
                recipient_role: "participant",
                delivery_channel: rule.delivery_channel,
                status: "sent",
                scheduled_at: new Date(targetTriggerTime).toISOString(),
                processed_at: now.toISOString(),
                retry_count: 0,
                idempotency_key: idempotencyKey,
              });
              generatedCount++;
            }
          }
        }
      }

      // 4. Resubmission Deadline Approaching
      else if (rule.reminder_type === "resubmission_deadline_approaching") {
        const pendingAttempts = attempts.filter((att) => att.status === "revision_requested" && att.resubmission_deadline);
        for (const att of pendingAttempts) {
          const resubDeadlineTime = new Date(att.resubmission_deadline!).getTime();
          const targetTriggerTime = resubDeadlineTime + rule.time_offset_hours * 3600000;
          if (now.getTime() >= targetTriggerTime && now.getTime() < resubDeadlineTime) {
            const idempotencyKey = `rem_resub_due_${att.id}`;
            if (existingLogs.some((l) => l.idempotency_key === idempotencyKey)) continue;

            const asg = assignments.find((a) => a.id === att.assignment_id);
            const part = participants.find((p) => p.id === att.participant_id);

            newNotifs.push({
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              recipient_id: att.participant_id,
              recipient_email: part?.email,
              title: rule.name,
              title_ar: rule.name_ar,
              message: rule.message_template.replace("{title}", asg?.title || "Assignment"),
              message_ar: rule.message_template_ar.replace("{title}", asg?.title || "Assignment"),
              category: "feedback",
              related_track_id: asg?.track_id,
              related_entity_type: "assignment",
              related_entity_id: att.assignment_id,
              link: `/education?tab=assignments&asg=${att.assignment_id}`,
              is_read: false,
              created_at: now.toISOString(),
            });

            newLogs.push({
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              rule_id: rule.id,
              rule_name: rule.name,
              event_id: att.id,
              event_type: "submission",
              recipient_id: att.participant_id,
              recipient_role: "participant",
              delivery_channel: rule.delivery_channel,
              status: "sent",
              scheduled_at: new Date(targetTriggerTime).toISOString(),
              processed_at: now.toISOString(),
              retry_count: 0,
              idempotency_key: idempotencyKey,
            });
            generatedCount++;
          }
        }
      }

      // 5. At-Risk Follow-Up Due
      else if (rule.reminder_type === "at_risk_follow_up_due") {
        const openCases = followUps.filter((c) => c.status !== "resolved" && c.status !== "closed");
        for (const c of openCases) {
          const deadlineTime = new Date(`${c.follow_up_deadline}T12:00:00Z`).getTime();
          const targetTriggerTime = deadlineTime + rule.time_offset_hours * 3600000;
          if (now.getTime() >= targetTriggerTime && now.getTime() <= deadlineTime + 86400000) {
            const idempotencyKey = `rem_risk_${c.id}_${c.assigned_owner_id}`;
            if (existingLogs.some((l) => l.idempotency_key === idempotencyKey)) continue;

            newNotifs.push({
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              recipient_id: c.assigned_owner_id,
              title: rule.name,
              title_ar: rule.name_ar,
              message: rule.message_template.replace("{participant_name}", c.participant_name).replace("{deadline}", c.follow_up_deadline),
              message_ar: rule.message_template_ar.replace("{participant_name}", c.participant_name).replace("{deadline}", c.follow_up_deadline),
              category: "follow_ups",
              related_track_id: c.track_id,
              related_entity_type: "follow_up",
              related_entity_id: c.id,
              link: `/education?tab=at_risk&case=${c.id}`,
              is_read: false,
              created_at: now.toISOString(),
            });

            newLogs.push({
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              rule_id: rule.id,
              rule_name: rule.name,
              event_id: c.id,
              event_type: "follow_up",
              recipient_id: c.assigned_owner_id,
              recipient_role: "follow_up_owner",
              delivery_channel: rule.delivery_channel,
              status: "sent",
              scheduled_at: new Date(targetTriggerTime).toISOString(),
              processed_at: now.toISOString(),
              retry_count: 0,
              idempotency_key: idempotencyKey,
            });
            generatedCount++;
          }
        }
      }
    }

    if (newNotifs.length > 0) {
      setStorage("track_notifications", [...newNotifs, ...existingNotifs]);
    }
    if (newLogs.length > 0) {
      setStorage("reminder_logs", [...newLogs, ...existingLogs]);
    }

    return {
      generatedCount,
      suppressedCount,
      logs: [...newLogs, ...existingLogs],
    };
  },

  // ════════════════════════════════════════════════════════════
  // FEATURE 2: FEEDBACK, RESUBMISSION & IMMUTABLE ATTEMPT HISTORY
  // ════════════════════════════════════════════════════════════

  getSubmissionAttempts(filter?: {
    assignmentId?: string;
    participantId?: string;
    submissionId?: string;
  }): TrackSubmissionAttempt[] {
    const attempts = getStorage<TrackSubmissionAttempt>(
      "submission_attempts",
      INITIAL_SUBMISSION_ATTEMPTS
    );
    return attempts.filter((att) => {
      if (filter?.assignmentId && att.assignment_id !== filter.assignmentId) return false;
      if (filter?.participantId && att.participant_id !== filter.participantId) return false;
      if (filter?.submissionId && att.submission_id !== filter.submissionId) return false;
      return true;
    });
  },

  getSubmissionAttemptById(id: string): TrackSubmissionAttempt | null {
    return this.getSubmissionAttempts().find((a) => a.id === id) || null;
  },

  /**
   * Submits a new attempt. Preserves all earlier attempts as immutable records.
   */
  recordSubmissionAttempt(params: {
    assignmentId: string;
    enrollmentId: string;
    participantId: string;
    submissionUrl: string;
    notes?: string;
  }): { attempt: TrackSubmissionAttempt; submission: TrackSubmission } {
    const now = new Date();
    const asg = this.getAssignments().find((a) => a.id === params.assignmentId);
    const existingAttempts = this.getSubmissionAttempts({
      assignmentId: params.assignmentId,
      participantId: params.participantId,
    }).sort((a, b) => a.attempt_number - b.attempt_number);

    const attemptNumber = existingAttempts.length + 1;
    const lastAttempt = existingAttempts[existingAttempts.length - 1];
    const applicableDeadline =
      attemptNumber > 1 && lastAttempt?.resubmission_deadline
        ? lastAttempt.resubmission_deadline
        : asg?.deadline || now.toISOString();
    const isLate = now.getTime() > new Date(applicableDeadline).getTime();

    // Check max attempts policy
    if (asg?.max_attempts && attemptNumber > asg.max_attempts) {
      throw new Error(`Maximum number of allowed attempts (${asg.max_attempts}) reached for this assignment.`);
    }

    const allSubmissions = this.getSubmissions();
    let sub = allSubmissions.find(
      (s) => s.assignment_id === params.assignmentId && s.participant_id === params.participantId
    );

    const submissionId = sub?.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newAttempt: TrackSubmissionAttempt = {
      id: `attm_${params.assignmentId}_${params.participantId}_${attemptNumber}`,
      submission_id: submissionId,
      assignment_id: params.assignmentId,
      enrollment_id: params.enrollmentId,
      participant_id: params.participantId,
      attempt_number: attemptNumber,
      submission_url: params.submissionUrl,
      submitted_at: now.toISOString(),
      applicable_deadline: applicableDeadline,
      is_late: isLate,
      late_penalty_applied: isLate ? 10 : 0,
      status: isLate ? "submitted_late" : attemptNumber === 1 ? "submitted" : "resubmitted",
      score: null,
      created_at: now.toISOString(),
    };

    const allAttempts = getStorage<TrackSubmissionAttempt>("submission_attempts", INITIAL_SUBMISSION_ATTEMPTS);
    setStorage("submission_attempts", [newAttempt, ...allAttempts]);

    // Update parent submission record
    const updatedSub: TrackSubmission = {
      id: submissionId,
      assignment_id: params.assignmentId,
      enrollment_id: params.enrollmentId,
      participant_id: params.participantId,
      submission_url: params.submissionUrl,
      submitted_at: now.toISOString(),
      status: isLate ? "submitted_late" : attemptNumber === 1 ? "submitted" : "resubmitted",
      score: sub?.score ?? null,
      current_attempt_number: attemptNumber,
      revision_history: [
        ...(sub?.revision_history || []),
        { date: now.toISOString(), url: params.submissionUrl, note: params.notes || `Attempt #${attemptNumber}` },
      ],
      created_at: sub?.created_at || now.toISOString(),
      updated_at: now.toISOString(),
    };

    const nextSubs = allSubmissions.some((s) => s.id === submissionId)
      ? allSubmissions.map((s) => (s.id === submissionId ? updatedSub : s))
      : [updatedSub, ...allSubmissions];

    setStorage("submissions", nextSubs);

    // Create In-App notification for instructor
    if (asg?.reviewer_id) {
      const part = this.getParticipants().find((p) => p.id === params.participantId);
      const existingNotifs = this.getTrackNotifications();
      const notif: TrackNotificationItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        recipient_id: asg.reviewer_id,
        title: attemptNumber === 1 ? "New Assignment Submission" : "New Resubmitted Attempt",
        title_ar: attemptNumber === 1 ? "تسليم جديد لمهمة تدريبية" : "إعادة تسليم محاولة جديدة",
        message: `${part?.full_name || "Participant"} submitted Attempt #${attemptNumber} for '${asg.title}'.`,
        message_ar: `قام المتدرب ${part?.full_name || "متدرب"} بتقديم المحاولة رقم ${attemptNumber} للمهمة '${asg.title}'.`,
        category: "assignments",
        related_track_id: asg.track_id,
        related_entity_type: "submission",
        related_entity_id: submissionId,
        link: `/education?tab=assignments&asg=${asg.id}`,
        is_read: false,
        created_at: now.toISOString(),
      };
      setStorage("track_notifications", [notif, ...existingNotifs]);
    }

    return { attempt: newAttempt, submission: updatedSub };
  },

  /**
   * Reviews an attempt, records structured feedback and either accepts or requests revision.
   * Calculates official final grade using configured assignment policy.
   */
  reviewSubmissionAttempt(params: {
    attemptId: string;
    score: number;
    feedback: StructuredFeedback;
    reviewerId: string;
    reviewerName: string;
    action: "accept" | "request_revision" | "reject";
    resubmissionDeadline?: string;
    resubmissionNotes?: string;
  }): { attempt: TrackSubmissionAttempt; submission: TrackSubmission } {
    const allAttempts = getStorage<TrackSubmissionAttempt>("submission_attempts", INITIAL_SUBMISSION_ATTEMPTS);
    const targetIdx = allAttempts.findIndex((a) => a.id === params.attemptId);
    if (targetIdx < 0) throw new Error("Attempt record not found.");

    const now = new Date().toISOString();
    const existingAttempt = allAttempts[targetIdx];

    const updatedAttempt: TrackSubmissionAttempt = {
      ...existingAttempt,
      score: Math.min(100, Math.max(0, params.score)),
      feedback: params.feedback,
      reviewer_id: params.reviewerId,
      reviewer_name: params.reviewerName,
      reviewed_at: now,
      status:
        params.action === "accept"
          ? "accepted"
          : params.action === "request_revision"
          ? "revision_requested"
          : "needs_revision",
      revision_requested_at: params.action === "request_revision" ? now : undefined,
      resubmission_deadline: params.resubmissionDeadline,
      resubmission_notes: params.resubmissionNotes,
    };

    allAttempts[targetIdx] = updatedAttempt;
    setStorage("submission_attempts", allAttempts);

    // Calculate official final score based on assignment's approved policy
    const officialCalc = this.calculateOfficialFinalScore(
      updatedAttempt.assignment_id,
      updatedAttempt.participant_id
    );

    // Update parent submission record
    const allSubmissions = this.getSubmissions();
    const subIdx = allSubmissions.findIndex((s) => s.id === updatedAttempt.submission_id);
    const existingSub = allSubmissions[subIdx];

    const updatedSub: TrackSubmission = {
      ...existingSub,
      score: officialCalc.finalScore,
      status: updatedAttempt.status,
      reviewer_feedback: params.feedback.what_went_well + " — " + params.feedback.needs_improvement,
      structured_feedback: params.feedback,
      reviewed_by: params.reviewerName,
      reviewed_at: now,
      updated_at: now,
    };

    if (subIdx >= 0) {
      allSubmissions[subIdx] = updatedSub;
      setStorage("submissions", allSubmissions);
    }

    // Notify participant of published feedback / revision request
    const asg = this.getAssignments().find((a) => a.id === updatedAttempt.assignment_id);
    const existingNotifs = this.getTrackNotifications();
    const notif: TrackNotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipient_id: updatedAttempt.participant_id,
      title:
        params.action === "request_revision"
          ? "Revision Requested on Assignment"
          : "Assignment Graded & Feedback Published",
      title_ar:
        params.action === "request_revision"
          ? "طلب مراجعة وتعديل على المهمة"
          : "تم تصحيح المهمة ونشر الملاحظات",
      message:
        params.action === "request_revision"
          ? `Your submission for '${asg?.title}' requires corrections. Resubmit before ${params.resubmissionDeadline || "the deadline"}.`
          : `Feedback published for '${asg?.title}'. Official score: ${officialCalc.finalScore} / ${asg?.max_score || 100}.`,
      message_ar:
        params.action === "request_revision"
          ? `طلب مراجع المسار تعديلات على تسليمك للمهمة '${asg?.title}'. يرجى الاطلاع على الملاحظات وإعادة التسليم.`
          : `تم نشر نتيجة تقييم المهمة '${asg?.title}'. الدرجة الرسمية: ${officialCalc.finalScore} / ${asg?.max_score || 100}.`,
      category: "feedback",
      related_track_id: asg?.track_id,
      related_entity_type: "assignment",
      related_entity_id: asg?.id,
      link: `/education?tab=assignments&asg=${asg?.id}`,
      is_read: false,
      created_at: now,
    };
    setStorage("track_notifications", [notif, ...existingNotifs]);

    return { attempt: updatedAttempt, submission: updatedSub };
  },

  /**
   * Calculates official final grade based on approved assignment policy:
   * 'latest_reviewed', 'highest_approved', or 'instructor_selected'.
   */
  calculateOfficialFinalScore(
    assignmentId: string,
    participantId: string
  ): {
    finalScore: number | null;
    policy: FinalGradePolicy;
    selectedAttemptNumber: number;
  } {
    const asg = this.getAssignments().find((a) => a.id === assignmentId);
    const policy: FinalGradePolicy = asg?.final_grade_policy || "highest_approved";
    const attempts = this.getSubmissionAttempts({ assignmentId, participantId }).filter(
      (a) => a.score !== null
    );

    if (attempts.length === 0) {
      return { finalScore: null, policy, selectedAttemptNumber: 0 };
    }

    if (policy === "highest_approved") {
      const highest = attempts.reduce((prev, curr) => ((curr.score || 0) > (prev.score || 0) ? curr : prev));
      return { finalScore: highest.score, policy, selectedAttemptNumber: highest.attempt_number };
    }

    if (policy === "latest_reviewed") {
      const latest = [...attempts].sort((a, b) => b.attempt_number - a.attempt_number)[0];
      return { finalScore: latest.score, policy, selectedAttemptNumber: latest.attempt_number };
    }

    // 'instructor_selected' -> accepted attempt or latest
    const accepted = attempts.find((a) => a.status === "accepted") || attempts[attempts.length - 1];
    return { finalScore: accepted.score, policy, selectedAttemptNumber: accepted.attempt_number };
  },

  /**
   * Post-publication grade correction audit trail.
   */
  correctGrade(params: {
    attemptId: string;
    newScore: number;
    newFeedback?: string;
    correctedBy: string;
    correctedByName: string;
    reason: string;
  }): GradeCorrectionLog {
    const allAttempts = getStorage<TrackSubmissionAttempt>("submission_attempts", INITIAL_SUBMISSION_ATTEMPTS);
    const attIdx = allAttempts.findIndex((a) => a.id === params.attemptId);
    if (attIdx < 0) throw new Error("Attempt record not found.");

    const attempt = allAttempts[attIdx];
    const previousScore = attempt.score;
    const now = new Date().toISOString();

    const correctionLog: GradeCorrectionLog = {
      id: `corr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      attempt_id: params.attemptId,
      submission_id: attempt.submission_id,
      assignment_id: attempt.assignment_id,
      participant_id: attempt.participant_id,
      previous_score: previousScore,
      new_score: Math.min(100, Math.max(0, params.newScore)),
      previous_feedback: attempt.feedback?.what_went_well,
      new_feedback: params.newFeedback,
      corrected_by: params.correctedBy,
      corrected_by_name: params.correctedByName,
      corrected_at: now,
      reason: params.reason,
    };

    const allCorrections = getStorage<GradeCorrectionLog>("grade_corrections", INITIAL_GRADE_CORRECTIONS);
    setStorage("grade_corrections", [correctionLog, ...allCorrections]);

    // Update attempt
    allAttempts[attIdx] = {
      ...attempt,
      score: correctionLog.new_score,
      reviewer_feedback: params.newFeedback || attempt.reviewer_feedback,
    };
    setStorage("submission_attempts", allAttempts);

    // Recalculate parent submission
    const officialCalc = this.calculateOfficialFinalScore(attempt.assignment_id, attempt.participant_id);
    const allSubmissions = this.getSubmissions();
    const subIdx = allSubmissions.findIndex((s) => s.id === attempt.submission_id);
    if (subIdx >= 0) {
      allSubmissions[subIdx] = {
        ...allSubmissions[subIdx],
        score: officialCalc.finalScore,
        updated_at: now,
      };
      setStorage("submissions", allSubmissions);
    }

    return correctionLog;
  },

  getGradeCorrections(attemptId?: string): GradeCorrectionLog[] {
    const list = getStorage<GradeCorrectionLog>("grade_corrections", INITIAL_GRADE_CORRECTIONS);
    if (!attemptId) return list;
    return list.filter((c) => c.attempt_id === attemptId);
  },

  // ════════════════════════════════════════════════════════════
  // FEATURE 3: AT-RISK MONITORING & FOLLOW-UP CASE MANAGEMENT
  // ════════════════════════════════════════════════════════════

  getRiskRules(): RiskRule[] {
    return getStorage<RiskRule>("risk_rules", INITIAL_RISK_RULES);
  },

  getRiskRuleById(id: string): RiskRule | null {
    return this.getRiskRules().find((r) => r.id === id) || null;
  },

  saveRiskRule(rule: Omit<RiskRule, "id" | "created_at" | "updated_at"> & { id?: string }): RiskRule {
    const list = this.getRiskRules();
    const now = new Date().toISOString();
    if (rule.id) {
      const existingIdx = list.findIndex((r) => r.id === rule.id);
      if (existingIdx >= 0) {
        const updated: RiskRule = {
          ...list[existingIdx],
          ...rule,
          updated_at: now,
        };
        list[existingIdx] = updated;
        setStorage("risk_rules", list);
        return updated;
      }
    }

    const newRule: RiskRule = {
      ...rule,
      id: rule.id || `risk_rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: now,
      updated_at: now,
    };
    setStorage("risk_rules", [newRule, ...list]);
    return newRule;
  },

  toggleRiskRule(ruleId: string, enabled?: boolean): RiskRule | null {
    const list = this.getRiskRules();
    let updated: RiskRule | null = null;
    const next = list.map((r) => {
      if (r.id === ruleId) {
        updated = {
          ...r,
          enabled: typeof enabled === "boolean" ? enabled : !r.enabled,
          updated_at: new Date().toISOString(),
        };
        return updated;
      }
      return r;
    });
    setStorage("risk_rules", next);
    return updated;
  },

  getRiskFollowUpCases(filter?: {
    trackId?: string;
    status?: string;
    riskLevel?: string;
  }): RiskFollowUpCase[] {
    const cases = getStorage<RiskFollowUpCase>("risk_cases", INITIAL_RISK_CASES);
    return cases.filter((c) => {
      if (filter?.trackId && filter.trackId !== "all" && c.track_id !== filter.trackId) return false;
      if (filter?.status && filter.status !== "all" && c.status !== filter.status) return false;
      if (filter?.riskLevel && filter.riskLevel !== "all" && c.risk_level !== filter.riskLevel) return false;
      return true;
    });
  },

  getRiskFollowUpCaseById(id: string): RiskFollowUpCase | null {
    return this.getRiskFollowUpCases().find((c) => c.id === id) || null;
  },

  createOrUpdateRiskCase(
    caseData: Omit<RiskFollowUpCase, "id" | "created_at" | "updated_at"> & { id?: string }
  ): RiskFollowUpCase {
    const list = this.getRiskFollowUpCases();
    const now = new Date().toISOString();

    if (caseData.id) {
      const idx = list.findIndex((c) => c.id === caseData.id);
      if (idx >= 0) {
        const updated: RiskFollowUpCase = {
          ...list[idx],
          ...caseData,
          updated_at: now,
        };
        list[idx] = updated;
        setStorage("risk_cases", list);
        return updated;
      }
    }

    const newCase: RiskFollowUpCase = {
      ...caseData,
      id: caseData.id || `case_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: now,
      updated_at: now,
    };
    setStorage("risk_cases", [newCase, ...list]);
    return newCase;
  },

  updateRiskCaseStatus(
    caseId: string,
    status: RiskFollowUpCase["status"],
    nextAction?: string,
    resolutionNotes?: string
  ): boolean {
    const list = this.getRiskFollowUpCases();
    const now = new Date().toISOString();
    let updated = false;

    const next = list.map((c) => {
      if (c.id === caseId) {
        updated = true;
        return {
          ...c,
          status,
          next_action: nextAction || c.next_action,
          resolution_notes: resolutionNotes || c.resolution_notes,
          resolution_date: status === "resolved" || status === "closed" ? now : c.resolution_date,
          updated_at: now,
        };
      }
      return c;
    });

    if (updated) {
      setStorage("risk_cases", next);
      // Log action
      this.addCaseAction(
        caseId,
        "current_user",
        "Staff Member",
        "status_change",
        `Case status updated to "${status}". ${resolutionNotes ? `Notes: ${resolutionNotes}` : ""}`
      );
    }
    return updated;
  },

  addCaseAction(
    caseIdOrParams: string | (Partial<CaseActionLog> & { case_id: string }),
    actorId?: string,
    actorName?: string,
    actionType?: string,
    notes?: string
  ): CaseActionLog {
    const allActions = getStorage<CaseActionLog>("case_actions", INITIAL_CASE_ACTIONS);
    const now = new Date().toISOString();
    let newAction: CaseActionLog;

    if (typeof caseIdOrParams === "object") {
      newAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        case_id: caseIdOrParams.case_id,
        action_type: caseIdOrParams.action_type || "supportive_reminder",
        description: caseIdOrParams.description || caseIdOrParams.notes || "",
        notes: caseIdOrParams.notes || caseIdOrParams.description || "",
        actor_id: caseIdOrParams.performed_by_id || caseIdOrParams.actor_id || "staff",
        actor_name: caseIdOrParams.performed_by_name || caseIdOrParams.actor_name || "Staff",
        performed_by_id: caseIdOrParams.performed_by_id || caseIdOrParams.actor_id || "staff",
        performed_by_name: caseIdOrParams.performed_by_name || caseIdOrParams.actor_name || "Staff",
        participant_response: caseIdOrParams.participant_response,
        agreed_next_steps: caseIdOrParams.agreed_next_steps,
        next_deadline: caseIdOrParams.next_deadline,
        timestamp: now,
        created_at: now,
      };
    } else {
      newAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        case_id: caseIdOrParams,
        actor_id: actorId || "staff",
        actor_name: actorName || "Staff",
        performed_by_id: actorId || "staff",
        performed_by_name: actorName || "Staff",
        action_type: actionType || "status_change",
        description: notes || "",
        notes: notes || "",
        timestamp: now,
        created_at: now,
      };
    }

    setStorage("case_actions", [newAction, ...allActions]);
    return newAction;
  },

  getCaseActions(caseId?: string): CaseActionLog[] {
    const list = getStorage<CaseActionLog>("case_actions", INITIAL_CASE_ACTIONS);
    if (!caseId || caseId === "all") return list;
    return list.filter((a) => a.case_id === caseId);
  },

  /**
   * Transparently evaluates risk indicators for every participant.
   * Fair adjustments: excludes excused absences, accounts for approved extensions.
   * Explains exact calculation and dates. Automatically synchronizes with follow-up cases without duplicating.
   */
  evaluateAtRiskParticipants(nowOverride?: Date): Array<{
    participant: Participant;
    enrollment: TrackEnrollment;
    track: TechnicalTrack;
    riskLevel: RiskSeverity;
    triggeringIndicators: RiskIndicatorEvidence[];
    metrics: any;
  }> {
    const now = nowOverride || new Date();
    const rules = this.getRiskRules().filter((r) => r.enabled);
    const enrollments = this.getEnrollments().filter((e) => e.status === "active");
    const assignments = this.getAssignments();
    const sessions = this.getSessions();
    const attendance = this.getAttendanceRecords();
    const submissions = this.getSubmissions();
    const attempts = this.getSubmissionAttempts();

    const results: Array<{
      participant: Participant;
      enrollment: TrackEnrollment;
      track: TechnicalTrack;
      riskLevel: RiskSeverity;
      triggeringIndicators: RiskIndicatorEvidence[];
      metrics: any;
    }> = [];

    for (const enr of enrollments) {
      if (!enr.participant || !enr.track) continue;

      const metrics = this.calculateParticipantMetrics(enr.participant_id, enr.track_id);
      const triggeringIndicators: RiskIndicatorEvidence[] = [];

      // Participant session records in this track
      const pAttRecords = attendance
        .filter((a) => a.track_id === enr.track_id && a.participant_id === enr.participant_id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Consecutive unexcused absences check
      let consecutiveAbsences = 0;
      for (const att of pAttRecords) {
        if (att.status === "absent") {
          consecutiveAbsences++;
        } else if (att.status === "present" || att.status === "late") {
          break;
        }
        // excused sessions do not increment unexcused absence
      }

      // Missing assignments check (past deadline, no valid submission, taking extension into account)
      const trackAsgs = assignments.filter((a) => a.track_id === enr.track_id);
      let missingAsgCount = 0;
      for (const asg of trackAsgs) {
        const sub = submissions.find((s) => s.assignment_id === asg.id && s.participant_id === enr.participant_id);
        const effectiveDeadline = sub?.deadline_extension_date || asg.deadline;
        const isPastDeadline = now.getTime() > new Date(effectiveDeadline).getTime();

        if (isPastDeadline && (!sub || sub.status === "missing" || (!sub.score && sub.status !== "submitted" && sub.status !== "under_review" && sub.status !== "resubmitted"))) {
          missingAsgCount++;
        }
      }

      // Check pending resubmission deadlines
      const pAttempts = attempts.filter((att) => att.participant_id === enr.participant_id && att.status === "revision_requested");
      let overdueResubmissions = 0;
      for (const att of pAttempts) {
        if (att.resubmission_deadline && now.getTime() > new Date(att.resubmission_deadline).getTime()) {
          overdueResubmissions++;
        }
      }

      // Evaluate active rules
      for (const rule of rules) {
        if (rule.track_id !== "all" && rule.track_id !== enr.track_id) continue;

        if (rule.trigger_type === "attendance_threshold") {
          if (metrics.eligibleSessionsCount >= 2 && metrics.attendancePercentage < rule.threshold_value) {
            triggeringIndicators.push({
              rule_id: rule.id,
              rule_name: rule.name,
              evidence: `Attendance is ${metrics.attendancePercentage}% (below ${rule.threshold_value}% requirement; ${metrics.presentCount} attended out of ${metrics.eligibleSessionsCount} completed sessions).`,
              evidence_ar: `نسبة الحضور الحالية ${metrics.attendancePercentage}% (أقل من الحد الأدنى ${rule.threshold_value}%؛ حضور ${metrics.presentCount} من ${metrics.eligibleSessionsCount} جلسات).`,
              date: now.toISOString().split("T")[0],
            });
          }
        } else if (rule.trigger_type === "consecutive_absences") {
          if (consecutiveAbsences >= rule.threshold_value) {
            triggeringIndicators.push({
              rule_id: rule.id,
              rule_name: rule.name,
              evidence: `${consecutiveAbsences} consecutive unexcused absences recorded.`,
              evidence_ar: `تم تسجيل غياب غير مبرر لـ ${consecutiveAbsences} جلسات متتالية دون تقديم عذر رسمي.`,
              date: now.toISOString().split("T")[0],
            });
          }
        } else if (rule.trigger_type === "missing_assignments") {
          if (missingAsgCount >= rule.threshold_value) {
            triggeringIndicators.push({
              rule_id: rule.id,
              rule_name: rule.name,
              evidence: `${missingAsgCount} assignments are overdue without submitted deliverables.`,
              evidence_ar: `يوجد ${missingAsgCount} مهام متأخرة تجاوزت الموعد النهائي دون تسليم.`,
              date: now.toISOString().split("T")[0],
            });
          }
        } else if (rule.trigger_type === "assignment_completion_threshold") {
          if (trackAsgs.length >= 2 && metrics.assignmentCompletionRate < rule.threshold_value) {
            triggeringIndicators.push({
              rule_id: rule.id,
              rule_name: rule.name,
              evidence: `Assignment completion rate is ${metrics.assignmentCompletionRate}% (threshold: ${rule.threshold_value}%).`,
              evidence_ar: `معدل إنجاز المهام الحالي ${metrics.assignmentCompletionRate}% (أقل من ${rule.threshold_value}%).`,
              date: now.toISOString().split("T")[0],
            });
          }
        } else if (rule.trigger_type === "pending_resubmission_overdue") {
          if (overdueResubmissions > rule.threshold_value) {
            triggeringIndicators.push({
              rule_id: rule.id,
              rule_name: rule.name,
              evidence: `${overdueResubmissions} requested revisions have exceeded their resubmission deadlines.`,
              evidence_ar: `انقضت المهلة المحددة لتعديل وإعادة تسليم ${overdueResubmissions} مهام.`,
              date: now.toISOString().split("T")[0],
            });
          }
        }
      }

      // Determine aggregated risk level
      let riskLevel: RiskSeverity = "resolved";
      if (triggeringIndicators.length > 0) {
        const hasUrgent = rules.some((r) => r.severity === "urgent_support" && triggeringIndicators.some((ti) => ti.rule_id === r.id));
        const hasNeedsFollowUp = rules.some((r) => r.severity === "needs_follow_up" && triggeringIndicators.some((ti) => ti.rule_id === r.id));
        if (hasUrgent) {
          riskLevel = "urgent_support";
        } else if (hasNeedsFollowUp) {
          riskLevel = "needs_follow_up";
        } else {
          riskLevel = "monitor";
        }
      }

      // Sync with follow-up cases (prevent duplicates)
      if (triggeringIndicators.length > 0) {
        const existingCases = this.getRiskFollowUpCases();
        const activeCase = existingCases.find(
          (c) => c.participant_id === enr.participant_id && c.track_id === enr.track_id && c.status !== "resolved" && c.status !== "closed"
        );

        if (activeCase) {
          // Update existing case's indicators and risk level
          this.createOrUpdateRiskCase({
            id: activeCase.id,
            participant_id: enr.participant_id,
            participant_name: enr.participant.full_name,
            participant_email: enr.participant.email,
            track_id: enr.track_id,
            track_name: enr.track.name,
            cohort: enr.cohort,
            risk_level: riskLevel,
            triggering_indicators: triggeringIndicators,
            date_identified: activeCase.date_identified,
            assigned_owner_id: activeCase.assigned_owner_id,
            assigned_owner_name: activeCase.assigned_owner_name,
            recommended_action: activeCase.recommended_action,
            follow_up_deadline: activeCase.follow_up_deadline,
            status: activeCase.status,
            next_action: activeCase.next_action,
          });
        }
      }

      results.push({
        participant: enr.participant,
        enrollment: enr,
        track: enr.track,
        riskLevel,
        triggeringIndicators,
        metrics,
      });
    }

    return results;
  },
};
