"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { useApp } from "@/lib/app-context";
import { canAccessRoute } from "@/lib/auth-service";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, locale, isAuthenticated } = useApp();

  const isAuthOrErrorPage = Boolean(
    pathname && (pathname.includes("/login") || pathname.includes("/forbidden"))
  );
  const isAllowed = isAuthOrErrorPage || (Boolean(isAuthenticated && currentUser) && canAccessRoute(currentUser!.role, pathname || "/"));

  useEffect(() => {
    if (!isAuthOrErrorPage) {
      if (!isAuthenticated) {
        router.push(`/${locale}/login`);
      } else if (!isAllowed) {
        router.push(`/${locale}/forbidden`);
      }
    }
  }, [isAuthOrErrorPage, isAuthenticated, isAllowed, locale, router]);

  // If on login or forbidden page, render clean full screen without sidebar
  if (isAuthOrErrorPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  if (!isAuthenticated || !isAllowed) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">{children}</div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNav onOpenSidebar={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
}
