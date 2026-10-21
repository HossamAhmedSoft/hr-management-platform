// ============================================================
// GDG NCTU HR Management Platform — Forms API Auth & Security Helper
// Session Signature Verification, Role Checking, API Key Auth,
// and In-Memory IP Sliding-Window Rate Limiting
// ============================================================

import { NextRequest } from "next/server";
import { verifySessionSignature } from "./auth-service";
import { internalDB } from "./internal-db";
import { Profile, UserRole } from "@/types";

export interface ApiAuthContext {
  isAuthenticated: boolean;
  user: Profile | null;
  role: UserRole | null;
  isApiKey: boolean;
}

// IP Rate Limiting (In-memory sliding window)
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkApiRateLimit(
  request: NextRequest,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetInSec: number } {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const now = Date.now();

  const record = ipRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSec: Math.ceil((record.resetAt - now) / 1000),
  };
}

export function getApiAuthContext(request: NextRequest): ApiAuthContext {
  // 1. Check API Key header
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization");
  if (apiKey) {
    const cleanKey = apiKey.replace(/^Bearer\s+/i, "").trim();
    const configuredApiKey = process.env.FORMS_API_KEY;
    // Strictly validate against environment-configured secret (never allow wildcard prefix or hardcoded keys)
    if (configuredApiKey && cleanKey === configuredApiKey) {
      return {
        isAuthenticated: true,
        user: {
          id: "api_system_user",
          email: "api@nctu.edu.eg",
          full_name: "REST API Client",
          role: "super_admin",
          status: "active",
          join_date: "2026-01-01",
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
        role: "super_admin",
        isApiKey: true,
      };
    }
  }

  // 2. Check Session Cookies
  const userCookie = request.cookies.get("gdg_session_user")?.value;
  const roleCookie = request.cookies.get("gdg_session_role")?.value as UserRole | undefined;
  const expiresCookie = request.cookies.get("gdg_session_expires")?.value;
  const tokenCookie = request.cookies.get("gdg_auth_token")?.value;
  const sigCookie = request.cookies.get("gdg_session_sig")?.value;

  if (!userCookie || !roleCookie || !expiresCookie || !tokenCookie || !sigCookie) {
    return { isAuthenticated: false, user: null, role: null, isApiKey: false };
  }

  const userId = decodeURIComponent(userCookie);
  const expiresAt = parseInt(expiresCookie, 10);
  const token = decodeURIComponent(tokenCookie);
  const sig = decodeURIComponent(sigCookie);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { isAuthenticated: false, user: null, role: null, isApiKey: false };
  }

  const isValidSig = verifySessionSignature(userId, roleCookie, token, sig);
  if (!isValidSig) {
    return { isAuthenticated: false, user: null, role: null, isApiKey: false };
  }

  const profile = internalDB.getProfiles().find((p) => p.id === userId) || null;

  return {
    isAuthenticated: true,
    user: profile,
    role: roleCookie,
    isApiKey: false,
  };
}
