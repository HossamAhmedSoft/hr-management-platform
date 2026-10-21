// ============================================================
// Form Responses CSV Export Endpoint: GET /api/forms/[id]/export
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
    const questions = form.questions || [];

    // Build CSV Headers
    const headers = [
      "Response ID",
      "Submitted At",
      "Respondent Name",
      "Respondent Email",
      ...(form.quiz_settings?.is_quiz ? ["Quiz Score", "Quiz Percentage", "Passed"] : []),
      ...questions.map((q) => `"${q.title.replace(/"/g, '""')} / ${q.title_ar.replace(/"/g, '""')}"`),
    ];

    const rows: string[] = [headers.join(",")];

    responses.forEach((resp) => {
      const answersMap: Record<string, any> = {};
      resp.answers?.forEach((a) => {
        answersMap[a.question_id] = a.answer_value;
      });

      const rowValues: string[] = [
        `"${resp.id}"`,
        `"${resp.submitted_at}"`,
        `"${(resp.respondent_name || "").replace(/"/g, '""')}"`,
        `"${(resp.respondent_email || "").replace(/"/g, '""')}"`,
        ...(form.quiz_settings?.is_quiz
          ? [
              String(resp.score ?? 0),
              `${resp.percentage ?? 0}%`,
              (resp.percentage ?? 0) >= (form.quiz_settings.passing_score_percentage || 70) ? "YES" : "NO",
            ]
          : []),
        ...questions.map((q) => {
          const val = answersMap[q.id];
          if (val === undefined || val === null) return '""';
          if (Array.isArray(val)) {
            return `"${val.join("; ").replace(/"/g, '""')}"`;
          }
          if (typeof val === "object") {
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        }),
      ];

      rows.push(rowValues.join(","));
    });

    // UTF-8 BOM (\uFEFF) ensures Excel renders Arabic properly without garbled text
    const csvContent = "\uFEFF" + rows.join("\r\n");
    const filename = `${form.slug}-responses-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to export responses." },
      { status: 500 }
    );
  }
}
