/**
 * 子项目集成步骤
 * 
 * 用于调用 packages/ 下子 L-Project 的能力
 * 当前为空实现，待有子项目时填充
 */

import type { CoreContext } from "../types/context";

export interface ChildProjectResult {
  success: boolean;
  projectId?: string;
  data?: unknown;
  error?: string;
}

/**
 * 集成子项目
 * 
 * 当前 packages/ 目录为空，此函数返回空结果
 * 未来添加子项目时，在此处调用子项目的 runProject 函数
 * 
 * @example
 * ```typescript
 * // 未来实现示例：
 * import { runProject as runFooProject } from "@internal/lproject-foo";
 * 
 * const result = await runFooProject(input, ctx);
 * return { success: true, projectId: "lproject-foo", data: result };
 * ```
 */
export async function integrateChildProject(
  _input: unknown,
  _ctx?: CoreContext
): Promise<ChildProjectResult> {
  // 当前无子项目，返回空结果
  return {
    success: true,
    data: null,
  };
}

/**
 * 检查子项目是否可用
 */
export function isChildProjectAvailable(_projectId: string): boolean {
  // 当前无子项目
  return false;
}

/**
 * 获取可用的子项目列表
 */
export function getAvailableChildProjects(): string[] {
  // 当前无子项目
  return [];
}



