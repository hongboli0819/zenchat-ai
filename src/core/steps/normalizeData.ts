/**
 * 数据标准化步骤
 * 
 * 将输入数据标准化为统一格式
 */

import { type Message, Role } from "../types/io";

/**
 * 标准化消息历史
 * 确保每条消息都有必要的字段
 */
export function normalizeMessages(messages: Partial<Message>[]): Message[] {
  return messages.map((msg, index) => ({
    id: msg.id || `msg-${Date.now()}-${index}`,
    role: msg.role || Role.USER,
    content: msg.content || "",
    timestamp: msg.timestamp || Date.now(),
  }));
}

/**
 * 标准化聊天输入
 */
export function normalizeChatInput(input: {
  message: string;
  history?: Partial<Message>[];
}): {
  message: string;
  history: Message[];
} {
  return {
    message: input.message.trim(),
    history: input.history ? normalizeMessages(input.history) : [],
  };
}

/**
 * 标准化字符串
 * 移除多余空白，转换为小写等
 */
export function normalizeString(str: string, options?: {
  lowercase?: boolean;
  trim?: boolean;
  removeExtraSpaces?: boolean;
}): string {
  let result = str;

  if (options?.trim !== false) {
    result = result.trim();
  }

  if (options?.removeExtraSpaces) {
    result = result.replace(/\s+/g, " ");
  }

  if (options?.lowercase) {
    result = result.toLowerCase();
  }

  return result;
}

/**
 * 标准化数字
 * 确保数字在有效范围内
 */
export function normalizeNumber(
  value: unknown,
  options?: {
    min?: number;
    max?: number;
    defaultValue?: number;
  }
): number {
  const num = typeof value === "number" ? value : Number(value);

  if (isNaN(num)) {
    return options?.defaultValue ?? 0;
  }

  let result = num;

  if (options?.min !== undefined && result < options.min) {
    result = options.min;
  }

  if (options?.max !== undefined && result > options.max) {
    result = options.max;
  }

  return result;
}

