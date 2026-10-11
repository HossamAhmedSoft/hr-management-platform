"use client";

import React, { useState } from "react";
import {
  HeartHandshake,
  Plus,
  Calendar,
  Lock,
  Target,
  Clock,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/app-context";

export default function FeedbackPage() {
  const { feedbackSessions, availableUsers, locale } = useApp();
  const isAr = locale === "ar";

  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);

  const getMemberName = (id: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "جلسات المتابعة وخطط التحسين (PIP)" : "Feedback Sessions & PIP Support"}
        description={
          isAr
            ? "جلسات التوجيه الدورية (Strengths, Improvement, Next Steps, Support) وخطط التحسين الشخصية الداعمة."
            : "Constructive feedback loops and Performance Improvement Plans designed to support member development."
        }
      >
        <Button
          size="sm"
          onClick={() => setIsNewSessionOpen(true)}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {isAr ? "تسجيل جلسة متابعة" : "Schedule Feedback Session"}
        </Button>
      </PageHeader>

      {/* Feedback Sessions List */}
      <div className="space-y-4">
        {feedbackSessions.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <HeartHandshake className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">
              {isAr ? "لا توجد جلسات متابعة أو خطط تحسين مسجلة حالياً" : "No feedback or PIP sessions scheduled yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "جلسات المتابعة مصممة لدعم نمو الأعضاء وتوثيق نقاط القوة وخطط التطوير."
                : "Feedback loops are conducted regularly to guide member growth and alignment."}
            </p>
          </Card>
        ) : (
          feedbackSessions.map((fs) => (
          <Card key={fs.id} className="p-5 border-border/80 hover:shadow-md transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {getMemberName(fs.member_id)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Conducted by: {getMemberName(fs.provider_id)} • Date: {fs.date}
                </p>
              </div>
              <StatusBadge status={fs.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                  {isAr ? "نقاط القوة والإشادة:" : "Key Strengths:"}
                </span>
                <p className="text-foreground">{fs.strengths}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
                  {isAr ? "مجالات التطوير المقترحة:" : "Areas for Growth:"}
                </span>
                <p className="text-foreground">{fs.improvement_area}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="font-bold text-foreground block mb-1">
                  {isAr ? "الخطوات المتفق عليها:" : "Agreed Next Steps:"}
                </span>
                <p className="text-muted-foreground">{fs.next_step}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="font-bold text-foreground block mb-1">
                  {isAr ? "الدعم المطلوب من الفريق:" : "Support Required from Team:"}
                </span>
                <p className="text-muted-foreground">{fs.support_required}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Follow-up Check: {fs.follow_up_date}
              </span>
              <span className="flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                <Lock className="w-3 h-3 text-muted-foreground" />
                HR Private Notes Encrypted
              </span>
            </div>
          </Card>
        )))}
      </div>
    </div>
  );
}
