"use client";

import React from "react";
import {
  Target,
  ShieldCheck,
  Heart,
  Scale,
  Award,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";

export default function HRKPIsPage() {
  const { locale } = useApp();
  const isAr = locale === "ar";

  const hrMetrics = [
    {
      title: isAr ? "التواصل ودعم الأعضاء" : "Communication & Member Support",
      target: "5.0 / 5.0",
      description: isAr
        ? "سرعة الرد على استفسارات الأعضاء وتوفير بيئة داعمة للنمو والتوجيه."
        : "Responsiveness to member requests and supportive engagement.",
      icon: Heart,
      color: "text-rose-500",
    },
    {
      title: isAr ? "سرية السجلات والبيانات" : "Confidentiality of Records",
      target: "5.0 / 5.0",
      description: isAr
        ? "حماية تامة للبيانات الحساسة، الملاحظات الخاصة والتحقيقات الإدارية."
        : "Zero data leakage, encrypted notes and strict access control.",
      icon: ShieldCheck,
      color: "text-primary",
    },
    {
      title: isAr ? "دمج ومتابعة الأعضاء الجدد" : "Member Integration & Follow-up",
      target: "5.0 / 5.0",
      description: isAr
        ? "متابعة مسار اندماج الأعضاء باللجان وخطط التطوير الفردية."
        : "Smooth onboarding, peer buddy matching and check-ins.",
      icon: Target,
      color: "text-emerald-500",
    },
    {
      title: isAr ? "عدالة ونزاهة التقييم" : "Fairness of Evaluation",
      target: "5.0 / 5.0",
      description: isAr
        ? "تطبيق حيادي لميثاق النقاط وتفعيل مراجعة التظلمات المحايدة."
        : "Objective evidence-based scoring and neutral appeal resolution.",
      icon: Scale,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "مؤشرات كفاءة الموارد البشرية" : "HR Operations Quality KPIs"}
        description={
          isAr
            ? "المعايير الأربعة المعتمدة لتقييم أداء فريق الموارد البشرية وضمان العدالة المؤسسية."
            : "The 4 official quality benchmarks for the HR team ensuring integrity, fairness, and support."
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {hrMetrics.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={idx}
              className="p-5 border-border/80 hover:shadow-lg transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-muted/60">
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      {kpi.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Benchmark Criterion #{idx + 1}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-black text-foreground">
                  {kpi.target}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {kpi.description}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
