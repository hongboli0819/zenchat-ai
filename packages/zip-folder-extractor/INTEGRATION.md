# ZIP Folder Extractor 集成文档

## 功能概述

ZIP Folder Extractor 是一个用于从 ZIP 文件中提取"两层结构"文件夹单元的工具，支持：

1. **ZIP 文件解析**：异步处理多个 ZIP 文件
2. **两层结构提取**：识别并提取符合条件的文件夹单元
3. **数据解析**：从文件名和内容中提取 `post_id`、`title`、`content`
4. **图片转换**：将所有图片转换为 PNG 格式
5. **多格式导出**：
   - 数据包 ZIP（JSON + PNG 图片文件）
   - Excel 表格（文本数据 + 图片文件名）
   - 原始文件 ZIP（保留原始结构）

### 什么是"两层结构"？

两层结构是指满足以下条件的文件夹：
- 该文件夹下只有子文件夹（没有直接的文件）
- 这些子文件夹下只有文件（没有更深的文件夹）

```
TargetFolder/           ← 这是要提取的"最小单元"
├── 图片/               ← 第一层：直接子文件夹
│   ├── file1.jpg       ← 第二层：直接是文件
│   └── file2.png
└── 文本/
    └── content.txt
```

## 作为 Lovable 项目运行（L-App）

### 安装依赖

```bash
cd packages/zip-folder-extractor
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3001

### 构建

```bash
# 构建前端应用
npm run build:app

# 构建函数库
npm run build:lib
```

## 作为函数模块集成（L-Core）

### 安装

```bash
npm i @org/zip-folder-extractor
```

### 主函数：runProject

```typescript
import { runProject } from "@org/zip-folder-extractor";

const result = await runProject(
  { zipFiles: [file1, file2] },
  {
    adapters: {
      onProgress: (message, percent) => {
        console.log(`${message} - ${percent}%`);
      },
      logger: console,
    },
  }
);

if (result.success) {
  // 下载数据包 ZIP（JSON + 图片）
  if (result.resultJson) {
    const url = URL.createObjectURL(result.resultJson);
    // ...
  }

  // 下载 Excel（文本数据）
  if (result.resultExcel) {
    const url = URL.createObjectURL(result.resultExcel);
    // ...
  }

  // 下载原始文件 ZIP
  if (result.resultZip) {
    const url = URL.createObjectURL(result.resultZip);
    // ...
  }

  // 访问解析后的数据
  console.log(result.parsedData);
}
```

### 类型定义

```typescript
// 输入类型
interface RunProjectInput {
  zipFiles: File[];
}

// 输出类型
interface RunProjectOutput {
  success: boolean;
  resultZip: Blob | null;        // 合并后的 ZIP Blob
  resultExcel: Blob | null;      // Excel 文件（文本数据 + 图片文件名）
  resultJson: Blob | null;       // 数据包 ZIP（JSON + PNG 图片文件）
  summary: ExtractionSummary;
  parsedData: ParsedUnitData[];  // 解析后的结构化数据
  error?: string;
}

// 摘要信息
interface ExtractionSummary {
  totalZipsProcessed: number;
  totalUnitsFound: number;
  units: FolderUnitInfo[];
}

// 解析后的单元数据
interface ParsedUnitData {
  index: number;           // 序号
  post_id: string;         // 帖子 ID（从文件名提取）
  title: string;           // 标题（从文件名提取）
  content: string;         // 文本内容（从 txt 文件提取）
  images: ParsedImage[];   // 图片列表（已转换为 PNG）
  sourceUnit: string;      // 来源单元名称
}

// 图片数据
interface ParsedImage {
  originalName: string;    // 原始文件名
  base64: string;          // PNG 格式的 Base64 数据
  order: number;           // 排序序号
}
```

### CoreContext / Adapters

```typescript
interface CoreContext {
  adapters?: {
    api?: ApiClient;         // 调用外部 API
    db?: DbClient;           // 数据库访问
    logger?: Logger;         // 日志记录
    auth?: AuthClient;       // 认证
    onProgress?: ProgressCallback;  // 进度回调
    now?: () => Date;        // 时间获取
    random?: () => number;   // 随机数生成
  };
}

type ProgressCallback = (message: string, percent: number) => void;
```

## 数据包结构

下载的数据包 ZIP 结构如下：

```
xiaohongshu_data_package.zip
├── data.json              # 文本数据 + 图片路径引用
└── images/
    ├── 1/                 # 按序号分组
    │   ├── pic1.png
    │   ├── pic2.png
    │   └── pic3.png
    ├── 2/
    │   ├── pic1.png
    │   └── pic2.png
    └── ...
```

**data.json 内容示例**：
```json
[
  {
    "序号": 1,
    "post_id": "user123",
    "title": "我的标题",
    "content": "文本内容...",
    "sourceUnit": "单元名",
    "imageCount": 3,
    "imagePaths": [
      "images/1/pic1.png",
      "images/1/pic2.png",
      "images/1/pic3.png"
    ]
  }
]
```

## packages 目录说明

当前没有子项目。预留 `packages/` 目录用于未来扩展，符合 Unified L-Project 规范的递归结构承诺。

## 目录结构

```
zip-folder-extractor/
├─ src/
│  ├─ app/                    # L-App：前端壳子
│  │  ├─ AppShell.tsx         # 布局组件
│  │  └─ pages/
│  │      └─ ExtractorPage.tsx
│  ├─ core/                   # L-Core：纯函数核心
│  │  ├─ index.ts             # 对外导出入口
│  │  ├─ pipelines/
│  │  │  └─ runProject.ts     # 主能力函数
│  │  ├─ steps/               # 内部步骤函数
│  │  ├─ types/               # 类型定义
│  │  └─ adapters/            # 外部系统接口
│  ├─ shared/                 # 共享工具
│  │  ├─ lib/
│  │  └─ ui/
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
├─ packages/                  # 子项目目录（预留）
├─ INTEGRATION.md
├─ package.json
├─ tsconfig.json
├─ tsconfig.build.json
└─ vite.config.ts
```

## 常见问题

### Q: ZIP 文件太大怎么办？

A: JSZip 库在浏览器中处理大文件可能会慢，建议单个文件不超过 100MB。

### Q: 没有找到任何单元？

A: 请确认 ZIP 内的文件夹结构符合"两层结构"定义。可以使用 `printDirectoryTree` 函数调试查看目录结构。

### Q: 如何在 Node.js 中使用？

A: 使用 `build:lib` 构建后，可以在 Node.js 中导入使用，但需要自行处理 File 对象的创建。

### Q: Excel 单元格长度限制？

A: Excel 单元格最大支持 32767 字符。图片数据使用数据包 ZIP 方式导出，避免了此限制。

### Q: 如何获取完整的 Base64 图片数据？

A: 下载数据包 ZIP，解压后读取 `data.json` 中的 `imagePaths`，然后读取对应的 PNG 文件。
