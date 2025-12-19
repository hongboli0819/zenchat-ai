/**
 * AppShell - L-App 布局组件
 * 
 * 提供全局布局、导航、主题切换等功能
 */

import { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 可以在这里添加全局导航栏、侧边栏等 */}
      <main className="flex-1">{children}</main>
    </div>
  );
}


