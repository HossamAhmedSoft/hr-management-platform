import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale: string = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string, locale: string = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function ensureUUID(val?: string): string {
  if (val && isValidUUID(val)) return val;
  return generateId();
}

export const SUPABASE_TEAM_UUIDS: Record<string, string> = {
  hr: "11111111-1111-1111-1111-111111111101",
  pr: "11111111-1111-1111-1111-111111111102",
  ops: "11111111-1111-1111-1111-111111111103",
  media: "11111111-1111-1111-1111-111111111104",
  web: "11111111-1111-1111-1111-111111111105",
  mobile: "11111111-1111-1111-1111-111111111106",
  ai: "11111111-1111-1111-1111-111111111107",
  cyber: "11111111-1111-1111-1111-111111111108",
};

export const TRACK_KEYWORDS: Record<string, string[]> = {
  hr: ["hr", "human resources", "موارد بشرية", "الموارد البشرية"],
  media: ["media", "content", "branding", "إعلام", "محتوى", "الإعلام"],
  pr: ["pr", "public relations", "marketing", "علاقات عامة", "تسويق", "العلاقات"],
  ops: ["ops", "operations", "logistics", "عمليات", "لوجستيات", "العمليات"],
  web: ["web", "ويب", "تطوير الويب"],
  mobile: ["mobile", "flutter", "android", "ios", "موبايل", "هواتف"],
  uiux: ["ui", "ux", "design", "تصميم", "واجهات"],
  ai: ["ai", "data", "machine learning", "ذكاء", "بيانات"],
  embedded: ["embedded", "iot", "مدمجة", "إنترنت الأشياء"],
  cyber: ["cyber", "security", "أمن", "سيبران"],
};

