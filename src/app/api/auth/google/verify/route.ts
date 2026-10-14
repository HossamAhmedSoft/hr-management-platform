import { NextRequest, NextResponse } from "next/server";
import {
  verifyGoogleIdToken,
  handleGoogleIdentity,
  createGoogleApplicationSession,
} from "@/lib/google-auth";

/**
 * POST /api/auth/google/verify
 * Secure endpoint for Google Identity Services (GIS) Credential Verification.
 * Accepts ID token, validates cryptographically with Google, resolves identity,
 * and sets cryptographically signed session cookies.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id_token, remember_me = false } = body;

    if (!id_token || typeof id_token !== "string") {
      return NextResponse.json(
        { success: false, error: "رمز التعريف الأمني (ID Token) مفقود أو غير صالح" },
        { status: 400 }
      );
    }

    // 1. Verify Google ID token cryptographically
    const verification = await verifyGoogleIdToken(id_token);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: 401 }
      );
    }

    // 2. Resolve account (linking or registration with role safety)
    const result = await handleGoogleIdentity(verification.payload);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || "فشل التحقق من الحساب", code: result.errorCode },
        { status: 403 }
      );
    }

    // 3. Issue application session matching proxy signature architecture
    const session = createGoogleApplicationSession(result.user, Boolean(remember_me));

    const response = NextResponse.json({
      success: true,
      user: result.user,
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
        sig: session.sig,
      },
      isNewUser: result.isNewUser,
    });

    const isProd = process.env.NODE_ENV === "production";
    const cookieOptions = {
      path: "/",
      maxAge: session.maxAgeSec,
      sameSite: "lax" as const,
      secure: isProd,
    };

    response.cookies.set("gdg_session_role", result.user.role, cookieOptions);
    response.cookies.set("gdg_session_user", encodeURIComponent(result.user.id), cookieOptions);
    response.cookies.set("gdg_session_expires", session.expiresAt.toString(), cookieOptions);
    response.cookies.set("gdg_auth_token", encodeURIComponent(session.token), cookieOptions);
    response.cookies.set("gdg_session_sig", encodeURIComponent(session.sig), cookieOptions);

    return response;
  } catch (error: any) {
    console.error("Unhandled error in /api/auth/google/verify:", error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول" },
      { status: 500 }
    );
  }
}
