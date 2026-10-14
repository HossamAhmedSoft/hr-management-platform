import { NextResponse } from "next/server";
import { getGoogleConfigStatus } from "@/lib/google-auth";

/**
 * GET /api/auth/google/config
 * Public configuration endpoint for Google authentication.
 * Returns public client ID, redirect URI, and configuration status
 * without exposing sensitive secrets (e.g., client secret is never returned).
 */
export async function GET() {
  const status = getGoogleConfigStatus();
  return NextResponse.json({
    configured: status.isConfigured,
    clientId: status.clientId,
    redirectUri: status.redirectUri,
    missingFields: status.missingFields,
  });
}
