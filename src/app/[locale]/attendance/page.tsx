"use client";

import React, { useState } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Users,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";

export default function AttendancePage() {
  const { locale, availableUsers } = useApp();
  const isAr = locale === "ar";

  const sampleEvents = [
    {
      id: "ev-1",
      title: isAr ? "الاجتماع التنسيقي العام لـ GDG NCTU" : "GDG NCTU General Assembly Sync",
      date: "2026-10-18T16:00:00Z",
      location: "Main Campus Auditorium A",
      type: "Mandatory",
      presentCount: 65,
      absentCount: 7,
      excusedCount: 5,
    },
    {
      id: "ev-2",
      title: isAr ? "جلسة مسار الويب: مراجعة معمارية Next.js" : "Web Track: Next.js Architecture Review",
      date: "2026-10-22T17:30:00Z",
      location: "Lab 3 & Google Meet",
      type: "Track Sync",
      presentCount: 15,
      absentCount: 1,
      excusedCount: 0,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "الحضور والاجتماعات الرسمية" : "Attendance & Official Meetings"}
        description={
          isAr
            ? "تسجيل حضور الاجتماعات العامة والورش، مع دعم الأعذار الأكاديمية والطبية الموثقة مسبقاً."
            : "Meeting logs, check-in tracking, and documented academic/medical excuse workflows."
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sampleEvents.map((ev) => (
          <Card key={ev.id} className="p-5 border-border/80 hover:shadow-lg transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {ev.type}
                </span>
                <h3 className="font-bold text-base text-foreground mt-1">
                  {ev.title}
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Active Record
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(ev.date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {ev.location}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <span className="font-extrabold text-lg block">{ev.presentCount}</span>
                <span>{isAr ? "حضور" : "Present"}</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <span className="font-extrabold text-lg block">{ev.excusedCount}</span>
                <span>{isAr ? "أعذار مقبولة" : "Excused"}</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400">
                <span className="font-extrabold text-lg block">{ev.absentCount}</span>
                <span>{isAr ? "غياب غير مبرر" : "Unexcused"}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
