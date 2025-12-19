/**
 * xlsx-data-importer 主流程
 *
 * 增量导入 Excel 数据到 Supabase
 */

import type { CoreFn } from "../types/functional";
import type { RunProjectInput, RunProjectOutput } from "../types/io";
import { parseXlsx } from "../steps/parseXlsx";
import { mapToDatabase } from "../steps/mapToDatabase";
import { findExistingPosts } from "../steps/findExistingPosts";
import { findOrCreateAccounts } from "../steps/findOrCreateAccounts";
import { insertNewPosts } from "../steps/insertNewPosts";

/**
 * 主流程：解析 Excel 并增量导入到数据库
 *
 * 流程：
 * 1. 解析 Excel 文件
 * 2. 字段映射
 * 3. 查询已存在的帖子
 * 4. 过滤出新帖子
 * 5. 处理账号（查找或创建）
 * 6. 插入新帖子
 */
export const runProject: CoreFn<RunProjectInput, RunProjectOutput> = async (
  input,
  ctx
) => {
  const startTime = Date.now();
  const logger = ctx?.adapters?.logger;
  const onProgress = input.onProgress;

  try {
    logger?.info?.("xlsx-data-importer:start", { fileName: input.file.name });

    // Step 1: 解析 Excel 文件
    onProgress?.("正在解析 Excel 文件...", 10);
    const rows = await parseXlsx(input.file);
    logger?.info?.("parseXlsx:complete", { rowCount: rows.length });

    if (rows.length === 0) {
      return {
        success: true,
        summary: {
          totalRows: 0,
          existingCount: 0,
          insertedPosts: 0,
          newAccounts: 0,
          existingAccounts: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }

    // Step 2: 字段映射
    onProgress?.("正在映射数据...", 20);
    const { posts, accounts } = mapToDatabase(rows);
    logger?.info?.("mapToDatabase:complete", {
      postCount: posts.length,
      accountCount: accounts.length,
    });

    // Step 3: 查询已存在的帖子
    onProgress?.("正在检查已存在数据...", 40);
    const postUrls = posts.map((p) => p.post_url);
    const existingUrls = await findExistingPosts(postUrls, ctx);
    logger?.info?.("findExistingPosts:complete", {
      existingCount: existingUrls.size,
    });

    // Step 4: 过滤出新帖子
    const newPosts = posts.filter((p) => !existingUrls.has(p.post_url));
    const existingCount = posts.length - newPosts.length;
    logger?.info?.("filterNewPosts:complete", { newCount: newPosts.length });

    if (newPosts.length === 0) {
      onProgress?.("所有数据已存在，无需导入", 100);
      return {
        success: true,
        summary: {
          totalRows: rows.length,
          existingCount,
          insertedPosts: 0,
          newAccounts: 0,
          existingAccounts: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }

    // Step 5: 处理账号（只处理新帖子相关的账号）
    onProgress?.("正在处理账号...", 60);
    const relevantProfileUrls = new Set(newPosts.map((p) => p.profile_url));
    const relevantAccounts = accounts.filter((a) =>
      relevantProfileUrls.has(a.profile_url)
    );
    const {
      accountMap,
      newCount: newAccounts,
      existingCount: existingAccounts,
    } = await findOrCreateAccounts(relevantAccounts, ctx);
    logger?.info?.("findOrCreateAccounts:complete", {
      newAccounts,
      existingAccounts,
    });

    // Step 6: 插入新帖子
    onProgress?.("正在导入新数据...", 80);
    const insertedPosts = await insertNewPosts(newPosts, accountMap, ctx);
    logger?.info?.("insertNewPosts:complete", { insertedPosts });

    // 完成
    const processingTime = Date.now() - startTime;
    onProgress?.("导入完成！", 100);

    logger?.info?.("xlsx-data-importer:success", {
      totalRows: rows.length,
      existingCount,
      insertedPosts,
      newAccounts,
      existingAccounts,
      processingTime,
    });

    return {
      success: true,
      summary: {
        totalRows: rows.length,
        existingCount,
        insertedPosts,
        newAccounts,
        existingAccounts,
        processingTime,
      },
    };
  } catch (error) {
    // 提取错误信息，兼容 Error 实例和 Supabase 错误对象
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      errorMessage = String((error as { message: unknown }).message);
    } else {
      errorMessage = JSON.stringify(error);
    }

    logger?.error?.("xlsx-data-importer:error", errorMessage);

    return {
      success: false,
      summary: {
        totalRows: 0,
        existingCount: 0,
        insertedPosts: 0,
        newAccounts: 0,
        existingAccounts: 0,
        processingTime: Date.now() - startTime,
      },
      errors: [errorMessage],
    };
  }
};

