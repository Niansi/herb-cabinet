import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "藥斗子 — 中藥開方管理",
  description: "傳統中藥櫃開方管理系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
      </body>
    </html>
  );
}
