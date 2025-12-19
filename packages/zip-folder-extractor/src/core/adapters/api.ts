/**
 * API 适配器
 * 
 * 用于封装调用 Lovable Edge Functions 的逻辑
 * 当前项目不需要外部 API 调用，保留为占位文件
 */

import type { CoreContext } from "../types/context";

/**
 * 示例：通过 ctx.adapters.api 调用外部 API
 */
export async function callExternalApi<T>(
  endpoint: string,
  ctx?: CoreContext
): Promise<T | null> {
  const api = ctx?.adapters?.api;
  if (!api) {
    ctx?.adapters?.logger?.warn?.("API adapter not provided");
    return null;
  }
  return api.get<T>(endpoint);
}


