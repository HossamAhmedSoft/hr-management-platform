import { Profile, UserRole } from "@/types";
import { MOCK_PROFILES } from "./mock-data";
import { getSupabaseCredentials, createClient } from "./supabase/client";

export interface AuthSession {
  user: Profile;
  token: string;
  expiresAt: number;
}

const STORAGE_KEY = "gdg_nctu_auth_session";

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseCredentials());
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

// Real Supabase Auth + Fallback
export async function loginWithSupabaseOrFallback(
  email: string,
  password: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not initialize Supabase client");

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", email)
          .single();

        const user: Profile = profile || {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || email.split("@")[0].toUpperCase(),
          role: (data.user.user_metadata?.role as UserRole) || "member",
          status: "active",
          join_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        saveSession(user);
        return { success: true, user };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to authenticate with Supabase";
      return { success: false, error: msg };
    }
  }

  // Fallback demo authentication
  const testAccounts = getAvailableTestAccounts();
  const matched = testAccounts.find(
    (a) => a.user.email.toLowerCase() === email.toLowerCase()
  );

  const user: Profile = matched
    ? matched.user
    : {
        id: `usr_${Date.now()}`,
        email,
        full_name: email.split("@")[0].replace(".", " ").toUpperCase(),
        role: "member",
        status: "active",
        join_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

  saveSession(user);
  return { success: true, user };
}

export async function registerWithSupabaseOrFallback(
  email: string,
  password: string,
  fullName: string,
  role: UserRole = "member"
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Could not initialize Supabase client");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const newProfile: Profile = {
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          status: "active",
          join_date: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabase.from("profiles").upsert(newProfile);
        saveSession(newProfile);
        return { success: true, user: newProfile };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      return { success: false, error: msg };
    }
  }

  const user: Profile = {
    id: `usr_${Date.now()}`,
    email,
    full_name: fullName,
    role,
    status: "active",
    join_date: new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveSession(user);
  return { success: true, user };
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
