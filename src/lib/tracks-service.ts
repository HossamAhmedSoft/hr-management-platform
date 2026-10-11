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

const STORAGE_PREFIX = "gdg_nctu_tracks_";

function getStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
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
      evidence_url: evidenceUrl,
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

    return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
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

    return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  },

  exportGradesToCSV(trackId: string): string {
    const assignments = this.getAssignmentsByTrack(trackId);
    const enrollments = this.getEnrollmentsByTrack(trackId);
    const submissions = this.getSubmissions();

    const header = [
      "Participant Name",
      "Email",
      ...assignments.map((a) => `${a.title} (Max ${a.max_score})`),
      "Assignment Score (30%)",
      "Attendance Score (40%)",
      "Bonus Points",
      "Final Official Score (100)",
      "Certificate Status",
    ];
    const rows = [header];

    enrollments.forEach((e) => {
      const p = e.participant;
      const metrics = this.calculateParticipantMetrics(e.participant_id, trackId);
      const assignmentScores = assignments.map((a) => {
        const sub = submissions.find((s) => s.assignment_id === a.id && s.participant_id === e.participant_id);
        return sub && sub.score !== null ? `${sub.score}` : "N/A";
      });

      rows.push([
        p?.full_name || "",
        p?.email || "",
        ...assignmentScores,
        `${metrics.assignmentScore}`,
        `${metrics.attendanceScore}`,
        `${metrics.totalBonus}`,
        `${metrics.finalOfficialScore}`,
        metrics.isEligibleForCertificate ? "Eligible (>=75%)" : "In Progress",
      ]);
    });

    return rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  },
};
