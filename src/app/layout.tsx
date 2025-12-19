import type { Metadata } from "next";
import "@/index.css";
import { QueryProvider } from "@/shared/lib/QueryProvider";

export const metadata: Metadata = {
  title: "ZenChat AI - 小红书数据分析平台",
  description: "小红书内容分析、账号管理、素材库管理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
