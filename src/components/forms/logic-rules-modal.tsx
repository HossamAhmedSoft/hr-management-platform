"use client";

import React, { useState } from "react";
import {
  FormLogicRule,
  FormQuestion,
  FormSection,
  LogicAction,
  LogicOperator,
  LogicCondition,
} from "@/types/forms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowRight, GitBranch } from "lucide-react";
import { generateId } from "@/lib/utils";

interface LogicRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  sections: FormSection[];
  questions: FormQuestion[];
  logicRules: FormLogicRule[];
  onSaveRules: (updatedRules: FormLogicRule[]) => void;
  locale: "en" | "ar";
}

const OPERATORS: Array<{ op: LogicOperator; label: string; label_ar: string }> = [
  { op: "equals", label: "is equal to", label_ar: "يساوي" },
  { op: "not_equals", label: "is not equal to", label_ar: "لا يساوي" },
  { op: "contains", label: "contains", label_ar: "يحتوي على" },
  { op: "greater_than", label: "is greater than", label_ar: "أكبر من" },
  { op: "less_than", label: "is less than", label_ar: "أصغر من" },
  { op: "is_empty", label: "is unanswered / empty", label_ar: "فارغ / لم يُجب عليه" },
  { op: "is_not_empty", label: "has an answer", label_ar: "تمت الإجابة عليه" },
];

const ACTIONS: Array<{ action: LogicAction; label: string; label_ar: string }> = [
  { action: "jump_to_section", label: "Jump to Section", label_ar: "الانتقال إلى القسم" },
  { action: "show_question", label: "Show Question", label_ar: "إظهار السؤال" },
  { action: "hide_question", label: "Hide Question", label_ar: "إخفاء السؤال" },
  { action: "submit_form", label: "Submit Form Immediately", label_ar: "إرسال وإنهاء النموذج فوراً" },
];

