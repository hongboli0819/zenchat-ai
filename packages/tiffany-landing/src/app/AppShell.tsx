import React from "react";
import { Outlet } from "react-router-dom";

/**
 * AppShell - Landing 页面布局壳子
 * 
 * Landing 页面不需要侧边栏，仅作为简单的布局容器
 */
export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
};

