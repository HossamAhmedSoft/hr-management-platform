"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/lib/app-context";

function LoginRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useApp();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("mode")) {
      params.set("mode", "login");
    }
    router.replace(`/${locale}/auth?${params.toString()}`);
  }, [locale, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-zinc-950" />}>
      <LoginRedirectContent />
    </Suspense>
  );
}
