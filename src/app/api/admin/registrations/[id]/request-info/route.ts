import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/api-auth-helper";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/registrations/[id]/request-info
 * Flags specific fields/documents for applicant update and transitions status to NEEDS_INFO.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getApiAuthContext(request);
    if (!auth.isAuthenticated || !auth.user || !auth.role) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    if (auth.role !== "super_admin" && auth.role !== "hr_admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Super Admin or HR Admin clearance required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const fields: string[] = Array.isArray(body.fields) ? body.fields : [];
    const message = (body.message || "").trim();

    if (!message || fields.length === 0) {
      return NextResponse.json(
        { success: false, error: "يرجى تحديد الحقول المطلوب تعديلها وكتابة رسالة التوجيه للمتقدم." },
        { status: 400 }
      );
    }

    const result = await registrationService.requestMoreInfo(id, auth.user, fields, message);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "تم إرسال طلب استكمال البيانات لمقدم الطلب بنجاح." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to request info." }, { status: 500 });
  }
}
