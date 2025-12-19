/**
 * Supabase 数据查询 Hooks
 * 
 * 基于 TanStack Query 封装的数据获取层
 * 提供类型安全的查询和变更操作
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { queryKeys, CACHE_TIMES } from "./queryClient";

// ============ 类型定义 ============

export interface XHSPost {
  id: string;
  post_id: string;
  account_id: string | null;
  platform: string;
  title: string | null;
  content: string | null;
  post_url: string | null;
  cover_url: string | null;
  note_type: string | null;
  publish_time: string | null;
  status: string | null;
  interactions: number;
  likes: number;
  favorites: number;
  comments: number;
  shares: number;
  image_count: number;
  card_image: string | null;
  merge_image: string | null;
  xhs_accounts?: {
    nickname: string;
    avatar: string | null;
    profile_url: string | null;
  } | null;
}

export interface XHSAccount {
  id: string;
  nickname: string;
  avatar: string | null;
  profile_url: string | null;
  xhs_id: string | null;
  xhs_user_id: string | null;
  account_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZipUploadTask {
  id: string;
  file_name: string;
  status: string;
  total_posts: number;
  processed_posts: number;
  created_at: string;
  updated_at: string;
  error_message: string | null;
}

export interface PostImage {
  id: string;
  post_id: string;
  storage_url: string;
  image_order: number;
}

export interface OverviewStats {
  totalPosts: number;
  postsWithImages: number;
  totalAccounts: number;
  totalLikes: number;
  totalFavorites: number;
  totalComments: number;
  totalInteractions: number;
}

export interface AccountStats {
  total_posts: number;
  total_interactions: number;
  total_likes: number;
  total_favorites: number;
  total_comments: number;
  total_shares: number;
}

// ============ 帖子查询 ============

/**
 * 获取帖子列表
 * 
 * @param options.withImages - 只获取有图片的帖子
 * @param options.search - 搜索关键词
 * @param options.enabled - 是否启用查询
 */
export function usePosts(options?: {
  withImages?: boolean;
  search?: string;
  enabled?: boolean;
  withFirstImage?: boolean;
}) {
  const { withImages = false, search, enabled = true, withFirstImage = false } = options || {};
  
  return useQuery({
    queryKey: queryKeys.posts.list({ withImages, search, withFirstImage }),
    queryFn: async (): Promise<XHSPost[]> => {
      // 根据是否需要第一张图片决定 select 内容
      const selectFields = withFirstImage
        ? `
          *,
          xhs_accounts (
            nickname,
            avatar,
            profile_url
          ),
          post_images (
            id,
            storage_url,
            thumbnail_url,
            image_order
          )
        `
        : `
          *,
          xhs_accounts (
            nickname,
            avatar,
            profile_url
          )
        `;
      
      let query = supabase
        .from("xhs_posts")
        .select(selectFields)
        .order("publish_time", { ascending: false });
      
      if (withImages) {
        query = query.gt("image_count", 0).neq("note_type", "视频");
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // 如果需要第一张图片，处理数据添加 first_image_url 和 first_image_thumbnail 字段
      if (withFirstImage && data) {
        return data.map((post) => {
          const postData = post as XHSPost & { 
            post_images?: Array<{ storage_url: string; thumbnail_url: string | null; image_order: number }> | null 
          };
          const images = postData.post_images;
          const sortedImages = images?.sort((a, b) => a.image_order - b.image_order) || [];
          const firstImage = sortedImages[0];
          return {
            ...postData,
            first_image_url: firstImage?.storage_url || null,
            first_image_thumbnail: firstImage?.thumbnail_url || null,
          } as XHSPost & { first_image_url: string | null; first_image_thumbnail: string | null };
        });
      }
      
      return (data || []) as XHSPost[];
    },
    ...CACHE_TIMES.POSTS,
    enabled,
  });
}

/**
 * 获取单个帖子详情
 */
export function usePost(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.posts.detail(postId || ""),
    queryFn: async (): Promise<XHSPost | null> => {
      if (!postId) return null;
      
      const { data, error } = await supabase
        .from("xhs_posts")
        .select(`
          *,
          xhs_accounts (
            nickname,
            avatar,
            profile_url
          )
        `)
        .or(`id.eq.${postId},post_id.eq.${postId}`)
        .single();
      
      if (error) throw error;
      return data;
    },
    ...CACHE_TIMES.POSTS,
    enabled: !!postId,
  });
}

/**
 * 获取帖子图片
 */
export function usePostImages(postId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.posts.images(postId || ""),
    queryFn: async (): Promise<PostImage[]> => {
      if (!postId) return [];
      
      const { data, error } = await supabase
        .from("post_images")
        .select("id, post_id, storage_url, image_order")
        .eq("post_id", postId)
        .order("image_order", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    ...CACHE_TIMES.POST_IMAGES,
    enabled: !!postId,
  });
}

