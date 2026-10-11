import React from "react";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppProvider } from "@/lib/app-context";
import { MainLayout } from "@/components/layout/main-layout";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  return (
    <AppProvider initialLocale={locale as "en" | "ar"}>
      <MainLayout>{children}</MainLayout>
    </AppProvider>
  );
}
