// ============================================================
// Forms Collection Endpoint: GET /api/forms & POST /api/forms
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";
import { getApiAuthContext, checkApiRateLimit } from "@/lib/api-auth-helper";
import { Form } from "@/types/forms";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Rate limiting check
  const rateLimit = checkApiRateLimit(request, 100);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetInSec) } }
    );
  }

  const auth = getApiAuthContext(request);
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase().trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    let forms = await dbService.getForms();

    if (status && status !== "all") {
      forms = forms.filter((f) => f.status === status);
    }

    if (search) {
      forms = forms.filter(
        (f) =>
          f.title.toLowerCase().includes(search) ||
          f.title_ar.toLowerCase().includes(search) ||
          f.slug.toLowerCase().includes(search) ||
          (f.description && f.description.toLowerCase().includes(search))
      );
    }

    // Role-based visibility: members only see published forms or forms they collaborate on
    if (auth.role === "member") {
      forms = forms.filter(
        (f) =>
          f.status === "published" ||
          f.created_by === auth.user?.id ||
          f.collaborators?.some((c) => c.profile_id === auth.user?.id)
      );
    }

    const total = forms.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = forms.slice(startIndex, startIndex + pageSize);

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
      { error: error?.message || "Failed to fetch forms." },
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

    const title = body.title?.trim() || "Untitled Form";
    const title_ar = body.title_ar?.trim() || "استمارة جديدة بدون عنوان";
    const slug =
      body.slug?.trim() ||
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

    // Generate initial default section
    const defaultSectionId = `sec_${Date.now().toString(36)}`;
    const initialSections = body.sections && body.sections.length > 0
      ? body.sections
      : [
          {
            id: defaultSectionId,
            title: "General Information",
            title_ar: "البيانات العامة",
            order_index: 0,
          },
        ];

    const newForm: Partial<Form> = {
      title,
      title_ar,
      slug,
      description: body.description || "",
      description_ar: body.description_ar || "",
      status: body.status || "draft",
      access_mode: body.access_mode || "public",
      allowed_roles: body.allowed_roles || [],
      allowed_user_ids: body.allowed_user_ids || [],
      theme_config: body.theme_config || {
        primaryColor: "#1a73e8",
        accentColor: "#4285F4",
        backgroundColor: "#f8f9fa",
        font: "Inter",
        rounded: "rounded-xl",
      },
      settings: body.settings || {
        limit_one_response: false,
        allow_edit: false,
        show_progress_bar: true,
        shuffle_questions: false,
        collect_email: true,
        auto_collect_user_profile: true,
        confirmation_message: "Your response has been recorded.",
        confirmation_message_ar: "تم تسجيل ردك بنجاح.",
      },
      quiz_settings: body.quiz_settings || {
        is_quiz: false,
        total_points: 0,
        show_score_immediate: true,
        show_correct_answers: false,
      },
      created_by: auth.user?.id || "system",
      sections: initialSections,
      questions: body.questions || [],
      logic_rules: body.logic_rules || [],
    };

    const created = await dbService.createForm(newForm);

    return NextResponse.json(
      { status: "success", data: created },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create form." },
      { status: 500 }
    );
  }
}