export function LogicRulesModal({
  isOpen,
  onClose,
  formId,
  sections,
  questions,
  logicRules,
  onSaveRules,
  locale,
}: LogicRulesModalProps) {
  const isAr = locale === "ar";
  const [rules, setRules] = useState<FormLogicRule[]>(() => [...logicRules]);

  const addRule = () => {
    const firstQ = questions[0]?.id || "q1";
    const newRule: FormLogicRule = {
      id: `rule_${generateId()}`,
      form_id: formId,
      source_question_id: firstQ,
      action: "jump_to_section",
      target_id: sections[1]?.id || sections[0]?.id || "sec1",
      conditions: [
        {
          question_id: firstQ,
          operator: "equals",
          value: "",
          combinator: "AND",
        },
      ],
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<FormLogicRule>) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)));
  };

  const removeRule = (ruleId: string) => {
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  const addCondition = (ruleId: string) => {
    setRules(
      rules.map((r) => {
        if (r.id === ruleId) {
          const newCond: LogicCondition = {
            question_id: questions[0]?.id || "q1",
            operator: "equals",
            value: "",
            combinator: "AND",
          };
          return { ...r, conditions: [...r.conditions, newCond] };
        }
        return r;
      })
    );
  };

  const updateCondition = (
    ruleId: string,
    condIndex: number,
    updates: Partial<LogicCondition>
  ) => {
    setRules(
      rules.map((r) => {
        if (r.id === ruleId) {
          const newConds = [...r.conditions];
          newConds[condIndex] = { ...newConds[condIndex], ...updates };
          return { ...r, conditions: newConds };
        }
        return r;
      })
    );
  };

  const removeCondition = (ruleId: string, condIndex: number) => {
    setRules(
      rules.map((r) => {
        if (r.id === ruleId) {
          const newConds = r.conditions.filter((_, idx) => idx !== condIndex);
          return { ...r, conditions: newConds };
        }
        return r;
      })
    );
  };

  const handleSave = () => {
    onSaveRules(rules);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {isAr ? "قواعد المنطق والتفرع الشرطي" : "Conditional Branching & Logic Rules"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isAr
                  ? "تحديد الانتقال بين الأقسام أو إظهار/إخفاء الأسئلة بناءً على إجابات معينة."
                  : "Navigate respondents to specific sections or show/hide questions based on their answers."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {rules.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
              <GitBranch className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground">
                {isAr ? "لا توجد قواعد منطقية محددة بعد" : "No conditional rules created yet"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                {isAr
                  ? "يمكنك توجيه المستخدم لقسم معين أو إظهار حقول إضافية بناءً على اختياره."
                  : "Add rules to skip sections or show dynamic questions tailored to each respondent."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRule}
                className="mt-4 text-xs"
              >
                <Plus className="w-3.5 h-3.5 me-1" />
                {isAr ? "إضافة أول قاعدة منطقية" : "Add First Rule"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, ruleIdx) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl border border-border bg-muted/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      {isAr ? `قاعدة رقم ${ruleIdx + 1}` : `Rule #${ruleIdx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-2">
                    {rule.conditions.map((cond, condIdx) => {
                      const selectedQ = questions.find((q) => q.id === cond.question_id);
                      const hasOptions =
                        selectedQ?.type === "multiple_choice" ||
                        selectedQ?.type === "dropdown" ||
                        selectedQ?.type === "checkboxes";

                      return (
                        <div key={condIdx} className="flex flex-wrap items-center gap-2 text-xs">
                          {condIdx > 0 && (
                            <select
                              value={cond.combinator || "AND"}
                              onChange={(e) =>
                                updateCondition(rule.id, condIdx, {
                                  combinator: e.target.value as "AND" | "OR",
                                })
                              }
                              className="font-bold text-[11px] bg-background px-2 py-1 rounded border border-border"
                            >
                              <option value="AND">AND (و)</option>
                              <option value="OR">OR (أو)</option>
                            </select>
                          )}
                          <span className="text-muted-foreground font-medium">
                            {isAr ? "إذا كانت إجابة" : "IF"}
                          </span>
                          <select
                            value={cond.question_id}
                            onChange={(e) =>
                              updateCondition(rule.id, condIdx, {
                                question_id: e.target.value,
                              })
                            }
                            className="bg-background px-2.5 py-1 rounded border border-border max-w-[180px] truncate"
                          >
                            {questions.map((q) => (
                              <option key={q.id} value={q.id}>
                                {isAr ? q.title_ar || q.title : q.title}
                              </option>
                            ))}
                          </select>

                          <select
                            value={cond.operator}
                            onChange={(e) =>
                              updateCondition(rule.id, condIdx, {
                                operator: e.target.value as LogicOperator,
                              })
                            }
                            className="bg-background px-2.5 py-1 rounded border border-border font-medium"
                          >
                            {OPERATORS.map((op) => (
                              <option key={op.op} value={op.op}>
                                {isAr ? op.label_ar : op.label}
                              </option>
                            ))}
                          </select>

                          {cond.operator !== "is_empty" && cond.operator !== "is_not_empty" && (
                            hasOptions && selectedQ?.options ? (
                              <select
                                value={cond.value}
                                onChange={(e) =>
                                  updateCondition(rule.id, condIdx, {
                                    value: e.target.value,
                                  })
                                }
                                className="bg-background px-2.5 py-1 rounded border border-border max-w-[150px] truncate"
                              >
                                <option value="">Select option...</option>
                                {selectedQ.options.map((opt) => (
                                  <option key={opt.id} value={opt.value}>
                                    {isAr ? opt.label_ar || opt.label : opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={cond.value || ""}
                                onChange={(e) =>
                                  updateCondition(rule.id, condIdx, {
                                    value: e.target.value,
                                  })
                                }
                                placeholder="Value..."
                                className="bg-background px-2.5 py-1 rounded border border-border text-xs w-32"
                              />
                            )
                          )}

                          {rule.conditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCondition(rule.id, condIdx)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addCondition(rule.id)}
                      className="text-[11px] h-6 px-2 text-primary"
                    >
                      <Plus className="w-3 h-3 me-1" />
                      {isAr ? "إضافة شرط فرعي (AND/OR)" : "Add condition"}
                    </Button>
                  </div>

                  {/* Action Selection */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      {isAr ? "الإجراء المطلوب (THEN):" : "THEN:"}
                    </span>

                    <select
                      value={rule.action}
                      onChange={(e) =>
                        updateRule(rule.id, { action: e.target.value as LogicAction })
                      }
                      className="bg-background px-2.5 py-1 rounded border border-border font-medium"
                    >
                      {ACTIONS.map((a) => (
                        <option key={a.action} value={a.action}>
                          {isAr ? a.label_ar : a.label}
                        </option>
                      ))}
                    </select>

                    {rule.action === "jump_to_section" && (
                      <select
                        value={rule.target_id}
                        onChange={(e) => updateRule(rule.id, { target_id: e.target.value })}
                        className="bg-background px-2.5 py-1 rounded border border-border max-w-[200px] truncate"
                      >
                        {sections.map((sec, secIdx) => (
                          <option key={sec.id} value={sec.id}>
                            Section {secIdx + 1}: {isAr ? sec.title_ar : sec.title}
                          </option>
                        ))}
                      </select>
                    )}

                    {(rule.action === "show_question" || rule.action === "hide_question") && (
                      <select
                        value={rule.target_id}
                        onChange={(e) => updateRule(rule.id, { target_id: e.target.value })}
                        className="bg-background px-2.5 py-1 rounded border border-border max-w-[200px] truncate"
                      >
                        {questions.map((q) => (
                          <option key={q.id} value={q.id}>
                            {isAr ? q.title_ar || q.title : q.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRule}
                className="w-full text-xs"
              >
                <Plus className="w-3.5 h-3.5 me-1" />
                {isAr ? "إضافة قاعدة تفرع أخرى" : "Add Another Rule"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="text-xs">
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="button" onClick={handleSave} className="text-xs">
            {isAr ? "حفظ وتطبيق القواعد" : "Save Logic Rules"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
