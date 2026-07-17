import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import "nprogress/nprogress.css"; // Import basic NProgress styles

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";
import { Analytics } from "@vercel/analytics/react";
import SentryProvider from "@/components/SentryProvider";
import { Suspense } from "react";

// 1. Configure Fonts
const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

// 2. Set Metadata Global Settings
export const metadata: Metadata = {
  title: "CBCK | Youth Forum",
  description: "News, events, and people of our youth forum",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cbckyouthforum.live"),

};

// 3. Unified Root Layout
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Set initial theme-color based on color scheme */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#151515" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-[#151515] text-[#231F1E] dark:text-[#e5e5e5] font-body transition-colors duration-300">
        {/* Inline script to set dark class based on system preference (prevents flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* Skip to main content link - first focusable element for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-[#6B1F2A] focus:shadow-lg focus:rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B1F2A]"
        >
          Skip to main content
        </a>
        <SentryProvider>
          {/* Next.js navigation hooks require Suspense wrap structures when rendered statically */}
          <Suspense fallback={null}>
            <ProgressBar />
          </Suspense>
          
          <Navbar />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <Analytics />
        </SentryProvider>
      </body>
    </html>
  );
}