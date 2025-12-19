/**
 * CoreContext - L-Core 上下文类型定义
 * 
 * 按照开发规范，所有副作用通过 ctx.adapters 注入
 */

export interface ApiClient {
  get<T>(url: string, init?: RequestInit): Promise<T>;
  post<T>(url: string, body?: unknown, init?: RequestInit): Promise<T>;
}

export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface CoreContext {
  adapters?: {
    api?: ApiClient;
    logger?: Logger;
    now?: () => Date;
  };
}

