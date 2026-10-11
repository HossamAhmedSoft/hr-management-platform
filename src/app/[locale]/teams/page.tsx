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
  const { availableUsers, locale } = useApp();
  const isAr = locale === "ar";

  const allTracks = [
    {
      id: "hr",
      name: "Human Resources",
      nameAr: "الموارد البشرية",
      type: "non_tech",
      icon: Users,
      color: "text-[#1a73e8]",
      bg: "bg-[#e8f0fe] border-[#d2e3fc]",
      memberCount: 8,
      lead: "Sara Mahmoud",
      desc: "Manages recruitment, performance tracking, conflict mediation, and community welfare.",
    },
    {
      id: "media",
      name: "Media & Content",
      nameAr: "الإعلام والمحتوى",
      type: "non_tech",
      icon: Palette,
      color: "text-[#ea4335]",
      bg: "bg-[#fce8e6] border-[#fad2cf]",
      memberCount: 10,
      lead: "Mariam Fathy",
      desc: "Visual branding, video editing, photography, event coverage, and digital reels.",
    },
    {
      id: "pr",
      name: "Public Relations & Marketing",
      nameAr: "العلاقات العامة والتسويق",
      type: "non_tech",
      icon: Sparkles,
      color: "text-[#b06000]",
      bg: "bg-[#fef7e0] border-[#feefc3]",
      memberCount: 12,
      lead: "Mostafa Hassan",
      desc: "Sponsorship acquisitions, corporate relations, campus reach, and campaigns.",
    },
    {
      id: "or",
      name: "Operations & Logistics (OR)",
      nameAr: "العمليات واللوجستيات",
      type: "non_tech",
      icon: Layers,
      color: "text-[#137333]",
      bg: "bg-[#e6f4ea] border-[#ceead6]",
      memberCount: 10,
      lead: "Ahmed Taha",
      desc: "Auditorium reservations, sound equipment, stage lighting, and smooth event execution.",
    },
    {
      id: "web",
      name: "Web Development Track",
      nameAr: "مسار تطوير الويب",
      type: "tech",
      icon: Code,
      color: "text-[#1a73e8]",
      bg: "bg-[#e8f0fe] border-[#d2e3fc]",
      memberCount: 16,
      lead: "Kareem Tarek",
      desc: "Full-stack cloud applications with Next.js, TypeScript, PostgreSQL, and modern APIs.",
    },
    {
      id: "flutter",
      name: "Flutter / Mobile App Track",
      nameAr: "مسار تطبيقات الموبايل",
      type: "tech",
      icon: Smartphone,
      color: "text-[#1a73e8]",
      bg: "bg-[#e8f0fe] border-[#d2e3fc]",
      memberCount: 12,
      lead: "Hassan Ali",
      desc: "Cross-platform iOS and Android mobile engineering with Flutter and native integrations.",
    },
    {
      id: "uiux",
      name: "UI/UX Design Track",
      nameAr: "مسار تصميم واجهات المستخدم",
      type: "tech",
      icon: Palette,
      color: "text-[#ea4335]",
      bg: "bg-[#fce8e6] border-[#fad2cf]",
      memberCount: 9,
      lead: "Laila Youssef",
      desc: "Figma design system architectures, user research, wireframing, and accessibility.",
    },
    {
      id: "embedded",
      name: "Embedded Systems & IoT",
      nameAr: "مسار الأنظمة المدمجة وإنترنت الأشياء",
      type: "tech",
      icon: Cpu,
      color: "text-[#137333]",
      bg: "bg-[#e6f4ea] border-[#ceead6]",
      memberCount: 11,
      lead: "Youssef Nabil",
      desc: "Microcontrollers, C/C++, sensor telemetry, robotics, and hardware IoT prototyping.",
    },
    {
      id: "cyber",
      name: "Cyber Security Track",
      nameAr: "مسار الأمن السيبراني",
      type: "tech",
      icon: Shield,
      color: "text-[#ea4335]",
      bg: "bg-[#fce8e6] border-[#fad2cf]",
      memberCount: 10,
      lead: "Tariq Mansour",
      desc: "Offensive and defensive security, penetration testing, CTF preparation, and audits.",
    },
  ];

  const [selectedTrack, setSelectedTrack] = useState(allTracks[0]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={
          isAr
            ? "دليل اللجان والمسارات التقنية التسعة"
            : "Tracks & Committees Directory (9 Units)"
        }
        description={
          isAr
            ? "الهيكل التنظيمي المعتمد في GDG NCTU: اللجان غير التقنية (HR, Media, PR, OR) والمسارات التقنية (Web, Flutter, UI/UX, Embedded, Cyber)."
            : "Official organizational matrix spanning Non-Tech (HR, Media, PR, OR) and Tech (Web, Flutter, UI/UX, Embedded, Cyber)."
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
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrack(t)}
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
                    {t.memberCount}
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
                      Track Leader: <strong className="text-foreground">{selectedTrack.lead}</strong>
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                  Active Committee
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {selectedTrack.desc}
              </p>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#202124] border border-border">
                  <span className="text-xl font-bold text-foreground block font-mono">
                    {selectedTrack.memberCount}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Active Members</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#202124] border border-border">
                  <span className="text-xl font-bold text-[#137333] block font-mono">
                    95%
                  </span>
                  <span className="text-[11px] text-muted-foreground">Attendance</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#202124] border border-border">
                  <span className="text-xl font-bold text-[#1a73e8] block font-mono">
                    4.8 / 5
                  </span>
                  <span className="text-[11px] text-muted-foreground">Avg Rubric Score</span>
                </div>
                <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#202124] border border-border">
                  <span className="text-xl font-bold text-[#b06000] block font-mono">
                    100%
                  </span>
                  <span className="text-[11px] text-muted-foreground">Milestones Met</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
