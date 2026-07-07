import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import "nprogress/nprogress.css"; // Import basic NProgress styles

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";
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
  alternates: {
    canonical: '/',
  },
};

// 3. Unified Root Layout
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-[#231F1E] font-body">
        {/* Next.js navigation hooks require Suspense wrap structures when rendered statically */}
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
        
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}