/**
 * L-Core 函数式类型定义
 */

import type { CoreContext } from "./context";

/**
 * 核心函数签名
 * 所有 L-Core 函数都遵循这个形式
 */
export type CoreFn<I, O> = (input: I, ctx?: CoreContext) => Promise<O> | O;



