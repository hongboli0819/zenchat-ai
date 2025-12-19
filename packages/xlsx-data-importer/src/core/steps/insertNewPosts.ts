/**
 * Step 5: 插入新帖子
 */

import type { CoreContext } from "../types/context";
import type { MappedPost } from "../types/io";

interface InsertedRow {
  id: string;
}

/**
 * 批量插入新帖子
 *
 * @param posts - 要插入的帖子列表
 * @param accountMap - profile_url → account_id 映射
 * @param ctx - CoreContext
 * @returns 插入成功的数量
 */
export async function insertNewPosts(
  posts: MappedPost[],
  accountMap: Map<string, string>,
  ctx?: CoreContext
): Promise<number> {
  const db = ctx?.adapters?.db;
  const logger = ctx?.adapters?.logger;
  if (!db) throw new Error("Database adapter is required");

  if (posts.length === 0) return 0;

  // 准备插入数据
  const insertData = posts.map((post) => ({
    account_id: accountMap.get(post.profile_url) || null,
    platform: post.platform,
    title: post.title,
    content: post.content,
    post_url: post.post_url,
    post_id: post.post_id,
    cover_url: post.cover_url,
    note_type: post.note_type,
    publish_time: post.publish_time,
    status: post.status,
    interactions: post.interactions,
    likes: post.likes,
    favorites: post.favorites,
    comments: post.comments,
    shares: post.shares,
    data_period: post.data_period,
    image_count: 0,
    merge_image: null,
  }));

  // 分批插入（每批 100 条）
  const BATCH_SIZE = 100;
  let insertedCount = 0;

  for (let i = 0; i < insertData.length; i += BATCH_SIZE) {
    const batch = insertData.slice(i, i + BATCH_SIZE);

    const { data, error } = await db
      .from("xhs_posts")
      .insert(batch)
      .select("id");

    if (error) {
      // 使用 ctx.adapters.logger 而不是直接 console.error
      logger?.error?.(
        `批次 ${Math.floor(i / BATCH_SIZE) + 1} 插入失败:`,
        error
      );
      // 继续处理下一批
      continue;
    }

    insertedCount += (data as InsertedRow[] | null)?.length || 0;
  }

  return insertedCount;
}

