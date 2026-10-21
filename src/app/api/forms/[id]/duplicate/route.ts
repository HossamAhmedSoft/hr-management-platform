// ============================================================
// Form Duplication Endpoint: POST /api/forms/[id]/duplicate
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";
import { getApiAuthContext } from "@/lib/api-auth-helper";
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
    const original = await dbService.getFormById(id);
    if (!original) {
      return NextResponse.json({ error: "Original form not found." }, { status: 404 });
    }

    const timestamp = Date.now().toString(36);
    const newFormId = generateId();
    const newSlug = `${original.slug}-copy-${timestamp}`;

    // Map old section IDs to new section IDs
    const sectionIdMap: Record<string, string> = {};
    const clonedSections = (original.sections || []).map((sec, idx) => {
      const newSecId = `sec_${timestamp}_${idx}`;
      sectionIdMap[sec.id] = newSecId;
      return {
        ...sec,
        id: newSecId,
        form_id: newFormId,
      };
    });

    // Map old question IDs to new question IDs
    const questionIdMap: Record<string, string> = {};
    const clonedQuestions = (original.questions || []).map((q, idx) => {
      const newQId = `q_${timestamp}_${idx}`;
      questionIdMap[q.id] = newQId;
      return {
        ...q,
        id: newQId,
        form_id: newFormId,
        section_id: sectionIdMap[q.section_id] || clonedSections[0]?.id || "sec_default",
      };
    });

    // Remap logic rules
    const clonedLogicRules = (original.logic_rules || []).map((rule, idx) => ({
      ...rule,
      id: `rule_${timestamp}_${idx}`,
      form_id: newFormId,
      source_question_id: questionIdMap[rule.source_question_id] || rule.source_question_id,
      target_id:
        rule.action === "jump_to_section"
          ? sectionIdMap[rule.target_id] || rule.target_id
          : questionIdMap[rule.target_id] || rule.target_id,
      conditions: rule.conditions.map((c) => ({
        ...c,
        question_id: questionIdMap[c.question_id] || c.question_id,
      })),
    }));

    const duplicated = await dbService.createForm({
      id: newFormId,
      slug: newSlug,
      title: `${original.title} (Copy)`,
      title_ar: `${original.title_ar} (نسخة)`,
      description: original.description,
      description_ar: original.description_ar,
      status: "draft",
      access_mode: original.access_mode,
      allowed_roles: original.allowed_roles,
      allowed_user_ids: original.allowed_user_ids,
      theme_config: { ...original.theme_config },
      settings: { ...original.settings },
      quiz_settings: { ...original.quiz_settings },
      created_by: auth.user?.id || "system",
      sections: clonedSections,
      questions: clonedQuestions,
      logic_rules: clonedLogicRules,
      response_count: 0,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Form successfully duplicated.",
        data: duplicated,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to duplicate form." },
      { status: 500 }
    );
  }
}
