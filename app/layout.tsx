import type { Metadata, Viewport } from "next"; 
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. ADD THIS IMPORT
import { SettingsProvider } from '@/context/settingsContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

export const metadata: Metadata = {
  title: "STUDIO_OS // premium_detailing_infrastructure",
  description: "High-performance automotive detailing management and booking system.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="selection:bg-black selection:text-white">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black`}
      >
        {/* 2. WRAP EVERYTHING INSIDE BODY WITH SETTINGSPROVIDER */}
        <SettingsProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}