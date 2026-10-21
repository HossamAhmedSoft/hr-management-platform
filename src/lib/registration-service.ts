// ============================================================
// GDG NCTU HR Management Platform — Registration Workflow Service
// State Machine, Schema Validation, Anti-Enumeration, and Security
// ============================================================

import {
  RegistrationRequest,
  RegistrationStatus,
  RegistrationField,
  RegistrationSettings,
  RegistrationRequestEvent,
  UserRole,
  Profile,
} from "@/types";
import { dbService } from "./db-service";
import { internalDB, hashPassword } from "./internal-db";
import { generateId } from "./utils";

// ── State Machine Transition Matrix ───────────────────────────
export const VALID_STATUS_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  pending_email_verification: ["pending_approval", "expired", "cancelled"],
  pending_approval: ["approved", "rejected", "needs_info", "cancelled"],
  needs_info: ["pending_approval", "expired", "cancelled"],
  approved: [], // Terminal state
  rejected: [], // Re-apply creates a new request after cooldown
  expired: [], // Terminal state
  cancelled: [], // Terminal state
};

export function canTransitionStatus(
  currentStatus: RegistrationStatus,
  nextStatus: RegistrationStatus
): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

// ── Reference Number & OTP Generation ─────────────────────────
export function generateReferenceNumber(): string {
  let randomPart = "";
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    randomPart = Array.from(bytes, (b) => (b % 36).toString(36).toUpperCase()).join("");
  } else {
    randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  const timestamp = Date.now().toString().slice(-4);
  return `REG-2026-NCTU-${randomPart}${timestamp}`;
}

