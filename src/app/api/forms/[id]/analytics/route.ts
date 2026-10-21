// ============================================================
// Form Analytics & Aggregations Endpoint: GET /api/forms/[id]/analytics
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";
import { getApiAuthContext } from "@/lib/api-auth-helper";
import { computeFormAnalytics } from "@/lib/forms-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = getApiAuthContext(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await dbService.getFormById(id);
    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    const responses = await dbService.getFormResponses(form.id);
    const analytics = computeFormAnalytics(form, responses);

    return NextResponse.json({
      status: "success",
      data: analytics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to compute analytics." },
      { status: 500 }
    );
  }
}
