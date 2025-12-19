/**
 * Step 3: 查询已存在帖子
 */

import type { CoreContext } from "../types/context";

interface PostUrlRow {
  post_url: string;
}

/**
 * 批量查询已存在的帖子 URL
 *
 * @param postUrls - 要检查的 URL 列表
 * @param ctx - CoreContext（包含 db adapter）
 * @returns 已存在的 URL 集合
 */
export async function findExistingPosts(
  postUrls: string[],
  ctx?: CoreContext
): Promise<Set<string>> {
  const db = ctx?.adapters?.db;
  if (!db) throw new Error("Database adapter is required");

  const existingUrls = new Set<string>();

  if (postUrls.length === 0) return existingUrls;

  // 分批查询（每批 50 条，避免 URL 过长导致 400 Bad Request）
  // 小红书 URL 较长，500 条会超出 HTTP GET URL 长度限制
  const BATCH_SIZE = 50;
  for (let i = 0; i < postUrls.length; i += BATCH_SIZE) {
    const batch = postUrls.slice(i, i + BATCH_SIZE);

    const { data, error } = await db
      .from("xhs_posts")
      .select("post_url")
      .in("post_url", batch);

    if (error) {
      const msg = error.message || JSON.stringify(error);
      throw new Error(`查询已存在帖子失败: ${msg}`);
    }

    (data as PostUrlRow[] | null)?.forEach((row) => {
      if (row.post_url) {
        existingUrls.add(row.post_url);
      }
    });
  }

  return existingUrls;
}

