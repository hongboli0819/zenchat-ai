# Next.js 15 迁移说明

## 迁移概述

本项目已成功从 Vite + React Router 迁移到 Next.js 15 (App Router)。

## 主要变更

### 1. 项目配置
- ✅ 创建 `next.config.mjs` - Next.js 配置
- ✅ 更新 `package.json` - 使用 Next.js 15.3.2
- ✅ 更新 `tsconfig.json` - 适配 Next.js
- ✅ 创建 `tailwind.config.ts` - Tailwind CSS 配置
- ✅ 更新 `.env` - 环境变量从 `VITE_*` 改为 `NEXT_PUBLIC_*`
- ✅ 删除 Vite 相关文件：`vite.config.ts`, `index.html`, `main.tsx`, `App.tsx`

### 2. 路由结构

采用 Next.js App Router，页面路由如下：

```
/                          → 重定向到 /chat
/(main)/
  ├── dashboard            → 仪表板
  ├── chat                 → 聊天页面
  ├── accounts             → 账号列表
  │   └── [accountId]      → 账号详情
  ├── content-analysis     → 内容分析
  │   └── [postId]         → 内容分析详情
  ├── materials            → 素材库
  ├── strategy-insights    → 策略洞察
  ├── playground           → 游乐场
  ├── rules                → 规则管理
  └── history              → 历史数据
```

### 3. Server Actions

所有服务端函数已转换为 Server Actions（使用 `'use server'` 指令）：

#### `/src/actions/material.ts`
- `checkDuplicateTask` - 检查重复任务
- `cleanupDuplicateTasks` - 清理重复任务
- `getTasks` - 获取任务列表
- `getTask` - 获取单个任务
- `createTask` - 创建任务
- `updateTask` - 更新任务
- `deleteTask` - 删除任务
- `markStuckTasksAsFailed` - 标记卡住的任务为失败
- `deleteFailedTasks` - 删除失败的任务
- `getPostImages` - 获取帖子图片
- `getTaskImages` - 获取任务图片

#### `/src/actions/chat.ts`
- `sendChatMessage` - 发送聊天消息

### 4. Supabase 客户端

创建了两个 Supabase 客户端：

- `/src/shared/lib/supabase.ts` - 客户端组件使用（使用 ANON_KEY）
- `/src/shared/lib/supabase-server.ts` - Server Actions 使用（使用 SERVICE_KEY）

### 5. 子项目核心函数

子项目的核心函数保持不变，因为它们已经是纯函数形态：

- `@org/zip-folder-extractor` - ZIP 文件夹提取器
- `@internal/xlsx-data-importer` - Excel 数据导入器
- `@muse/image-compressor` - 图片压缩器
- `@tiffany/landing` - 着陆页

这些函数可以直接在 Server Actions 中调用。

### 6. 组件更新

- `AppShell` 从 `react-router-dom` 迁移到 `next/navigation`
- 使用 `useRouter` 和 `usePathname` 替代 `useNavigate` 和 `useLocation`
- 所有客户端组件添加 `'use client'` 指令

## 环境变量

更新 `.env` 文件，将所有 `VITE_*` 前缀改为 `NEXT_PUBLIC_*`：

```env
# 旧格式
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# 新格式
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...  # 仅服务端使用
```

## 使用 pnpm

项目现在使用 pnpm 作为包管理器：

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 启动生产服务器
pnpm start
```

## 注意事项

1. **Server Actions** - 所有服务端函数都需要添加 `'use server'` 指令
2. **客户端组件** - 需要使用客户端 Hooks 的组件需要添加 `'use client'` 指令
3. **路由导航** - 使用 `next/navigation` 的 `useRouter` 替代 `react-router-dom`
4. **环境变量** - 客户端可访问的变量必须使用 `NEXT_PUBLIC_` 前缀
5. **Supabase 客户端** - Server Actions 使用 `supabaseServer`，客户端组件使用 `supabase`

## 待办事项

- [ ] 更新所有页面组件，确保正确使用 `'use client'` 指令
- [ ] 测试所有路由和功能
- [ ] 更新 `processZipFile` 等复杂函数为 Server Actions
- [ ] 优化图片加载（使用 `next/image`）
- [ ] 配置生产环境部署

## 已知问题

- Next.js 15.3.2 有安全漏洞，建议升级到最新版本
- 部分依赖包有更新版本可用

## 相关资源

- [Next.js 文档](https://nextjs.org/docs)
- [Server Actions 文档](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [App Router 迁移指南](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
