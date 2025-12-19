/**
 * runChat - 聊天能力的核心函数
 * 
 * 这是一个纯函数形态的聊天能力，所有副作用通过 ctx.adapters 注入
 */

import type { CoreFn } from "../types/functional";
import type { RunChatInput, RunChatOutput } from "../types/io";
import { simulateAIResponse } from "../adapters/api";

export const runChat: CoreFn<RunChatInput, RunChatOutput> = async (input, ctx) => {
  const logger = ctx?.adapters?.logger;
  const onChunk = ctx?.adapters?.onChunk;
  
  logger?.info?.("runChat:start", { message: input.message });

  try {
    // 使用 API 适配器获取响应
    const response = await simulateAIResponse(input.message, onChunk);

    const result: RunChatOutput = {
      response,
      messageId: Date.now().toString(),
    };

    logger?.info?.("runChat:success", result);
    ctx?.adapters?.onComplete?.(response);
    
    return result;
  } catch (error) {
    logger?.error?.("runChat:error", error);
    throw error;
  }
};



