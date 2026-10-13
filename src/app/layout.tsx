import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

export const viewport: Viewport = {
  themeColor: "#1a73e8",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://hr.gdgnctu.com"
  ),
  title: {
    default: "GDG NCTU - Management Portal",
    template: "%s | GDG NCTU HR Portal",
  },
  description:
    "Official Operations and Member Performance Platform for GDG on Campus New Cairo Technological University",
  keywords: [
    "GDG",
    "NCTU",
    "Google Developer Groups",
    "HR Management",
    "Performance Evaluation",
    "Student Community",
    "Technical Tracks",
  ],
  authors: [{ name: "GDG on Campus NCTU Tech Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ar_EG"],
    url: "/",
    siteName: "GDG NCTU HR Portal",
    title: "GDG NCTU - Management Portal",
    description:
      "Official Operations and Member Performance Platform for GDG on Campus New Cairo Technological University",
  },
  twitter: {
    card: "summary_large_image",
    title: "GDG NCTU - Management Portal",
    description:
      "Official Operations and Member Performance Platform for GDG on Campus New Cairo Technological University",
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GDG NCTU HR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
