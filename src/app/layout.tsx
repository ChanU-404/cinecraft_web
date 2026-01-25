import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScreenplayProvider } from "@/context/ScreenplayContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { LanguageProvider } from "@/context/LanguageContext";

import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CineCraft — 시나리오 시각화 & 촬영 계획 워크스페이스",
  description: "AI 기반의 시나리오 시각화 및 스토리보드 기획 워크스페이스입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <SubscriptionProvider>
            <LanguageProvider>
              <ScreenplayProvider>
                {children}
              </ScreenplayProvider>
            </LanguageProvider>
          </SubscriptionProvider>
        </Providers>
      </body>
    </html>
  );
}
