import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "文件共享系统",
  description: "用于内部文件上传、管理、分享和下载的文件系统。",
  keywords: ["文件共享", "文件下载", "文件管理"],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "文件共享系统",
    description: "用于内部文件上传、管理、分享和下载的文件系统。",
    siteName: "文件共享系统",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "文件共享系统",
    description: "用于内部文件上传、管理、分享和下载的文件系统。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
