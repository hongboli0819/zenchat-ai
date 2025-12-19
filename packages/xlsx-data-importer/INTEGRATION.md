# xlsx-data-importer 集成文档

## 功能概述

`xlsx-data-importer` 是一个用于将小红书数据 Excel 文件增量导入到 Supabase 数据库的子项目。

### 主要特性

- ✅ 解析 xlsx/xls 格式的 Excel 文件
- ✅ 自动字段映射（Excel 表头 → 数据库字段）
- ✅ 增量导入（已存在的数据自动跳过）
- ✅ 自动处理账号（查找或创建）
- ✅ 批量操作优化（分批查询和插入）
- ✅ 进度回调支持

## 作为函数模块集成（L-Core）

### 安装

项目已包含在 monorepo 中，无需额外安装。

### 使用方式

```typescript
import {
  runProject,
  type RunProjectInput,
  type RunProjectOutput,
} from "@internal/xlsx-data-importer";

// 构造 CoreContext
const ctx = {
  adapters: {
    db: supabaseClient,
    logger: console,
  },
};

// 调用
const result = await runProject(
  {
    file: xlsxFile,
    mode: "incremental",
    onProgress: (message, percent) => {
      console.log(`${percent}% - ${message}`);
    },
  },
  ctx
);

if (result.success) {
  console.log("导入成功:", result.summary);
} else {
  console.error("导入失败:", result.errors);
}
```

### 输入参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | ✅ | xlsx/xls 文件 |
| mode | "incremental" | ❌ | 导入模式，目前仅支持增量 |
| onProgress | (message, percent) => void | ❌ | 进度回调 |

### 输出结果

```typescript
interface RunProjectOutput {
  success: boolean;
  summary: {
    totalRows: number;      // Excel 总行数
    existingCount: number;  // 已存在跳过数
    insertedPosts: number;  // 新插入帖子数
    newAccounts: number;    // 新创建账号数
    existingAccounts: number; // 复用账号数
    processingTime: number; // 处理耗时（ms）
  };
  errors?: string[];        // 错误信息
}
```

## Excel 表头映射

| Excel 表头 | 数据库字段 | 说明 |
|-----------|-----------|------|
| 平台 | platform | - |
| 标题 | title | - |
| 作品正文 | content | - |
| 作品原链接 | post_url | 唯一标识 |
| 封面图链接 | cover_url | - |
| 笔记类型 | note_type | 图文/视频 |
| 发布时间 | publish_time | 转换为 ISO 格式 |
| 作品状态 | status | - |
| 互动量 | interactions | - |
| 获赞数 | likes | - |
| 收藏数 | favorites | - |
| 评论数 | comments | - |
| 分享数 | shares | - |
| 发布时间段 | data_period | - |
| 昵称 | xhs_accounts.nickname | - |
| 头像 | xhs_accounts.avatar | - |
| 账号主页链接 | xhs_accounts.profile_url | 账号唯一标识 |
| 小红书号 | xhs_accounts.xhs_id | - |
| 账号类型 | xhs_accounts.account_type | - |

## 增量导入逻辑

1. 使用 `post_url`（作品原链接）作为帖子唯一标识
2. 使用 `profile_url`（账号主页链接）作为账号唯一标识
3. 已存在的数据保持不变，只插入新数据

## 作为独立应用运行

```bash
cd packages/xlsx-data-importer
npm install
npm run dev
```

访问 http://localhost:8084



