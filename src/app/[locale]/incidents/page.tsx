"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  Plus,
  Scale,
  FileCheck,
  CheckCircle,
  Clock,
  ArrowDown,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";

export default function IncidentsPage() {
  const { incidents, availableUsers, locale } = useApp();
  const isAr = locale === "ar";

  const getMemberName = (id: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id;
  };

  const ladderSteps = [
    {
      level: 1,
      title: isAr ? "المستوى 1: تنبيه ودي مباشر" : "Level 1: Friendly Notice",
      tagColor: "bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]",
      dotColor: "bg-[#1a73e8]",
      desc: isAr
        ? "محادثة توجيهية هادئة ومباشرة بين العضو وقائد الفريق لمعالجة أي قصور أولي فور حدوثه."
        : "Informal, constructive 1-on-1 alignment meeting to address minor issues and align expectations early.",
      action: isAr ? "إجراء غير عقابي" : "Non-Punitive Advisory",
    },
    {
      level: 2,
      title: isAr ? "المستوى 2: خطة تحسين الأداء (PIP)" : "Level 2: Performance Improvement Plan (PIP)",
      tagColor: "bg-[#fef7e0] text-[#b06000] border-[#feefc3]",
      dotColor: "bg-[#fbbc04]",
      desc: isAr
        ? "خطة أهداف محددة ومكتوبة بمهلة زمنية (عادة أسبوعين إلى 30 يوماً) مع تحديد أوجه الدعم والتدريب اللازمة."
        : "Written, time-bound objectives agreement with designated team support and weekly progress checkpoints.",
      action: isAr ? "خطة داعمة موثقة" : "Formal Developmental Support",
    },
    {
      level: 3,
      title: isAr ? "المستوى 3: مراجعة قائد ونائب الفريق" : "Level 3: Head / Vice Head Review",
      tagColor: "bg-[#feefe3] text-[#e37400] border-[#fed7b2]",
      dotColor: "bg-[#e37400]",
      desc: isAr
        ? "جلسة استماع رسمية على مستوى قيادة اللجنة ومسؤول الموارد البشرية لتقييم أسباب عدم تحقق أهداف الـ PIP."
        : "Formal committee review hearing with Track Lead and HR Admin evaluating unaddressed milestones.",
      action: isAr ? "جلسة استماع رسمية" : "Formal Committee Hearing",
    },
    {
      level: 4,
      title: isAr ? "المستوى 4: تصعيد لقيادة مجتمع GDG" : "Level 4: Community Leadership Escalation",
      tagColor: "bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]",
      dotColor: "bg-[#ea4335]",
      desc: isAr
        ? "إحالة الملف إلى قائد GDG NCTU ومجلس الإدارة لاتخاذ القرار المؤسسي النهائي بعد استيفاء حق الدفاع والتحقيق."
        : "Final executive hearing with Chapter Lead and Executive Board for binding status determinations.",
      action: isAr ? "قرار مجلس القيادة" : "Executive Board Determination",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={
          isAr
            ? "سلم التصعيد الإداري المتدرج ومتابعة الحالات"
            : "Progressive Escalation Ladder & Incident Governance"
        }
        description={
          isAr
            ? "نظام التدرج الإداري من 4 مستويات متدرجة الألوان (أزرق → أصفر → برتقالي → أحمر) لضمان الشفافية والعدالة."
            : "4-level progressive vertical stepper ladder with color graduation from Blue to Yellow to Orange to Red."
        }
      />

      {/* Vertical Stepper Escalation Ladder (from ui ana item 4) */}
      <Card className="border border-border bg-card shadow-2xs">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#ea4335]" />
            <span>
              {isAr
                ? "مخطط سلم التصعيد التدريجي (Vertical Stepper Ladder)"
                : "Vertical Stepper: 4-Level Progressive Escalation Protocol"}
            </span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAr
              ? "لا يجوز الانتقال لمستوى أعلى إلا بعد استيفاء خطوات المستوى السابق وإتاحة فرصة كاملة للعضو للتحسين والتوضيح."
              : "Strict procedural fairness: Higher levels cannot be invoked without documented exhaustion of prior steps."}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:top-3 before:bottom-3 before:left-2.5 sm:before:left-3.5 before:w-0.5 before:bg-[#dadce0] dark:before:bg-[#3c4043]">
            {ladderSteps.map((step) => (
              <div key={step.level} className="relative group">
                {/* Stepper Dot */}
                <span
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background ring-4 ring-card ${step.dotColor}`}
                />

                <div className="p-4 rounded-lg bg-[#f8f9fa] dark:bg-[#202124] border border-border hover:border-primary/40 transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${step.tagColor}`}
                      >
                        Level {step.level}
                      </span>
                      <h4 className="font-bold text-xs text-foreground">
                        {step.title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {step.action}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Incidents Records */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground px-1">
          {isAr ? "الحالات والوقائع المسجلة رسمياً" : "Official Incident Records"}
        </h3>

        <div className="space-y-3">
          {incidents.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
              <p className="text-sm font-semibold">
                {isAr ? "لا توجد مخالفات أو وقائع مسجلة حالياً" : "No active incidents recorded"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr
                  ? "السجل الإداري منضبط تماماً وخالٍ من أي بلاغات أو مخالفات مفتوحة."
                  : "All teams are in good standing with zero open disciplinary reports."}
              </p>
            </Card>
          ) : (
            incidents.map((inc) => (
            <Card
              key={inc.id}
              className="p-4 border border-border bg-card hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]">
                      Level {inc.escalation_level ?? 1}
                    </span>
                    <h4 className="font-bold text-xs text-foreground">
                      {inc.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target Member: <strong>{getMemberName(inc.target_member_id || inc.member_id || "")}</strong> • Reported by: {getMemberName(inc.reported_by)}
                  </p>
                </div>
                <StatusBadge status={inc.status} size="sm" />
              </div>

              <p className="text-xs text-foreground bg-[#f8f9fa] dark:bg-[#202124] p-3 rounded-md border border-border">
                {inc.description}
              </p>

              {inc.decision_notes && (
                <div className="text-xs text-[#137333] dark:text-[#81c995] bg-[#e6f4ea] dark:bg-[#34a853]/20 p-2.5 rounded-md border border-[#ceead6]">
                  <strong>{isAr ? "القرار الرسمي والتسوية:" : "Formal Resolution Note:"}</strong>{" "}
                  {inc.decision_notes}
                </div>
              )}
            </Card>
          )))}
        </div>
      </div>
    </div>
  );
}
