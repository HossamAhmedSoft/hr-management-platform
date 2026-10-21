import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/api-auth-helper";
import { dbService } from "@/lib/db-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/registrations/settings
 * Retrieves registration settings and field definitions.
 *
 * PUT /api/admin/registrations/settings
 * Updates registration mode, allowed domains, expiry policies, and schema version.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = getApiAuthContext(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    if (auth.role !== "super_admin" && auth.role !== "hr_admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin clearance required." }, { status: 403 });
    }

    const [settings, fields] = await Promise.all([
      dbService.getRegistrationSettings(),
      dbService.getRegistrationFields(),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      fields,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to load settings." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getApiAuthContext(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    if (auth.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden: Super Admin clearance required." }, { status: 403 });
    }

    const body = await request.json();
    const updated = await dbService.updateRegistrationSettings(body);

    return NextResponse.json({
      success: true,
      message: "تم تحديث إعدادات التسجيل بنجاح.",
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to update settings." }, { status: 500 });
  }
}
