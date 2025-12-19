# Tiffany Landing - 集成文档

## 1. 功能概述

Tiffany AI Social Media Insights 的欢迎页面，包含：
- 全屏视频背景（tiffany.mp4）
- 打字机动画欢迎语
- "开始探索"按钮，跳转到主应用

## 2. 作为 Lovable 项目运行（L-App）

```bash
cd packages/tiffany-landing
npm install
npm run dev   # http://127.0.0.1:8095
```

## 3. 作为函数模块集成（L-Core）

### 安装

项目内部使用，通过 Vite 别名配置：

```typescript
// 父项目 vite.config.ts
"@tiffany/landing": path.resolve(__dirname, "./packages/tiffany-landing/src/core/index.ts")
```

### 使用

```typescript
import { runProject, DEFAULT_LANDING_CONFIG } from "@tiffany/landing";

const result = await runProject({
  config: {
    welcomeLine1: "Welcome to Tiffany's AI-Powered",
    welcomeLine2: "Social Media Insights Assistant",
    videoSrc: "/tiffany.mp4",
    buttonText: "开始探索",
    navigateTo: "/",
  }
});
```

## 4. 父项目路由集成

在父项目 `App.tsx` 中添加路由：

```tsx
import { LandingPage } from "../../packages/tiffany-landing/src/app/pages/LandingPage";

<Routes>
  <Route path="/welcome" element={<LandingPage />} />
  <Route path="/" element={<AppShell />}>
    {/* 其他路由 */}
  </Route>
</Routes>
```

## 5. 视频文件

确保 `tiffany.mp4` 存在于：
- 子项目独立运行：`packages/tiffany-landing/public/tiffany.mp4`
- 父项目集成：`public/tiffany.mp4`

## 6. 常见问题

### Q: 视频不播放？
A: 检查视频路径是否正确，确保 `public` 目录中有 `tiffany.mp4`

### Q: 打字机动画重复？
A: 使用 `useRef` 防止 React 18 StrictMode 重复执行

### Q: 按钮点击无反应？
A: 检查 `useNavigate` 是否在 `BrowserRouter` 上下文中

