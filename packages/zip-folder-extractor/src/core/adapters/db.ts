/**
 * 数据库适配器
 * 
 * 用于抽象数据查询层（底层是 Supabase，由调用方注入）
 * 当前项目不需要数据库访问，保留为占位文件
 */

import type { CoreContext } from "../types/context";

/**
 * 示例：通过 ctx.adapters.db 查询数据
 */
export async function queryData<T>(
  sql: string,
  params: unknown[],
  ctx?: CoreContext
): Promise<T | null> {
  const db = ctx?.adapters?.db;
  if (!db) {
    ctx?.adapters?.logger?.warn?.("Database adapter not provided");
    return null;
  }
  return db.query<T>(sql, params);
}


