import { NextRequest, NextResponse } from "next/server";
import { registrationService } from "@/lib/registration-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/registration/schema
 * Returns active schema fields and registration settings for building the registration wizard.
 */
export async function GET(request: NextRequest) {
  try {
    const [fields, settings] = await Promise.all([
      registrationService.getSchemaFields(),
      registrationService.getSettings(),
    ]);

    return NextResponse.json({
      success: true,
      fields: fields.filter((f) => f.is_active),
      settings,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load registration schema" },
      { status: 500 }
    );
  }
}
