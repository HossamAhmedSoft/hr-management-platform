import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/api-auth-helper";
import { dbService } from "@/lib/db-service";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/registrations/[id]/reject
 * Rejects request with mandatory reason and configurable cooldown.
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
    const reason = (body.reason || "").trim();
    const reasonVisible = typeof body.reason_visible === "boolean" ? body.reason_visible : true;
    const cooldownDays = typeof body.cooldown_days === "number" ? body.cooldown_days : undefined;

    if (!reason) {
      return NextResponse.json({ success: false, error: "سبب الرفض إلزامي لإتمام العملية." }, { status: 400 });
    }

    const result = await registrationService.rejectRequest(id, auth.user, reason, {
      reasonVisible,
      cooldownDays,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "تم تسجيل قرار رفض الطلب وحفظ السبب في سجل التدقيق." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to reject request." }, { status: 500 });
  }
}
