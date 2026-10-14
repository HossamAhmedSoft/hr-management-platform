import { NextRequest, NextResponse } from "next/server";
import { verifySessionSignature } from "@/lib/auth-service";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/session
 * Verifies the currently active HTTP session cookies cryptographically,
 * checks account status against the database, and returns the current authenticated user profile.
 */
export async function GET(request: NextRequest) {
  try {
    const userCookie = request.cookies.get("gdg_session_user")?.value;
    const roleCookie = request.cookies.get("gdg_session_role")?.value;
    const expiresCookie = request.cookies.get("gdg_session_expires")?.value;
    const tokenCookie = request.cookies.get("gdg_auth_token")?.value;
    const sigCookie = request.cookies.get("gdg_session_sig")?.value;

    if (!userCookie || !roleCookie || !expiresCookie || !tokenCookie || !sigCookie) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const userId = decodeURIComponent(userCookie);
    const role = roleCookie;
    const expiresAt = parseInt(expiresCookie, 10);
    const token = decodeURIComponent(tokenCookie);
    const sig = decodeURIComponent(sigCookie);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return NextResponse.json(
        { authenticated: false, user: null, reason: "expired" },
        { status: 200 }
      );
    }

    const isValidSig = verifySessionSignature(userId, role, token, sig);
    if (!isValidSig) {
      return NextResponse.json(
        { authenticated: false, user: null, reason: "invalid_signature" },
        { status: 401 }
      );
    }

    // Lookup user profile
    let profile = internalDB.getProfiles().find((p) => p.id === userId) || null;
    if (!profile) {
      try {
        const liveProfiles = await dbService.getProfiles();
        profile = liveProfiles.find((p) => p.id === userId) || null;
      } catch {}
    }

    if (!profile || profile.status === "suspended" || profile.status === "inactive") {
      return NextResponse.json(
        { authenticated: false, user: null, reason: "account_inactive" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: profile,
      expiresAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, error: err.message },
      { status: 500 }
    );
  }
}