/**
 * 预取帖子图片（用于提前加载）
 * 
 * 在用户可能访问某个帖子详情前调用，提前缓存图片数据
 */
export function usePrefetchPostImages() {
  const queryClient = useQueryClient();
  
  return useCallback((postId: string) => {
    if (!postId) return;
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.images(postId),
      queryFn: async (): Promise<PostImage[]> => {
        const { data, error } = await supabase
          .from("post_images")
          .select("id, post_id, storage_url, image_order")
          .eq("post_id", postId)
          .order("image_order", { ascending: true });
        
        if (error) throw error;
        return data || [];
      },
      ...CACHE_TIMES.POST_IMAGES,
    });
  }, [queryClient]);
}

/**
 * 获取账号的帖子
 * 
 * @param accountId - 账号 ID
 * @param options.withImages - 只获取有图片的帖子（图文笔记）
 * @param options.withFirstImage - 是否关联获取第一张本地化图片
 */
export function usePostsByAccount(accountId: string | undefined, options?: {
  withImages?: boolean;
  withFirstImage?: boolean;
}) {
  const { withImages = true, withFirstImage = false } = options || {};
  
  return useQuery({
    queryKey: [...queryKeys.posts.byAccount(accountId || ""), { withFirstImage }],
    queryFn: async (): Promise<XHSPost[]> => {
      if (!accountId) return [];
      
      // 根据是否需要第一张图片决定 select 内容
      const selectFields = withFirstImage
        ? `
          *,
          post_images (
            id,
            storage_url,
            thumbnail_url,
            image_order
          )
        `
        : "*";
      
      let query = supabase
        .from("xhs_posts")
        .select(selectFields)
        .eq("account_id", accountId)
        .order("publish_time", { ascending: false });
      
      if (withImages) {
        query = query.gt("image_count", 0).neq("note_type", "视频");
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // 如果需要第一张图片，处理数据添加 first_image_url 和 first_image_thumbnail 字段
      if (withFirstImage && data) {
        return data.map((post) => {
          const postData = post as XHSPost & { 
            post_images?: Array<{ storage_url: string; thumbnail_url: string | null; image_order: number }> | null 
          };
          const images = postData.post_images;
          const sortedImages = images?.sort((a, b) => a.image_order - b.image_order) || [];
          const firstImage = sortedImages[0];
          return {
            ...postData,
            first_image_url: firstImage?.storage_url || null,
            first_image_thumbnail: firstImage?.thumbnail_url || null,
          } as XHSPost & { first_image_url: string | null; first_image_thumbnail: string | null };
        });
      }
      
      return data || [];
    },
    ...CACHE_TIMES.POSTS,
    enabled: !!accountId,
  });
}

// ============ 账号查询 ============

/**
 * 获取账号列表
 */
export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: async (): Promise<XHSAccount[]> => {
      const { data, error } = await supabase
        .from("xhs_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    ...CACHE_TIMES.ACCOUNTS,
  });
}

/**
 * 获取账号详情
 */
export function useAccount(accountId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(accountId || ""),
    queryFn: async (): Promise<XHSAccount | null> => {
      if (!accountId) return null;
      
      const { data, error } = await supabase
        .from("xhs_accounts")
        .select("*")
        .eq("id", accountId)
        .single();
      
      if (error) throw error;
      return data;
    },
    ...CACHE_TIMES.ACCOUNTS,
    enabled: !!accountId,
  });
}

/**
 * 获取账号统计数据（带帖子聚合）
 */
export function useAccountsWithStats() {
  const accountsQuery = useAccounts();
  const postsQuery = usePosts({ withImages: true });
  
  const isLoading = accountsQuery.isLoading || postsQuery.isLoading;
  const error = accountsQuery.error || postsQuery.error;
  
  // 计算每个账号的统计
  const accountsWithStats = (() => {
    if (!accountsQuery.data || !postsQuery.data) return [];
    
    const statsMap = new Map<string, AccountStats>();
    
    postsQuery.data.forEach((post) => {
      if (!post.account_id) return;
      const existing = statsMap.get(post.account_id) || {
        total_posts: 0,
        total_interactions: 0,
        total_likes: 0,
        total_favorites: 0,
        total_comments: 0,
        total_shares: 0,
      };
      existing.total_posts += 1;
      existing.total_interactions += post.interactions || 0;
      existing.total_likes += post.likes || 0;
      existing.total_favorites += post.favorites || 0;
      existing.total_comments += post.comments || 0;
      existing.total_shares += post.shares || 0;
      statsMap.set(post.account_id, existing);
    });
    
    return accountsQuery.data
      .map((account) => ({
        ...account,
        ...statsMap.get(account.id),
      }))
      .filter((a) => (a.total_posts || 0) > 0)
      .sort((a, b) => (b.total_interactions || 0) - (a.total_interactions || 0));
  })();
  
  return {
    data: accountsWithStats,
    isLoading,
    error,
    refetch: () => {
      accountsQuery.refetch();
      postsQuery.refetch();
    },
  };
}

