/**
 * L-Core 对外导出入口
 *
 * 这是 zip-folder-extractor 作为函数模块被其他项目调用时的入口
 */

// 项目标识
export const projectId = "zip-folder-extractor";
export const projectName = "ZIP Folder Extractor";

// 顶层能力函数
export { runProject } from "./pipelines/runProject";

// 步骤函数（可选导出，供高级用法）
export {
  buildDirectoryTree,
  printDirectoryTree,
  findTwoLevelUnits,
  packUnitsToZip,
  convertToPngBase64,
  convertImagesToPngBase64,
  parseFileName,
  parseUnitData,
  parseAllUnits,
  generateExcel,
  generateJSON,
  generateCSV,
} from "./steps";

// 类型导出
export type {
  RunProjectInput,
  RunProjectOutput,
  ExtractionSummary,
  FolderUnitInfo,
  FolderUnit,
  SubfolderData,
  FileData,
  DirNode,
  ParsedUnitData,
  ParsedImage,
  FileNameParseResult,
} from "./types/io";

export type {
  CoreContext,
  ApiClient,
  DbClient,
  Logger,
  AuthClient,
  ProgressCallback,
} from "./types/context";

export type { CoreFn } from "./types/functional";

