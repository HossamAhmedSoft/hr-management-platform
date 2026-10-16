"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, BookOpen, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { tracksService } from "@/lib/tracks-service";
import { Participant, TechnicalTrack } from "@/types";

interface EnrollTraineeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  tracks: TechnicalTrack[];
  preselectedParticipantId?: string;
  preselectedTrackId?: string;
  onSuccess: () => void;
  logUserAction?: (action: any) => void;
  isAr: boolean;
}

export function EnrollTraineeModal({
  isOpen,
  onOpenChange,
  participants,
  tracks,
  preselectedParticipantId = "",
  preselectedTrackId = "",
  onSuccess,
  logUserAction,
  isAr,
}: EnrollTraineeModalProps) {
  const [participantId, setParticipantId] = useState(preselectedParticipantId);
  const [trackId, setTrackId] = useState(preselectedTrackId);
  const [cohort, setCohort] = useState("Season 2026 - Cohort 1");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setParticipantId(preselectedParticipantId);
      setTrackId(preselectedTrackId || (tracks[0]?.id || ""));
      setError(null);
    }
  }, [isOpen, preselectedParticipantId, preselectedTrackId, tracks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId) {
      setError(isAr ? "يرجى تحديد المتدرب أولاً." : "Please select a trainee.");
      return;
    }
    if (!trackId) {
      setError(isAr ? "يرجى اختيار المسار التقني." : "Please select a technical track.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = tracksService.createEnrollment(participantId, trackId, cohort);
    if (!res.success) {
      setError(res.error || (isAr ? "فشل تسجيل المتدرب بالمسار." : "Failed to enroll participant."));
      setIsSubmitting(false);
      return;
    }

    if (logUserAction) {
      const selectedPart = participants.find((p) => p.id === participantId);
      const selectedTrk = tracks.find((t) => t.id === trackId);
      logUserAction({
        action: "PARTICIPANT_ENROLLED",
        entity_type: "track_enrollment",
        entity_id: res.enrollment?.id || `enr_${Date.now()}`,
        reason: `تسجيل المتدرب "${selectedPart?.full_name}" في المسار التقني "${selectedTrk?.name_ar || selectedTrk?.name}"`,
        details: `Cohort: ${cohort}.`,
        after_value: { participant_id: participantId, track_id: trackId },
      });
    }

    setIsSubmitting(false);
    onOpenChange(false);
    onSuccess();
  };

  const selectedParticipant = participants.find((p) => p.id === participantId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card text-card-foreground">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                {isAr ? "تنسيب متدرب إلى مسار تقني" : "Enroll Trainee in Track"}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/80 mt-0.5">
                {isAr
                  ? "إلحاق المتدرب بالمسار وتفعيل خطة المتابعة الأكاديمية والمهام."
                  : "Assign trainee to a track and enable their academic syllabus."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Trainee Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {isAr ? "المتدرب المراد تنسيبه" : "Select Trainee"}
              <span className="text-rose-500">*</span>
            </Label>
            <select
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="">{isAr ? "-- اختر المتدرب --" : "-- Select trainee --"}</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.email})
                </option>
              ))}
            </select>
            {selectedParticipant && (
              <p className="text-[11px] text-muted-foreground">
                {selectedParticipant.university} • {selectedParticipant.faculty_department}
              </p>
            )}
          </div>

          {/* Track Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {isAr ? "المسار التدريبي المستهدف" : "Target Track"}
              <span className="text-rose-500">*</span>
            </Label>
            <select
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="">{isAr ? "-- اختر المسار --" : "-- Select track --"}</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {isAr ? t.name_ar : t.name} ({t.cohort})
                </option>
              ))}
            </select>
          </div>

          {/* Cohort */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {isAr ? "الدفعة / الموسم" : "Cohort"}
            </Label>
            <Input
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              className="h-10 text-xs rounded-xl border-border bg-background focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
              placeholder="Season 2026 - Cohort 1"
            />
          </div>

          {/* Footer */}
          <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-9 px-4 text-xs"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="rounded-xl h-9 px-5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? "تأكيد التنسيب" : "Confirm Enrollment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
