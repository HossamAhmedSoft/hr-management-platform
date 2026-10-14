import { NextResponse } from "next/server";
import { tracksService } from "@/lib/tracks-service";
import crypto from "crypto";

// In-memory rate limiting defense (max 30 requests / min / IP)
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) {
    // Constant-time dummy comparison to prevent length timing leakage
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function checkRateLimit(ip: string, limit: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = ipRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

/**
 * Server-side scheduled job endpoint for Smart Reminders & At-Risk Evaluations.
 * Compatible with Vercel Cron, external monitoring webhooks, or direct manual execution.
 * Enforces timing-safe token verification, mandatory secret enforcement, and rate-limiting.
 */
export async function GET(request: Request) {
  return handleReminderProcessing(request);
}

export async function POST(request: Request) {
  return handleReminderProcessing(request);
}

async function handleReminderProcessing(request: Request) {
  // 1. IP Rate Limiting Check
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 30 requests per minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // 2. Constant-Time Authentication Check
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET || process.env.SCHEDULER_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !cronSecret) {
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET is required in production mode." },
      { status: 500 }
    );
  }

  if (cronSecret) {
    const expectedHeader = `Bearer ${cronSecret}`;
    if (!timingSafeCompare(authHeader, expectedHeader)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing bearer token." },
        { status: 401 }
      );
    }
  }

  const startTime = Date.now();
  const now = new Date();

  // 1. Process Smart Reminders (Idempotent evaluation)
  const reminderResult = tracksService.evaluateAndGenerateReminders(now);

  // 2. Evaluate At-Risk Students and sync follow-up cases
  const atRiskResults = tracksService.evaluateAtRiskParticipants(now);
  const flaggedCount = atRiskResults.filter((r) => r.triggeringIndicators.length > 0).length;

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    status: "success",
    timestamp: now.toISOString(),
    execution_duration_ms: durationMs,
    reminders: {
      generated_count: reminderResult.generatedCount,
      suppressed_count: reminderResult.suppressedCount,
      active_rules: tracksService.getReminderRules().filter((r) => r.enabled).length,
    },
    at_risk_monitoring: {
      total_participants_evaluated: atRiskResults.length,
      participants_flagged: flaggedCount,
      open_cases_count: tracksService.getRiskFollowUpCases({ status: "open" }).length,
    },
    latest_execution_logs: reminderResult.logs.slice(0, 5),
  });
}
