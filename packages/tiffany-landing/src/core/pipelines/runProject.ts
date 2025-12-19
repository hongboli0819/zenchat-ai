/**
 * runProject - Landing 模块主能力
 * 
 * 纯函数形态：(input, ctx) => output
 */

import type { CoreContext } from "../types/context";
import type { 
  RunProjectInput, 
  RunProjectOutput, 
  LandingConfig,
  DEFAULT_LANDING_CONFIG 
} from "../types/io";

export const projectId = "tiffany-landing";
export const projectName = "Tiffany AI Landing Page";

/**
 * 获取 Landing 页面配置
 */
export async function runProject(
  input: RunProjectInput,
  ctx?: CoreContext
): Promise<RunProjectOutput> {
  const logger = ctx?.adapters?.logger;
  logger?.info?.("runProject:start", input);

  // 合并用户配置和默认配置
  const config: LandingConfig = {
    welcomeLine1: input.config?.welcomeLine1 ?? "Welcome to Tiffany's AI-Powered",
    welcomeLine2: input.config?.welcomeLine2 ?? "KOS Content Assistant",
    videoSrc: input.config?.videoSrc ?? "/tiffany2.mp4",
    buttonText: input.config?.buttonText ?? "开始探索",
    navigateTo: input.config?.navigateTo ?? "/",
  };

  const result: RunProjectOutput = {
    success: true,
    config,
  };

  logger?.info?.("runProject:success", result);
  return result;
}

