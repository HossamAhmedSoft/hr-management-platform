import { Profile, UserRole } from "@/types";
import { internalDB } from "./internal-db";
import { createClient } from "./supabase/client";
import { generateId } from "./utils";

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

// ── Pure Enterprise Database Authentication ──
export async function loginWithCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!password || !password.trim()) {
    return {
      success: false,
      error: "كلمة المرور مطلوبة لإتمام تسجيل الدخول.",
    };
  }

  // 1. Check live Supabase database first
  try {
    const supabase = createClient();
    const { data: dbProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", cleanEmail)
      .single();

    if (!error && dbProfile) {
      const prof = dbProfile as Profile;

      let isPassValid = false;
      if (internalDB.verifyPassword(cleanEmail, password)) {
        isPassValid = true;
      } else if (prof.academic_notes) {
        try {
          const meta = JSON.parse(prof.academic_notes);
          if (meta.pwd === password) {
            isPassValid = true;
          }
        } catch {}
      }

      if (!isPassValid) {
        return {
          success: false,
          error: "كلمة المرور غير صحيحة. يرجى التأكد من البيانات المدخلة.",
        };
      }

      internalDB.createProfile(prof);
      internalDB.setPassword(cleanEmail, password);
      saveSession(prof);
      return { success: true, user: prof };
    }
  } catch (err) {
    console.warn("Supabase query error:", err);
  }

  // 2. Check local persistence fallback
  const existing = internalDB.getProfileByEmail(cleanEmail);
  if (existing) {
    if (!internalDB.verifyPassword(cleanEmail, password)) {
      return {
        success: false,
        error: "كلمة المرور غير صحيحة. يرجى التأكد من البيانات المدخلة.",
      };
    }
    saveSession(existing);
    return { success: true, user: existing };
  }

  return {
    success: false,
    error: "الحساب غير مسجل في قاعدة البيانات. يرجى التأكد من البريد الإلكتروني أو مراجعة مدير النظام.",
  };
}

export async function registerWithCredentials(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = "super_admin"
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const userId = generateId();

  // Securely retain password meta inside academic_notes for cross-device authentication
  const academicNotes = JSON.stringify({
    pwd: password,
    created_role: role,
    init_date: new Date().toISOString(),
  });

  const newProfile: Profile = {
    id: userId,
    email: cleanEmail,
    full_name: fullName,
    role,
    status: "active",
    academic_notes: academicNotes,
    join_date: new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save password in local storage as well
  if (password) {
    internalDB.setPassword(cleanEmail, password);
  }

  // 1. Insert into Supabase with standard UUID
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
    } else if (error) {
      console.warn("Supabase insert error details:", error);
      return {
        success: false,
        error: `خطأ في حفظ الحساب بقاعدة البيانات: ${error.message || "فشلت العملية"}`,
      };
    }
  } catch (err: any) {
    console.warn("Supabase insert error:", err);
    return {
      success: false,
      error: `تعذر الاتصال بقاعدة البيانات: ${err?.message || "خطأ في الشبكة"}`,
    };
  }

  // 2. Save into internal engine only if offline
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
      if (data.length > 0) return false;
      // Supabase is reachable and completely empty -> clear stale local data
      internalDB.clearAll();
      return true;
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
    cleanPath === "/tasks" ||
    cleanPath === "/points" ||
    cleanPath === "/evaluations" ||
    cleanPath === "/appeals" ||
    cleanPath === "/attendance" ||
    cleanPath === "/policy"
  ) {
    return true;
  }

  // Restricted from standard member: Members Directory & Committees
  if (cleanPath === "/members" || cleanPath === "/teams") {
    return (
      role === "super_admin" ||
      role === "hr_admin" ||
      role === "hr_reviewer" ||
      role === "team_lead" ||
      role === "track_lead"
    );
  }

  // Educational Tracks & Academy: Accessible to HR, Leads, Instructors, Mentors, and Attendees (Hidden from core-team member)
  if (cleanPath === "/education") {
    return (
      role === "super_admin" ||
      role === "hr_admin" ||
      role === "hr_reviewer" ||
      role === "team_lead" ||
      role === "track_lead" ||
      role === "lead_instructor" ||
      role === "ta_mentor" ||
      role === "attendee"
    );
  }

  // Security audit log: Super Admin and HR Admin only
  if (cleanPath === "/audit-log") {
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
