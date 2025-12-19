/**
 * Steps 模块导出
 * 
 * 这些是更细粒度的纯函数步骤，供 pipelines 调用
 */

// 验证步骤
export {
  validateChatInput,
  validateProjectInput,
  type ValidationResult,
} from "./validateInput";

// 标准化步骤
export {
  normalizeMessages,
  normalizeChatInput,
  normalizeString,
  normalizeNumber,
} from "./normalizeData";

// 子项目集成步骤
export {
  integrateChildProject,
  isChildProjectAvailable,
  getAvailableChildProjects,
  type ChildProjectResult,
} from "./integrateChildProject";



