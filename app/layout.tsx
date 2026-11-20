import type { Metadata } from "next";
import "./globals.css";
import PointerEffects from '@/components/pointer-effects';

export const metadata: Metadata = {
  title: "智科学代指南 · 校园生活知识库",
  description: "学习、综测、宿舍、就医与办事信息，一处查阅。由智能科学与工程学院学代团持续维护。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}<PointerEffects/></body>
    </html>
  );
}
