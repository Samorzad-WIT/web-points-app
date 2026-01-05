import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Punkty Aktywności - Samorząd W4N PWr",
  description:
    "System zarządzania punktami aktywności dla Samorządu Studenckiego Wydziału W4N Politechniki Wrocławskiej",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning className={inter.variable}>
      <body
        className={cn(geistSans.variable, geistMono.variable, "antialiased")}
      >
        <NextTopLoader showSpinner={false} color="var(--primary)" />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
