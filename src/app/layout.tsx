import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { KSPProvider } from "@/context/KSPContext";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KSP Mulia Dana Sejahtera",
  description: "KSP Mulia Dana Sejahtera - Sistem Manajemen Keuangan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100`}>
        <KSPProvider>
          <div className="flex min-h-screen">
            <Navigation />
            <main className="flex-1 p-4 md:ml-64">
              {children}
            </main>
          </div>
        </KSPProvider>
      </body>
    </html>
  );
}