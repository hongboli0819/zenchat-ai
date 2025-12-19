'use client'

import React from "react";
import {
  PlusIcon,
  ChatBubbleIcon,
  SparklesIcon,
  SidebarCloseIcon,
  TrashIcon,
  FolderIcon,
  ChartIcon,
  DocumentIcon,
  LightbulbIcon,
  UserCogIcon,
  ClipboardListIcon,
} from "./Icon";
import { ChatSession } from "@/core/types/io";

interface SidebarProps {
  isOpen: boolean;
  onNewChat: () => void;
  toggleSidebar: () => void;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  activeModule: string | null;
  onModuleClick: (moduleId: string | null) => void;
}

// 历史数据图标
const HistoryIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// 菜单项数据
export const menuItems = [
  { id: "materials", name: "素材库", icon: FolderIcon },
  { id: "dashboard", name: "数据看板", icon: ChartIcon },
  { id: "analysis", name: "内容分析", icon: DocumentIcon },
  { id: "insights", name: "策略洞察", icon: LightbulbIcon },
  { id: "rules", name: "规则管理", icon: ClipboardListIcon },
  { id: "accounts", name: "账号管理", icon: UserCogIcon },
  { id: "history-data", name: "历史数据", icon: HistoryIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onNewChat,
  toggleSidebar,
  chatSessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  activeModule,
  onModuleClick,
}) => {
  const handleMenuClick = (menuId: string) => {
    // 点击已激活的模块则取消，否则激活该模块
    onModuleClick(activeModule === menuId ? null : menuId);
  };

  return (
    <div
      className={`
        ${isOpen ? "w-[280px] opacity-100" : "w-0 opacity-0 overflow-hidden"}
        md:relative fixed inset-y-0 left-0 z-40 
        flex flex-col 
        bg-primary/85 backdrop-blur-2xl rounded-3xl
        text-foreground
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        shadow-xl shadow-primary/30
        border border-card/30
        ${isOpen ? "md:m-0" : "md:w-0 md:p-0 md:border-0"}
      `}
    >
      {/* Glossy overlay - glass effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-card/30 via-card/10 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-card/70 to-transparent rounded-t-3xl"></div>
      <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-card/50 via-card/30 to-transparent rounded-l-3xl"></div>

      {/* Header */}
      <div className="p-5 flex items-center justify-between relative z-10 mt-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-card/90 backdrop-blur-md rounded-xl flex items-center justify-center text-primary shadow-lg border border-card/50">
              <SparklesIcon className="w-5 h-5" />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-foreground tracking-wide font-sans">TIFFANY</h1>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-card/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
          aria-label="Collapse Sidebar"
        >
          <SidebarCloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button - Glass style */}
      <div className="px-4 mb-4 relative z-10">
        <button
          onClick={() => {
            onNewChat();
            onModuleClick(null); // 新建对话时清除模块选择
          }}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-card/90 backdrop-blur-md text-tiffany-600 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl group font-semibold relative overflow-hidden hover:scale-[1.02] border border-card/50 tracking-wide"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-transparent pointer-events-none rounded-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

          <PlusIcon className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90 relative z-10" />
          <span className="relative z-10">新建对话</span>
        </button>
      </div>

      {/* Menu Modules */}
      <div className="px-3 mb-4 relative z-10">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-card/50 text-foreground shadow-sm"
                      : "hover:bg-card/25 text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                <IconComponent
                  className={`w-5 h-5 ${isActive ? "text-tiffany-600" : "text-muted-foreground group-hover:text-foreground"}`}
                />
                <span className="text-sm font-medium tracking-wide">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-card/30 relative z-10"></div>

      {/* Chat History - 始终显示 */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 custom-scrollbar relative z-10">
        {chatSessions.length > 0 ? (
          <>
            <div className="text-[10px] font-semibold text-muted-foreground px-4 py-2 uppercase tracking-[0.15em]">
              对话历史
            </div>
            <div className="space-y-1">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer
                    ${
                      currentSessionId === session.id && !activeModule
                        ? "bg-card/40 text-foreground"
                        : "hover:bg-card/20 text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <button
                    onClick={() => {
                      onSelectSession(session.id);
                      onModuleClick(null); // 选择对话时清除模块选择
                    }}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <ChatBubbleIcon
                      className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id && !activeModule ? "text-tiffany-600" : "text-muted-foreground"}`}
                    />
                    <span className="truncate text-sm font-medium tracking-wide">{session.title}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-card/40 rounded-lg transition-all text-muted-foreground hover:text-destructive"
                    aria-label="Delete chat"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ChatBubbleIcon className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">暂无对话历史</p>
            <p className="text-xs text-muted-foreground/70 mt-1">点击上方按钮开始新对话</p>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-card/30 relative z-10">
        <button className="flex items-center gap-3 px-3 py-3 w-full hover:bg-card/30 rounded-xl transition-all duration-300 group backdrop-blur-sm">
          <div className="w-9 h-9 rounded-full bg-card/90 backdrop-blur-md flex items-center justify-center text-sm text-tiffany-600 font-bold shadow-md group-hover:shadow-lg transition-all border border-card/50">
            T
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate tracking-wide">TIFFANY</p>
            <p className="text-xs text-muted-foreground truncate tracking-wide">Pro Plan</p>
          </div>
        </button>
      </div>
    </div>
  );
};
