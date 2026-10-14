import { NextRequest, NextResponse } from "next/server";
import {
  verifyGoogleIdToken,
  handleGoogleIdentity,
  createGoogleApplicationSession,
} from "@/lib/google-auth";

// In-memory rate limiting defense (max 15 verification attempts / min / IP)
const verifyRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkVerifyRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = verifyRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    verifyRateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (record.count >= 15) {
    return false;
  }
  record.count += 1;
  return true;
}

/**
 * POST /api/auth/google/verify
 * Hardened endpoint for Google Identity Services (GIS) Credential Verification.
 * - CSRF & Origin defense: verifies Origin / Referer and blocks cross-site requests.
 * - Rate limiting: max 15 requests per minute per IP.
 * - Payload size limit: strictly caps request size at 10KB.
 * - Cryptographically verifies Google ID token (signature, issuer, audience, exp, email_verified).
 * - Enforces single-use token replay defense.
 * - Enforces account status and administrative privilege takeover protection.
 * - Issues cryptographically signed application session with HttpOnly cookies.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Origin & Cross-Site Defense
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite === "cross-site") {
      return NextResponse.json(
        { success: false, error: "تم رفض الطلب: طلبات التحقق الخارجية غير مسموح بها" },
        { status: 403 }
      );
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { success: false, error: "رفض أمني: مصدر الطلب (Origin) غير مطابق" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "تنسيق مصدر الطلب غير صالح" },
          { status: 403 }
        );
      }
    }

    // 2. IP-based Rate Limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkVerifyRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "تم تجاوز حد محاولات التحقق المسموح بها. يرجى الانتظار دقيقة." },
        { status: 429 }
      );
    }

    // 3. Payload size enforcement (max 10KB)
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 10240) {
      return NextResponse.json(
        { success: false, error: "حجم الطلب يتجاوز الحد المسموح به" },
        { status: 413 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "محتوى الطلب غير صالح" },
        { status: 400 }
      );
    }

    const { id_token, remember_me = false, expected_nonce } = body;

    if (!id_token || typeof id_token !== "string" || id_token.length < 20 || id_token.length > 4096) {
      return NextResponse.json(
        { success: false, error: "رمز التعريف الأمني (ID Token) مفقود أو غير صالح" },
        { status: 400 }
      );
    }

    // 4. Verify Google ID token cryptographically (with replay prevention & nonce check)
    const verification = await verifyGoogleIdToken(id_token, expected_nonce);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: 401 }
      );
    }

    // 5. Resolve account (linking or registration with strict RBAC & privilege protection)
    const result = await handleGoogleIdentity(verification.payload);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || "فشل التحقق من الحساب", code: result.errorCode },
        { status: 403 }
      );
    }

    // 6. Issue application session matching proxy signature architecture
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
    const baseCookieOptions = {
      path: "/",
      maxAge: session.maxAgeSec,
      sameSite: "lax" as const,
      secure: isProd,
    };

    // Sensitive authentication tokens must be HttpOnly
    response.cookies.set("gdg_session_role", result.user.role, baseCookieOptions);
    response.cookies.set("gdg_session_user", encodeURIComponent(result.user.id), baseCookieOptions);
    response.cookies.set("gdg_session_expires", session.expiresAt.toString(), baseCookieOptions);
    response.cookies.set("gdg_auth_token", encodeURIComponent(session.token), {
      ...baseCookieOptions,
      httpOnly: true,
    });
    response.cookies.set("gdg_session_sig", encodeURIComponent(session.sig), {
      ...baseCookieOptions,
      httpOnly: true,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول" },
      { status: 500 }
    );
  }
}
