import React from "react";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppProvider } from "@/lib/app-context";
import { MainLayout } from "@/components/layout/main-layout";

import type { Metadata } from "next";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";

  return {
    title: {
      default: isAr
        ? "بوابة إدارة العمليات والأداء | GDG NCTU"
        : "Operations & Performance Portal | GDG NCTU",
      template: isAr
        ? "%s | بوابة GDG NCTU الإدارية"
        : "%s | GDG NCTU Management Portal",
    },
    description: isAr
      ? "المنظومة الرسمية لإدارة قواعد الأداء، سجل النقاط، تقييمات اللجان والمسارات التقنية — GDG on Campus NCTU"
      : "Official Operations and Member Performance Platform for GDG on Campus New Cairo Technological University",
    openGraph: {
      locale: isAr ? "ar_EG" : "en_US",
      title: isAr
        ? "بوابة إدارة العمليات والأداء | GDG NCTU"
        : "Operations & Performance Portal | GDG NCTU",
      description: isAr
        ? "المنظومة الرسمية لإدارة قواعد الأداء، سجل النقاط، تقييمات اللجان والمسارات التقنية — GDG on Campus NCTU"
        : "Official Operations and Member Performance Platform for GDG on Campus New Cairo Technological University",
    },
  };
}

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
