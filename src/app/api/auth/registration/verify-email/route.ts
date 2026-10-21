import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/api-auth-helper";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/registration/verify-email
 * Verifies email ownership via 6-digit OTP code and advances to PENDING_APPROVAL.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkApiRateLimit(request, 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "تم تجاوز عدد المحاولات الخاطئة. يرجى الانتظار قليلاً قبل المحاولة مجدداً.",
        },
        { status: 429 }
      );
    }

    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني ورمز التحقق مطلوبان." },
        { status: 400 }
      );
    }

    const result = await registrationService.verifyEmail(email, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      reference_no: result.reference_no,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to verify email." },
      { status: 500 }
    );
  }
}
