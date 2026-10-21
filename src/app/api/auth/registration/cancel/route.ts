import { NextRequest, NextResponse } from "next/server";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/registration/cancel
 * Allows applicant to cancel their pending registration request.
 */
export async function POST(request: NextRequest) {
  try {
    const { reference_no, email } = await request.json();

    if (!reference_no || !email) {
      return NextResponse.json(
        { success: false, error: "رقم المرجع والبريد الإلكتروني مطلوبان." },
        { status: 400 }
      );
    }

    const result = await registrationService.cancelRegistration(reference_no, email);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "تم إلغاء طلب التسجيل بنجاح." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to cancel registration." },
      { status: 500 }
    );
  }
}
