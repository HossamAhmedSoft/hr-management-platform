// ============================================================
// Forms Template Library Endpoint: GET & POST /api/forms/templates
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";
import { getApiAuthContext } from "@/lib/api-auth-helper";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const templates = await dbService.getFormTemplates();
    return NextResponse.json({ status: "success", data: templates });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch form templates." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = getApiAuthContext(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const created = internalDB.createFormTemplate({
      category: body.category || "operations",
      title: body.title || "Custom Template",
      title_ar: body.title_ar || "قالب مخصص",
      description: body.description || "",
      description_ar: body.description_ar || "",
      icon: body.icon || "FileText",
      schema_snapshot: body.schema_snapshot,
      is_system: false,
    });

    return NextResponse.json({ status: "success", data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create template." },
      { status: 500 }
    );
  }
}
