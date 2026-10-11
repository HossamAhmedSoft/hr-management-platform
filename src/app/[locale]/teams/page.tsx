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
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/lib/app-context";

export default function TeamsPage() {
  const { availableUsers, tasks, evaluations, locale } = useApp();
  const isAr = locale === "ar";

  const allTracks = [
    {
      id: "hr",
      name: "Human Resources",
      nameAr: "الموارد البشرية",
      type: "non_tech",
      icon: Users,
      color: "text-[#1a73e8] dark:text-[#8ab4f8]",
      bg: "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border-[#d2e3fc] dark:border-[#1a73e8]/30",
      desc: "Manages recruitment, performance tracking, conflict mediation, and community welfare.",
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
    },
    {
      id: "embedded",
      name: "Embedded Systems & IoT",
      nameAr: "مسار الأنظمة المدمجة وإنترنت الأشياء",
      type: "tech",
      icon: Cpu,
      color: "text-[#137333] dark:text-[#81c995]",
      bg: "bg-[#e6f4ea] dark:bg-[#34a853]/20 border-[#ceead6] dark:border-[#34a853]/30",
      desc: "Microcontrollers, C/C++, sensor telemetry, robotics, and hardware IoT prototyping.",
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
    },
  ];

  const [selectedTrackId, setSelectedTrackId] = useState(allTracks[0].id);
  const selectedTrack = allTracks.find((t) => t.id === selectedTrackId) || allTracks[0];

  const getTrackStats = (trackId: string) => {
    const trackMembers = availableUsers.filter((u) => u.team_id?.toLowerCase().includes(trackId.toLowerCase()));
    const lead = trackMembers.find((u) => u.role === "team_lead" || u.role === "hr_admin" || u.role === "super_admin");
    const trackTasks = tasks.filter((t) => t.team_id?.toLowerCase().includes(trackId.toLowerCase()));
    const completedTasks = trackTasks.filter((t) => t.status === "completed");
    const tasksRatio = trackTasks.length > 0 ? `${Math.round((completedTasks.length / trackTasks.length) * 100)}%` : "—";
    return {
      memberCount: trackMembers.length,
      leadName: lead ? lead.full_name : (isAr ? "لم يتم التعيين بعد" : "Unassigned"),
      tasksRatio,
      members: trackMembers,
    };
  };

  const currentStats = getTrackStats(selectedTrack.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={
          isAr
            ? "دليل اللجان والمسارات التقنية"
            : "Tracks & Committees Directory"
        }
        description={
          isAr
            ? "الهيكل التنظيمي المعتمد في GDG NCTU: اللجان غير التقنية والمسارات التقنية، مستخرجة مباشرة من قاعدة البيانات."
            : "Official organizational matrix spanning Non-Tech and Technical tracks, driven directly from the database."
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Track Selection Column */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
            {isAr ? "قائمة المسارات واللجان" : "Select Committee / Track"}
          </span>
          <div className="space-y-1.5">
            {allTracks.map((t) => {
              const isSelected = selectedTrack.id === t.id;
              const Icon = t.icon;
              const stats = getTrackStats(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrackId(t.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#e8f0fe] dark:bg-[#1a73e8]/20 border-[#1a73e8] shadow-2xs"
                      : "bg-card border-border hover:bg-[#f8f9fa] dark:hover:bg-[#202124]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md border ${t.bg}`}>
                      <Icon className={`w-4 h-4 ${t.color}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {isAr ? t.nameAr : t.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {t.type === "tech" ? "Technical" : "Non-Tech"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                    {stats.memberCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Track Detail Card */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border bg-card shadow-2xs">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${selectedTrack.bg}`}>
                    <selectedTrack.icon className={`w-5 h-5 ${selectedTrack.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {isAr ? selectedTrack.nameAr : selectedTrack.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Track Leader: <strong className="text-foreground">{currentStats.leadName}</strong>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e6f4ea] dark:bg-[#34a853]/20 text-[#137333] dark:text-[#81c995] border border-[#ceead6] dark:border-[#34a853]/30">
                  Active Committee
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {selectedTrack.desc}
              </p>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#202124] border border-border">
                  <span className="text-xl font-bold text-foreground block font-mono">
                    {currentStats.memberCount}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{isAr ? "الأعضاء الفعليين" : "Active Members"}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#202124] border border-border">
                  <span className="text-xl font-bold text-[#137333] dark:text-[#81c995] block font-mono">
                    {currentStats.tasksRatio}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{isAr ? "إنجاز المهام" : "Milestones Met"}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#202124] border border-border">
                  <span className="text-xl font-bold text-[#1a73e8] dark:text-[#8ab4f8] block font-mono">
                    {currentStats.memberCount > 0 ? "Good" : "—"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{isAr ? "حالة اللجنة" : "Track Status"}</span>
                </div>
              </div>

              {/* Members in this track */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-foreground mb-2">
                  {isAr ? "أعضاء المسار المسجلين:" : "Registered Members:"}
                </h4>
                {currentStats.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                    {isAr ? "لا يوجد أعضاء منضمين لهذا المسار حتى الآن" : "No members assigned to this track yet"}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentStats.members.map((m) => (
                      <div key={m.id} className="p-2.5 rounded-lg border border-border flex items-center gap-2.5 text-xs">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-bold">
                            {m.full_name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{m.full_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{m.role.replace("_", " ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
