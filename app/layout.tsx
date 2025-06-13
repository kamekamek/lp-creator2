import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AI } from './action';
import { EditModeProvider } from '@/app/contexts/EditModeContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LP Creator - AI-Powered Landing Page Generator",
  description: "Create professional landing pages with AI-powered generation and real-time preview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AI><EditModeProvider>{children}</EditModeProvider></AI>
      </body>
    </html>
  );
}
