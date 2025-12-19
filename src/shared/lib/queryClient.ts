/**
 * Query Client 配置
 * 
 * 集中管理 TanStack Query 的配置：
 * - 缓存策略
 * - 重试策略
 * - 查询默认配置
 * - 持久化缓存（可选）
 */

import { QueryClient } from "@tanstack/react-query";

// 创建 QueryClient 工厂函数
export function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 缓存 5 分钟
        staleTime: 1000 * 60 * 5,
        // 后台刷新缓存（5分钟后）
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // 失败重试
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 0,
      },
    },
  });

  // 持久化缓存（仅在客户端）
  if (typeof window !== 'undefined') {
    try {
      const cachedData = localStorage.getItem("react-query-cache");
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        queryClient.setQueryData(["cache"], parsed);
        console.log("[QueryCache] 恢复缓存成功");
      }
    } catch (e) {
      console.warn("[QueryCache] 恢复缓存失败:", e);
    }

    // 监听窗口关闭，保存缓存
    window.addEventListener("beforeunload", () => {
      try {
        const cache = queryClient.getQueryCache().getAll();
        localStorage.setItem("react-query-cache", JSON.stringify(cache));
      } catch (e) {
        console.warn("[QueryCache] 保存缓存失败:", e);
      }
    });
  }

  return queryClient;
}
