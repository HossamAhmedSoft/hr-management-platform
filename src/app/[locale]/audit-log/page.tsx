"use client";

import React, { useState } from "react";
import {
  FileText,
  Shield,
  Search,
  Filter,
  Clock,
  User,
  Database,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-context";

export default function AuditLogPage() {
  const { availableUsers, locale, auditLogs } = useApp();
  const isAr = locale === "ar";
  const [search, setSearch] = useState("");

  const getActorName = (id?: string) => {
    return availableUsers.find((u) => u.id === id)?.full_name || id || "System";
  };

  const filteredLogs = auditLogs.filter((l) => {
    const actor = getActorName(l.actor_id).toLowerCase();
    const entity = l.entity_type.toLowerCase();
    const action = l.action.toLowerCase();
    const q = search.toLowerCase();
    return actor.includes(q) || entity.includes(q) || action.includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? "سجل التدقيق والعمليات غير القابل للتعديل" : "Tamper-Resistant Audit Trail"}
        description={
          isAr
            ? "سجل إداري غير قابل للحذف أو التعديل، يوثق كل عملية اعتماد، تعديل، أو تغيير في السجلات الحساسة."
            : "Immutable, append-only security logs documenting every state change and approval action."
        }
      />

      <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border border-border/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder={
              isAr ? "بحث في العمليات أو المسؤولين..." : "Search action or actor..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {filteredLogs.length} verified audit records
        </span>
      </div>

      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">{isAr ? "لا توجد عمليات تدقيق مسجلة حتى الآن" : "No audit trail logs recorded yet"}</p>
            <p className="text-xs text-muted-foreground mt-1">{isAr ? "تُسجل جميع العمليات والاعتمادات تلقائياً في هذا السجل غير القابل للتعديل." : "All state transitions and approvals are automatically appended here."}</p>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card
              key={log.id}
              className="p-4 border-border/70 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {log.action}
                  </span>
                  <span className="font-bold text-foreground capitalize">
                    Table: {log.entity_type}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">ID: {log.entity_id}</span>
                </div>
                <p className="text-muted-foreground">
                  Actor: <strong className="text-foreground">{getActorName(log.actor_id)}</strong>
                </p>
                {log.new_state && (
                  <pre className="mt-1 p-2 rounded-lg bg-muted/40 text-[11px] font-mono overflow-x-auto text-foreground/80">
                    {JSON.stringify(log.new_state, null, 2)}
                  </pre>
                )}
              </div>

              <div className="shrink-0 text-muted-foreground text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(log.created_at).toLocaleString()}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
