"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Hash, AlertCircle, RefreshCw } from "lucide-react";
import { RegistrationStatus } from "@/types";

interface StatusCheckDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAr: boolean;
  onStatusFound: (data: {
    status: RegistrationStatus;
    referenceNo: string;
    email: string;
    fullName?: string;
    submittedAt?: string;
    decisionReason?: string;
    infoRequestedFields?: string[];
    infoRequestMessage?: string;
    reapplyCooldownUntil?: string;
  }) => void;
}

export function StatusCheckDrawer({
  isOpen,
  onOpenChange,
  isAr,
  onStatusFound,
}: StatusCheckDrawerProps) {
  const [referenceNo, setReferenceNo] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNo.trim() || !email.trim()) {
      setError(isAr ? "يرجى إدخال رقم المرجع والبريد الإلكتروني." : "Please enter both reference number and email.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/auth/registration/status?ref=${encodeURIComponent(
          referenceNo.trim().toUpperCase()
        )}&email=${encodeURIComponent(email.trim().toLowerCase())}`
      );
      const data = await res.json();

      if (res.ok && data.success && data.found) {
        onOpenChange(false);
        onStatusFound({
          status: data.status,
          referenceNo: data.reference_no,
          email: email.trim().toLowerCase(),
          fullName: data.full_name,
          submittedAt: data.submitted_at,
          decisionReason: data.decision_reason,
          infoRequestedFields: data.info_requested_fields,
          infoRequestMessage: data.info_request_message,
          reapplyCooldownUntil: data.reapply_cooldown_until,
        });
      } else {
        setError(data.error || (isAr ? "لم يتم العثور على طلب مطابق للبيانات." : "No matching application found."));
      }
    } catch {
      setError(isAr ? "حدث خطأ أثناء الاستعلام." : "Error checking application status.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950">
        <DialogHeader className="text-center sm:text-start pb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 mx-auto sm:mx-0">
            <Search className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            {isAr ? "متابعة حالة طلب الانضمام" : "Track Application Status"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
            {isAr
              ? "أدخل رقم المرجع الرسمي والبريد الإلكتروني المسجل به لمتابعة حالة المراجعة."
              : "Enter your official reference number and email to track review progress."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleQuery} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? "رقم المرجع (Reference No)" : "Reference Number"}</span>
            </label>
            <Input
              required
              placeholder="e.g. REG-2026-NCTU-XXXX"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="h-10 text-xs rounded-xl font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span>{isAr ? "البريد الإلكتروني المسجل" : "Registered Email"}</span>
            </label>
            <Input
              type="email"
              required
              placeholder="name@nctu.edu.eg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isAr ? "جاري الاستعلام..." : "Checking..."}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{isAr ? "استعلام عن الحالة الآن" : "Query Application"}</span>
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
