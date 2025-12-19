/**
 * L-Core 函数类型定义
 */

import type { CoreContext } from "./context";

/**
 * CoreFn - 纯函数的标准形态
 * 所有能力都导出为这种形式
 */
export type CoreFn<I, O> = (input: I, ctx?: CoreContext) => Promise<O> | O;