// ============ 任务查询 ============

/**
 * 获取任务列表
 */
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.list(),
    queryFn: async (): Promise<ZipUploadTask[]> => {
      const { data, error } = await supabase
        .from("zip_upload_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    ...CACHE_TIMES.TASKS,
  });
}

/**
 * 获取任务详情
 */
export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId || ""),
    queryFn: async (): Promise<ZipUploadTask | null> => {
      if (!taskId) return null;
      
      const { data, error } = await supabase
        .from("zip_upload_tasks")
        .select("*")
        .eq("id", taskId)
        .single();
      
      if (error) throw error;
      return data;
    },
    ...CACHE_TIMES.TASKS,
    enabled: !!taskId,
  });
}

// ============ 统计查询 ============

/**
 * 获取概览统计数据
 */
export function useOverviewStats() {
  return useQuery({
    queryKey: queryKeys.stats.overview(),
    queryFn: async (): Promise<OverviewStats> => {
      // 并行获取统计数据
      // 注意：使用 SQL 过滤避免 1000 条默认限制问题
      const [postsResult, allPostsCount, accountsResult] = await Promise.all([
        // 获取有图片帖子的统计（使用 SQL 过滤）
        supabase
          .from("xhs_posts")
          .select("likes, favorites, comments, interactions")
          .gt("image_count", 0)
          .neq("note_type", "视频"),
        // 获取所有帖子总数
        supabase
          .from("xhs_posts")
          .select("id", { count: "exact", head: true }),
        // 获取账号总数
        supabase
          .from("xhs_accounts")
          .select("id", { count: "exact", head: true }),
      ]);
      
      if (postsResult.error) throw postsResult.error;
      
      const postsWithImages = (postsResult.data || []) as Array<{
        likes: number | null;
        favorites: number | null;
        comments: number | null;
        interactions: number | null;
      }>;
      
      return {
        totalPosts: allPostsCount.count || 0,
        postsWithImages: postsWithImages.length,
        totalAccounts: accountsResult.count || 0,
        totalLikes: postsWithImages.reduce((sum, p) => sum + (p.likes || 0), 0),
        totalFavorites: postsWithImages.reduce((sum, p) => sum + (p.favorites || 0), 0),
        totalComments: postsWithImages.reduce((sum, p) => sum + (p.comments || 0), 0),
        totalInteractions: postsWithImages.reduce((sum, p) => sum + (p.interactions || 0), 0),
      };
    },
    ...CACHE_TIMES.STATS,
  });
}

// ============ 变更操作 ============

/**
 * 删除任务
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      // 这里调用 materialService 的 deleteTask
      const { deleteTask } = await import("@/core/services/materialService");
      return deleteTask(taskId);
    },
    onSuccess: () => {
      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

// ============ 外部触发缓存刷新 ============

/**
 * 全局缓存失效函数
 * 供 materialService 等非 React 代码调用
 * 
 * 使用方式：
 * import { invalidateAllData } from "@/shared/lib/queries";
 * await invalidateAllData();
 */
export async function invalidateAllData(): Promise<void> {
  // 动态获取 queryClient（避免循环依赖）
  const { queryClient } = await import("./QueryProvider");
  
  console.log("[Cache] 触发全局缓存刷新...");
  
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
  ]);
  
  console.log("[Cache] 缓存刷新完成");
}

/**
 * 刷新特定类型的数据
 * 供 Realtime 订阅和手动刷新使用
 */
export async function invalidateData(
  type: "posts" | "accounts" | "tasks" | "stats" | "all"
): Promise<void> {
  const { queryClient } = await import("./QueryProvider");
  
  if (type === "all") {
    return invalidateAllData();
  }
  
  const keyMap = {
    posts: queryKeys.posts.all,
    accounts: queryKeys.accounts.all,
    tasks: queryKeys.tasks.all,
    stats: queryKeys.stats.all,
  };
  
  await queryClient.invalidateQueries({ queryKey: keyMap[type] });
  
  // posts 或 accounts 变化时，也刷新统计数据
  if (type === "posts" || type === "accounts") {
    await queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
  }
  
  console.log(`[Cache] 已刷新 ${type} 缓存`);
}

