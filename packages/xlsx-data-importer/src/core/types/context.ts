/**
 * L-Core Context 类型定义
 * 所有副作用通过 ctx.adapters 注入
 */

/**
 * API 客户端接口
 * 调用 Lovable Edge Functions
 */
export interface ApiClient {
  get<T>(url: string, init?: RequestInit): Promise<T>;
  post<T>(url: string, body?: unknown, init?: RequestInit): Promise<T>;
}

/**
 * 数据库客户端接口
 * 抽象"查询/写入"能力，底层实现可以是 Supabase
 */
export interface DbClient {
  from(table: string): {
    select(columns?: string): {
      in(
        column: string,
        values: string[]
      ): Promise<{ data: unknown[] | null; error: Error | null }>;
      eq(
        column: string,
        value: string
      ): Promise<{ data: unknown[] | null; error: Error | null }>;
    };
    insert(data: unknown[]): {
      select(
        columns?: string
      ): Promise<{ data: unknown[] | null; error: Error | null }>;
    };
  };
}

/**
 * 日志接口
 */
export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * 认证客户端接口
 */
export interface AuthClient {
  getToken: () => Promise<string | null>;
  hasRole?: (role: string) => boolean;
}

/**
 * 进度回调
 */
export type ProgressCallback = (message: string, percent: number) => void;

/**
 * CoreContext - 所有纯函数的上下文
 *
 * 约束：
 * - CoreFn 不依赖 React / DOM，不做 UI
 * - 不直接 fetch / console.log / 访问 localStorage 等，而是用 ctx.adapters
 * - 尽量做到：相同 input + ctx → 相同 output，方便测试和重放
 */
export interface CoreContext {
  adapters?: {
    api?: ApiClient; // 调 Lovable Edge Functions
    db?: DbClient; // 访问 Supabase（通过调用方注入）
    logger?: Logger; // 日志
    auth?: AuthClient; // 鉴权
    now?: () => Date; // 时间
    random?: () => number; // 随机数
    onProgress?: ProgressCallback; // 进度回调
  };
}
