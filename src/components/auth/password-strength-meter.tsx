"use client";

import React from "react";
import { Check, X, ShieldAlert, ShieldCheck } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  isAr: boolean;
}

export function PasswordStrengthMeter({ password, isAr }: PasswordStrengthMeterProps) {
  const criteria = [
    {
      id: "length",
      label_en: "At least 8 characters",
      label_ar: "8 أحرف على الأقل",
      met: password.length >= 8,
    },
    {
      id: "upper",
      label_en: "Uppercase letter (A-Z)",
      label_ar: "حرف كبير بالإنجليزية (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label_en: "Lowercase letter (a-z)",
      label_ar: "حرف صغير بالإنجليزية (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      id: "number",
      label_en: "At least one number (0-9)",
      label_ar: "رقم واحد على الأقل (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      id: "special",
      label_en: "Special symbol (!@#$%^&*)",
      label_ar: "رمز خاص (!@#$%^&*)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  const strengthPercentage = (metCount / criteria.length) * 100;

  let strengthLabel = isAr ? "ضعيفة" : "Weak";
  let strengthColor = "bg-rose-500";
  let strengthTextColor = "text-rose-500";

  if (metCount >= 4) {
    strengthLabel = isAr ? "قوية جداً" : "Very Strong";
    strengthColor = "bg-emerald-500";
    strengthTextColor = "text-emerald-500";
  } else if (metCount === 3) {
    strengthLabel = isAr ? "جيدة" : "Good";
    strengthColor = "bg-blue-500";
    strengthTextColor = "text-blue-500";
  } else if (metCount === 2) {
    strengthLabel = isAr ? "متوسطة" : "Medium";
    strengthColor = "bg-amber-500";
    strengthTextColor = "text-amber-500";
  }

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs transition-all">
      <div className="flex items-center justify-between font-medium">
        <span className="text-slate-600 dark:text-zinc-400">
          {isAr ? "قوة كلمة المرور:" : "Password Strength:"}
        </span>
        <span className={`font-semibold ${strengthTextColor} flex items-center gap-1`}>
          {metCount >= 4 ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5" />
          )}
          {strengthLabel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${strengthColor}`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((c) => (
          <div
            key={c.id}
            className={`flex items-center gap-1.5 transition-colors ${
              c.met ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-500"
            }`}
          >
            {c.met ? (
              <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
            )}
            <span className="text-[11px] leading-tight">{isAr ? c.label_ar : c.label_en}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
