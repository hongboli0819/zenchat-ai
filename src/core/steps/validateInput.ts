/**
 * 输入验证步骤
 * 
 * 验证输入数据的格式和必填字段
 */

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * 验证聊天输入
 */
export function validateChatInput(input: unknown): ValidationResult<{ message: string }> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Input must be an object"] };
  }

  const obj = input as Record<string, unknown>;

  if (!obj.message || typeof obj.message !== "string") {
    errors.push("message is required and must be a string");
  }

  if (obj.message && typeof obj.message === "string" && obj.message.trim().length === 0) {
    errors.push("message cannot be empty");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: { message: (obj.message as string).trim() },
  };
}

/**
 * 验证项目输入
 */
export function validateProjectInput(input: unknown): ValidationResult<{ action: string; payload: unknown }> {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return { valid: false, errors: ["Input must be an object"] };
  }

  const obj = input as Record<string, unknown>;

  if (!obj.action || typeof obj.action !== "string") {
    errors.push("action is required and must be a string");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      action: obj.action as string,
      payload: obj.payload,
    },
  };
}



