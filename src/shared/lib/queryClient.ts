/**
 * TanStack Query 客户端配置
 * 
 * 专业级缓存策略：
 * 1. 智能缓存过期（staleTime + gcTime）
 * 2. 后台自动刷新
 * 3. 窗口聚焦刷新
 * 4. 网络重连刷新
 * 5. 请求去重
 * 6. 持久化到 localStorage
 */

import { QueryClient } from "@tanstack/react-query";

// ============ 缓存时间配置 ============

/**
 * 缓存时间策略（毫秒）
 * 
 * staleTime: 数据被认为是"新鲜"的时间
 *   - 在此时间内，不会重新获取数据
 *   - 直接使用缓存
 * 
 * gcTime: 垃圾回收时间（原 cacheTime）
 *   - 数据在内存中保留的时间
 *   - 超过后被垃圾回收
 */
export const CACHE_TIMES = {
  // 帖子数据：5分钟新鲜，30分钟保留
  POSTS: {
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
  },
  
  // 账号数据：10分钟新鲜，1小时保留
  ACCOUNTS: {
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
  },
  
  // 任务数据：1分钟新鲜，10分钟保留（变化较频繁）
  TASKS: {
    staleTime: 1 * 60 * 1000,    // 1 minute
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  
  // 统计数据：5分钟新鲜，30分钟保留
  STATS: {
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes
  },
  
  // 帖子图片：长期缓存（很少变化）
  POST_IMAGES: {
    staleTime: 30 * 60 * 1000,   // 30 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
  },
} as const;

// ============ Query Keys ============

/**
 * 缓存结构版本号
 * 
 * ⚠️ 重要：修改 queryKeys 结构时必须更新此版本号！
 * 
 * 版本历史：
 * - v1: 初始版本
 * - v2: posts.list 添加 withFirstImage 参数
 */
export const CACHE_SCHEMA_VERSION = 2;

/**
 * 统一的查询键管理
 * 
 * 使用 factory 模式确保键的一致性
 * 支持层级关系，便于批量失效
 * 
 * ⚠️ 修改此结构后，必须同时更新 CACHE_SCHEMA_VERSION！
 */
export const queryKeys = {
  // 帖子相关
  posts: {
    all: ["posts"] as const,
    list: (filters?: { withImages?: boolean; search?: string; withFirstImage?: boolean }) => 
      [...queryKeys.posts.all, "list", filters] as const,
    detail: (id: string) => 
      [...queryKeys.posts.all, "detail", id] as const,
    images: (postId: string) => 
      [...queryKeys.posts.all, "images", postId] as const,
    byAccount: (accountId: string) => 
      [...queryKeys.posts.all, "byAccount", accountId] as const,
  },
  
  // 账号相关
  accounts: {
    all: ["accounts"] as const,
    list: () => [...queryKeys.accounts.all, "list"] as const,
    detail: (id: string) => 
      [...queryKeys.accounts.all, "detail", id] as const,
    stats: (id: string) => 
      [...queryKeys.accounts.all, "stats", id] as const,
  },
  
  // 任务相关
  tasks: {
    all: ["tasks"] as const,
    list: () => [...queryKeys.tasks.all, "list"] as const,
    detail: (id: string) => 
      [...queryKeys.tasks.all, "detail", id] as const,
  },
  
  // 统计相关
  stats: {
    all: ["stats"] as const,
    overview: () => [...queryKeys.stats.all, "overview"] as const,
    accounts: () => [...queryKeys.stats.all, "accounts"] as const,
  },
} as const;

// ============ 持久化配置 ============

const PERSISTER_KEY = "zenchat_query_cache";

// 排除大数据的 queryKey 前缀（这些数据量大，不适合持久化到 localStorage）
const EXCLUDED_QUERY_KEYS = ["zip-tasks", "posts", "accounts", "post-images"];

/**
 * 保存缓存到 localStorage
 * 
 * 注意：已优化为只缓存轻量数据，排除大数据（任务列表、帖子数据等）
 * 避免 QuotaExceededError
 */
function persistQueryCache(queryClient: QueryClient): void {
  try {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    // 只持久化成功的查询，并排除大数据
    const persistableQueries = queries
      .filter(query => {
        if (query.state.status !== "success" || !query.state.data) return false;
        
        // 检查是否在排除列表中
        const firstKey = query.queryKey[0];
        if (typeof firstKey === "string" && EXCLUDED_QUERY_KEYS.includes(firstKey)) {
          return false;
        }
        
        return true;
      })
      .map(query => ({
        queryKey: query.queryKey,
        data: query.state.data,
        dataUpdatedAt: query.state.dataUpdatedAt,
      }));
    
    // 如果没有可持久化的数据，跳过
    if (persistableQueries.length === 0) {
      return;
    }
    
    const cacheData = JSON.stringify({
      version: CACHE_SCHEMA_VERSION,
      timestamp: Date.now(),
      queries: persistableQueries,
    });
    
    // 检查大小，超过 2MB 则跳过
    if (cacheData.length > 2 * 1024 * 1024) {
      console.warn("[QueryCache] 缓存数据过大，跳过持久化");
      return;
    }
    
    localStorage.setItem(PERSISTER_KEY, cacheData);
    
    console.log(`[QueryCache] 已持久化 ${persistableQueries.length} 个查询`);
  } catch (error) {
    // 静默处理 QuotaExceededError，避免控制台噪音
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      // 清除旧缓存，避免持续报错
      try {
        localStorage.removeItem(PERSISTER_KEY);
      } catch {
        // 忽略
      }
      return;
    }
    console.warn("[QueryCache] 持久化失败:", error);
  }
}

