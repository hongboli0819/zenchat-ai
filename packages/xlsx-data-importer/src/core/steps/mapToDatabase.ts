/**
 * Step 2: 字段映射与 ID 提取
 */

import type { ExcelRow, MappedPost, MappedAccount } from "../types/io";

/**
 * 从 post_url 提取 post_id
 * 例：https://www.xiaohongshu.com/discovery/item/693014dd000000001d03f43f
 *   → 693014dd000000001d03f43f
 */
function extractPostId(postUrl: string): string {
  const match = postUrl.match(/\/item\/([a-zA-Z0-9]+)/);
  return match?.[1] || "";
}

/**
 * 从 profile_url 提取 xhs_user_id
 * 例：https://www.xiaohongshu.com/user/profile/6534a2aa0000000006006d01
 *   → 6534a2aa0000000006006d01
 */
function extractUserId(profileUrl: string): string | null {
  const match = profileUrl.match(/\/profile\/([a-zA-Z0-9]+)/);
  return match?.[1] || null;
}

/**
 * 解析发布时间为 ISO 格式
 */
function parsePublishTime(timeStr: string | null): string | null {
  if (!timeStr || timeStr === "-") return null;
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * 解析数值字段（处理 "-" 等非数值）
 */
function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value !== "-") {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * 清理字符串字段（处理 "-" 等特殊值）
 */
function cleanString(value: unknown): string | null {
  if (!value || value === "-") return null;
  if (typeof value === "string") return value.trim() || null;
  return String(value);
}

/**
 * 将 Excel 行映射为数据库格式
 *
 * @param rows - Excel 原始行数据
 * @returns 映射后的帖子和账号数据
 */
export function mapToDatabase(rows: ExcelRow[]): {
  posts: MappedPost[];
  accounts: MappedAccount[];
} {
  const accountsMap = new Map<string, MappedAccount>();
  const posts: MappedPost[] = [];

  for (const row of rows) {
    const profileUrl = row.账号主页链接?.trim() || "";
    const postUrl = row.作品原链接?.trim() || "";

    // 跳过无效数据（没有作品链接）
    if (!postUrl) continue;

    // 1. 处理账号（以 profile_url 去重）
    if (profileUrl && !accountsMap.has(profileUrl)) {
      accountsMap.set(profileUrl, {
        nickname: row.昵称 || "未知用户",
        avatar: cleanString(row.头像),
        profile_url: profileUrl,
        xhs_id: cleanString(row.小红书号),
        xhs_user_id: extractUserId(profileUrl),
        account_type: cleanString(row.账号类型),
      });
    }

    // 2. 处理帖子
    posts.push({
      platform: row.平台 || "小红书",
      title: cleanString(row.标题),
      content: cleanString(row.作品正文),
      post_url: postUrl,
      post_id: extractPostId(postUrl),
      cover_url: cleanString(row.封面图链接),
      note_type: cleanString(row.笔记类型),
      publish_time: parsePublishTime(row.发布时间),
      status: cleanString(row.作品状态),
      interactions: parseNumber(row.互动量),
      likes: parseNumber(row.获赞数),
      favorites: parseNumber(row.收藏数),
      comments: parseNumber(row.评论数),
      shares: parseNumber(row.分享数),
      data_period: cleanString(row.发布时间段),
      profile_url: profileUrl,
      // 默认值
      image_count: 0,
      merge_image: null,
    });
  }

  return {
    posts,
    accounts: Array.from(accountsMap.values()),
  };
}



