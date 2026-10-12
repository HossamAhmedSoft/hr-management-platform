import { NextResponse } from "next/server";
import { tracksService } from "@/lib/tracks-service";

/**
 * Server-side scheduled job endpoint for Smart Reminders & At-Risk Evaluations.
 * Compatible with Vercel Cron, external monitoring webhooks, or direct manual execution.
 * Enforces idempotent processing and returns full execution telemetry.
 */
export async function GET(request: Request) {
  return handleReminderProcessing(request);
}

export async function POST(request: Request) {
  return handleReminderProcessing(request);
}

async function handleReminderProcessing(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is configured in production, verify bearer token
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized scheduled execution request" },
      { status: 401 }
    );
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
