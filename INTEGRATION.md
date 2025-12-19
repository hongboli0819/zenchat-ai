# ZenChat AI - 集成文档

## 1. 功能概述

ZenChat AI 是一个符合 Lovable 平台规范的前端 AI 聊天应用，采用 L-Project 架构设计。

### 核心能力

- 💬 **AI 聊天**: 基于流式响应的对话体验
- 🎨 **Tiffany Blue 主题**: 精心设计的玻璃拟态 UI
- 📱 **响应式设计**: 支持桌面和移动端
- 🔧 **L-Core 纯函数**: 可被其他项目调用的能力模块

---

## 2. 作为 Lovable 项目运行 (L-App)

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 环境变量

当前版本使用模拟 AI 响应，无需配置环境变量。

未来接入真实 API 时，需要在 Lovable Secrets 中配置：

- `GEMINI_API_KEY`: Google Gemini API 密钥

---

## 3. 作为函数模块集成 (L-Core)

### 安装

```bash
npm install @org/zenchat-ai
```

### 主函数签名

#### runChat

```typescript
import { runChat, RunChatInput, RunChatOutput, CoreContext } from "@org/zenchat-ai";

const input: RunChatInput = {
  message: "Hello, how are you?",
  history: [], // 可选：历史消息
};

const ctx: CoreContext = {
  adapters: {
    onChunk: (chunk: string) => console.log(chunk), // 流式响应回调
    onComplete: (response: string) => console.log("Done:", response),
    logger: console,
  },
};

const result: RunChatOutput = await runChat(input, ctx);
console.log(result.response);
```

#### runProject

```typescript
import { runProject, RunProjectInput, RunProjectOutput } from "@org/zenchat-ai";

const input: RunProjectInput = {
  action: "chat",
  payload: { message: "Hello" },
};

const result: RunProjectOutput = await runProject(input);
console.log(result.success, result.data);
```

### CoreContext / Adapters 定义

```typescript
interface CoreContext {
  adapters?: {
    api?: ApiClient; // HTTP 客户端
    db?: DbClient; // 数据库客户端
    logger?: Logger; // 日志
    auth?: AuthClient; // 认证
    now?: () => Date; // 时间函数
    random?: () => number; // 随机数函数
    onChunk?: (chunk: string) => void; // 流式响应
    onComplete?: (response: string) => void; // 完成回调
  };
}
```

---

## 4. packages 目录说明

当前 `packages/` 目录为空，预留用于未来扩展子 L-Project。

### 规划中的子项目

| 子项目 | 职责 |
|--------|------|
| `lproject-ai-models` | AI 模型适配层 |
| `lproject-chat-storage` | 聊天持久化 |

---

## 4.1 Supabase 数据库

### 环境变量配置

```bash
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 数据库表结构

项目使用两张表存储小红书数据：

| 表名 | 说明 |
|------|------|
| `xhs_accounts` | 小红书账号信息 |
| `xhs_posts` | 小红书帖子数据 |

### 初始化数据库

```bash
# 在 Supabase SQL Editor 中执行
cat supabase/schema.sql
```

### 导入数据

```bash
# 配置环境变量后执行
npx tsx scripts/import-data.ts
```

### 数据库适配器

```typescript
import { 
  getAccounts, 
  getPosts, 
  getPostsByAccount,
  getStats 
} from "@org/zenchat-ai";

// 获取所有账号
const accounts = await getAccounts();

// 获取帖子（支持分页和过滤）
const { data, count } = await getPosts({
  accountId: "xxx",
  noteType: "视频",
  search: "关键词",
  page: 1,
  pageSize: 20,
});

// 获取统计数据
const stats = await getStats();
```

---

## 5. 目录结构

```
zenchat-ai/
├─ src/
│  ├─ app/                    # L-App 前端壳子
│  │  ├─ AppShell.tsx         # 布局、导航
│  │  └─ pages/
│  │      ├─ ChatPage.tsx     # 主聊天页面
│  │      └─ PlaygroundPage.tsx
│  │
│  ├─ core/                   # L-Core 纯函数核心
│  │  ├─ index.ts             # 对外导出入口
│  │  ├─ pipelines/
│  │  │  ├─ runChat.ts        # 聊天能力
│  │  │  └─ runProject.ts     # 主项目能力
│  │  ├─ types/               # 类型定义
│  │  └─ adapters/            # API 适配器
│  │
│  ├─ shared/
│  │  └─ ui/                  # UI 组件
│  │
│  ├─ index.css               # HSL 颜色变量
│  ├─ App.tsx                 # 根组件
│  └─ main.tsx                # 入口
│
├─ packages/                  # 子 L-Project（预留）
├─ tailwind.config.ts
├─ vite.config.ts
├─ tsconfig.json
└─ package.json
```

---

## 6. 常见问题

### App 相关

**Q: React 版本兼容性？**
A: 支持 React 18.2.0+

**Q: Tailwind 样式不生效？**
A: 确保 `src/index.css` 已在 `main.tsx` 中导入

**Q: CORS 错误？**
A: 当前使用模拟响应，无 CORS 问题。接入真实 API 后需要配置 Edge Functions

### Core 相关

**Q: ctx 没传 / adapters 没注入？**
A: Core 函数对 ctx 采用可选设计，未提供 adapters 时使用默认行为

**Q: 如何自定义 AI 响应？**
A: 修改 `src/core/adapters/api.ts` 中的 `MOCK_RESPONSES` 或替换为真实 API 调用

---

## 7. 技术规范遵循

- ✅ React 18 + Vite + TypeScript
- ✅ Tailwind CSS + HSL 颜色变量
- ✅ react-router-dom 路由
- ✅ `@/` 路径别名指向 `src/`
- ✅ L-Core 纯函数架构
- ✅ packages/ 目录预留

