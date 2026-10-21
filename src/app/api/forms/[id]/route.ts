// ============================================================
// Single Form Operations: GET, PUT, DELETE /api/forms/[id]
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

    return NextResponse.json({ status: "success", data: form });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch form." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = getApiAuthContext(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await dbService.getFormById(id);
    if (!existing) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    // Permission check: owner or super_admin or editor
    const isOwner = existing.created_by === auth.user?.id;
    const isAdmin = auth.role === "super_admin" || auth.role === "hr_admin";
    const isEditor = existing.collaborators?.some(
      (c) => c.profile_id === auth.user?.id && (c.role === "owner" || c.role === "editor")
    );

    if (!isOwner && !isAdmin && !isEditor) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this form." },
        { status: 403 }
      );
    }

    const updates = await request.json();
    const updated = await dbService.updateForm(existing.id, updates);

    return NextResponse.json({ status: "success", data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update form." },
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
    const existing = await dbService.getFormById(id);
    if (!existing) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    const isOwner = existing.created_by === auth.user?.id;
    const isAdmin = auth.role === "super_admin" || auth.role === "hr_admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only the owner or HR admin can delete this form." },
        { status: 403 }
      );
    }

    await dbService.deleteForm(existing.id);

    return NextResponse.json({
      status: "success",
      message: "Form successfully deleted.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete form." },
      { status: 500 }
    );
  }
}
