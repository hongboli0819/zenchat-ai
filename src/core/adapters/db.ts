/**
 * 数据库适配器
 * 
 * 根据规范：抽象"数据查询"层，底层是 Supabase，由调用方注入
 * 通过 ctx.adapters.db 使用
 */

import { supabase, isSupabaseConfigured } from "../../shared/lib/supabase";
import type { XHSAccount, XHSPost, XHSAccountInsert, XHSPostInsert } from "../types/database";

// 帖子统计字段类型
interface PostStats {
  interactions: number;
  likes: number;
  favorites: number;
  comments: number;
  shares: number;
}

/**
 * 获取所有账号（按总互动量排序）
 */
export async function getAccounts(): Promise<XHSAccount[]> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, returning empty array");
    return [];
  }

  const { data, error } = await supabase
    .from("xhs_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch accounts:", error);
    throw error;
  }

  return (data as XHSAccount[]) || [];
}

/**
 * 获取账号详情（包含统计数据）
 */
export async function getAccountWithStats(accountId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: account, error: accountError } = await supabase
    .from("xhs_accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (accountError) {
    console.error("Failed to fetch account:", accountError);
    return null;
  }

  // 获取该账号的帖子统计
  const { data: posts, error: postsError } = await supabase
    .from("xhs_posts")
    .select("interactions, likes, favorites, comments, shares")
    .eq("account_id", accountId);

  if (postsError) {
    console.error("Failed to fetch posts stats:", postsError);
  }

  const postsData = (posts as PostStats[]) || [];
  const stats = postsData.reduce(
    (acc, post) => ({
      totalPosts: acc.totalPosts + 1,
      totalInteractions: acc.totalInteractions + (post.interactions || 0),
      totalLikes: acc.totalLikes + (post.likes || 0),
      totalFavorites: acc.totalFavorites + (post.favorites || 0),
      totalComments: acc.totalComments + (post.comments || 0),
      totalShares: acc.totalShares + (post.shares || 0),
    }),
    {
      totalPosts: 0,
      totalInteractions: 0,
      totalLikes: 0,
      totalFavorites: 0,
      totalComments: 0,
      totalShares: 0,
    }
  );

  return { ...(account as XHSAccount), ...stats };
}

/**
 * 获取所有帖子（支持分页和过滤）
 */
export async function getPosts(options?: {
  accountId?: string;
  noteType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: XHSPost[]; count: number }> {
  if (!isSupabaseConfigured()) {
    return { data: [], count: 0 };
  }

  const { accountId, noteType, search, page = 1, pageSize = 20 } = options || {};

  let query = supabase
    .from("xhs_posts")
    .select("*", { count: "exact" });

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  if (noteType && noteType !== "all") {
    query = query.eq("note_type", noteType);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("publish_time", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Failed to fetch posts:", error);
    throw error;
  }

  return { data: (data as XHSPost[]) || [], count: count || 0 };
}

/**
 * 获取账号下的所有帖子（按时间排序）
 */
export async function getPostsByAccount(accountId: string): Promise<XHSPost[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from("xhs_posts")
    .select("*")
    .eq("account_id", accountId)
    .order("publish_time", { ascending: false });

  if (error) {
    console.error("Failed to fetch posts:", error);
    throw error;
  }

  return (data as XHSPost[]) || [];
}

/**
 * 批量插入账号
 */
export async function insertAccounts(accounts: XHSAccountInsert[]): Promise<XHSAccount[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  // 使用类型断言来解决 Supabase 类型推断问题
  const { data, error } = await supabase
    .from("xhs_accounts")
    .upsert(accounts as never[], { onConflict: "xhs_id" })
    .select();

  if (error) {
    console.error("Failed to insert accounts:", error);
    throw error;
  }

  return (data as XHSAccount[]) || [];
}

/**
 * 批量插入帖子
 */
export async function insertPosts(posts: XHSPostInsert[]): Promise<XHSPost[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  // 使用类型断言来解决 Supabase 类型推断问题
  const { data, error } = await supabase
    .from("xhs_posts")
    .upsert(posts as never[], { onConflict: "post_url" })
    .select();

  if (error) {
    console.error("Failed to insert posts:", error);
    throw error;
  }

  return (data as XHSPost[]) || [];
}

/**
 * 获取统计数据
 */
export async function getStats() {
  if (!isSupabaseConfigured()) {
    return {
      totalAccounts: 0,
      totalPosts: 0,
      totalLikes: 0,
      totalFavorites: 0,
      totalComments: 0,
      totalInteractions: 0,
    };
  }

  const { count: accountCount } = await supabase
    .from("xhs_accounts")
    .select("*", { count: "exact", head: true });

  const { data: postsStats } = await supabase
    .from("xhs_posts")
    .select("interactions, likes, favorites, comments, shares");

  const postsData = (postsStats as PostStats[]) || [];
  const stats = postsData.reduce(
    (acc, post) => ({
      totalPosts: acc.totalPosts + 1,
      totalInteractions: acc.totalInteractions + (post.interactions || 0),
      totalLikes: acc.totalLikes + (post.likes || 0),
      totalFavorites: acc.totalFavorites + (post.favorites || 0),
      totalComments: acc.totalComments + (post.comments || 0),
    }),
    {
      totalPosts: 0,
      totalInteractions: 0,
      totalLikes: 0,
      totalFavorites: 0,
      totalComments: 0,
    }
  );

  return {
    totalAccounts: accountCount || 0,
    ...stats,
  };
}
