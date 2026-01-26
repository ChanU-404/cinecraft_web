import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScreenplayProvider } from "@/context/ScreenplayContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/react';

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
  openGraph: {
    title: "CineCraft — AI 시나리오 시각화 플랫폼",
    description: "PDF 시나리오를 AI 기반 스토리보드, 촬영 스케줄, 프로덕션 샷으로 즉시 변환합니다.",
    url: "https://cinecraft-ai.vercel.app",
    siteName: "CineCraft",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CineCraft — AI 시나리오 시각화",
    description: "PDF 시나리오를 AI 기반 스토리보드로 즉시 변환",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
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
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
