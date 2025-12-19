/**
 * xlsx-data-importer 输入/输出类型定义
 */

// ===== Excel 原始行数据 =====
export interface ExcelRow {
  序号: number;
  平台: string;
  标题: string;
  作品正文: string;
  作品原链接: string;
  封面图链接: string;
  笔记类型: string;
  发布时间: string;
  昵称: string;
  头像: string;
  账号主页链接: string;
  小红书号: string;
  作品状态: string;
  账号类型: string;
  互动量: number | string;
  获赞数: number | string;
  收藏数: number | string;
  评论数: number | string;
  分享数: number | string;
  发布时间段: string;
}

// ===== 映射后的帖子数据 =====
export interface MappedPost {
  // 从 Excel 直接映射
  platform: string;
  title: string | null;
  content: string | null;
  post_url: string;
  cover_url: string | null;
  note_type: string | null;
  publish_time: string | null;
  status: string | null;
  interactions: number;
  likes: number;
  favorites: number;
  comments: number;
  shares: number;
  data_period: string | null;

  // 解析生成
  post_id: string; // 从 post_url 解析

  // 关联字段（用于查找账号）
  profile_url: string; // 用于关联账号

  // 默认值
  image_count: number; // 默认 0
  merge_image: null; // 默认 null
}

// ===== 映射后的账号数据 =====
export interface MappedAccount {
  nickname: string;
  avatar: string | null;
  profile_url: string; // 唯一标识
  xhs_id: string | null;
  xhs_user_id: string | null; // 从 profile_url 解析
  account_type: string | null;
}

// ===== 输入类型 =====
export interface RunProjectInput {
  file: File; // xlsx 文件
  mode?: "incremental"; // 导入模式（目前只支持增量）
  onProgress?: (message: string, percent: number) => void;
}

// ===== 输出类型 =====
export interface RunProjectOutput {
  success: boolean;
  summary: ImportSummary;
  errors?: string[];
}

export interface ImportSummary {
  totalRows: number; // Excel 总行数
  existingCount: number; // 已存在跳过数
  insertedPosts: number; // 新插入帖子数
  newAccounts: number; // 新创建账号数
  existingAccounts: number; // 复用已有账号数
  processingTime: number; // 处理耗时（ms）
}



