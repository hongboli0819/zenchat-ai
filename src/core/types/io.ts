/**
 * L-Core 输入输出类型定义
 */

// ===== 消息相关 =====
export enum Role {
  USER = "user",
  MODEL = "model",
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

// ===== 聊天会话 =====
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

// ===== runChat 输入输出 =====
export interface RunChatInput {
  message: string;
  history?: Message[];
}

export interface RunChatOutput {
  response: string;
  messageId: string;
}

// ===== runProject 输入输出 (主项目能力) =====
export interface RunProjectInput {
  // 整个项目的主输入
  action: string;
  payload?: unknown;
}

export interface RunProjectOutput {
  // 主输出
  success: boolean;
  data?: unknown;
  error?: string;
}



