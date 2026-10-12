"use client";

import React, { useState } from "react";
import {
  Layers,
  Users,
  Code,
  Smartphone,
  Palette,
  Cpu,
  Shield,
  Sparkles,
  Briefcase,
  Star,
  CheckCircle,
  Search,
  Filter,
  Award,
  CheckSquare,
  Clock,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/app-context";

interface TrackDefinition {
  id: string;
  name: string;
  nameAr: string;
  type: "tech" | "non_tech";
  icon: React.ElementType;
  color: string;
  bg: string;
  desc: string;
  descAr: string;
}

export default function TeamsPage() {
  const { availableUsers, tasks, evaluations, pointEvents, locale } = useApp();
  const isAr = locale === "ar";

  const allTracks: TrackDefinition[] = [
    {
      id: "hr",
      name: "Human Resources",
      nameAr: "الموارد البشرية",
      type: "non_tech",
      icon: Users,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
      bg: "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border-[#d2e3fc] dark:border-[#1a73e8]/30",
      desc: "Manages recruitment, performance tracking, conflict mediation, and community welfare.",
      descAr: "مسؤولة عن التوظيف، متابعة وتقييم الأداء، الوساطة وحل النزاعات، وتطبيق لوائح الحوكمة وضمان سلامة بيئة العمل.",
    },
    {
      id: "media",
      name: "Media & Content",
      nameAr: "الإعلام والمحتوى",
      type: "non_tech",
      icon: Palette,
      color: "text-[#ea4335] dark:text-[#f28b82]",
      bg: "bg-[#fce8e6] dark:bg-[#ea4335]/20 border-[#fad2cf] dark:border-[#ea4335]/30",
      desc: "Visual branding, video editing, photography, event coverage, and digital reels.",
      descAr: "إدارة الهوية البصرية، إنتاج وتعديل الفيديو، التصوير الفوتوغرافي، تغطية الفعاليات وصناعة المحتوى الرقمي المبتكر.",
    },
    {
      id: "pr",
      name: "Public Relations & Marketing",
      nameAr: "العلاقات العامة والتسويق",
      type: "non_tech",
      icon: Sparkles,
      color: "text-[#b06000] dark:text-[#fdd663]",
      bg: "bg-[#fef7e0] dark:bg-[#fbbc04]/20 border-[#feefc3] dark:border-[#fbbc04]/30",
      desc: "Sponsorship acquisitions, corporate relations, campus reach, and campaigns.",
      descAr: "جذب الرعايات والشراكات المؤسسية، التواصل مع الشركات، إدارة الحملات الترويجية وتوسيع انتشار النادي داخل الحرم الجامعي.",
    },
    {
      id: "ops",
      name: "Operations & Logistics",
      nameAr: "العمليات واللوجستيات",
      type: "non_tech",
      icon: Layers,
      color: "text-[#137333] dark:text-[#81c995]",
      bg: "bg-[#e6f4ea] dark:bg-[#34a853]/20 border-[#ceead6] dark:border-[#34a853]/30",
      desc: "Auditorium reservations, sound equipment, stage lighting, and smooth event execution.",
      descAr: "حجز القاعات والمدرجات، تجهيز معدات الصوت والإضاءة، إدارة الحشود، والتنظيم الميداني اللوجستي لكافة الفعاليات.",
    },
    {
      id: "web",
      name: "Web Development Track",
      nameAr: "مسار تطوير الويب",
      type: "tech",
      icon: Code,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
      bg: "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border-[#d2e3fc] dark:border-[#1a73e8]/30",
      desc: "Full-stack cloud applications with Next.js, TypeScript, PostgreSQL, and modern APIs.",
      descAr: "بناء تطبيقات الويب الحديثة والحوسبة السحابية باستخدام Next.js وTypeScript وقواعد البيانات التفاعلية ومشاريع الإنتاج.",
    },
    {
      id: "mobile",
      name: "Mobile App Track",
      nameAr: "مسار تطبيقات الموبايل",
      type: "tech",
      icon: Smartphone,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
      bg: "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border-[#d2e3fc] dark:border-[#1a73e8]/30",
      desc: "Cross-platform iOS and Android mobile engineering with Flutter and native integrations.",
      descAr: "تطوير تطبيقات الهواتف الذكية لنظامي iOS وAndroid باستخدام إطار عمل Flutter وربطها بالخدمات السحابية والواجهات البرمجية.",
    },
    {
      id: "uiux",
      name: "UI/UX Design Track",
      nameAr: "مسار تصميم واجهات المستخدم",
      type: "tech",
      icon: Palette,
      color: "text-[#ea4335] dark:text-[#f28b82]",
      bg: "bg-[#fce8e6] dark:bg-[#ea4335]/20 border-[#fad2cf] dark:border-[#ea4335]/30",
      desc: "Figma design system architectures, user research, wireframing, and accessibility.",
      descAr: "تصميم أنظمة الواجهات (Design Systems) بأداة Figma، أبحاث تجربة المستخدم (UX)، النماذج الأولية ومعايير سهولة الاستخدام.",
    },
    {
      id: "ai",
      name: "AI & Data Science Track",
      nameAr: "مسار الذكاء الاصطناعي وعلم البيانات",
      type: "tech",
      icon: Sparkles,
      color: "text-[#b06000] dark:text-[#fdd663]",
      bg: "bg-[#fef7e0] dark:bg-[#fbbc04]/20 border-[#feefc3] dark:border-[#fbbc04]/30",
      desc: "Machine learning engineering, generative AI, NLP, computer vision, and predictive analytics.",
      descAr: "تطوير نماذج تعلم الآلة، الذكاء الاصطناعي التوليدي، معالجة اللغات الطبيعية (NLP)، وتحليل البيانات الضخمة لحل المشكلات الواقعية.",
    },
    {
      id: "embedded",
      name: "Embedded Systems & IoT",
      nameAr: "الأنظمة المدمجة وإنترنت الأشياء",
      type: "tech",
      icon: Cpu,
      color: "text-[#137333] dark:text-[#81c995]",
      bg: "bg-[#e6f4ea] dark:bg-[#34a853]/20 border-[#ceead6] dark:border-[#34a853]/30",
      desc: "Microcontrollers, C/C++, sensor telemetry, robotics, and hardware IoT prototyping.",
      descAr: "برمجة المتحكمات الدقيقة بلغة C/C++، ربط المستشعرات ونظم إنترنت الأشياء، وبناء نماذج الروبوتات والأجهزة المدمجة.",
    },
    {
      id: "cyber",
      name: "Cyber Security Track",
      nameAr: "مسار الأمن السيبراني",
      type: "tech",
      icon: Shield,
      color: "text-[#ea4335] dark:text-[#f28b82]",
      bg: "bg-[#fce8e6] dark:bg-[#ea4335]/20 border-[#fad2cf] dark:border-[#ea4335]/30",
      desc: "Offensive and defensive security, penetration testing, CTF preparation, and audits.",
      descAr: "الأمن السيبراني الدفاعي والهجومي، اختبار الاختراق الأخلاقي، تأمين الشبكات، التدريب على مسابقات الهاكاثون وCTF.",
    },
  ];

  const [selectedTrackId, setSelectedTrackId] = useState<string>("web");
  const [filterType, setFilterType] = useState<"all" | "tech" | "non_tech">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Helper: check if member or entity belongs to selected team / committee
  const isUserInTeam = (u: any, trackId: string) => {
    if (!trackId) return false;
    const target = trackId.toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userTeam = (u.team_id || u.team?.id || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userCommittee = (u.committee || "").toLowerCase().replace("team_", "").replace("team-", "").trim();
    const userTeamName = (u.team?.name || "").toLowerCase().trim();

    if (userTeam === target) return true;
    if (userCommittee === target) return true;
    if (userTeam && target && (userTeam.includes(target) || target.includes(userTeam))) return true;
    if (userCommittee && target && (userCommittee.includes(target) || target.includes(userCommittee))) return true;
    if (userTeamName && target && (userTeamName.includes(target) || target.includes(userTeamName))) return true;
    return false;
  };

  const filteredTracks = allTracks.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.nameAr.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const selectedTrack =
    allTracks.find((t) => t.id === selectedTrackId) ||
    filteredTracks[0] ||
    allTracks[0];

  const getTrackStats = (trackId: string) => {
    const trackMembers = availableUsers.filter((u) => isUserInTeam(u, trackId));
    const lead = trackMembers.find(
      (u) => u.role === "team_lead" || u.role === "track_lead" || u.role === "hr_admin" || u.role === "super_admin"
    );

    const trackTasks = tasks.filter((t) => isUserInTeam({ team_id: t.team_id }, trackId));
    const completedTasks = trackTasks.filter((t) => t.status === "completed");
    const tasksRatio =
      trackTasks.length > 0
        ? `${Math.round((completedTasks.length / trackTasks.length) * 100)}%`
        : "—";

    const memberIds = trackMembers.map((m) => m.id);
    const trackPointEvents = pointEvents.filter((p) => memberIds.includes(p.member_id) && p.status === "approved");
    const netPoints = trackPointEvents.reduce(
      (sum, p) => sum + (p.direction === "positive" ? p.value : -Math.abs(p.value)),
      0
    );

    return {
      memberCount: trackMembers.length,
      lead,
      leadName: lead ? lead.full_name : (isAr ? "قيد التعيين" : "Pending Assignment"),
      tasksRatio,
      tasksTotal: trackTasks.length,
      tasksCompleted: completedTasks.length,
      netPoints,
      members: trackMembers,
      tasks: trackTasks,
    };
  };

  const currentStats = getTrackStats(selectedTrack.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={isAr ? "دليل اللجان والمسارات التقنية" : "Tracks & Committees Directory"}
        description={
          isAr
            ? "الهيكل التنظيمي المعتمد في GDG on Campus NCTU: اللجان التنفيذية والمسارات التقنية، مستخرجة مباشرة ومترابطة مع قاعدة البيانات."
            : "Official organizational matrix spanning Non-Technical committees and Technical tracks, driven directly from the enterprise database."
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Track Selection Column */}
        <div className="space-y-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-lg border border-border">
            <button
              onClick={() => setFilterType("all")}
              className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all ${
                filterType === "all"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAr ? "الكل" : "All"} ({allTracks.length})
            </button>
            <button
              onClick={() => setFilterType("tech")}
              className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all ${
                filterType === "tech"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAr ? "التقنية" : "Tech"} (6)
            </button>
            <button
              onClick={() => setFilterType("non_tech")}
              className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold transition-all ${
                filterType === "non_tech"
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAr ? "الإدارية" : "Non-Tech"} (4)
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={isAr ? "بحث في اللجان والمسارات..." : "Search tracks & committees..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 rtl:pl-3 rtl:pr-8 h-8 text-xs bg-card"
            />
          </div>

          {/* Tracks List */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-0.5">
            {filteredTracks.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                {isAr ? "لا توجد نتائج مطابقة لبحثك" : "No matching tracks found"}
              </div>
            ) : (
              filteredTracks.map((t) => {
                const isSelected = selectedTrack.id === t.id;
                const Icon = t.icon;
                const stats = getTrackStats(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrackId(t.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border-[#1a73e8] shadow-xs"
                        : "bg-card border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg border ${t.bg}`}>
                        <Icon className={`w-4 h-4 ${t.color}`} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">
                          {isAr ? t.nameAr : t.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {t.type === "tech" ? (isAr ? "مسار تقني" : "Technical") : (isAr ? "لجنة إدارية" : "Non-Tech")}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted/60 text-foreground border border-border/60">
                      {stats.memberCount} {isAr ? "عضو" : "m"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Track Detail Card */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${selectedTrack.bg}`}>
                    <selectedTrack.icon className={`w-6 h-6 ${selectedTrack.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {isAr ? selectedTrack.nameAr : selectedTrack.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isAr ? "قائد المسار / اللجنة: " : "Track Leader: "}
                      <strong className="text-foreground font-semibold">{currentStats.leadName}</strong>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#e6f4ea] dark:bg-[#34a853]/20 text-[#137333] dark:text-[#81c995] border border-[#ceead6] dark:border-[#34a853]/30">
                  {isAr ? "هيكل معتمد رسمياً" : "Official Committee"}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {isAr ? selectedTrack.descAr : selectedTrack.desc}
              </p>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              {/* Key Indicators Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                  <span className="text-2xl font-black text-foreground block font-mono">
                    {currentStats.memberCount}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    {isAr ? "الأعضاء الفعليين" : "Active Members"}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                  <span className="text-2xl font-black text-[#137333] dark:text-[#81c995] block font-mono">
                    {currentStats.tasksRatio}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    {isAr ? "إنجاز المهام المسندة" : "Milestones Delivered"}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border col-span-2 sm:col-span-1">
                  <span className="text-2xl font-black text-[#1a73e8] dark:text-[#8ab4f8] block font-mono">
                    {currentStats.netPoints > 0 ? `+${currentStats.netPoints}` : currentStats.netPoints}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 block">
                    {isAr ? "رصيد نقاط التميز للمسار" : "Track Net Points"}
                  </span>
                </div>
              </div>

              {/* Leader Spotlight */}
              {currentStats.lead && (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="w-9 h-9 border border-primary/30">
                      <AvatarFallback className="bg-primary text-white font-bold text-xs">
                        {currentStats.lead.full_name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-foreground">{currentStats.lead.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{currentStats.lead.email}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {isAr ? "قائد معتمد" : "Designated Lead"}
                  </span>
                </div>
              )}

              {/* Members in this track */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    {isAr ? "أعضاء المسار المسجلين في قاعدة البيانات:" : "Registered Track Members:"}
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {currentStats.members.length} {isAr ? "عضو" : "members"}
                  </span>
                </div>

                {currentStats.members.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                    <p className="font-semibold">{isAr ? "لا يوجد أعضاء مخصصين لهذا المسار حالياً" : "No members assigned to this track yet"}</p>
                    <p className="text-[11px] mt-0.5">{isAr ? "يمكن لمدير النظام أو مسؤول HR تعيين الأعضاء من صفحة دليل الأعضاء." : "Super Admin or HR can assign members from the Members Directory."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentStats.members.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-all flex items-center justify-between gap-2.5 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="w-8 h-8 shrink-0 border border-border">
                            <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-bold">
                              {m.full_name.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{m.full_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded border capitalize shrink-0 bg-muted/50 border-border text-foreground">
                          {m.role.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks Assigned to this Track */}
              {currentStats.tasks.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <h4 className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    {isAr ? "مهام ومخرجات المسار الحالية:" : "Track Active Tasks & Milestones:"}
                  </h4>
                  <div className="space-y-2">
                    {currentStats.tasks.slice(0, 4).map((tk) => (
                      <div
                        key={tk.id}
                        className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-foreground truncate">{tk.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {isAr ? "الموعد النهائي: " : "Deadline: "} {tk.deadline}
                          </p>
                        </div>
                        <StatusBadge status={tk.status} size="sm" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
