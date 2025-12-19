'use server'

/**
 * Chat Server Actions
 * 聊天功能的 Server Actions
 */

import { runChat } from "@/core/pipelines/runChat";

export async function sendChatMessage(message: string) {
  const result = await runChat(
    { message },
    {
      adapters: {
        logger: console,
        onChunk: (chunk) => {
          // 在服务端流式处理
          console.log('Chunk:', chunk);
        },
        onComplete: (response) => {
          console.log('Complete:', response);
        },
      },
    }
  );

  return result;
}
