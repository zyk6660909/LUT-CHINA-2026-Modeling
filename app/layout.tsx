import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "iGEM 项目评估系统",
  description:
    "输入项目参数，输出可行性总分与等级、6 维雷达图、奖牌 Checklist、Veto 风险预警、定向优化建议与专项奖匹配。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
