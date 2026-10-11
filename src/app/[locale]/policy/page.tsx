"use client";

import React from "react";
import {
  Settings,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";

export default function PolicyPage() {
  const { locale } = useApp();
  const isAr = locale === "ar";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "السياسات واللوائح المعتمدة" : "Official Policies & Configuration"}
        description={
          isAr
            ? "اللوائح الرسمية غير القابلة للتأويل لمجتمع GDG بجامعة القاهرة التكنولوجية الجديدة، وإعدادات التقويم والأيام الرسمية."
            : "Immutable published policy governance, working-day calendar configuration, and category mappings."
        }
      />

      {/* Non-Negotiable Directives Card */}
      <Card className="border-border/80 border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>
              {isAr
                ? "المبادئ الحاكمة الأساسية (غير قابلة للتفاوض)"
                : "Non-Negotiable Policy Guardrails"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-foreground">
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
            <strong>1. الفصل التام بين النقاط والتقييم الشهري:</strong>
            <p className="text-muted-foreground mt-0.5">
              رصيد النقاط (الإيجابي والسلبي) مستقل استقلالاً تاماً عن درجة التقييم الشهري (من 100). لا يُخصم أي رقم من درجة التقييم بسبب نقاط اللائحة.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
            <strong>2. حظر العقوبات التلقائية من الأرقام وحدها:</strong>
            <p className="text-muted-foreground mt-0.5">
              لا يؤدي انخفاض رصيد النقاط أو بلوغ الرصيد الأحمر إلى الفصل أو التجميد المباشر إطلاقاً. العقوبة تتطلب واقعة موثقة + إخطار + تحقيق إداري.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
            <strong>3. مهلة التوضيح الإلزامية قبل تسجيل الخصم:</strong>
            <p className="text-muted-foreground mt-0.5">
              يلتزم فريق الموارد البشرية بإخطار العضو المعني ومنحه مهلة 48 ساعة لتقديم توضيح أو عذر رسمي قبل البت في تسجيل أي نقطة سلبية.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
            <strong>4. المخالفات الجسيمة (المساس بالنزاهة أو الأخلاقيات):</strong>
            <p className="text-muted-foreground mt-0.5">
              تُحال المخالفات الجسيمة فوراً إلى التحقيق الإداري ولا تخضع لخصم نقاط رقمية مسبقة.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Egyptian Working Days Calendar Configuration */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>
              {isAr ? "إعدادات تقويم أيام العمل المصرية" : "Egyptian Working-Day Calendar Setup"}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
              Configured: Sun – Thu
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <p className="text-muted-foreground">
            {isAr
              ? "تُحسب المهل القانونية (مثل مهلة الـ 7 أيام لتقديم التظلمات) وفق تقويم العمل الرسمي في جمهورية مصر العربية."
              : "All operational deadlines (such as the 7-day appeal submission window) strictly adhere to official Egyptian business days."}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-center">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((day) => (
              <div key={day} className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-400">
                {day}
                <span className="block text-[10px] font-normal text-muted-foreground">Working Day</span>
              </div>
            ))}
            {["Friday", "Saturday"].map((day) => (
              <div key={day} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 font-bold text-rose-700 dark:text-rose-400">
                {day}
                <span className="block text-[10px] font-normal text-muted-foreground">Weekend (Excluded)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