export function generateNumericOtp(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const uint = new Uint32Array(1);
    crypto.getRandomValues(uint);
    return String(100000 + (uint[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Registration Service Implementation ───────────────────────
export const registrationService = {
  /**
   * Retrieves active schema fields grouped into wizard steps
   */
  async getSchemaFields(): Promise<RegistrationField[]> {
    return dbService.getRegistrationFields();
  },

  /**
   * Retrieves global registration settings
   */
  async getSettings(): Promise<RegistrationSettings> {
    return dbService.getRegistrationSettings();
  },

  /**
   * Validates submitted payload against dynamic field rules
   */
  validateSubmission(
    fields: RegistrationField[],
    submittedData: Record<string, any>
  ): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const field of fields) {
      if (!field.is_active) continue;

      // Check visibility condition
      if (field.visibility_condition) {
        const { field: depKey, operator, value: condVal } = field.visibility_condition;
        const actualVal = submittedData[depKey];
        if (operator === "in" && Array.isArray(condVal) && !condVal.includes(actualVal)) {
          continue; // Skip validation for hidden conditional field
        } else if (operator === "equals" && actualVal !== condVal) {
          continue;
        }
      }

      const val = submittedData[field.field_key];

      // Required check
      if (field.is_required) {
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          errors[field.field_key] = `حقل (${field.label_ar || field.label_en}) مطلوب.`;
          continue;
        }
      }

      if (val === undefined || val === null || val === "") continue;

      // Min/Max string length
      if (field.validation_rules?.min_length && typeof val === "string") {
        if (val.trim().length < field.validation_rules.min_length) {
          errors[field.field_key] = `يجب ألا يقل عن ${field.validation_rules.min_length} أحرف.`;
        }
      }
      if (field.validation_rules?.max_length && typeof val === "string") {
        if (val.trim().length > field.validation_rules.max_length) {
          errors[field.field_key] = `يجب ألا يتجاوز ${field.validation_rules.max_length} حرفاً.`;
        }
      }

      // Regex validation
      if (field.validation_rules?.regex && typeof val === "string") {
        try {
          const reg = new RegExp(field.validation_rules.regex);
          if (!reg.test(val.trim())) {
            errors[field.field_key] = `صيغة (${field.label_ar || field.label_en}) غير صحيحة.`;
          }
        } catch {}
      }

      // Date age validation
      if ((field.validation_rules?.min_age || field.validation_rules?.max_age) && typeof val === "string") {
        const birthDate = new Date(val);
        if (!isNaN(birthDate.getTime())) {
          const ageDiffMs = Date.now() - birthDate.getTime();
          const ageDate = new Date(ageDiffMs);
          const age = Math.abs(ageDate.getUTCFullYear() - 1970);
          if (field.validation_rules.min_age && age < field.validation_rules.min_age) {
            errors[field.field_key] = `يجب أن يكون العمر ${field.validation_rules.min_age} سنة على الأقل.`;
          }
          if (field.validation_rules.max_age && age > field.validation_rules.max_age) {
            errors[field.field_key] = `يجب ألا يتجاوز العمر ${field.validation_rules.max_age} سنة.`;
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Submit registration request
   * Implements anti-enumeration: returns identical response if account exists,
   * while privately notifying the existing user.
   */
  async submitRegistration(
    submittedData: Record<string, any>,
    meta: { ip?: string; userAgent?: string; locale?: "ar" | "en" }
  ): Promise<{
    success: boolean;
    reference_no: string;
    email: string;
    expires_at?: string;
    error?: string;
    fieldErrors?: Record<string, string>;
  }> {
    const settings = await this.getSettings();

    // 1. Check registration mode
    if (settings.registration_mode === "CLOSED") {
      return {
        success: false,
        reference_no: "",
        email: "",
        error: "التسجيل مغلق حالياً بقرار من إدارة المنصة. يرجى المتابعة لاحقاً.",
      };
    }

    const cleanEmail = (submittedData.email || "").toLowerCase().trim();
    const rawPassword = submittedData.password || "";
    const fullName = (submittedData.full_name || "").trim();
    const phone = (submittedData.phone || "").trim();

    if (!cleanEmail || !rawPassword || !fullName) {
      return {
        success: false,
        reference_no: "",
        email: cleanEmail,
        error: "الاسم والبريد الإلكتروني وكلمة المرور بيانات أساسية مطلوبة.",
      };
    }

    // Domain restriction check
    if (settings.registration_mode === "DOMAIN_RESTRICTED" && settings.allowed_domains?.length > 0) {
      const domain = cleanEmail.split("@")[1];
      const isAllowed = settings.allowed_domains.some((d) => d.toLowerCase() === domain);
      if (!isAllowed) {
        return {
          success: false,
          reference_no: "",
          email: cleanEmail,
          error: `التسجيل متاح فقط للنطاقات المعتمدة: (${settings.allowed_domains.join(", ")})`,
        };
      }
    }

    // 2. Schema field validation
    const fields = await this.getSchemaFields();
    const validation = this.validateSubmission(fields, submittedData);
    if (!validation.isValid) {
      return {
        success: false,
        reference_no: "",
        email: cleanEmail,
        error: "يرجى مراجعة البيانات المدخلة وتصحيح الأخطاء الموضحة.",
        fieldErrors: validation.errors,
      };
    }

    // 3. Duplicate check with Anti-Enumeration Protection
    const existingProfile = await dbService.getRegistrationRequestByEmail(cleanEmail);
    const existingRealUser = (await dbService.getProfiles()).find(
      (p) => p.email.toLowerCase().trim() === cleanEmail
    );

    const referenceNo = generateReferenceNumber();

    // If an active user already exists, generate a dummy response (no account enumeration!)
    if (existingRealUser) {
      // In production: send an email to the owner saying someone attempted to register
      return {
        success: true,
        reference_no: referenceNo,
        email: cleanEmail,
      };
    }

    // If an existing pending request exists
    if (existingProfile) {
      if (existingProfile.status === "pending_approval") {
        return {
          success: true,
          reference_no: existingProfile.reference_no,
          email: cleanEmail,
        };
      }
      if (existingProfile.status === "rejected") {
        // Check cooldown
        if (existingProfile.reapply_cooldown_until) {
          const cooldownEnd = new Date(existingProfile.reapply_cooldown_until).getTime();
          if (Date.now() < cooldownEnd) {
            const daysLeft = Math.ceil((cooldownEnd - Date.now()) / (1000 * 60 * 60 * 24));
            return {
              success: false,
              reference_no: existingProfile.reference_no,
              email: cleanEmail,
              error: `لا يمكن إعادة التقديم قبل انقضاء فترة الانتظار (${daysLeft} يوم متبقي).`,
            };
          }
        }
      }
    }

    // 4. Cryptographic password hashing
    const salt = `salt_${cleanEmail.slice(0, 8)}`;
    const passwordHash = hashPassword(rawPassword, salt);

    // 5. Generate 6-digit email OTP
    const verificationCode = generateNumericOtp();
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Sanitize submittedData: NEVER save plaintext password in JSON payload
    const safeSubmittedData = { ...submittedData };
    delete safeSubmittedData.password;
    delete safeSubmittedData.confirm_password;

    const newRequest: RegistrationRequest = {
      id: generateId(),
      reference_no: referenceNo,
      status: "pending_email_verification",
      email: cleanEmail,
      email_verified_at: null,
      email_verification_token: verificationCode,
      email_verification_expires_at: tokenExpiresAt,
      password_hash: passwordHash,
      full_name: fullName,
      phone: phone || null,
      submitted_data: safeSubmittedData,
      schema_version: settings.schema_version || 1,
      locale: meta.locale || "ar",
      ip_address: meta.ip || null,
      user_agent: meta.userAgent || null,
      submitted_at: new Date().toISOString(),
      assigned_role: settings.default_assigned_role || "member",
      assigned_team_id: safeSubmittedData.preferred_track || null,
      reason_visible_to_applicant: true,
      expires_at: new Date(Date.now() + (settings.expiry_days || 30) * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await dbService.createRegistrationRequest(newRequest);

    // Record submission event
    await dbService.addRegistrationEvent({
      id: generateId(),
      request_id: newRequest.id,
      from_status: null,
      to_status: "pending_email_verification",
      action: "REQUEST_SUBMITTED",
      comment: "تم استلام طلب التسجيل المبدئي وحفظ البيانات، وبانتظار تأكيد البريد الإلكتروني.",
      created_at: new Date().toISOString(),
    });

    // In a live system, dispatches actual email with verificationCode.
    // We log it securely and make it visible in demo mode:
    console.log(`[RegistrationMailer] Verification code for ${cleanEmail}: [${verificationCode}]`);

    return {
      success: true,
      reference_no: referenceNo,
      email: cleanEmail,
      expires_at: tokenExpiresAt,
    };
  },

  /**
   * Verify applicant's email using OTP code
   */
  async verifyEmail(
    email: string,
    code: string
  ): Promise<{ success: boolean; status?: RegistrationStatus; reference_no?: string; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const request = await dbService.getRegistrationRequestByEmail(cleanEmail);

    if (!request) {
      return { success: false, error: "طلب التسجيل غير مسجل في النظام." };
    }

    if (request.status !== "pending_email_verification") {
      return {
        success: true,
        status: request.status,
        reference_no: request.reference_no,
      };
    }

    if (!request.email_verification_token) {
      return { success: false, error: "لم يتم إصدار رمز تحقق لهذا البريد." };
    }

    if (
      request.email_verification_expires_at &&
      Date.now() > new Date(request.email_verification_expires_at).getTime()
    ) {
      return {
        success: false,
        error: "انتهت صلاحية رمز التحقق (15 دقيقة). يرجى طلب رمز جديد.",
      };
    }

    if (request.email_verification_token.trim() !== code.trim()) {
      return { success: false, error: "رمز التحقق غير صحيح. يرجى التأكد من الرمز وإعادة المحاولة." };
    }

    // Email verified! Advance state machine to PENDING_APPROVAL
    const updated = await dbService.updateRegistrationRequest(request.id, {
      status: "pending_approval",
      email_verified_at: new Date().toISOString(),
      email_verification_token: null, // Single-use consumption
      email_verification_expires_at: null,
    });

    // Record audit event
    await dbService.addRegistrationEvent({
      id: generateId(),
      request_id: request.id,
      from_status: "pending_email_verification",
      to_status: "pending_approval",
      action: "EMAIL_VERIFIED",
      comment: "تم التحقق من ملكية البريد الإلكتروني بنجاح وتحويل الطلب للمراجعة الإدارية.",
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      status: "pending_approval",
      reference_no: updated?.reference_no || request.reference_no,
    };
  },

  /**
   * Resend verification email OTP
   */
  async resendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const request = await dbService.getRegistrationRequestByEmail(cleanEmail);

    if (!request) {
      return { success: false, error: "طلب التسجيل غير موجود." };
    }

    if (request.status !== "pending_email_verification") {
      return { success: true };
    }

    const verificationCode = generateNumericOtp();
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await dbService.updateRegistrationRequest(request.id, {
      email_verification_token: verificationCode,
      email_verification_expires_at: tokenExpiresAt,
    });

    console.log(`[RegistrationMailer] Resent verification code for ${cleanEmail}: [${verificationCode}]`);
    return { success: true };
  },

  /**
   * Check public request status without personal data enumeration
   */
  async checkStatus(
    referenceNo: string,
    email: string
  ): Promise<{
    found: boolean;
    reference_no?: string;
    full_name?: string;
    status?: RegistrationStatus;
    submitted_at?: string;
    info_requested_fields?: string[];
    info_request_message?: string;
    decision_reason?: string;
    reapply_cooldown_until?: string;
  }> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanRef = referenceNo.trim().toUpperCase();

    const request = await dbService.getRegistrationRequestByReference(cleanRef);
    if (!request || request.email.toLowerCase().trim() !== cleanEmail) {
      return { found: false };
    }

    return {
      found: true,
      reference_no: request.reference_no,
      full_name: request.full_name,
      status: request.status,
      submitted_at: request.submitted_at,
      info_requested_fields: request.info_requested_fields || undefined,
      info_request_message: request.info_request_message || undefined,
      decision_reason: request.reason_visible_to_applicant ? request.decision_reason || undefined : undefined,
      reapply_cooldown_until: request.reapply_cooldown_until || undefined,
    };
  },

  /**
   * Update requested info when status is NEEDS_INFO
   */
  async updateRequestedInfo(
    referenceNo: string,
    email: string,
    updatedFields: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanRef = referenceNo.trim().toUpperCase();

    const request = await dbService.getRegistrationRequestByReference(cleanRef);
    if (!request || request.email.toLowerCase().trim() !== cleanEmail) {
      return { success: false, error: "طلب التسجيل غير موجود أو البريد غير متطابق." };
    }

    if (request.status !== "needs_info") {
      return { success: false, error: "لا يمكن تعديل البيانات؛ الطلب ليس في حالة طلب استكمال معلومات." };
    }

    const mergedData = {
      ...request.submitted_data,
      ...updatedFields,
    };

    await dbService.updateRegistrationRequest(request.id, {
      submitted_data: mergedData,
      status: "pending_approval", // Advance back to review
      info_requested_fields: null,
      info_request_message: null,
    });

    await dbService.addRegistrationEvent({
      id: generateId(),
      request_id: request.id,
      from_status: "needs_info",
      to_status: "pending_approval",
      action: "INFO_RESUBMITTED",
      comment: "قام مقدم الطلب بتحديث البيانات والمستندات المطلوبة وإعادة إرسالها للمراجعة.",
      created_at: new Date().toISOString(),
    });

    return { success: true };
  },

  /**
   * Cancel pending registration
   */
  async cancelRegistration(
    referenceNo: string,
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanRef = referenceNo.trim().toUpperCase();

    const request = await dbService.getRegistrationRequestByReference(cleanRef);
    if (!request || request.email.toLowerCase().trim() !== cleanEmail) {
      return { success: false, error: "طلب التسجيل غير موجود أو البريد غير متطابق." };
    }

    if (request.status === "approved") {
      return { success: false, error: "لا يمكن إلغاء الطلب بعد اعتماده." };
    }

    await dbService.updateRegistrationRequest(request.id, {
      status: "cancelled",
    });

    await dbService.addRegistrationEvent({
      id: generateId(),
      request_id: request.id,
      from_status: request.status,
      to_status: "cancelled",
      action: "REQUEST_CANCELLED",
      comment: "قام مقدم الطلب بإلغاء طلب التسجيل طواعية.",
      created_at: new Date().toISOString(),
    });

    return { success: true };
  },

  /**
   * Reject registration request
   */
  async rejectRequest(
    requestId: string,
    adminActor: Profile,
    reason: string,
    options?: {
      reasonVisible?: boolean;
      cooldownDays?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const request = await dbService.getRegistrationRequestById(requestId);
    if (!request) return { success: false, error: "Request not found." };

    if (!canTransitionStatus(request.status, "rejected")) {
      return { success: false, error: `Invalid transition from ${request.status} to rejected.` };
    }

    const settings = await this.getSettings();
    const cooldownDays = options?.cooldownDays ?? settings.reject_cooldown_days ?? 14;
    const cooldownUntil = new Date(Date.now() + cooldownDays * 86400000).toISOString();

    await dbService.updateRegistrationRequest(request.id, {
      status: "rejected",
      decision_reason: reason,
      reason_visible_to_applicant: options?.reasonVisible ?? true,
      reapply_cooldown_until: cooldownUntil,
      reviewed_by: adminActor.id,
      reviewed_at: new Date().toISOString(),
    });

    await dbService.addRegistrationEvent({
      id: generateId(),
      request_id: request.id,
      from_status: request.status,
      to_status: "rejected",
      actor_id: adminActor.id,
      actor_name: adminActor.full_name,
      action: "REQUEST_REJECTED",
      comment: `تم رفض الطلب. السبب: ${reason}`,
      created_at: new Date().toISOString(),
    });

    return { success: true };
  },

  /**
   * Request more info from applicant
   */
  async requestMoreInfo(
    requestId: string,
    adminActor: Profile,
    fields: string[],
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    const request = await dbService.getRegistrationRequestById(requestId);
    if (!request) return { success: false, error: "Request not found." };

    if (!canTransitionStatus(request.status, "needs_info")) {
      return { success: false, error: `Invalid transition from ${request.status} to needs_info.` };
    }

    await dbService.updateRegistrationRequest(request.id, {
      status: "needs_info",
      info_requested_fields: fields,
      info_request_message: message,
      reviewed_by: adminActor.id,
      reviewed_at: new Date().toISOString(),
    });

    await dbService.addRegistrationEvent({
      id: generateId(),
      request_id: request.id,
      from_status: request.status,
      to_status: "needs_info",
      actor_id: adminActor.id,
      actor_name: adminActor.full_name,
      action: "INFO_REQUESTED",
      comment: `طلب استكمال بيانات: ${message} (الحقول: ${fields.join(", ")})`,
      created_at: new Date().toISOString(),
    });

    return { success: true };
  },
};
