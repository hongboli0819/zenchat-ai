'use client'

/**
 * TanStack Query Provider
 * 
 * 封装 QueryClientProvider，提供：
 * 1. QueryClient 实例
 * 2. 开发工具（仅开发环境）
 * 3. 应用启动时的数据预加载
 * 4. Supabase Realtime 实时订阅
 */

import React, { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "./queryClient";
import { usePrefetchCoreData } from "./queries";
import { useRealtimeSubscription } from "./realtimeSubscription";

// 创建单例 QueryClient
const queryClient = createQueryClient();

// 内部组件：负责预加载和实时订阅
function DataManager() {
  const prefetch = usePrefetchCoreData();
  
  // 预加载核心数据
  useEffect(() => {
    prefetch();
  }, [prefetch]);
  
  // 订阅 Supabase Realtime（数据库变化时自动刷新缓存）
  useRealtimeSubscription();
  
  return null;
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [showDevtools, setShowDevtools] = useState(false);
  
  // 开发环境下按 Ctrl+Shift+D 切换 DevTools
  useEffect(() => {
    // 仅在开发环境注册快捷键
    if (process.env.NODE_ENV !== 'development') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setShowDevtools((prev) => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <DataManager />
      {children}
      {process.env.NODE_ENV === 'development' && showDevtools && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}

// 导出 queryClient 供手动操作
export { queryClient };
