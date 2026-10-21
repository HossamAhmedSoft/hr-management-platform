"use client";

import React, { useState, useEffect } from "react";
import { Form, FormEntityLink, FormResponse } from "@/types/forms";
import { internalDB } from "@/lib/internal-db";
import { dbService } from "@/lib/db-service";
import {
  FileText,
  ExternalLink,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FormEntityWidgetProps {
  entityType: "task" | "profile" | "team" | "track" | "incident" | "attendance";
  entityId?: string;
  entityName?: string;
  locale: "en" | "ar";
}

export function FormEntityWidget({
  entityType,
  entityId,
  entityName,
  locale,
}: FormEntityWidgetProps) {
  const isAr = locale === "ar";
  const [links, setLinks] = useState<FormEntityLink[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntityForms() {
      try {
        const allLinks = internalDB.getFormEntityLinks(undefined, entityType, entityId);
        setLinks(allLinks);

        const allForms = await dbService.getForms();
        const linkedForms = allForms.filter((f) => allLinks.some((l) => l.form_id === f.id));
        setForms(linkedForms);

        // Fetch responses
        const allResps: FormResponse[] = [];
        for (const lf of linkedForms) {
          const r = await dbService.getFormResponses(lf.id);
          allResps.push(...r);
        }
        setResponses(allResps);
      } catch (e) {
        console.error("Error loading entity forms:", e);
      } finally {
        setLoading(false);
      }
    }
    loadEntityForms();
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
        {isAr ? "جاري تحميل النماذج المرتبطة..." : "Loading linked forms..."}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {isAr ? "النماذج والاستمارات المرتبطة" : "Linked Forms & Intake"}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {isAr
                ? `استمارات موصولة بـ ${entityType} (${entityName || entityId || "عام"})`
                : `Forms mapped to this ${entityType}`}
            </p>
          </div>
        </div>

        <Link href={`/${locale}/forms`}>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
            <span>{isAr ? "دليل النماذج" : "Forms Hub"}</span>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Button>
        </Link>
      </div>

      {/* Forms List */}
      <div className="space-y-3">
        {forms.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-border rounded-xl space-y-2">
            <Layers className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "لا توجد استمارات مخصصة لهذا الكيان حالياً."
                : "No forms currently linked to this entity."}
            </p>
          </div>
        ) : (
          forms.map((f) => (
            <div
              key={f.id}
              className="p-3.5 rounded-xl bg-muted/20 border border-border/70 hover:border-primary/50 transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground truncate">
                    {isAr ? f.title_ar || f.title : f.title}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {f.response_count || 0} {isAr ? "رد" : "submissions"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {isAr ? f.description_ar || f.description : f.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`/${locale}/forms/p/${f.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <span>{isAr ? "تعبئة الاستمارة" : "Fill Form"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <Link href={`/${locale}/forms/${f.id}/responses`}>
                  <Button variant="outline" size="sm" className="text-xs h-8 px-2">
                    {isAr ? "الردود" : "View"}
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
