import {
  PointCategory,
  PointCapCategory,
  EvaluationCategory,
  EvaluationPeriod,
} from "@/types";

// ============================================================
// GDG on Campus NCTU — Official Governance & Policy Catalog
// Based on Published Community Bylaws & Rubrics
// ============================================================

export const POLICY_POINT_CATEGORIES: PointCategory[] = [
  // ── Official Positive Categories (Policy Sec 4.D) ──
  {
    id: "core_task",
    name: "Core task completed",
    name_ar: "إنجاز مهمة أساسية ومستحقة",
    direction: "positive",
    default_value: 5.0,
    description: "Core task completed satisfactorily to specification",
    description_ar: "إنجاز وتسليم مهمة أساسية للمشروع بالجودة المعتمدة",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "initiative_innovation",
    name: "Initiative and innovation",
    name_ar: "مبادرة وابتكار فكرة متميزة",
    direction: "positive",
    default_value: 3.0,
    description: "Outstanding proactive initiative or creative improvement",
    description_ar: "مبادرة ذاتية ملموسة أضافت قيمة واضحة للفريق",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "peer_support",
    name: "Peer support and knowledge sharing",
    name_ar: "مساعدة الزملاء ومشاركة المعرفة",
    direction: "positive",
    default_value: 2.0,
    description: "Voluntary assistance to peers or sharing knowledge sessions",
    description_ar: "تقديم عون تطوعي لأعضاء الفريق أو جلسة تبادل خبرات",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "documentation",
    name: "Documentation and archiving",
    name_ar: "التوثيق والأرشفة المنظمة",
    direction: "positive",
    default_value: 2.0,
    description: "Comprehensive notes, guides, and reproducible records",
    description_ar: "توثيق منظم يتيح استدامة العمل وسهولة الرجوع إليه",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "additional_contrib",
    name: "Additional contribution",
    name_ar: "مساهمة إضافية ملموسة",
    direction: "positive",
    default_value: 2.0, // Scale: 1 to 3 pts
    description: "Extra helpful effort beyond regular scope (1 to 3 pts)",
    description_ar: "جهد إضافي خارج النطاق العادي بتوثيق قائد الفريق (1 إلى 3)",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },

  // ── Official Negative Categories (Policy Sec 4.D) ──
  {
    id: "status_update_failure",
    name: "Failure to update task status after reminder",
    name_ar: "عدم تحديث حالة المهمة بعد التذكير",
    direction: "negative",
    default_value: -1.0,
    description: "Ignoring required progress update after official reminder",
    description_ar: "إغفال تحديث حالة الإنجاز رغم التنبيه المسبق",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "unjustified_delay",
    name: "Unjustified deadline delay",
    name_ar: "تأخر غير مبرر عن موعد التسليم",
    direction: "negative",
    default_value: -2.0,
    description: "Late submission without prior approved postponement",
    description_ar: "تسليم متأخر دون طلب تأجيل مسبق ومعتمد",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "unexcused_meeting",
    name: "Unexcused essential meeting absence",
    name_ar: "غياب غير معذور عن اجتماع أساسي",
    direction: "negative",
    default_value: -2.0,
    description: "Absence from mandatory meeting without 24h prior excuse",
    description_ar: "الغياب عن اجتماع إلزامي دون عذر مسبق بـ 24 ساعة",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "repeated_unresponsiveness",
    name: "Repeated failure to respond causing collaboration disruption",
    name_ar: "تكرار عدم الرد مع تعطيل سير العمل المشترك",
    direction: "negative",
    default_value: -3.0,
    description: "Prolonged communication silence that blocked other members",
    description_ar: "تجاهل متكرر للتواصل تسبب في إعاقة أعضاء آخرين",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "incomplete_delivery",
    name: "Materially incomplete delivery",
    name_ar: "تسليم ناقص بشكل جوهري",
    direction: "negative",
    default_value: -3.0,
    description: "Submitted work missing essential requirements or non-functional",
    description_ar: "تسليم عمل يفتقد متطلبات جوهرية يتطلب إعادة واسعة",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "event_duty_failure",
    name: "Failure to fulfill a direct event responsibility",
    name_ar: "التقصير في مسؤولية مباشرة أثناء فعالية",
    direction: "negative",
    default_value: -5.0,
    description: "Missing or abandoning agreed on-site/operational event task",
    description_ar: "الإخلال بمسؤولية تشغيلية مباشرة أثناء يوم الفعالية",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "inappropriate_conduct",
    name: "Inappropriate conduct (Neutral Review Required)",
    name_ar: "سلوك غير لائق (يخضع لمراجعة محايدة)",
    direction: "negative",
    default_value: -5.0, // Scale: -5 to -10, subject to neutral review
    description: "Conduct violation, strictly requires neutral HR review (-5 to -10)",
    description_ar: "مخالفة سلوكية تستوجب وجوباً مراجعة محايدة من HR (من -5 إلى -10)",
    is_investigation_referral: false,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "serious_violation",
    name: "Serious violation (Referral Only - NO Numeric Deduction)",
    name_ar: "مخالفة جسيمة (إحالة للتحقيق دون خصم رقمي)",
    direction: "negative",
    default_value: 0.0,
    description: "Severe misconduct referred to HR investigation with NO invented numeric penalty",
    description_ar: "مخالفات جسيمة تُحال مباشرة للتحقيق ولا تخضع لأي خصم رقمي مسبق",
    is_investigation_referral: true,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
];

// ── Official Monthly Positive-Point Caps (Policy Sec 4.E) ──
export const POLICY_POINT_CAP_CATEGORIES: PointCapCategory[] = [
  {
    id: "cap-attendance",
    name: "Attendance and Commitment",
    name_ar: "الحضور والالتزام",
    points_per_event: 2.0,
    monthly_cap: 6.0,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "cap-task-exec",
    name: "Task Execution",
    name_ar: "إنجاز المهام",
    points_per_event: 3.0,
    monthly_cap: 9.0,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "cap-quality",
    name: "Work Quality Added",
    name_ar: "جودة العمل المضافة",
    points_per_event: 1.0,
    monthly_cap: 3.0,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "cap-reliability",
    name: "Reliability and Transparency",
    name_ar: "الاعتمادية والشفافية",
    points_per_event: 2.0,
    monthly_cap: 4.0,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "cap-collaboration",
    name: "Collaboration and Helping Others",
    name_ar: "التعاون ومساعدة الآخرين",
    points_per_event: 2.0,
    monthly_cap: 6.0,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "cap-initiative",
    name: "Initiative and Innovation",
    name_ar: "المبادرة والابتكار",
    points_per_event: 2.0,
    monthly_cap: 4.0,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "cap-ownership",
    name: "Ownership and Leadership",
    name_ar: "روح المسؤولية والقيادة",
    points_per_event: 3.0,
    monthly_cap: 6.0,
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
  },
];

// ── Explicit Point-to-Cap Mapping Registry & Ambiguity Register ──
export interface PointToCapMapping {
  point_category_id: string;
  cap_category_id: string;
  has_policy_ambiguity: boolean;
  ambiguity_note?: string;
}

export const OFFICIAL_POINT_TO_CAP_MAPPINGS: PointToCapMapping[] = [
  {
    point_category_id: "core_task",
    cap_category_id: "cap-task-exec",
    has_policy_ambiguity: true,
    ambiguity_note:
      "Core task gives +5 pts per table, while Task Execution cap specifies +3/ev with 9/mo cap. The system applies the event points (+5) capped at remaining monthly cap.",
  },
  {
    point_category_id: "initiative_innovation",
    cap_category_id: "cap-initiative",
    has_policy_ambiguity: true,
    ambiguity_note:
      "Initiative table awards +3 pts, whereas cap rubric lists +2/ev with 4/mo cap.",
  },
  {
    point_category_id: "peer_support",
    cap_category_id: "cap-collaboration",
    has_policy_ambiguity: false,
  },
  {
    point_category_id: "documentation",
    cap_category_id: "cap-reliability",
    has_policy_ambiguity: false,
  },
  {
    point_category_id: "additional_contrib",
    cap_category_id: "cap-ownership",
    has_policy_ambiguity: true,
    ambiguity_note:
      "Additional contribution scale (1-3 pts) mapped to Ownership & Leadership (+3/ev, max 6/mo).",
  },
];

// ── Official Evaluation Categories (Policy Sec 4.G) ──
export const POLICY_EVALUATION_CATEGORIES: EvaluationCategory[] = [
  {
    id: "eval-cat-1",
    template_id: "tpl-default",
    name: "Task Completion",
    name_ar: "إنجاز المهام والتسليمات",
    weight: 30.0,
    order: 1,
    description: "Timeliness, specification adherence, and milestone achievement.",
  },
  {
    id: "eval-cat-2",
    template_id: "tpl-default",
    name: "Quality & Standards",
    name_ar: "جودة المخرجات والمعايير",
    weight: 25.0,
    order: 2,
    description: "Quality guidelines, clean code/deliverables, minimal rework.",
  },
  {
    id: "eval-cat-3",
    template_id: "tpl-default",
    name: "Reliability & Commitment",
    name_ar: "الاعتمادية والالتزام",
    weight: 15.0,
    order: 3,
    description: "Meeting attendance, communication responsiveness, consistency.",
  },
  {
    id: "eval-cat-4",
    template_id: "tpl-default",
    name: "Knowledge Sharing & Teamwork",
    name_ar: "مشاركة المعرفة والعمل الجماعي",
    weight: 10.0,
    order: 4,
    description: "Helping peers, sharing discoveries, team cohesion.",
  },
  {
    id: "eval-cat-5",
    template_id: "tpl-default",
    name: "Documentation & Reporting",
    name_ar: "التوثيق والتقارير",
    weight: 10.0,
    order: 5,
    description: "Detailed notes, pull request descriptions, transparency.",
  },
  {
    id: "eval-cat-6",
    template_id: "tpl-default",
    name: "Growth & Initiative",
    name_ar: "التطور الشخصي والمبادرة",
    weight: 10.0,
    order: 6,
    description: "Self-learning, proactive contributions, technical growth.",
  },
];

// ── Team-Specific Criteria Catalog (Policy Sec 4.H) ──
// Missing official weights are explicitly marked unassigned to avoid fabrication
export interface TeamSpecificCriterion {
  team_key: "hr" | "pr" | "or" | "media" | "web" | "flutter" | "uiux" | "embedded" | "cyber";
  name: string;
  name_ar: string;
  official_weight: number | null; // null if not defined in source policy
  is_official_weight_unassigned: boolean;
  criteria: string[];
}

export const TEAM_SPECIFIC_CRITERIA: TeamSpecificCriterion[] = [
  {
    team_key: "hr",
    name: "Human Resources (HR)",
    name_ar: "الموارد البشرية",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: [
      "Communication and Member Support",
      "Confidentiality of Records",
      "Member Integration and Follow-up",
      "Fairness of Evaluation",
    ],
  },
  {
    team_key: "pr",
    name: "Public Relations (PR)",
    name_ar: "العلاقات العامة",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: [
      "Professional Correspondence",
      "Partnership Documentation",
      "Sponsor Suitability",
      "Authorization Boundaries",
    ],
  },
  {
    team_key: "or",
    name: "Operations & Logistics (OR)",
    name_ar: "العمليات واللوجستيات",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: [
      "Logistics Preparation",
      "Coordination and Crisis Management",
      "Resource Management",
      "Post-Event Documentation",
    ],
  },
  {
    team_key: "media",
    name: "Media & Branding",
    name_ar: "الإعلام والهوية البصرية",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: [
      "Visual Identity Compliance",
      "Production Quality",
      "Scheduling and Archiving",
      "Early Coordination",
    ],
  },
  {
    team_key: "web",
    name: "Web Development",
    name_ar: "تطوير الويب",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: ["Code Quality", "Architecture", "Responsive Design", "Security"],
  },
  {
    team_key: "flutter",
    name: "Flutter Development",
    name_ar: "تطوير تطبيقات فلاتر",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: ["State Management", "Performance", "Clean Architecture", "UI Polish"],
  },
  {
    team_key: "uiux",
    name: "UI/UX Design",
    name_ar: "تصميم واجهات وتجربة المستخدم",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: ["Design Systems", "User Research", "Wireframing", "Prototyping"],
  },
  {
    team_key: "embedded",
    name: "Embedded Systems & IoT",
    name_ar: "الأنظمة المدمجة وإنترنت الأشياء",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: ["Hardware Integration", "Firmware Quality", "Testing", "Safety"],
  },
  {
    team_key: "cyber",
    name: "Cybersecurity",
    name_ar: "الأمن السيبراني",
    official_weight: null,
    is_official_weight_unassigned: true,
    criteria: ["Vulnerability Assessment", "Penetration Testing", "Security Reporting"],
  },
];

export const POLICY_EVALUATION_PERIODS: EvaluationPeriod[] = [
  {
    id: "period-current",
    name: "Current Evaluation Cycle",
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    status: "open",
    created_at: new Date().toISOString(),
  },
];
