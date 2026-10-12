"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileText,
  Link as LinkIcon,
  Send,
  Calendar,
  CheckCircle,
  Edit,
  Trash2,
  Filter,
  User,
  X,
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
import { Task, TaskPriority, TaskStatus, TaskAssignee } from "@/types";
import { isUserInTrack } from "@/lib/utils";

export default function TasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberParam = searchParams.get("member");

  const {
    tasks,
    teams,
    addTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    availableUsers,
    locale,
    currentUser,
    logUserAction,
    addNotification,
  } = useApp();
  const isAr = locale === "ar";

  const userRole = currentUser?.role || "member";
  const isMember = userRole === "member";
  const canCreateTask = userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";
  const canApproveTask = userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";
  const canManageTask = userRole === "super_admin" || userRole === "hr_admin" || userRole === "team_lead";

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterMember, setFilterMember] = useState<string>(memberParam || "all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);

  // Edit Task State
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editTeam, setEditTeam] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium");
  const [editDeadline, setEditDeadline] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("assigned");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Task State
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

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

  // Helper: check if member belongs to selected team / committee
  const isUserInTeam = (u: any, teamId?: string) => {
    if (!teamId || teamId === "all") return true;
    return isUserInTrack(u, teamId, teams);
  };

  // Candidate assignees strictly scoped to selected team (zero fallback to all)
  const candidateAssignees = React.useMemo(() => {
    if (!newTeam || newTeam === "all") return availableUsers;
    return availableUsers.filter((u) => isUserInTeam(u, newTeam));
  }, [availableUsers, newTeam]);

  const editCandidateAssignees = React.useMemo(() => {
    if (!editTeam || editTeam === "all") return availableUsers;
    return availableUsers.filter((u) => isUserInTeam(u, editTeam));
  }, [availableUsers, editTeam]);

  useEffect(() => {
    if (memberParam) {
      setFilterMember(memberParam);
    }
  }, [memberParam]);

  useEffect(() => {
    if (!newTeam && teams.length > 0) {
      setNewTeam(teams[0].id);
    }
  }, [teams, newTeam]);

  // Auto-sync newAssignee when candidateAssignees change
  useEffect(() => {
    if (candidateAssignees.length > 0) {
      if (!newAssignee || !candidateAssignees.some((u) => u.id === newAssignee)) {
        setNewAssignee(candidateAssignees[0].id);
      }
    } else {
      setNewAssignee("");
    }
  }, [candidateAssignees, newAssignee]);

  // Auto-sync editAssignee when editCandidateAssignees change
  useEffect(() => {
    if (editCandidateAssignees.length > 0) {
      if (!editAssignee || !editCandidateAssignees.some((u) => u.id === editAssignee)) {
        setEditAssignee(editCandidateAssignees[0].id);
      }
    } else {
      setEditAssignee("");
    }
  }, [editCandidateAssignees, editAssignee]);

  // Precise assignment matching helper
  const isTaskAssignedTo = (task: Task, targetUserId?: string) => {
    if (!targetUserId) return false;
    const targetUser = availableUsers.find((u) => u.id === targetUserId);

    if (task.assignees && Array.isArray(task.assignees) && task.assignees.length > 0) {
      return task.assignees.some((a) => {
        if (!a) return false;
        if (a.profile_id === targetUserId || a.profile?.id === targetUserId) return true;
        if (
          targetUser?.email &&
          a.profile?.email &&
          a.profile.email.toLowerCase() === targetUser.email.toLowerCase()
        ) {
          return true;
        }
        const matched = availableUsers.find((u) => u.id === a.profile_id);
        if (matched) {
          if (matched.id === targetUserId) return true;
          if (
            targetUser?.email &&
            matched.email &&
            matched.email.toLowerCase() === targetUser.email.toLowerCase()
          ) {
            return true;
          }
        }
        return false;
      });
    }

    return false;
  };

  // Scoped tasks based on user role and explicit member filter
  const visibleTasks = tasks.filter((t) => {
    // If ordinary member: strictly show ONLY their assigned tasks!
    if (isMember) {
      return isTaskAssignedTo(t, currentUser?.id) || t.created_by === currentUser?.id;
    }

    // If explicit member filter is applied:
    if (filterMember !== "all") {
      return isTaskAssignedTo(t, filterMember) || t.created_by === filterMember;
    }

    // If team lead without explicit member filter:
    if (userRole === "team_lead" && currentUser?.team_id) {
      return (
        t.team_id === currentUser.team_id ||
        t.created_by === currentUser.id ||
        isTaskAssignedTo(t, currentUser.id)
      );
    }

    // If explicit team filter is applied:
    if (filterTeam !== "all") {
      const targetTeam = filterTeam.toLowerCase().replace("team_", "").replace("team-", "");
      const taskTeam = (t.team_id || "").toLowerCase().replace("team_", "").replace("team-", "");
      if (taskTeam !== targetTeam && !taskTeam.includes(targetTeam)) {
        return false;
      }
    }

    return true;
  });

  const overdueTasks = visibleTasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      t.deadline &&
      new Date(t.deadline).getTime() < Date.now()
  );
  const urgentTasks = visibleTasks.filter((t) => {
    if (t.status === "completed" || t.status === "cancelled" || !t.deadline) return false;
    const diff = (new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
    return diff >= 0 && diff <= 48;
  });

  const filteredTasks = visibleTasks.filter((t) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "escalated") {
      const isPast = t.deadline && new Date(t.deadline).getTime() < Date.now();
      const diff = t.deadline
        ? (new Date(t.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
        : 999;
      return (
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        (isPast || (diff >= 0 && diff <= 48))
      );
    }
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

  const getFilteredMemberName = () => {
    if (filterMember === "all") return "";
    return availableUsers.find((u) => u.id === filterMember)?.full_name || filterMember;
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
      deadline: newDeadline,
      assignees: [
        {
          id: `as_${Date.now()}`,
          task_id: "temp",
          profile_id: newAssignee,
          assigned_at: new Date().toISOString(),
          assigned_by: currentUser?.id || "admin",
          profile: chosenAssigneeUser,
        },
      ],
    });

    setNewTitle("");
    setNewDesc("");
    setIsNewTaskOpen(false);
  };

  // Open Edit Task Modal
  const openEditModal = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditTeam(task.team_id || teams[0]?.id || "");
    const firstAssignee = task.assignees?.[0]?.profile_id || availableUsers[0]?.id || "";
    setEditAssignee(firstAssignee);
    setEditPriority(task.priority || "medium");
    setEditDeadline(
      task.deadline
        ? new Date(task.deadline).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)
    );
    setEditStatus(task.status || "assigned");
    setIsEditTaskOpen(true);
  };

  // Submit Edit Task
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;
    setIsSubmittingEdit(true);

    const chosenAssigneeUser = availableUsers.find((u) => u.id === editAssignee);
    const updatedAssignees: TaskAssignee[] = [
      {
        id: editingTask.assignees?.[0]?.id || `as_${Date.now()}`,
        task_id: editingTask.id,
        profile_id: editAssignee,
        assigned_at: editingTask.assignees?.[0]?.assigned_at || new Date().toISOString(),
        assigned_by: currentUser?.id || "admin",
        profile: chosenAssigneeUser,
      },
    ];

    const success = await updateTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      team_id: editTeam,
      priority: editPriority,
      deadline: editDeadline,
      status: editStatus,
      assignees: updatedAssignees,
    });

    if (success) {
      setIsEditTaskOpen(false);
      setEditingTask(null);
    } else {
      alert(isAr ? "فشل تعديل المهمة" : "Failed to update task");
    }
    setIsSubmittingEdit(false);
  };

  // Open Delete Task Modal
  const openDeleteModal = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingTask(task);
    setIsDeleteTaskOpen(true);
  };

  // Submit Delete Task
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setIsSubmittingDelete(true);
    const success = await deleteTask(deletingTask.id);
    if (success) {
      setIsDeleteTaskOpen(false);
      setDeletingTask(null);
    } else {
      alert(isAr ? "فشل حذف المهمة" : "Failed to delete task");
    }
    setIsSubmittingDelete(false);
  };

  const handleSubmitDeliverable = async () => {
    if (!selectedTask || !deliverableLink.trim()) return;

    await updateTaskStatus(selectedTask.id, "submitted");

    if (logUserAction) {
      await logUserAction({
        action: "TASK_DELIVERABLE_SUBMITTED",
        entity_type: "task",
        entity_id: selectedTask.id,
        reason: `تسليم مخرجات المهمة: ${selectedTask.title}`,
        details: `Deliverable link: ${deliverableLink.trim()}`,
        after_value: {
          task_id: selectedTask.id,
          task_title: selectedTask.title,
          deliverable_link: deliverableLink.trim(),
          submitted_by: currentUser?.id,
        },
      });
    }

    alert(
      isAr
        ? "تم تسليم مخرجات المهمة بنجاح، وإشعار قائد الفريق للمراجعة والاعتماد."
        : "Deliverable evidence submitted successfully for Team Lead review."
    );
    setIsSubmitModalOpen(false);
    setSelectedTask(null);
    setDeliverableLink("");
  };

  const handleRequestDelay = async () => {
    if (!selectedTask || !delayReason.trim()) return;

    if (logUserAction) {
      await logUserAction({
        action: "TASK_DELAY_REQUESTED",
        entity_type: "task",
        entity_id: selectedTask.id,
        reason: `طلب تأجيل موعد المهمة: "${selectedTask.title}" - عذر: ${delayReason.trim()}`,
        details: `Proposed new deadline: ${delayDate}. Reason: ${delayReason.trim()}`,
        after_value: {
          task_id: selectedTask.id,
          task_title: selectedTask.title,
          delay_reason: delayReason.trim(),
          proposed_deadline: delayDate,
        },
      });
    }

    if (addNotification && selectedTask.created_by) {
      addNotification({
        user_id: selectedTask.created_by,
        title: isAr ? "طلب تمديد موعد مهمة" : "Task Delay Request",
        message: isAr
          ? `قدم العضو (${currentUser?.full_name || "عضو"}) طلب تمديد للمهمة "${selectedTask.title}": ${delayReason}`
          : `Member (${currentUser?.full_name || "Member"}) requested deadline extension for "${selectedTask.title}".`,
        type: "general",
        link: `/${locale}/tasks`,
        is_read: false,
      });
    }

    alert(
      isAr
        ? "تم إرسال وتوثيق طلب تمديد الموعد إلى قائد الفريق للمراجعة والاعتماد."
        : "Delay request logged and submitted to Team Lead for review."
    );
    setIsDelayModalOpen(false);
    setSelectedTask(null);
    setDelayReason("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={
          isAr
            ? isMember
              ? "مهامي وتكليفاتي"
              : filterMember !== "all"
              ? `مهمات العضو: ${getFilteredMemberName()}`
              : "إدارة المهام والتسليمات"
            : isMember
            ? "My Assigned Tasks"
            : filterMember !== "all"
            ? `Tasks for: ${getFilteredMemberName()}`
            : "Tasks & Milestone Delivery"
        }
        description={
          isAr
            ? isMember
              ? "استعراض المهام المسندة إليك حصراً، وتقديم روابط المخرجات وإرسال طلبات تمديد الموعد لقائد الفريق."
              : "متابعة دورة حياة المهام والتسليمات، مع إمكانية عزل مهام كل عضو وتعديل أو حذف التكليفات."
            : isMember
            ? "View deliverables assigned exclusively to you, submit your work, and request deadline adjustments."
            : "Complete task lifecycle governance: assign, filter by member, edit, delete, and review."
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

      {/* Member Filter Banner if isolated to single member */}
      {filterMember !== "all" && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">
              {isAr
                ? `يتم الآن عرض مهمات العضو (${getFilteredMemberName()}) فقط.`
                : `Showing tasks assigned to: ${getFilteredMemberName()}`}
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterMember("all");
              router.push(`/${locale}/tasks`);
            }}
            className="h-7 text-xs gap-1 text-primary hover:bg-primary/20"
          >
            <X className="w-3.5 h-3.5" />
            {isAr ? "إلغاء التصفية (عرض الكل)" : "Clear Filter"}
          </Button>
        </div>
      )}

      {/* Critical Milestone Escalation Banner */}
      {(overdueTasks.length > 0 || urgentTasks.length > 0) && (
        <div className="p-3.5 rounded-2xl bg-[#fce8e6] dark:bg-[#ea4335]/15 border border-[#fad2cf] dark:border-[#ea4335]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#ea4335] shrink-0" />
            <div>
              <span className="font-bold text-[#c5221f] dark:text-[#f28b82] block text-xs">
                {isAr
                  ? `تنبيه حرج لمتابعة المواعيد: يوجد ${overdueTasks.length} مهام متأخرة و ${urgentTasks.length} مهام تنتهي قريباً!`
                  : `Milestone Alert: ${overdueTasks.length} overdue tasks and ${urgentTasks.length} tasks due soon!`}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {isAr
                  ? "يرجى من قادة المسارات متابعة الأعضاء المكلفين لضمان التسليم في الوقت المحدد."
                  : "Team Leads should follow up with assignees to ensure timely delivery."}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterStatus(filterStatus === "escalated" ? "all" : "escalated")}
            className="h-7 text-xs bg-card border-[#ea4335]/40 text-[#c5221f] dark:text-[#f28b82] hover:bg-[#ea4335]/10 font-bold"
          >
            {filterStatus === "escalated"
              ? isAr
                ? "عرض كافة المهام"
                : "Show All"
              : isAr
              ? "عرض المهام الحرجة فقط"
              : "View Critical Only"}
          </Button>
        </div>
      )}

      {/* Filter Bar with Member Selector and Status Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { key: "all", label: isAr ? "الكل" : "All" },
            {
              key: "escalated",
              label: isAr
                ? `⚠️ متأخرة وعاجلة (${overdueTasks.length + urgentTasks.length})`
                : `⚠️ Urgent (${overdueTasks.length + urgentTasks.length})`,
            },
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
              className="text-xs h-8 rounded-xl shrink-0"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Member and Team Filter Dropdowns for Admins */}
        {!isMember && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2 h-8">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer max-w-[160px]"
              >
                <option value="all">{isAr ? "كل الفرق واللجان" : "All Teams"}</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {isAr ? t.name_ar : t.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filterMember}
              onChange={(e) => {
                const val = e.target.value;
                setFilterMember(val);
                if (val === "all") {
                  router.push(`/${locale}/tasks`);
                } else {
                  router.push(`/${locale}/tasks?member=${val}`);
                }
              }}
              className="h-8 px-2.5 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none max-w-[200px]"
            >
              <option value="all">
                {isAr ? "جميع الأعضاء المكلفين" : "All Assignees"}
              </option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTasks.length === 0 ? (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
            <p className="text-sm font-semibold">
              {isAr
                ? filterMember !== "all"
                  ? `لا توجد مهمات مسندة للعضو (${getFilteredMemberName()}) في هذا القسم`
                  : "لا توجد مهام مسجلة حالياً"
                : "No tasks found for current filter"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr
                ? "اضغط على 'إنشاء مهمة جديدة' بالأعلى لتعيين تكليف لإحدى اللجان أو الأعضاء."
                : "Click 'New Task' above to assign deliverables to a team."}
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
                  {isTaskAssignedTo(task, currentUser?.id) && (
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

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
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

                  {/* Edit Task Button for Admins */}
                  {canManageTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => openEditModal(task, e)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      title={isAr ? "تعديل المهمة" : "Edit Task"}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  {/* Delete Task Button for Admins */}
                  {canManageTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => openDeleteModal(task, e)}
                      className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-500/10"
                      title={isAr ? "حذف المهمة نهائياً" : "Delete Task"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Task Modal */}
      {isEditTaskOpen && editingTask && (
        <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                {isAr ? "تعديل بيانات المهمة" : "Edit Task"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 pt-2 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "عنوان المهمة:" : "Task Title:"}
                </label>
                <Input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-9"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "التفاصيل والمعايير:" : "Description:"}
                </label>
                <Textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "الفريق المسؤول:" : "Team:"}
                  </label>
                  <select
                    value={editTeam}
                    onChange={(e) => {
                      const newT = e.target.value;
                      setEditTeam(newT);
                      const filtered = availableUsers.filter((u) => isUserInTeam(u, newT));
                      if (filtered.length > 0 && !filtered.some((u) => u.id === editAssignee)) {
                        setEditAssignee(filtered[0].id);
                      }
                    }}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isAr ? t.name_ar : t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "العضو المكلف (ضمن الفريق):" : "Assignee (Within Team):"}
                  </label>
                  <select
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none"
                  >
                    {editCandidateAssignees.length === 0 ? (
                      <option value="" disabled>
                        {isAr ? "لا يوجد أعضاء مسجلين في هذا الفريق بعد" : "No members registered in this team"}
                      </option>
                    ) : (
                      editCandidateAssignees.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role.replace("_", " ")})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "الأولوية:" : "Priority:"}
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {isAr ? "حالة المهمة:" : "Status:"}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="assigned">{isAr ? "مُعينة" : "Assigned"}</option>
                    <option value="in_progress">{isAr ? "قيد التنفيذ" : "In Progress"}</option>
                    <option value="submitted">{isAr ? "تم التسليم" : "Submitted"}</option>
                    <option value="under_review">{isAr ? "قيد المراجعة" : "Under Review"}</option>
                    <option value="completed">{isAr ? "مكتملة" : "Completed"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {isAr ? "الموعد النهائي للتسليم:" : "Deadline:"}
                </label>
                <Input
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditTaskOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEdit}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmittingEdit
                    ? isAr
                      ? "جارِ الحفظ..."
                      : "Saving..."
                    : isAr
                    ? "حفظ التعديلات"
                    : "Save Changes"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Task Confirmation Modal */}
      {isDeleteTaskOpen && deletingTask && (
        <Dialog open={isDeleteTaskOpen} onOpenChange={setIsDeleteTaskOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5 text-rose-600" />
                {isAr ? "تأكيد حذف المهمة" : "Confirm Task Deletion"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-foreground">
                {isAr
                  ? `هل أنت متأكد من رغبتك في حذف المهمة "${deletingTask.title}" نهائياً؟`
                  : `Are you sure you want to delete task "${deletingTask.title}"?`}
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteTaskOpen(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="button"
                  disabled={isSubmittingDelete}
                  size="sm"
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isSubmittingDelete
                    ? isAr
                      ? "جارِ الحذف..."
                      : "Deleting..."
                    : isAr
                    ? "نعم، حذف نهائياً"
                    : "Delete Permanently"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
                    onChange={(e) => {
                      const newT = e.target.value;
                      setNewTeam(newT);
                      const filtered = availableUsers.filter((u) => isUserInTeam(u, newT));
                      if (filtered.length > 0 && !filtered.some((u) => u.id === newAssignee)) {
                        setNewAssignee(filtered[0].id);
                      }
                    }}
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
                    {isAr ? "العضو المكلف بالمهمة (ضمن الفريق):" : "Assignee Member (Within Team):"}
                  </label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    {candidateAssignees.length === 0 ? (
                      <option value="" disabled>
                        {isAr ? "لا يوجد أعضاء مسجلين في هذا الفريق بعد" : "No members registered in this team"}
                      </option>
                    ) : (
                      candidateAssignees.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role.replace("_", " ")})
                        </option>
                      ))
                    )}
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
