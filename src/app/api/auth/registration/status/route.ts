import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit } from "@/lib/api-auth-helper";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/registration/status?ref=...&email=...
 * Safe applicant status check without leaking sensitive profile information.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimit = checkApiRateLimit(request, 20, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "تم تجاوز حد الاستعلامات. يرجى الانتظار قليلاً." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ref = searchParams.get("ref") || "";
    const email = searchParams.get("email") || "";

    if (!ref || !email) {
      return NextResponse.json(
        { success: false, error: "رقم المرجع والبريد الإلكتروني مطلوبان للاستعلام." },
        { status: 400 }
      );
    }

    const statusResult = await registrationService.checkStatus(ref, email);

    if (!statusResult.found) {
      return NextResponse.json(
        {
          success: false,
          error: "لم يتم العثور على طلب تسجيل مطابق للبيانات المدخلة.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...statusResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to query registration status." },
      { status: 500 }
    );
  }
}
