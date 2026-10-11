import { Profile, UserRole } from "@/types";
import { MOCK_PROFILES } from "./mock-data";
import { internalDB } from "./internal-db";
import { createClient } from "./supabase/client";

export interface AuthSession {
  user: Profile;
  token: string;
  expiresAt: number;
}

const STORAGE_KEY = "gdg_nctu_auth_session";

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

// ── Live Supabase Authentication Engine ──
export async function loginWithCredentials(
  email: string,
  _password?: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try Supabase live database
  try {
    const supabase = createClient();
    const { data: dbProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", cleanEmail)
      .single();

    if (!error && dbProfile) {
      saveSession(dbProfile as Profile);
      return { success: true, user: dbProfile as Profile };
    }
  } catch (err) {
    console.warn("Supabase login query fallback:", err);
  }

  // 2. Try internal database
  const existing = internalDB.getProfileByEmail(cleanEmail);
  if (existing) {
    saveSession(existing);
    return { success: true, user: existing };
  }

  // 3. Fallback to official seed accounts
  const testAccounts = getAvailableTestAccounts();
  const matched = testAccounts.find(
    (a) => a.user.email.toLowerCase() === cleanEmail
  );

  if (matched) {
    saveSession(matched.user);
    return { success: true, user: matched.user };
  }

  return {
    success: false,
    error: "الحساب غير مسجل في قاعدة البيانات. إنشاء وتفعيل الحسابات مقتصر فقط على مدير النظام (Super Admin).",
  };
}

export async function registerWithCredentials(
  email: string,
  _password: string,
  fullName: string,
  role: UserRole = "member"
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  const newProfile: Profile = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    full_name: fullName,
    role,
    status: "active",
    join_date: new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Insert into Supabase live database
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .insert([newProfile])
      .select()
      .single();

    if (!error && data) {
      internalDB.createProfile(data as Profile);
      saveSession(data as Profile);
      return { success: true, user: data as Profile };
    }
  } catch (err) {
    console.warn("Supabase register insert fallback:", err);
  }

  // 2. Save into internal cache
  internalDB.createProfile(newProfile);
  saveSession(newProfile);
  return { success: true, user: newProfile };
}

// Check if database has any accounts registered
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (!error && data && data.length === 0) {
      return true;
    }
  } catch (err) {
    console.warn("isDatabaseEmpty error:", err);
  }
  return false;
}

// Role Permissions Matrix
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const cleanPath = pathname.replace(/^\/(en|ar)/, "") || "/";

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
      user: MOCK_PROFILES[0],
      label: "Super Admin (GDG Lead)",
      desc: "Full access to policy, audit logs, and organization-wide administration.",
    },
    {
      user: MOCK_PROFILES[1],
      label: "HR Admin (HR Lead)",
      desc: "Manages member performance, feedback sessions, PIPs, and reports.",
    },
    {
      user: MOCK_PROFILES[2],
      label: "HR Reviewer",
      desc: "Reviews point evidence, approves recommendations, and examines appeals.",
    },
    {
      user: MOCK_PROFILES[3],
      label: "Team Lead (Web Lead)",
      desc: "Assigns tasks, rates monthly evaluations, and recommends points for team.",
    },
    {
      user: MOCK_PROFILES[4],
      label: "Member (Web Developer)",
      desc: "Submits deliverables, requests delay, views own ledger, and files appeals.",
    },
  ];
}