export function isUserInTrack(
  user: any,
  trackId?: string,
  teams?: any[]
): boolean {
  if (!trackId || trackId === "all") return true;
  if (!user) return false;

  const cleanTrack = trackId.toLowerCase().replace("team_", "").replace("team-", "").trim();
  const userTeam = (user.team_id || user.team?.id || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
  const userComm = (user.committee || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
  const userTeamName = (user.team?.name || "").toLowerCase().trim();

  // 1. Direct match on ID or committee
  if (userTeam === cleanTrack || userTeam === trackId.toLowerCase().trim()) return true;
  if (userComm === cleanTrack || userComm === trackId.toLowerCase().trim()) return true;

  // 2. Direct UUID lookup from known table
  const mappedUuid = SUPABASE_TEAM_UUIDS[cleanTrack];
  if (mappedUuid && (user.team_id === mappedUuid || userTeam === mappedUuid.toLowerCase())) return true;

  // Reverse UUID lookup if trackId is a UUID
  for (const [slug, uuid] of Object.entries(SUPABASE_TEAM_UUIDS)) {
    if (trackId.toLowerCase().trim() === uuid.toLowerCase().trim()) {
      if (userTeam === slug || userComm === slug) return true;
    }
  }

  // 3. Keywords match on user's committee or team name
  const keywords = TRACK_KEYWORDS[cleanTrack] || [cleanTrack];
  if (userComm && keywords.some((k) => userComm.includes(k) || k.includes(userComm))) return true;
  if (userTeamName && keywords.some((k) => userTeamName.includes(k) || k.includes(userTeamName))) return true;

  // 4. Resolve via teams array
  if (teams && Array.isArray(teams) && teams.length > 0 && user.team_id) {
    const userTeamObj = teams.find(
      (t) => t.id === user.team_id || (t.id && t.id.toLowerCase().trim() === userTeam)
    );
    if (userTeamObj) {
      if (userTeamObj.id === trackId || userTeamObj.id?.toLowerCase().trim() === cleanTrack) return true;
      const name = (userTeamObj.name || "").toLowerCase();
      const nameAr = (userTeamObj.name_ar || "").toLowerCase();
      if (keywords.some((k) => name.includes(k) || nameAr.includes(k))) return true;
    }
  }

  // 5. Fallback substring match if non-empty and not a UUID
  if (userTeam.length > 2 && cleanTrack.length > 2 && !userTeam.includes("-")) {
    if (userTeam.includes(cleanTrack) || cleanTrack.includes(userTeam)) return true;
  }

  return false;
}

export function normalizeTeamUUID(teamId?: string): string {
  if (!teamId) return "11111111-1111-1111-1111-111111111101";
  if (isValidUUID(teamId)) return teamId;
  const clean = teamId.toLowerCase().replace("team_", "").replace("team-", "").trim();
  for (const [key, uuid] of Object.entries(SUPABASE_TEAM_UUIDS)) {
    if (clean.includes(key) || key.includes(clean)) return uuid;
  }
  return "11111111-1111-1111-1111-111111111101";
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
}

/**
 * Calculate evaluation score using the exact policy formula:
 * Category Score = (Rating / 5) × Category Weight
 * Total = Sum of all applicable category scores
 * 
 * With N/A adjustment:
 * Adjusted = (Sum of Applicable Scores / Sum of Applicable Weights) × 100
 */
export function calculateEvaluationScore(
  ratings: { categoryWeight: number; rating: number | null }[]
): { score: number | null; maxPossible: number; band: string } {
  const applicable = ratings.filter((r) => r.rating !== null);

  if (applicable.length === 0) {
    return { score: null, maxPossible: 100, band: "Not Evaluated" };
  }

  const sumApplicableWeights = applicable.reduce((acc, r) => acc + r.categoryWeight, 0);
  const rawScore = applicable.reduce(
    (acc, r) => acc + (r.rating! / 5) * r.categoryWeight,
    0
  );

  // N/A proportional recalculation
  const adjustedScore =
    applicable.length < ratings.length
      ? (rawScore / sumApplicableWeights) * 100
      : rawScore;

  const rounded = Math.round(adjustedScore * 100) / 100;

  let band: string;
  if (rounded >= 90) band = "Outstanding Performance";
  else if (rounded >= 75) band = "Strong Performance";
  else if (rounded >= 60) band = "Needs Improvement";
  else band = "Coaching / Guidance Session";

  return { score: rounded, maxPossible: 100, band };
}

/**
 * Net point classification per policy
 */
export function getPointClassification(netBalance: number): {
  label: string;
  color: string;
  level: "green" | "normal" | "warning" | "red";
} {
  if (netBalance >= 10) return { label: "Green", color: "#22c55e", level: "green" };
  if (netBalance >= 0) return { label: "Normal", color: "#3b82f6", level: "normal" };
  if (netBalance >= -5) return { label: "Warning", color: "#f59e0b", level: "warning" };
  return { label: "Red", color: "#ef4444", level: "red" };
}

/**
 * Calculate working days deadline from a notification date
 */
export function calculateWorkingDayDeadline(
  notificationDate: Date,
  workingDays: number,
  holidays: Date[] = []
): Date {
  const result = new Date(notificationDate);
  let daysAdded = 0;

  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const isHoliday = holidays.some(
      (h) => h.toDateString() === result.toDateString()
    );
    // Skip Friday and Saturday (Egyptian weekend) and holidays
    if (dayOfWeek !== 5 && dayOfWeek !== 6 && !isHoliday) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Calculate Educational Attendee Evaluation Score & Certificate Eligibility
 * Policy: Attendance (40) + Assignments (30) + Participation (20) + Conduct (10) = 100
 * Passing certificate eligibility threshold >= 75%
 */
export function calculateAttendeeEvaluation(
  attendance: number,
  assignments: number,
  participation: number,
  conduct: number
): { score: number; eligibleForCertificate: boolean } {
  const score = Math.round((attendance + assignments + participation + conduct) * 100) / 100;
  return {
    score,
    eligibleForCertificate: score >= 75,
  };
}

/**
 * Calculate Educational Instructor Evaluation Score
 * Policy: Punctuality (25) + Preparation (25) + Explanation (25) + Student Follow-up (15) + Professionalism (10) = 100
 */
export function calculateInstructorEvaluation(
  punctuality: number,
  preparation: number,
  explanation: number,
  studentFollowUp: number,
  professionalism: number
): { score: number } {
  const score =
    Math.round(
      (punctuality + preparation + explanation + studentFollowUp + professionalism) * 100
    ) / 100;
  return { score };
}

/**
 * Duplicate Deduction Detection
 * Prevents multiple approved negative-point deductions for the same incident/reference.
 */
export function isDuplicateDeduction(
  existingEvents: { member_id: string; evidence_url?: string; explanation?: string; status?: string }[],
  memberId: string,
  incidentKey: string
): boolean {
  if (!incidentKey || !incidentKey.trim()) return false;
  const cleanKey = incidentKey.trim().toLowerCase();
  return existingEvents.some(
    (e) =>
      e.member_id === memberId &&
      e.status !== "rejected" &&
      ((e.evidence_url && e.evidence_url.toLowerCase().includes(cleanKey)) ||
        (e.explanation && e.explanation.toLowerCase().includes(cleanKey)))
  );
}

