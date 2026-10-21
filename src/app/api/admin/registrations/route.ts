import { NextRequest, NextResponse } from "next/server";
import { getApiAuthContext } from "@/lib/api-auth-helper";
import { dbService } from "@/lib/db-service";
import { RegistrationRequest } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/registrations
 * Lists registration requests with search, filtering by status/track,
 * pagination, SLA indicators, and masked PII in list view.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = getApiAuthContext(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const allowedRoles = ["super_admin", "hr_admin", "hr_reviewer"];
    if (!allowedRoles.includes(auth.role)) {
      return NextResponse.json({ success: false, error: "Forbidden: Reviewer permission required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const status = searchParams.get("status") || "all";
    const team = searchParams.get("team") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const [allRequests, settings] = await Promise.all([
      dbService.getRegistrationRequests(),
      dbService.getRegistrationSettings(),
    ]);

    const slaHours = settings.sla_warning_hours || 48;
    const now = Date.now();

    // Filter
    let filtered = allRequests.filter((req) => {
      if (status !== "all" && req.status !== status) return false;
      if (team !== "all" && req.assigned_team_id !== team && req.submitted_data?.preferred_track !== team) return false;

      if (search) {
        const matchesName = req.full_name.toLowerCase().includes(search);
        const matchesEmail = req.email.toLowerCase().includes(search);
        const matchesRef = req.reference_no.toLowerCase().includes(search);
        const matchesPhone = req.phone?.toLowerCase().includes(search);
        if (!matchesName && !matchesEmail && !matchesRef && !matchesPhone) {
          return false;
        }
      }

      return true;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    // Compute SLA and mask sensitive national IDs in summary list
    const items = paginated.map((req) => {
      const submittedTime = new Date(req.submitted_at).getTime();
      const hoursPending = Math.round((now - submittedTime) / (1000 * 60 * 60));
      const isSlaBreached = req.status === "pending_approval" && hoursPending >= slaHours;

      // Mask national ID in list
      const rawId = req.submitted_data?.national_id || "";
      const maskedId = rawId.length > 4 ? `****${rawId.slice(-4)}` : rawId;

      return {
        ...req,
        password_hash: undefined, // Never expose hash to client list
        hours_pending: hoursPending,
        is_sla_breached: isSlaBreached,
        submitted_data: {
          ...req.submitted_data,
          national_id: maskedId,
        },
      };
    });

    // Compute status counts
    const statusCounts = {
      all: allRequests.length,
      pending_email_verification: allRequests.filter((r) => r.status === "pending_email_verification").length,
      pending_approval: allRequests.filter((r) => r.status === "pending_approval").length,
      needs_info: allRequests.filter((r) => r.status === "needs_info").length,
      approved: allRequests.filter((r) => r.status === "approved").length,
      rejected: allRequests.filter((r) => r.status === "rejected").length,
      sla_breached: allRequests.filter((r) => {
        const h = Math.round((now - new Date(r.submitted_at).getTime()) / (1000 * 60 * 60));
        return r.status === "pending_approval" && h >= slaHours;
      }).length,
    };

    return NextResponse.json({
      success: true,
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts,
      settings,
    });
  } catch (err: any) {
    console.error("Admin registrations error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to query registrations." }, { status: 500 });
  }
}
