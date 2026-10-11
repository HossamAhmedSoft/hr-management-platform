"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Award,
  Users,
  CheckCircle,
  Clock,
  BookOpen,
  Calendar,
  FileCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";

export default function EducationPage() {
  const { educationalTracks, attendees, locale } = useApp();
  const isAr = locale === "ar";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "المسارات التعليمية والشهادات" : "Educational Tracks & Certification"}
        description={
          isAr
            ? "تقييم المتدربين والمدربين في ورش العمل والمسارات التقنية بجامعة القاهرة التكنولوجية الجديدة (منفصلة تماماً عن تقييم الأداء الشهري للفرق)."
            : "Technical education tracks, student evaluation (100 pts), certificate eligibility (≥75%), and instructor metrics."
        }
      />

      {/* Criteria Formula Strip */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>
              {isAr
                ? "معايير تقييم المتدربين للحصول على الشهادة الرسمية (100 درجة)"
                : "Student Evaluation & Certification Rubric (100 pts)"}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
              {isAr ? "شرط الشهادة ≥ 75%" : "Passing Threshold ≥ 75%"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="text-2xl font-black text-primary">40%</span>
              <p className="font-bold text-foreground">
                {isAr ? "الحضور والانضباط" : "Attendance & Punctuality"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="text-2xl font-black text-emerald-600">30%</span>
              <p className="font-bold text-foreground">
                {isAr ? "التطبيقات والمشاريع" : "Projects & Assignments"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="text-2xl font-black text-amber-600">20%</span>
              <p className="font-bold text-foreground">
                {isAr ? "التفاعل والمشاركة" : "Active Participation"}
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="text-2xl font-black text-blue-600">10%</span>
              <p className="font-bold text-foreground">
                {isAr ? "السلوك والتعاون" : "Conduct & Collaboration"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracks Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">
          {isAr ? "المسارات التعليمية الفعالة" : "Active Educational Tracks"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {educationalTracks.map((tr) => (
            <Card key={tr.id} className="p-5 border-border/80 hover:shadow-lg transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-foreground">
                    {isAr ? tr.name_ar : tr.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tr.description}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  Cohort 1 Active
                </span>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  12 Sessions Curriculum
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  Verified Certificates Ready
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Attendees Roster with Certificate Status */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">
            {isAr ? "قائمة الطلاب والشهادات الصادرة" : "Enrolled Students & Certificate Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendees.map((att) => (
              <div
                key={att.id}
                className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h5 className="font-bold text-foreground">{att.full_name}</h5>
                  <p className="text-muted-foreground">{att.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">
                    Final Score: 93 / 100
                  </span>
                  {att.is_certified ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isAr ? "شهادة معتمدة" : "Certified"}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                      {isAr ? "قيد استيفاء المتطلبات" : "In Progress"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
