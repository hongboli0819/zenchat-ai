/**
 * L-Core 对外导出入口
 * 
 * 这是 zenchat-ai 作为函数模块被其他项目调用时的入口
 */

// 项目标识
export const projectId = "zenchat-ai";
export const projectName = "ZenChat AI";

// 顶层能力函数
export { runChat } from "./pipelines/runChat";
export { runProject } from "./pipelines/runProject";

// 数据库适配器
export {
  getAccounts,
  getAccountWithStats,
  getPosts,
  getPostsByAccount,
  insertAccounts,
  insertPosts,
  getStats,
} from "./adapters/db";

// 类型导出
export type { RunChatInput, RunChatOutput } from "./types/io";
export type { RunProjectInput, RunProjectOutput } from "./types/io";
export type { Message, ChatSession, Role } from "./types/io";

export type {
  CoreContext,
  ApiClient,
  DbClient,
  Logger,
  AuthClient,
  ChatAdapter,
} from "./types/context";

export type { CoreFn } from "./types/functional";

// 数据库类型
export type {
  Database,
  XHSAccount,
  XHSAccountInsert,
  XHSPost,
  XHSPostInsert,
} from "./types/database";

// Steps 纯函数步骤
export {
  validateChatInput,
  validateProjectInput,
  normalizeMessages,
  normalizeChatInput,
  normalizeString,
  normalizeNumber,
  integrateChildProject,
  isChildProjectAvailable,
  getAvailableChildProjects,
} from "./steps";

export type { ValidationResult, ChildProjectResult } from "./steps";