// ============ 数据看板查询 ============

export interface DashboardPost {
  id: string;
  post_id: string;
  title: string | null;
  content: string | null;
  cover_url: string | null;
  note_type: string | null;
  publish_time: string | null;
  likes: number;
  favorites: number;
  comments: number;
  shares: number;
  interactions: number;
  account_id: string | null;
  xhs_accounts: {
    id: string;
    nickname: string;
    avatar: string | null;
  } | null;
  first_image_url?: string | null; // 本地化的第一张图片
  first_image_thumbnail?: string | null; // 第一张图片的缩略图
}

/**
 * 获取数据看板原始数据
 * 使用缓存，避免重复请求
 * 包含本地化的第一张图片
 */
export function useDashboardPosts() {
  return useQuery({
    queryKey: [...queryKeys.posts.all, "dashboard"],
    queryFn: async (): Promise<DashboardPost[]> => {
      const { data, error } = await supabase
        .from("xhs_posts")
        .select(`
          id,
          post_id,
          title,
          content,
          cover_url,
          note_type,
          publish_time,
          likes,
          favorites,
          comments,
          shares,
          interactions,
          account_id,
          xhs_accounts (
            id,
            nickname,
            avatar
          ),
          post_images (
            storage_url,
            thumbnail_url,
            image_order
          )
        `)
        .gt("image_count", 0)
        .neq("note_type", "视频");
      
      if (error) throw error;
      
      // 处理数据，添加 first_image_url 和 first_image_thumbnail 字段
      return (data || []).map((post) => {
        const postData = post as DashboardPost & { 
          post_images?: Array<{ storage_url: string; thumbnail_url: string | null; image_order: number }> | null 
        };
        const images = postData.post_images;
        const sortedImages = images?.sort((a, b) => a.image_order - b.image_order) || [];
        const firstImage = sortedImages[0];
        return {
          ...postData,
          first_image_url: firstImage?.storage_url || null,
          first_image_thumbnail: firstImage?.thumbnail_url || null,
        } as DashboardPost;
      });
    },
    ...CACHE_TIMES.POSTS,
  });
}

// ============ 预加载 ============

/**
 * 预加载所有核心数据
 * 在应用启动时调用
 */
export function usePrefetchCoreData() {
  const queryClient = useQueryClient();
  
  return () => {
    // 预加载帖子列表（带图片）
    queryClient.prefetchQuery({
      queryKey: queryKeys.posts.list({ withImages: true, search: undefined }),
      queryFn: async () => {
        const { data } = await supabase
          .from("xhs_posts")
          .select(`
            *,
            xhs_accounts (
              nickname,
              avatar,
              profile_url
            )
          `)
          .gt("image_count", 0)
          .neq("note_type", "视频")
          .order("publish_time", { ascending: false });
        return data || [];
      },
      ...CACHE_TIMES.POSTS,
    });
    
    // 预加载账号列表
    queryClient.prefetchQuery({
      queryKey: queryKeys.accounts.list(),
      queryFn: async () => {
        const { data } = await supabase
          .from("xhs_accounts")
          .select("*")
          .order("created_at", { ascending: false });
        return data || [];
      },
      ...CACHE_TIMES.ACCOUNTS,
    });
    
    // 预加载统计数据（使用 SQL 过滤避免 1000 条限制）
    queryClient.prefetchQuery({
      queryKey: queryKeys.stats.overview(),
      queryFn: async () => {
        const [postsResult, allPostsCount, accountsResult] = await Promise.all([
          supabase
            .from("xhs_posts")
            .select("likes, favorites, comments, interactions")
            .gt("image_count", 0)
            .neq("note_type", "视频"),
          supabase
            .from("xhs_posts")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("xhs_accounts")
            .select("id", { count: "exact", head: true }),
        ]);
        const postsWithImages = (postsResult.data || []) as Array<{
          likes: number | null;
          favorites: number | null;
          comments: number | null;
          interactions: number | null;
        }>;
        return {
          totalPosts: allPostsCount.count || 0,
          postsWithImages: postsWithImages.length,
          totalAccounts: accountsResult.count || 0,
          totalLikes: postsWithImages.reduce((sum, p) => sum + (p.likes || 0), 0),
          totalFavorites: postsWithImages.reduce((sum, p) => sum + (p.favorites || 0), 0),
          totalComments: postsWithImages.reduce((sum, p) => sum + (p.comments || 0), 0),
          totalInteractions: postsWithImages.reduce((sum, p) => sum + (p.interactions || 0), 0),
        };
      },
      ...CACHE_TIMES.STATS,
    });
    
    console.log("[Prefetch] 核心数据预加载已启动");
  };
}

