"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Send,
  Calendar,
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
import { Task, TaskPriority, TaskStatus } from "@/types";

export default function TasksPage() {
  const { tasks, teams, addTask, updateTaskStatus, availableUsers, locale, currentUser } = useApp();
  const isAr = locale === "ar";

  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canCreateTask = userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";
  const canApproveTask = userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTeam, setNewTeam] = useState(teams[0]?.id || "");
  const [newAssignee, setNewAssignee] = useState(availableUsers[0]?.id || "");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newDeadline, setNewDeadline] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [deliverableLink, setDeliverableLink] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [delayDate, setDelayDate] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16));

  React.useEffect(() => {
    if (!newTeam && teams.length > 0) {
      setNewTeam(teams[0].id);
    }
    if (!newAssignee && availableUsers.length > 0) {
      setNewAssignee(availableUsers[0].id);
    }
  }, [teams, newTeam, availableUsers, newAssignee]);

  // Bulletproof matching helper for tasks
  const isAssignedToUser = (task: Task) => {
    if (!currentUser) return false;
    if (task.created_by === currentUser.id) return true;

    if (task.assignees && Array.isArray(task.assignees)) {
      for (const a of task.assignees) {
        if (!a) continue;
        if (a.profile_id === currentUser.id || a.profile?.id === currentUser.id) return true;
        if (
          currentUser.email &&
          a.profile?.email &&
          a.profile.email.toLowerCase() === currentUser.email.toLowerCase()
        ) {
          return true;
        }
        const matched = availableUsers.find((u) => u.id === a.profile_id);
        if (matched) {
          if (matched.id === currentUser.id) return true;
          if (
            currentUser.email &&
            matched.email &&
            matched.email.toLowerCase() === currentUser.email.toLowerCase()
          ) {
            return true;
          }
        }
      }
    }

    if (currentUser.team_id && task.team_id === currentUser.team_id) {
      return true;
    }

    return false;
  };

  // Scoped tasks based on user role
  const visibleTasks = tasks.filter((t) => {
    if (isMember) {
      // Ordinary member sees tasks assigned to them, created by them, or matching their team
      return isAssignedToUser(t);
    }
    if (userRole === "team_lead" && currentUser?.team_id) {
      // Team lead sees tasks in their team, created by them, or assigned to them
      return (
        t.team_id === currentUser.team_id ||
        t.created_by === currentUser.id ||
        isAssignedToUser(t)
      );
    }
    return true;
  });

  const filteredTasks = visibleTasks.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  const getAssigneeInfo = (task: Task) => {
    if (!task.assignees || task.assignees.length === 0) {
      return isAr ? "غير محدد" : "Unassigned";
    }
    const a = task.assignees[0];
    const user = a.profile || availableUsers.find((u) => u.id === a.profile_id);
    return user?.full_name || (isAr ? "عضو مكلف" : "Assigned Member");
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateTask) {
      alert(
        isAr
          ? "عذراً، صلاحية إنشاء وتكليف المهام مقتصرة على قادة الفرق ومسؤولي الإدارة."
          : "Permission denied: Only team leads and administrators can create tasks."
      );
      return;
    }
    if (!newTitle.trim()) return;

    const chosenAssigneeUser = availableUsers.find((u) => u.id === newAssignee);
    const resolvedTeamId = newTeam || chosenAssigneeUser?.team_id || teams[0]?.id || "team-general";

    addTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      team_id: resolvedTeamId,
      created_by: currentUser?.id || "admin",
      status: "assigned",
      priority: newPriority,
      deadline: new Date(newDeadline).toISOString(),
      assignees: newAssignee
        ? [
            {
              id: `assignee_${Date.now()}`,
              task_id: "",
              profile_id: newAssignee,
              profile: chosenAssigneeUser,
              assigned_at: new Date().toISOString(),
              assigned_by: currentUser?.id || "admin",
            },
          ]
        : undefined,
    });

    setNewTitle("");
    setNewDesc("");
    setIsNewTaskOpen(false);
  };

  const handleSubmitDeliverable = () => {
    if (!selectedTask || !deliverableLink.trim()) return;
    updateTaskStatus(selectedTask.id, "submitted");
    setIsSubmitModalOpen(false);
    setSelectedTask(null);
    setDeliverableLink("");
  };

  const handleRequestDelay = () => {
    if (!selectedTask || !delayReason.trim()) return;
    alert(
      isAr
        ? "تم إرسال طلب تمديد الموعد إلى قائد الفريق للمراجعة والاعتماد."
        : "Delay request submitted to Team Lead for review."
    );
    setIsDelayModalOpen(false);
    setSelectedTask(null);
    setDelayReason("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={isAr ? (isMember ? "مهامي وتكليفاتي" : "إدارة المهام والتسليمات") : (isMember ? "My Assigned Tasks" : "Tasks & Milestone Delivery")}
        description={
          isAr
            ? isMember
              ? "استعراض المهام المسندة إليك، وتقديم روابط المخرجات وإرسال طلبات تمديد الموعد لقائد الفريق."
              : "متابعة دورة حياة المهام (تكليف → تنفيذ → تسليم → مراجعة واعتماد) وطلبات التأجيل المسبقة."
            : isMember
              ? "View deliverables assigned to you, submit your work, and request deadline adjustments."
              : "Complete task lifecycle governance: assignment, evidence submission, delay requests, and reviews."
        }
      >
        {canCreateTask && (
          <Button
            size="sm"
            onClick={() => setIsNewTaskOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            {isAr ? "مهمة جديدة" : "New Task"}
          </Button>
        )}
      </PageHeader>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: isAr ? "الكل" : "All" },
          { key: "assigned", label: isAr ? "المُعينة" : "Assigned" },
          { key: "in_progress", label: isAr ? "قيد التنفيذ" : "In Progress" },
          { key: "submitted", label: isAr ? "تم التسليم" : "Submitted" },
          { key: "under_review", label: isAr ? "قيد المراجعة" : "Under Review" },
          { key: "completed", label: isAr ? "مكتملة" : "Completed" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filterStatus === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(tab.key)}
            className="text-xs h-8 rounded-full"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.length === 0 ? (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">
              {isAr ? "لا توجد مهام مسجلة حالياً" : "No tasks found"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "اضغط على 'إنشاء مهمة جديدة' بالأعلى لتعيين تكليف لإحدى اللجان أو الأعضاء."
                : "Click 'Create Task' above to assign deliverables to a team."}
            </p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
          <Card
            key={task.id}
            className="p-5 border-border/70 hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {task.priority} Priority
                </span>
                <StatusBadge status={task.status} />
              </div>

              <h3 className="font-bold text-sm text-foreground mb-1.5">
                {task.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                {task.description}
              </p>

              {/* Assignee & Personal Assignment Badge */}
              <div className="flex items-center justify-between text-xs text-muted-foreground my-2 pb-2 border-b border-border/40">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground text-[11px]">
                    {isAr ? "المكلف:" : "Assignee:"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-muted text-foreground text-[11px] font-medium">
                    {getAssigneeInfo(task)}
                  </span>
                </div>
                {isAssignedToUser(task) && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#e8f0fe] dark:bg-[#1a73e8]/25 text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#1a73e8]/30">
                    {isAr ? "مكلف بها أنت" : "Assigned to You"}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Due: {new Date(task.deadline).toLocaleDateString()}
                </span>
                {task.reviewer_comments && (
                  <span className="text-emerald-600 font-semibold">Reviewed</span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {task.status !== "completed" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsSubmitModalOpen(true);
                      }}
                      className="flex-1 text-xs h-8 gap-1"
                    >
                      <Send className="w-3 h-3 text-primary" />
                      {isAr ? "تسليم" : "Submit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDelayModalOpen(true);
                      }}
                      className="text-xs h-8 text-amber-600 hover:bg-amber-500/10"
                    >
                      {isAr ? "تأجيل" : "Delay"}
                    </Button>
                  </>
                )}
                {task.status === "submitted" && canApproveTask && (
                  <Button
                    size="sm"
                    onClick={() => updateTaskStatus(task.id, "completed")}
                    className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    {isAr ? "اعتماد الإنجاز" : "Approve"}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )))}
      </div>

      {/* New Task Modal */}
      {isNewTaskOpen && canCreateTask && (
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "إنشاء مهمة عمل وتكليف عضو" : "Create New Task & Assign"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "عنوان المهمة:" : "Task Title:"}
                </label>
                <Input
                  required
                  placeholder={
                    isAr ? "مثال: تجهيز تصميم ورشة العمل..." : "e.g. Design Hackathon Poster..."
                  }
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "تفاصيل المهمة ومعايير القبول:" : "Description & Acceptance Criteria:"}
                </label>
                <Textarea
                  rows={3}
                  placeholder={
                    isAr ? "المتطلبات ومعايير الجودة..." : "Requirements and acceptance criteria..."
                  }
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "الفريق المسؤول:" : "Target Team:"}
                  </label>
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.name_ar : t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "العضو المكلف بالمهمة:" : "Assignee Member:"}
                  </label>
                  <select
                    value={newAssignee}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewAssignee(val);
                      const user = availableUsers.find((u) => u.id === val);
                      if (user?.team_id) {
                        setNewTeam(user.team_id);
                      }
                    }}
                    className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "الأولوية:" : "Priority:"}
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">
                    {isAr ? "الموعد النهائي للتسليم:" : "Deadline:"}
                  </label>
                  <Input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewTaskOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" size="sm">
                  {isAr ? "حفظ وتكليف" : "Create & Assign"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Submit Deliverable Modal */}
      {isSubmitModalOpen && selectedTask && (
        <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "تسليم مخرجات المهمة" : "Submit Deliverable Evidence"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-xs">
              <p className="text-muted-foreground">
                Task: <strong className="text-foreground">{selectedTask.title}</strong>
              </p>
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "رابط التسليم (GitHub / Drive / Figma):" : "Deliverable Link (GitHub / Drive / Figma):"}
                </label>
                <Input
                  required
                  placeholder="https://..."
                  value={deliverableLink}
                  onChange={(e) => setDeliverableLink(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleSubmitDeliverable}>
                  {isAr ? "إرسال للمراجعة" : "Submit for Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delay Request Modal */}
      {isDelayModalOpen && selectedTask && (
        <Dialog open={isDelayModalOpen} onOpenChange={setIsDelayModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {isAr ? "طلب تمديد موعد المهمة (طلب مسبق)" : "Request Task Delay"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2 text-xs">
              <p className="text-muted-foreground">
                {isAr
                  ? "وفقاً للسياسة، تقديم طلب تأجيل مسبق قبل الموعد يمنع احتساب أي نقاط سلبية."
                  : "Under policy, submitting a justified delay request before deadline avoids any negative point penalties."}
              </p>
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "سبب طلب التأجيل المبرر:" : "Reason for Delay Request:"}
                </label>
                <Textarea
                  required
                  placeholder={
                    isAr ? "امتحانات جامعية / ظرف طارئ..." : "Academic mid-terms / emergency..."
                  }
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">
                  {isAr ? "الموعد المقترح الجديد:" : "Proposed New Deadline:"}
                </label>
                <Input
                  type="datetime-local"
                  value={delayDate}
                  onChange={(e) => setDelayDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDelayModalOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleRequestDelay}>
                  {isAr ? "إرسال الطلب للقائد" : "Submit Delay Request"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
