/**
 * runProject - 整个项目的主能力函数
 * 
 * 这是 L-Project 对外暴露的主入口
 */

import type { CoreFn } from "../types/functional";
import type { RunProjectInput, RunProjectOutput } from "../types/io";

export const runProject: CoreFn<RunProjectInput, RunProjectOutput> = async (input, ctx) => {
  const logger = ctx?.adapters?.logger;
  
  logger?.info?.("runProject:start", input);

  try {
    // 根据 action 路由到不同的处理逻辑
    switch (input.action) {
      case "chat":
        // 可以调用 runChat
        return {
          success: true,
          data: { message: "Chat action executed" },
        };
      
      default:
        return {
          success: false,
          error: `Unknown action: ${input.action}`,
        };
    }
  } catch (error) {
    logger?.error?.("runProject:error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};



