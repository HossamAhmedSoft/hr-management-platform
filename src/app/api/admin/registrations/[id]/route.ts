import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/api-auth-helper";
import { dbService } from "@/lib/db-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/registrations/[id]
 * Retrieves single registration request with complete submission fields,
 * event audit timeline, and uploaded document links.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getApiAuthContext(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const allowedRoles = ["super_admin", "hr_admin", "hr_reviewer"];
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Reviewer clearance required" }, { status: 403 });
    }

    const { id } = await params;
    const req = await dbService.getRegistrationRequestById(id);

    if (!req) {
      return NextResponse.json({ success: false, error: "Registration request not found." }, { status: 404 });
    }

    const events = await dbService.getRegistrationEvents(id);

    return NextResponse.json({
      success: true,
      data: {
        ...req,
        password_hash: undefined, // Never leak hash
        events,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to load request." }, { status: 500 });
  }
}
