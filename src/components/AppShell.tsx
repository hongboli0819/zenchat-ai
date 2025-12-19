'use client'

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/shared/ui/Sidebar";
import { SunIcon, MoonIcon } from "@/shared/ui/Icon";
import { ChatSession } from "@/core/types/io";

// 内容分析使用的帖子类型
export interface XHSPostForAnalysis {
  id: string;
  post_id: string;
  account_id: string | null;
  platform: string;
  title: string | null;
  content: string | null;
  post_url: string | null;
  cover_url: string | null;
  note_type: string | null;
  publish_time: string | null;
  status: string | null;
  interactions: number;
  likes: number;
  favorites: number;
  comments: number;
  shares: number;
  image_count: number;
  card_image: string | null;
  xhs_accounts?: {
    nickname: string;
    avatar: string | null;
    profile_url: string | null;
  } | null;
}

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [showBrightnessPanel, setShowBrightnessPanel] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [selectedPostForAnalysis, setSelectedPostForAnalysis] = useState<XHSPostForAnalysis | null>(null);
  const [analysisBackPath, setAnalysisBackPath] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNewChat = () => {
    if (pathname !== '/chat') {
      router.push('/chat');
    }
    setCurrentSessionId(null);
    setActiveModule(null);
    setSelectedPostForAnalysis(null);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    if (pathname !== '/chat') {
      router.push('/chat');
    }
    setCurrentSessionId(sessionId);
    setActiveModule(null);
    setSelectedPostForAnalysis(null);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  };

  const handleModuleClick = (moduleId: string | null) => {
    setSelectedPostForAnalysis(null);
    setActiveModule(moduleId);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans relative bg-gradient-to-br from-tiffany-100 via-tiffany-50 to-tiffany-200">
      {/* ===== 动态背景 ===== */}
      <div
        className="fixed inset-0 z-0 overflow-hidden transition-all duration-300"
        style={{ filter: `brightness(${brightness}%)` }}
      >
        {/* 彩色光斑 */}
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] bg-primary/50 rounded-full blur-[80px] animate-blob"></div>
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] bg-tiffany-400/40 rounded-full blur-[70px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-15%] left-[25%] w-[50vw] h-[50vw] bg-tiffany-200/50 rounded-full blur-[80px] animate-blob animation-delay-4000"></div>
        <div className="absolute top-[50%] left-[10%] w-[30vw] h-[30vw] bg-primary/35 rounded-full blur-[60px] animate-blob animation-delay-3000"></div>

        {/* 网格图案 */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.5) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        ></div>

        {/* 点状图案 */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 2px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        ></div>
      </div>

      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== 亮度控制面板 ===== */}
      <div className="fixed top-4 right-4 z-50 flex items-start gap-2">
        <div
          className={`
          overflow-hidden transition-all duration-300 ease-out
          ${showBrightnessPanel ? "w-64 opacity-100" : "w-0 opacity-0"}
        `}
        >
          <div className="glass-strong rounded-2xl shadow-lg shadow-primary/20 p-4 min-w-[250px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">亮度调节</span>
              <span className="text-xs font-bold text-tiffany-600 bg-primary/20 px-2 py-1 rounded-full">
                {brightness}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MoonIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="range"
                min="50"
                max="130"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="flex-1 h-2 bg-gradient-to-r from-muted to-primary rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:bg-card
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-primary
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                "
              />
              <SunIcon className="w-4 h-4 text-primary flex-shrink-0" />
            </div>
            <div className="flex justify-between mt-3 gap-2">
              <button
                onClick={() => setBrightness(80)}
                className="flex-1 text-xs py-1.5 px-2 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground transition-colors"
              >
                暗
              </button>
              <button
                onClick={() => setBrightness(100)}
                className="flex-1 text-xs py-1.5 px-2 bg-primary/20 hover:bg-primary/30 rounded-lg text-tiffany-600 font-semibold transition-colors"
              >
                标准
              </button>
              <button
                onClick={() => setBrightness(120)}
                className="flex-1 text-xs py-1.5 px-2 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground transition-colors"
              >
                亮
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowBrightnessPanel(!showBrightnessPanel)}
          className={`
            p-3 rounded-xl transition-all duration-300 shadow-lg
            ${
              showBrightnessPanel
                ? "bg-primary text-primary-foreground shadow-primary/40"
                : "glass text-tiffany-600 hover:bg-card/80"
            }
          `}
          aria-label="Toggle Brightness"
        >
          <SunIcon className="w-5 h-5" />
        </button>
      </div>

      {/* ===== 浮动布局 ===== */}
      <div className="flex w-full h-full p-3 md:p-4 gap-3 md:gap-4 relative z-10">
        <Sidebar
          isOpen={sidebarOpen}
          onNewChat={handleNewChat}
          toggleSidebar={toggleSidebar}
          chatSessions={chatSessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          activeModule={activeModule}
          onModuleClick={handleModuleClick}
        />

        {/* ===== 主内容区域 ===== */}
        <main
          className={`
          flex-1 flex flex-col relative overflow-hidden
          glass-strong rounded-3xl
          shadow-[0_8px_32px_hsl(var(--primary)/0.2),inset_0_1px_0_hsl(var(--card)/0.6)]
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        `}
        >
          {/* 玻璃高光 */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-card/50 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-card to-transparent"></div>
          <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-card via-card/50 to-transparent"></div>

          {children}
        </main>
      </div>
    </div>
  );
};
