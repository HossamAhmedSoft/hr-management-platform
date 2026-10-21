import { NextRequest, NextResponse } from "next/server";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/registration/update-info
 * Allows applicant to update requested information when status is NEEDS_INFO.
 */
export async function POST(request: NextRequest) {
  try {
    const { reference_no, email, updated_fields } = await request.json();

    if (!reference_no || !email || !updated_fields) {
      return NextResponse.json(
        { success: false, error: "رقم المرجع والبريد والبيانات المعدلة مطلوبة." },
        { status: 400 }
      );
    }

    const result = await registrationService.updateRequestedInfo(
      reference_no,
      email,
      updated_fields
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "تم تحديث البيانات وإعادة إرسال الطلب للمراجعة." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update registration info." },
      { status: 500 }
    );
  }
}
