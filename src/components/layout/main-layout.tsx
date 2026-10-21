"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useApp } from "@/lib/app-context";
import { canAccessRoute } from "@/lib/auth-service";

const Sidebar = dynamic(() => import("./sidebar").then((m) => m.Sidebar), {
  ssr: true,
});
const Header = dynamic(() => import("./header").then((m) => m.Header), {
  ssr: true,
});
const MobileNav = dynamic(() => import("./mobile-nav").then((m) => m.MobileNav), {
  ssr: true,
});

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, locale, isAuthenticated } = useApp();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isPublicFormPage = Boolean(
    pathname && (pathname.includes("/forms/p/") || pathname.includes("/forms/public/"))
  );
  const isAuthOrErrorPage = Boolean(
    pathname && (pathname.includes("/login") || pathname.includes("/forbidden"))
  );
  const isFullPage = isAuthOrErrorPage || isPublicFormPage;
  const isAllowed = isFullPage || (Boolean(isAuthenticated && currentUser) && canAccessRoute(currentUser!.role, pathname || "/"));

  useEffect(() => {
    if (!hasMounted) return;
    if (!isFullPage) {
      if (!isAuthenticated) {
        router.push(`/${locale}/login`);
      } else if (!isAllowed) {
        router.push(`/${locale}/forbidden`);
      }
    }
  }, [hasMounted, isFullPage, isAuthenticated, isAllowed, locale, router]);

  // If on login, forbidden, or public form page, render clean full screen without sidebar
  if (isFullPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  if (!hasMounted || !isAuthenticated || !isAllowed) {
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
