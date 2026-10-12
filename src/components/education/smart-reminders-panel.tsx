"use client";

import React, { useState } from "react";
import {
  Bell,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Sliders,
  Send,
  Zap,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReminderRule, ReminderExecutionLog } from "@/types";
import { tracksService } from "@/lib/tracks-service";

interface SmartRemindersPanelProps {
  isAr: boolean;
  canManage: boolean;
  onRefresh: () => void;
}

export function SmartRemindersPanel({
  isAr,
  canManage,
  onRefresh,
}: SmartRemindersPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<{
    generatedCount: number;
    suppressedCount: number;
  } | null>(null);

  const rules = tracksService.getReminderRules();
  const logs = tracksService.getReminderLogs();

  const handleTriggerProcessing = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const res = tracksService.evaluateAndGenerateReminders();
      setLastRunResult({
        generatedCount: res.generatedCount,
        suppressedCount: res.suppressedCount,
      });
      setIsProcessing(false);
      onRefresh();
    }, 600);
  };

  const handleToggleRule = (ruleId: string) => {
    tracksService.toggleReminderRule(ruleId);
    onRefresh();
  };

  const activeRulesCount = rules.filter((r) => r.enabled).length;
  const sentLogsCount = logs.filter((l) => l.status === "sent").length;
  const suppressedCount = logs.filter((l) => l.status === "suppressed_completed").length;

  return (
    <div className="space-y-6">
      {/* Overview Banner & Trigger Bar */}
      <Card className="border-border/80 bg-gradient-to-r from-card to-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {isAr
                    ? "محرك التنبيهات الذكية وسياسات الإشعارات"
                    : "Intelligent Smart Reminders & Scheduling Engine"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr
                    ? "جدولة آلية غير مزعجة، منع التكرار (Idempotency Key)، وحجب التنبيهات تلقائياً عند تسليم المهمة أو تقديم عذر رسمي."
                    : "Idempotent background evaluation, suppression upon completion/excuse, and multi-offset deadline alerts."}
                </p>
              </div>
            </div>

            {canManage && (
              <Button
                onClick={handleTriggerProcessing}
                disabled={isProcessing}
                className="h-9 text-xs font-bold bg-[#1a73e8] text-white gap-2 shadow-xs"
              >
                {isProcessing ? (
                  <RotateCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span>
                  {isProcessing
                    ? isAr
                      ? "جاري الفحص والمعالجة..."
                      : "Processing Reminders..."
                    : isAr
                    ? "تشغيل فحص التنبيهات الآن"
                    : "Run Evaluation Job Now"}
                </span>
              </Button>
            )}
          </div>

          {lastRunResult && (
            <div className="mt-4 p-3 rounded-lg bg-[#34a853]/10 border border-[#34a853]/30 text-xs text-[#34a853] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAr
                    ? `اكتمل الفحص: تم إرسال ${lastRunResult.generatedCount} تنبيهاً جديداً، وحجب ${lastRunResult.suppressedCount} إشعاراً مكتملاً لمنع الإزعاج.`
                    : `Evaluation completed: ${lastRunResult.generatedCount} new reminders dispatched, ${lastRunResult.suppressedCount} suppressed because actions were already completed.`}
                </span>
              </div>
              <span className="font-mono text-[10px] opacity-80">Processed just now</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 border-border/80 bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground flex justify-between">
            <span>{isAr ? "السياسات النشطة" : "Active Rules"}</span>
            <Sliders className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {activeRulesCount} / {rules.length}
          </div>
          <span className="text-[10px] text-muted-foreground">Configured Policies</span>
        </Card>

        <Card className="p-3 border-border/80 bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground flex justify-between">
            <span>{isAr ? "إشعارات تم تسليمها" : "Dispatched Alerts"}</span>
            <Send className="w-3.5 h-3.5 text-[#34a853]" />
          </div>
          <div className="text-2xl font-black text-[#34a853] mt-1">
            {sentLogsCount}
          </div>
          <span className="text-[10px] text-muted-foreground">In-App Notifications</span>
        </Card>

        <Card className="p-3 border-border/80 bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground flex justify-between">
            <span>{isAr ? "حجب الإزعاج (مكتمل)" : "Suppressed (Done)"}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {suppressedCount}
          </div>
          <span className="text-[10px] text-muted-foreground">Already Submitted / Excused</span>
        </Card>

        <Card className="p-3 border-border/80 bg-card">
          <div className="text-[11px] font-semibold text-muted-foreground flex justify-between">
            <span>{isAr ? "قنوات التسليم" : "Channels"}</span>
            <Bell className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            In-App
          </div>
          <span className="text-[10px] text-muted-foreground">Email Provider Ready</span>
        </Card>
      </div>

      {/* Configurable Reminder Rules Catalog */}
      <Card className="border-border/80">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              {isAr ? "سياسات وقواعد التنبيهات المعتمدة" : "Configurable Reminder Policies"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isAr
                ? "إمكانية تشغيل أو إيقاف أي قاعدة، وتحديد الإزاحة الزمنية والقناة المستهدفة."
                : "Manage offsets before/after events, recipient roles, quiet hours, and active status."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-xl border border-border/80 bg-card flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {isAr ? rule.name_ar : rule.name}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {rule.reminder_type.replace(/_/g, " ")}
                    </Badge>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary">
                      Offset: {rule.time_offset_hours > 0 ? `+${rule.time_offset_hours}h` : `${rule.time_offset_hours}h`}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAr ? rule.message_template_ar : rule.message_template}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                    <span>Recipient: <strong>{rule.recipient_role}</strong></span>
                    <span>•</span>
                    <span>Channel: <strong>{rule.delivery_channel}</strong></span>
                    <span>•</span>
                    <span>Quiet Hours: <strong>{rule.quiet_hours_start} - {rule.quiet_hours_end}</strong></span>
                  </div>
                </div>

                {canManage && (
                  <Button
                    size="sm"
                    variant={rule.enabled ? "default" : "outline"}
                    onClick={() => handleToggleRule(rule.id)}
                    className={`h-7 text-xs font-semibold shrink-0 ${
                      rule.enabled ? "bg-[#34a853] text-white" : "text-muted-foreground"
                    }`}
                  >
                    {rule.enabled ? (isAr ? "مفعلة" : "Enabled") : (isAr ? "معطلة" : "Disabled")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Reminder Execution & Failure Logs */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{isAr ? "سجل تنفيذ التنبيهات وحجب التكرار (Execution & Audit Log)" : "Reminder Execution & Audit Logs"}</span>
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "سجل توثيق المعالجة لكل إشعار مع مفتاح منع التكرار والوقت الفعلي للمعالجة."
              : "Verifiable record of processed reminders with idempotency keys and suppression status."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-2.5 text-start">{isAr ? "القاعدة" : "Rule"}</th>
                  <th className="p-2.5 text-start">{isAr ? "المستلم" : "Recipient ID"}</th>
                  <th className="p-2.5 text-start">{isAr ? "القناة" : "Channel"}</th>
                  <th className="p-2.5 text-start">{isAr ? "الحالة" : "Status"}</th>
                  <th className="p-2.5 text-start">{isAr ? "وقت المعالجة" : "Processed At"}</th>
                  <th className="p-2.5 text-start font-mono">{isAr ? "مفتاح التفرد" : "Idempotency Key"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="p-2.5 font-bold text-foreground">
                      {log.rule_name}
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      {log.recipient_id}
                    </td>
                    <td className="p-2.5">
                      <Badge variant="outline" className="text-[10px]">
                        {log.delivery_channel}
                      </Badge>
                    </td>
                    <td className="p-2.5">
                      <Badge
                        variant={
                          log.status === "sent"
                            ? "success"
                            : log.status === "suppressed_completed"
                            ? "info"
                            : "danger"
                        }
                        className="text-[10px]"
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      {new Date(log.processed_at).toLocaleString()}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-muted-foreground max-w-xs truncate">
                      {log.idempotency_key}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