/**
 * 从 localStorage 恢复缓存
 */
function hydrateQueryCache(queryClient: QueryClient): void {
  try {
    const stored = localStorage.getItem(PERSISTER_KEY);
    if (!stored) return;
    
    const { version, timestamp, queries } = JSON.parse(stored);
    
    // 版本检查
    if (version !== CACHE_SCHEMA_VERSION) {
      console.log(`[QueryCache] 缓存版本不匹配 (缓存: v${version}, 当前: v${CACHE_SCHEMA_VERSION})，清除旧缓存`);
      localStorage.removeItem(PERSISTER_KEY);
      return;
    }
    
    // 检查缓存是否过期（24小时）
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) {
      console.log("[QueryCache] 缓存已过期，清除");
      localStorage.removeItem(PERSISTER_KEY);
      return;
    }
    
    // 恢复查询
    let restoredCount = 0;
    for (const { queryKey, data, dataUpdatedAt } of queries) {
      queryClient.setQueryData(queryKey, data, {
        updatedAt: dataUpdatedAt,
      });
      restoredCount++;
    }
    
    console.log(`[QueryCache] 已恢复 ${restoredCount} 个查询，缓存时间: ${new Date(timestamp).toLocaleString()}`);
  } catch (error) {
    console.warn("[QueryCache] 恢复缓存失败:", error);
    localStorage.removeItem(PERSISTER_KEY);
  }
}

// ============ QueryClient 创建 ============

/**
 * 创建配置好的 QueryClient
 */
export function createQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 默认缓存时间
        staleTime: 5 * 60 * 1000,  // 5 minutes
        gcTime: 30 * 60 * 1000,    // 30 minutes
        
        // 重试策略
        retry: (failureCount, error) => {
          // 网络错误最多重试 3 次
          if (failureCount >= 3) return false;
          
          // 4xx 错误不重试
          if (error && typeof error === "object" && "status" in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          
          return true;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // 窗口聚焦时刷新
        refetchOnWindowFocus: true,
        
        // 网络重连时刷新
        refetchOnReconnect: true,
        
        // 组件挂载时不自动刷新（如果有缓存）
        refetchOnMount: true,
      },
      mutations: {
        // 变更操作重试 1 次
        retry: 1,
      },
    },
  });
  
  // 恢复持久化缓存
  hydrateQueryCache(queryClient);
  
  // 定期持久化（每 30 秒）
  setInterval(() => {
    persistQueryCache(queryClient);
  }, 30 * 1000);
  
  // 页面卸载前持久化
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      persistQueryCache(queryClient);
    });
    
    // 页面可见性变化时持久化
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        persistQueryCache(queryClient);
      }
    });
  }
  
  return queryClient;
}

// ============ 缓存操作工具 ============

/**
 * 清除所有缓存
 */
export function clearAllCache(queryClient: QueryClient): void {
  queryClient.clear();
  localStorage.removeItem(PERSISTER_KEY);
  console.log("[QueryCache] 已清除所有缓存");
}

/**
 * 使特定查询失效并重新获取
 */
export function invalidateQueries(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * 预取查询（不等待结果）
 */
export function prefetchQuery<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: { staleTime?: number }
): void {
  queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime,
  });
}


