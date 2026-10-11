"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useApp } from "@/lib/app-context";
import { canAccessRoute } from "@/lib/auth-service";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, locale } = useApp();

  const isAuthOrErrorPage = Boolean(
    pathname && (pathname.includes("/login") || pathname.includes("/forbidden"))
  );
  const isAllowed = isAuthOrErrorPage || canAccessRoute(currentUser.role, pathname || "/");

  useEffect(() => {
    if (!isAuthOrErrorPage && !isAllowed) {
      router.push(`/${locale}/forbidden`);
    }
  }, [isAuthOrErrorPage, isAllowed, locale, router]);

  // If on login or forbidden page, render clean full screen without sidebar
  if (isAuthOrErrorPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  if (!isAllowed) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
