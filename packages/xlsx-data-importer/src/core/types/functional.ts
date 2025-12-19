/**
 * 纯函数类型定义
 */

import type { CoreContext } from "./context";

export type CoreFn<I, O> = (input: I, ctx?: CoreContext) => Promise<O> | O;



