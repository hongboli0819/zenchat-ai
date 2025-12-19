/**
 * @tiffany/landing - L-Core 对外导出入口
 * 
 * 这是子项目的纯函数能力导出，供父项目或其他模块调用
 */

// 项目标识
export const projectId = "tiffany-landing";
export const projectName = "Tiffany AI Landing Page";

// 主能力导出
export { runProject } from "./pipelines/runProject";

// 类型导出
export type { CoreContext, ApiClient, Logger } from "./types/context";
export type { 
  RunProjectInput, 
  RunProjectOutput, 
  LandingConfig 
} from "./types/io";
export { DEFAULT_LANDING_CONFIG } from "./types/io";

