/**
 * L-Core 对外导出入口
 *
 * 这是 xlsx-data-importer 作为函数模块被其他项目调用时的入口
 */

// 项目标识
export const projectId = "xlsx-data-importer";
export const projectName = "XLSX Data Importer";

// 顶层能力函数
export { runProject } from "./pipelines/runProject";

// 步骤函数（可选导出，供高级用法）
export {
  parseXlsx,
  mapToDatabase,
  findExistingPosts,
  findOrCreateAccounts,
  insertNewPosts,
} from "./steps";

// 类型导出
export type {
  RunProjectInput,
  RunProjectOutput,
  ImportSummary,
  ExcelRow,
  MappedPost,
  MappedAccount,
} from "./types/io";

export type {
  CoreContext,
  Logger,
  DbClient,
  ApiClient,
  AuthClient,
  ProgressCallback,
} from "./types/context";

export type { CoreFn } from "./types/functional";

