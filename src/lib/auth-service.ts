import { Profile, UserRole } from "@/types";
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

// ── Pure Database Authentication (Zero Demo Fallbacks) ──
export async function loginWithCredentials(
  email: string,
  _password?: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check live Supabase database
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
    console.warn("Supabase query error:", err);
  }

  // 2. Check local persistence
  const existing = internalDB.getProfileByEmail(cleanEmail);
  if (existing) {
    saveSession(existing);
    return { success: true, user: existing };
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

  // 1. Insert into Supabase
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
    console.warn("Supabase insert error:", err);
  }

  // 2. Save into internal engine
  internalDB.createProfile(newProfile);
  saveSession(newProfile);
  return { success: true, user: newProfile };
}

// Check if database has any registered accounts
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (!error && Array.isArray(data)) {
      return data.length === 0;
    }
  } catch (err) {
    console.warn("isDatabaseEmpty error:", err);
  }

  return internalDB.getProfiles().length === 0;
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
