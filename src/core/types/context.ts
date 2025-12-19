/**
 * L-Core Context 类型定义
 * 所有副作用通过 ctx.adapters 注入
 */

export interface ApiClient {
  get<T>(url: string, init?: RequestInit): Promise<T>;
  post<T>(url: string, body?: unknown, init?: RequestInit): Promise<T>;
}

export interface DbClient {
  query<T>(sql: string, params?: unknown[]): Promise<T>;
}

export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface AuthClient {
  getToken: () => Promise<string | null>;
  hasRole?: (role: string) => boolean;
}

/**
 * 聊天适配器 - 用于流式响应
 */
export interface ChatAdapter {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

/**
 * CoreContext - 所有纯函数的上下文
 */
export interface CoreContext {
  adapters?: {
    api?: ApiClient;
    db?: DbClient;
    logger?: Logger;
    auth?: AuthClient;
    now?: () => Date;
    random?: () => number;
    // 聊天特定的适配器
    onChunk?: (chunk: string) => void;
    onComplete?: (fullResponse: string) => void;
  };
}



