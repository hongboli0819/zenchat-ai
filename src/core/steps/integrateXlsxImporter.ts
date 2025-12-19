/**
 * 集成 xlsx-data-importer 子项目
 *
 * 调用子项目的 runProject 函数，实现 Excel 数据增量导入
 */

import { supabaseAdmin, isSupabaseAdminConfigured } from "@/shared/lib/supabase";
import {
  runProject as runXlsxImport,
  type RunProjectInput,
  type RunProjectOutput,
  type CoreContext,
  type DbClient,
} from "@internal/xlsx-data-importer";

/**
 * 集成 xlsx-data-importer 子项目
 *
 * @param file - xlsx 文件
 * @param onProgress - 进度回调
 * @returns 导入结果
 */
export async function integrateXlsxImporter(
  file: File,
  onProgress?: (message: string, percent: number) => void
): Promise<RunProjectOutput> {
  // 检查 Admin 客户端是否可用
  if (!isSupabaseAdminConfigured()) {
    console.warn(
      "[XlsxImporter] ⚠️ Service Role Key 未配置，请在 .env 中添加 VITE_SUPABASE_SERVICE_KEY"
    );
  }

  // 构造 CoreContext，注入 Supabase Admin adapter（使用 Service Role 绕过 RLS）
  // 使用类型断言，因为 Supabase 的 PromiseLike 与标准 Promise 在类型上略有差异
  const ctx: CoreContext = {
    adapters: {
      db: supabaseAdmin as unknown as DbClient,
      logger: {
        info: (...args: unknown[]) => console.log("[XlsxImporter]", ...args),
        warn: (...args: unknown[]) => console.warn("[XlsxImporter]", ...args),
        error: (...args: unknown[]) => console.error("[XlsxImporter]", ...args),
      },
    },
  };

  const input: RunProjectInput = {
    file,
    mode: "incremental",
    onProgress,
  };

  return runXlsxImport(input, ctx);
}

