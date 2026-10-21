import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/api-auth-helper";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/registration/resend-code
 * Resends a fresh email OTP with cooldown throttling.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkApiRateLimit(request, 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى الانتظار دقيقتين قبل طلب إعادة إرسال رمز جديد.",
        },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني مطلوب." },
        { status: 400 }
      );
    }

    const result = await registrationService.resendVerificationCode(email);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to resend code." },
      { status: 500 }
    );
  }
}
