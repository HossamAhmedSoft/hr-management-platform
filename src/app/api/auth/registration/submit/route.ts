import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/api-auth-helper";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/registration/submit
 * Submits applicant registration data with honeypot detection,
 * sliding-window rate limiting, and anti-enumeration defense.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Sliding window rate limit: max 10 submissions per hour per IP
    const rateLimit = checkApiRateLimit(request, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `تم تجاوز الحد المسموح لمحاولات التسجيل. يرجى المحاولة بعد ${Math.ceil(rateLimit.resetInSec / 60)} دقيقة.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // 2. Honeypot check: if hidden honeypot field is filled, silently reject bot
    if (body.website_trap || body.hp_check) {
      return NextResponse.json({
        success: true,
        reference_no: "REG-2026-NCTU-BOT-SHIELD",
        email: body.email || "",
      });
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const locale = (body.locale === "en" ? "en" : "ar") as "ar" | "en";

    const result = await registrationService.submitRegistration(body, {
      ip,
      userAgent,
      locale,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          fieldErrors: result.fieldErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reference_no: result.reference_no,
      email: result.email,
      expires_at: result.expires_at,
    });
  } catch (err: any) {
    console.error("Registration submission error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process registration request." },
      { status: 500 }
    );
  }
}
