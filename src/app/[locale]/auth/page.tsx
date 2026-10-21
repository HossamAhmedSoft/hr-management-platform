import React, { Suspense } from "react";
import { UnifiedAuthCard } from "@/components/auth/unified-auth-card";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <UnifiedAuthCard />
    </Suspense>
  );
}
