import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const lora = Lora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Our Community",
  description: "News, events, and people of our community",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lora.variable} ${inter.variable} h-full`}>
     <body className="min-h-full flex flex-col bg-white text-[#231F1E] font-body">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}