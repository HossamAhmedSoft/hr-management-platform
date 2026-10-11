"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/app-context";

export default function ForbiddenPage() {
  const { currentUser, locale } = useApp();
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full border border-border bg-card shadow-lg overflow-hidden">
        {/* Google 4-color strip */}
        <div className="google-accent-strip">
          <div className="seg-blue" />
          <div className="seg-red" />
          <div className="seg-yellow" />
          <div className="seg-green" />
        </div>

        <CardContent className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#fce8e6] dark:bg-[#ea4335]/20 text-[#c5221f] dark:text-[#f28b82] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-foreground">
            {isAr ? "غير مصرح بالدخول (403)" : "403 - Access Restricted"}
          </h2>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAr
              ? `الصفحة المطلوبة تتطلب صلاحيات إدارية عليا (Super Admin أو HR Admin). دورك الحالي هو [${currentUser?.role || "عضو"}].`
              : `The requested resource is restricted to Super Admin or HR leadership. Your current active role is [${currentUser?.role || "member"}].`}
          </p>

          <div className="pt-2">
            <Link href={`/${locale}`}>
              <Button size="sm" className="bg-[#1a73e8] hover:bg-[#1765cc] text-white text-xs gap-2">
                {isAr ? "العودة إلى لوحة القيادة" : "Return to Dashboard"}
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
