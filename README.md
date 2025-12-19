# ZenChat AI - 小红书数据分析平台

基于 Next.js 15 + Supabase 的小红书内容分析、账号管理、素材库管理平台。

## 技术栈

- **框架**: Next.js 15.3.2 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **数据库**: Supabase (PostgreSQL)
- **状态管理**: TanStack Query (React Query)
- **数据可视化**: Recharts
- **样式**: Tailwind CSS + shadcn/ui

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### 3. 运行开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
pnpm build
pnpm start
```

## 项目结构

```
/workspace
├── src/
│   ├── actions/              # Server Actions
│   │   ├── material.ts       # 素材库相关
│   │   └── chat.ts           # 聊天相关
│   ├── app/                  # Next.js App Router
│   │   ├── (main)/           # 主应用路由组
│   │   │   ├── dashboard/
│   │   │   ├── chat/
│   │   │   ├── accounts/
│   │   │   ├── materials/
│   │   │   └── ...
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 首页
│   ├── components/           # 共享组件
│   │   └── AppShell.tsx      # 应用外壳
│   ├── core/                 # 核心业务逻辑
│   │   ├── adapters/
│   │   ├── pipelines/
│   │   ├── services/
│   │   ├── steps/
│   │   └── types/
│   └── shared/               # 共享资源
│       ├── lib/              # 工具函数
│       └── ui/               # UI 组件
├── packages/                 # 子项目
│   ├── zip-folder-extractor/
│   ├── xlsx-data-importer/
│   ├── image-compressor/
│   └── tiffany-landing/
└── supabase/                 # 数据库迁移
    └── migrations/
```

## 功能模块

### 📊 仪表板
- KPI 指标展示
- 数据趋势图表
- 排行榜
- 时间热力图

### 💬 AI 聊天
- 智能对话
- 数据分析
- 内容推荐

### 👥 账号管理
- 账号列表
- 账号详情
- 数据分析

### 📝 内容分析
- 帖子列表
- 详情分析
- 性能指标

### 📁 素材库
- ZIP 文件上传
- 图片管理
- 自动匹配

### 📈 策略洞察
- 趋势发现
- 性能分布
- KPI 追踪

## Server Actions

本项目使用 Next.js Server Actions 处理所有服务端逻辑：

```typescript
// 客户端调用示例
import { getTasks } from '@/actions/material';

// 在客户端组件中
const tasks = await getTasks();
```

所有 Server Actions 位于 `/src/actions/` 目录。

## 数据库

使用 Supabase 作为后端服务：

- **xhs_posts** - 小红书帖子数据
- **xhs_accounts** - 账号数据
- **zip_upload_tasks** - 素材上传任务
- **post_images** - 帖子图片记录

## 子项目

项目包含多个独立的子项目模块：

- **@org/zip-folder-extractor** - ZIP 文件夹解析和提取
- **@internal/xlsx-data-importer** - Excel 数据导入
- **@muse/image-compressor** - 图片压缩
- **@tiffany/landing** - 着陆页

## 开发规范

- 使用 pnpm 作为包管理器
- 使用 Server Actions 开发后端接口
- ORM 基于 Prisma（如需使用）
- UI 基于 shadcn/ui
- 所有页面支持响应式（PC + 手机端）

## 部署

### Vercel 部署

```bash
# 推送到 GitHub 后自动部署
git push origin main
```

### 自托管部署

```bash
pnpm build
pnpm start
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 迁移说明

本项目已从 Vite 迁移到 Next.js 15。详见 [MIGRATION.md](./MIGRATION.md)。
