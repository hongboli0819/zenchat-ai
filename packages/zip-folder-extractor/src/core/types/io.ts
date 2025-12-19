/**
 * L-Core 输入输出类型定义
 */

// ===== 输入类型 =====
export interface RunProjectInput {
  zipFiles: File[];  // 上传的 ZIP 文件列表
}

// ===== 输出类型 =====
export interface RunProjectOutput {
  success: boolean;
  resultZip: Blob | null;        // 合并后的 ZIP Blob，可直接下载
  resultExcel: Blob | null;      // Excel 文件 Blob（文本数据 + 图片文件名）
  resultJson: Blob | null;       // JSON 文件 Blob（包含完整 Base64 图片数据）
  summary: ExtractionSummary;
  parsedData: ParsedUnitData[];  // 解析后的数据
  error?: string;
}

export interface ExtractionSummary {
  totalZipsProcessed: number;    // 处理的 ZIP 数量
  totalUnitsFound: number;       // 找到的单元总数
  units: FolderUnitInfo[];       // 单元详情列表
}

export interface FolderUnitInfo {
  name: string;                  // 单元文件夹名
  sourceZip: string;             // 来源 ZIP 名
  originalPath: string;          // 原始路径
  subfolderCount: number;        // 子文件夹数量
  totalFileCount: number;        // 文件总数
}

// ===== 内部类型 =====
export interface FolderUnit {
  name: string;
  sourceZip: string;
  originalPath: string;
  subfolders: SubfolderData[];
}

export interface SubfolderData {
  name: string;
  files: FileData[];
}

export interface FileData {
  name: string;
  data: Uint8Array;
}

// ===== 目录树类型 =====
export interface DirNode {
  files: string[];                    // 直接的文件名列表
  subdirs: Map<string, DirNode>;      // 子目录映射
}

// ===== 解析后的数据类型 =====
export interface ParsedUnitData {
  index: number;                   // 序号
  post_id: string;                 // 帖子 ID（从文件名第二段提取）
  title: string;                   // 标题
  content: string;                 // 文本内容
  images: ParsedImage[];           // 排序后的图片列表
  sourceUnit: string;              // 来源单元名称
}

export interface ParsedImage {
  originalName: string;            // 原始文件名
  order: number;                   // 排序数字 (从 - n 提取)
  base64: string;                  // PNG Base64 数据 (data:image/png;base64,xxx)
}

// ===== 文件名解析结果 =====
export interface FileNameParseResult {
  post_id: string;
  title: string;
  order: number;
}

