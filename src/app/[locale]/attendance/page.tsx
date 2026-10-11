"use client";

import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/app-context";

interface AttendanceEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
}

export default function AttendancePage() {
  const { locale, availableUsers, currentUser } = useApp();
  const isAr = locale === "ar";
  const userRole = currentUser?.role || "member";
  const canCreateMeeting = userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";

  const [events, setEvents] = useState<AttendanceEvent[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("gdg_nctu_attendance_events");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("Main Campus / Google Meet");
  const [newType, setNewType] = useState("General Assembly");

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEvt: AttendanceEvent = {
      id: `evt_${Date.now()}`,
      title: newTitle,
      date: new Date().toISOString(),
      location: newLocation,
      type: newType,
      presentCount: availableUsers.length,
      absentCount: 0,
      excusedCount: 0,
    };

    const updated = [newEvt, ...events];
    setEvents(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("gdg_nctu_attendance_events", JSON.stringify(updated));
    }
    setNewTitle("");
    setIsNewMeetingOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "الحضور والاجتماعات الرسمية" : "Attendance & Official Meetings"}
        description={
          isAr
            ? "تسجيل حضور الاجتماعات العامة والورش، مع دعم الأعذار الأكاديمية والطبية الموثقة مسبقاً."
            : "Meeting logs, check-in tracking, and documented academic/medical excuse workflows."
        }
      >
        {canCreateMeeting && (
          <Button
            size="sm"
            onClick={() => setIsNewMeetingOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            {isAr ? "تسجيل اجتماع جديد" : "Record New Meeting"}
          </Button>
        )}
      </PageHeader>

      {events.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
          <p className="text-sm font-semibold">
            {isAr ? "لا توجد اجتماعات مسجلة حالياً" : "No meetings recorded yet"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr
              ? (canCreateMeeting ? "اضغط على 'تسجيل اجتماع جديد' بالأعلى لتوثيق حضور اجتماع عام أو ورشة عمل." : "لا توجد اجتماعات معلنة أو مسجلة لك حالياً.")
              : (canCreateMeeting ? "Click 'Record New Meeting' above to log attendance for a session." : "No meetings currently scheduled or logged.")}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((ev) => (
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
                  Verified
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
      )}

      {/* New Meeting Dialog */}
      {isNewMeetingOpen && (
        <Dialog open={isNewMeetingOpen} onOpenChange={setIsNewMeetingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "تسجيل اجتماع جديد" : "Record New Meeting"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMeeting} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "عنوان الاجتماع أو الورشة:" : "Meeting Title:"}
                </label>
                <Input
                  required
                  placeholder={isAr ? "مثال: الاجتماع التنسيقي العام" : "e.g., General Assembly Sync"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "الموقع / القاعة:" : "Location / Venue:"}
                </label>
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "نوع الاجتماع:" : "Meeting Type:"}
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  <option value="General Assembly">{isAr ? "اجتماع عام إلزامي" : "General Assembly (Mandatory)"}</option>
                  <option value="Track Sync">{isAr ? "جلسة مسار تقني" : "Track Sync"}</option>
                  <option value="Executive Review">{isAr ? "اجتماع قيادة إداري" : "Executive Review"}</option>
                  <option value="Workshop">{isAr ? "ورشة عمل تدريبية" : "Training Workshop"}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewMeetingOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-white">
                  {isAr ? "حفظ وتوثيق" : "Save Record"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
