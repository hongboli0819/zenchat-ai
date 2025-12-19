import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { ChatPage } from "@/app/pages/ChatPage";
import { PlaygroundPage } from "@/app/pages/PlaygroundPage";
import { AccountDetailPage } from "@/app/pages/AccountDetailPage";
import { usePrefetchCoreData } from "@/shared/lib/queries";
// Tiffany Landing 子项目页面
import { LandingPage } from "../packages/tiffany-landing/src/app/pages/LandingPage";

/**
 * 欢迎页面包装组件
 * 在展示欢迎页面的同时，后台预加载主应用数据
 */
function WelcomePageWithPrefetch() {
  const prefetchCoreData = usePrefetchCoreData();

  useEffect(() => {
    // 页面加载后，静默预加载主应用核心数据
    // 这样用户点击"开始探索"时，数据已缓存好
    console.log("[Welcome] 启动数据预加载...");
    prefetchCoreData();
  }, [prefetchCoreData]);

  return <LandingPage />;
}

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        {/* Tiffany Landing 欢迎页面（带数据预加载） */}
        <Route path="/welcome" element={<WelcomePageWithPrefetch />} />
        
        {/* 主应用路由 */}
        <Route path="/" element={<AppShell />}>
          <Route index element={<ChatPage />} />
          <Route path="playground" element={<PlaygroundPage />} />
          <Route path="accounts/:accountId" element={<AccountDetailPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;



