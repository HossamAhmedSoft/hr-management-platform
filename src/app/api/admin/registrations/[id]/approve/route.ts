import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/api-auth-helper";
import { dbService } from "@/lib/db-service";
import { UserRole } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/registrations/[id]/approve
 * Atomically approves request, creates Profile, sets role & team,
 * transfers credentials, and logs immutable audit trail.
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
        { success: false, error: "Forbidden: Super Admin or HR Admin clearance required to approve members." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const registrationReq = await dbService.getRegistrationRequestById(id);
    if (!registrationReq) {
      return NextResponse.json({ success: false, error: "Registration request not found." }, { status: 404 });
    }

    // Separation of duties defense: reviewer cannot approve their own application
    if (registrationReq.email.toLowerCase().trim() === auth.user.email.toLowerCase().trim()) {
      return NextResponse.json(
        { success: false, error: "Security restriction: You cannot approve your own registration request." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const role: UserRole | undefined = body.role;
    const team_id: string | undefined = body.team_id;
    const internal_notes: string | undefined = body.internal_notes;

    const result = await dbService.approveRegistrationRequest(id, auth.user, {
      role,
      team_id,
      internal_notes,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `تم اعتماد الطلب بنجاح وإنشاء حساب العضو (${result.profile?.full_name}).`,
      profile: result.profile,
    });
  } catch (err: any) {
    console.error("Approval error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to execute approval." }, { status: 500 });
  }
}
