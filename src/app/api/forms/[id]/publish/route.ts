// ============================================================
// Form Publication & Immutable Version Snapshot Endpoint
// POST /api/forms/[id]/publish
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";
import { getApiAuthContext } from "@/lib/api-auth-helper";
import { FormVersionSnapshot } from "@/types/forms";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
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

    const isOwner = form.created_by === auth.user?.id;
    const isAdmin = auth.role === "super_admin" || auth.role === "hr_admin";
    const isEditor = form.collaborators?.some(
      (c) => c.profile_id === auth.user?.id && (c.role === "owner" || c.role === "editor")
    );

    if (!isOwner && !isAdmin && !isEditor) {
      return NextResponse.json(
        { error: "Forbidden: You cannot publish this form." },
        { status: 403 }
      );
    }

    // Prepare immutable schema snapshot
    const schemaSnapshot: FormVersionSnapshot = {
      title: form.title,
      title_ar: form.title_ar,
      description: form.description,
      description_ar: form.description_ar,
      theme_config: form.theme_config,
      settings: form.settings,
      quiz_settings: form.quiz_settings,
      sections: form.sections || [],
      questions: form.questions || [],
      logic_rules: form.logic_rules || [],
    };

    const nextVersionNumber = (form.current_version_number || 0) + 1;
    const versionId = generateId();

    const version = await dbService.createFormVersion({
      id: versionId,
      form_id: form.id,
      version_number: nextVersionNumber,
      schema_snapshot: schemaSnapshot,
      published_by: auth.user?.id || "system",
      changelog: `Published version ${nextVersionNumber} on ${new Date().toISOString()}`,
    });

    // Update form status to published and point to this new version
    const updatedForm = await dbService.updateForm(form.id, {
      status: "published",
      current_version_id: versionId,
      current_version_number: nextVersionNumber,
    });

    return NextResponse.json({
      status: "success",
      message: `Form successfully published as version ${nextVersionNumber}.`,
      data: {
        form: updatedForm,
        version,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to publish form." },
      { status: 500 }
    );
  }
}
