// ============================================================
// Form Responses Management: GET & DELETE /api/forms/[id]/responses
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";
import { getApiAuthContext } from "@/lib/api-auth-helper";

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)));

    let filtered = responses;
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.respondent_name?.toLowerCase().includes(search) ||
          r.respondent_email?.toLowerCase().includes(search) ||
          r.id.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      status: "success",
      data: paginated,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch responses." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = getApiAuthContext(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get("responseId");

    if (responseId) {
      await dbService.deleteFormResponse(responseId);
      return NextResponse.json({
        status: "success",
        message: "Response deleted successfully.",
      });
    }

    // Bulk delete or clear all responses for form
    const isOwner = auth.role === "super_admin" || auth.role === "hr_admin";
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can bulk-delete form responses." },
        { status: 403 }
      );
    }

    const form = await dbService.getFormById(id);
    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    const existingResponses = await dbService.getFormResponses(form.id);
    for (const r of existingResponses) {
      await dbService.deleteFormResponse(r.id);
    }

    await dbService.updateForm(form.id, { response_count: 0 });

    return NextResponse.json({
      status: "success",
      message: `Cleared ${existingResponses.length} responses.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete responses." },
      { status: 500 }
    );
  }
}
