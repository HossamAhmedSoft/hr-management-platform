import { Profile, UserRole } from "@/types";
import { MOCK_PROFILES } from "./mock-data";

export interface AuthSession {
  user: Profile;
  token: string;
  expiresAt: number;
}

const STORAGE_KEY = "gdg_nctu_auth_session";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && !!key && !url.includes("your-project");
}

export function saveSession(user: Profile): AuthSession {
  const session: AuthSession = {
    user,
    token: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    document.cookie = `gdg_session_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `gdg_session_user=${encodeURIComponent(user.id)}; path=/; max-age=604800; SameSite=Lax`;
  }

  return session;
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = "gdg_session_role=; path=/; max-age=0";
    document.cookie = "gdg_session_user=; path=/; max-age=0";
  }
}

// Role Permissions Matrix
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  // Strip locale prefix (e.g. /en/policy -> /policy)
  const cleanPath = pathname.replace(/^\/(en|ar)/, "") || "/";

  // Public/all authenticated routes
  if (
    cleanPath === "/" ||
    cleanPath === "/login" ||
    cleanPath === "/members" ||
    cleanPath === "/tasks" ||
    cleanPath === "/points" ||
    cleanPath === "/evaluations" ||
    cleanPath === "/appeals" ||
    cleanPath === "/attendance" ||
    cleanPath === "/education" ||
    cleanPath === "/teams"
  ) {
    return true;
  }

  // Admin & HR exclusive routes
  if (cleanPath === "/policy" || cleanPath === "/audit-log") {
    return role === "super_admin" || role === "hr_admin";
  }

  if (cleanPath === "/hr-kpis" || cleanPath === "/feedback" || cleanPath === "/reports") {
    return role === "super_admin" || role === "hr_admin" || role === "team_lead";
  }

  if (cleanPath === "/incidents") {
    return role === "super_admin" || role === "hr_admin" || role === "hr_reviewer" || role === "team_lead";
  }

  return true;
}

export function getAvailableTestAccounts(): { user: Profile; label: string; desc: string }[] {
  return [
    {
      user: MOCK_PROFILES[0], // Ahmed El-Sayed (super_admin)
      label: "Super Admin (GDG Lead)",
      desc: "Full access to policy, audit logs, and organization-wide administration.",
    },
    {
      user: MOCK_PROFILES[1], // Sara Mahmoud (hr_admin)
      label: "HR Admin (HR Lead)",
      desc: "Manages member performance, feedback sessions, PIPs, and reports.",
    },
    {
      user: MOCK_PROFILES[2], // Omar Khaled (hr_reviewer)
      label: "HR Reviewer",
      desc: "Reviews point evidence, approves recommendations, and examines appeals.",
    },
    {
      user: MOCK_PROFILES[3], // Kareem Tarek (team_lead)
      label: "Team Lead (Web Lead)",
      desc: "Assigns tasks, rates monthly evaluations, and recommends points for team.",
    },
    {
      user: MOCK_PROFILES[4], // Youssef Ali (member)
      label: "Member (Web Developer)",
      desc: "Submits deliverables, requests delay, views own ledger, and files appeals.",
    },
  ];
}
