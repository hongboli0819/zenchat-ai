import React, { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { ChatMessage } from "@/shared/ui/ChatMessage";
import { SendIcon, SparklesIcon, PanelLeftIcon } from "@/shared/ui/Icon";
import { Message, Role, ChatSession } from "@/core/types/io";
import { runChat } from "@/core/pipelines/runChat";
import { menuItems } from "@/shared/ui/Sidebar";
import { HistoryDataPage } from "./HistoryDataPage";
import { AccountsPage } from "./AccountsPage";
import { MaterialLibraryPage } from "./MaterialLibraryPage";
import { DashboardPage } from "./DashboardPage";
import { ContentAnalysisPage } from "./ContentAnalysisPage";
import { ContentAnalysisDetailPage } from "./ContentAnalysisDetailPage";
import { StrategyInsightsPage } from "./StrategyInsightsPage";
import { RulesManagementPage } from "./RulesManagementPage";

import type { XHSPostForAnalysis } from "@/app/AppShell";

interface ChatContextType {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessions: ChatSession[];
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  activeModule: string | null;
  setActiveModule: React.Dispatch<React.SetStateAction<string | null>>;
  selectedPostForAnalysis: XHSPostForAnalysis | null;
  setSelectedPostForAnalysis: React.Dispatch<React.SetStateAction<XHSPostForAnalysis | null>>;
  analysisBackPath: string | null;
  setAnalysisBackPath: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ChatPage: React.FC = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    chatSessions,
    setChatSessions,
    currentSessionId,
    setCurrentSessionId,
    activeModule,
    setActiveModule,
    selectedPostForAnalysis,
    setSelectedPostForAnalysis,
    analysisBackPath,
    setAnalysisBackPath,
  } = useOutletContext<ChatContextType>();

  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 用于追踪是否是内部更新，避免循环
  const isInternalUpdateRef = useRef(false);
  // 用于追踪上一个 sessionId
  const prevSessionIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // 当 currentSessionId 改变时，加载对应的消息
  useEffect(() => {
    // 如果 sessionId 没有变化，不做任何事
    if (prevSessionIdRef.current === currentSessionId) {
      return;
    }

    // 保存旧 session 的消息（如果有的话）
    if (prevSessionIdRef.current && messages.length > 0) {
      const oldSessionId = prevSessionIdRef.current;
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === oldSessionId ? { ...session, messages } : session
        )
      );
    }

    // 更新 ref
    prevSessionIdRef.current = currentSessionId;

    // 加载新 session 的消息
    if (currentSessionId) {
      const session = chatSessions.find((s) => s.id === currentSessionId);
      if (session) {
        setMessages(session.messages);
      } else {
        setMessages([]);
      }
    } else {
      // 新对话，清空消息
      setMessages([]);
    }
  }, [currentSessionId]); // 只依赖 currentSessionId，不依赖 chatSessions

  // 当消息变化时，同步到当前 session
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    // 同步消息到 session
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId ? { ...session, messages } : session
      )
    );
  }, [messages, currentSessionId, setChatSessions]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: input.trim(),
      timestamp: Date.now(),
    };

    const messageContent = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // 创建新 session 如果不存在
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: sessionId,
        title: messageContent.slice(0, 30) + (messageContent.length > 30 ? "..." : ""),
        messages: [userMessage],
        createdAt: Date.now(),
      };
      
      // 先更新 ref，防止触发加载
      prevSessionIdRef.current = sessionId;
      isInternalUpdateRef.current = true;
      
      setChatSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
      setMessages([userMessage]);
    } else {
      setMessages((prev) => [...prev, userMessage]);
    }

    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, aiMessage]);

    try {
      // 使用 L-Core 的 runChat 函数
      await runChat(
        { message: messageContent },
        {
          adapters: {
            onChunk: (chunk: string) => {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId ? { ...msg, content: msg.content + chunk } : msg
                )
              );
            },
          },
        }
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: "Sorry, I encountered an issue. Please try again.", isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg))
      );
    }
  }, [input, isLoading, currentSessionId, setChatSessions, setCurrentSessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 获取当前激活的模块信息
  const activeModuleInfo = activeModule ? menuItems.find((m) => m.id === activeModule) : null;

  // 如果是素材库模块，显示素材库页面
  if (activeModule === "materials") {
    return <MaterialLibraryPage onBack={() => setActiveModule(null)} />;
  }

  // 如果是历史数据模块，显示专用页面
  if (activeModule === "history-data") {
    return <HistoryDataPage onBack={() => setActiveModule(null)} />;
  }

  // 如果是账号管理模块，显示账号管理页面
  if (activeModule === "accounts") {
    return <AccountsPage onBack={() => setActiveModule(null)} />;
  }

  // 如果是数据看板模块，显示数据看板页面
  if (activeModule === "dashboard") {
    return <DashboardPage onBack={() => setActiveModule(null)} />;
  }

  // 如果是内容分析模块
  if (activeModule === "analysis") {
    // 如果已选中帖子，显示详情页
    if (selectedPostForAnalysis) {
      return (
        <ContentAnalysisDetailPage
          post={selectedPostForAnalysis}
          onBack={() => {
            // 清除选中的帖子
            setSelectedPostForAnalysis(null);
            // 如果有来源路径，返回到来源页面
            if (analysisBackPath) {
              // 检查是否是模块标识（@module:xxx）
              if (analysisBackPath.startsWith('@module:')) {
                const moduleId = analysisBackPath.replace('@module:', '');
                setActiveModule(moduleId);
              } else {
                // 否则是路由路径，导航到该路径
                navigate(analysisBackPath);
                setActiveModule(null);
              }
              setAnalysisBackPath(null);
            }
            // 否则保持在内容分析列表页
          }}
        />
      );
    }
    // 否则显示列表页
    return (
      <ContentAnalysisPage
        onBack={() => setActiveModule(null)}
        onSelectPost={(post) => setSelectedPostForAnalysis(post)}
      />
    );
  }

  // 如果是策略洞察模块，显示策略洞察页面
  if (activeModule === "insights") {
    return (
      <StrategyInsightsPage
        onBack={() => setActiveModule(null)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    );
  }

  // 如果是规则管理模块，显示规则管理页面
  if (activeModule === "rules") {
    return (
      <RulesManagementPage
        onBack={() => setActiveModule(null)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    );
  }

  // 如果有激活的其他模块，显示"功能开发中"页面
  if (activeModule && activeModuleInfo) {
    const IconComponent = activeModuleInfo.icon;
    return (
      <>
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 relative z-20 border-b border-border/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all ${
                sidebarOpen ? "md:opacity-0 md:pointer-events-none" : "opacity-100"
              }`}
              aria-label="Toggle Menu"
            >
              <PanelLeftIcon className="w-5 h-5" />
            </button>

            {/* Module Badge */}
            <div
              className={`hidden md:flex items-center gap-2.5 px-4 py-2 glass rounded-full transition-all duration-500 ${
                !sidebarOpen ? "translate-x-0" : "-translate-x-2"
              }`}
            >
              <IconComponent className="w-4 h-4 text-tiffany-600" />
              <span className="text-xs font-bold text-tiffany-600 tracking-wider uppercase">
                {activeModuleInfo.name}
              </span>
            </div>
          </div>
        </header>

        {/* Module Content - 功能开发中 */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-primary rounded-3xl blur-xl opacity-50 scale-110 animate-pulse-slow"></div>
            <div className="relative w-24 h-24 bg-primary/80 backdrop-blur-md rounded-3xl flex items-center justify-center rotate-3 transition-transform hover:rotate-6 duration-700 group shadow-lg shadow-primary/30 border border-card/40">
              <IconComponent className="w-10 h-10 text-primary-foreground group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-foreground">
            {activeModuleInfo.name}
          </h2>
          <p className="text-muted-foreground text-lg max-w-md text-center mb-6">
            功能开发中，敬请期待...
          </p>

          <div className="flex items-center gap-3 text-sm text-muted-foreground/70 mb-8">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
            </div>
            <span>开发团队正在努力中</span>
          </div>

          <button
            onClick={() => setActiveModule(null)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            返回对话
          </button>
        </div>
      </>
    );
  }

  // 正常的聊天页面
  return (
    <>
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-8 relative z-20 border-b border-border/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all ${
              sidebarOpen ? "md:opacity-0 md:pointer-events-none" : "opacity-100"
            }`}
            aria-label="Toggle Menu"
          >
            <PanelLeftIcon className="w-5 h-5" />
          </button>

          {/* Model Badge */}
          <div
            className={`hidden md:flex items-center gap-2.5 px-4 py-2 glass rounded-full transition-all duration-500 ${
              !sidebarOpen ? "translate-x-0" : "-translate-x-2"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-slow shadow-[0_0_8px_hsl(var(--primary)/0.8)]"></span>
            <span className="text-xs font-bold text-tiffany-600 tracking-wider uppercase">TIFFANY</span>
          </div>
        </div>
      </header>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 custom-scrollbar pt-8 pb-4 scroll-smooth">
        <div className="max-w-3xl mx-auto min-h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in px-4">
              {/* Hero Icon */}
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-primary rounded-3xl blur-xl opacity-50 scale-110 animate-pulse-slow"></div>
                <div className="relative w-24 h-24 bg-primary/80 backdrop-blur-md rounded-3xl flex items-center justify-center rotate-3 transition-transform hover:rotate-6 duration-700 group shadow-lg shadow-primary/30 border border-card/40">
                  <SparklesIcon className="w-10 h-10 text-primary-foreground group-hover:scale-110 transition-transform duration-300 drop-shadow-md" />
                </div>
              </div>

              <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight text-foreground">Hello.</h2>
              <p className="text-muted-foreground text-lg max-w-md">
                I'm your AI assistant. Ask me anything in the input box below.
              </p>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* ===== 输入区域 ===== */}
      <div className="p-4 md:p-6 relative z-20">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-3 glass-strong rounded-2xl p-2 transition-all duration-300 hover:border-primary/50 focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/20 shadow-lg shadow-primary/10">
            {/* 玻璃高光 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-card/50 to-transparent pointer-events-none"></div>
            <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-card to-transparent"></div>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none max-h-48 text-foreground placeholder:text-muted-foreground px-4 py-3 leading-relaxed custom-scrollbar text-[15px] relative z-10"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`
                p-3 rounded-xl flex-shrink-0 mb-0.5 mr-0.5 transition-all duration-300 ease-out relative z-10
                ${
                  input.trim() && !isLoading
                    ? "bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-lg shadow-primary/40 font-semibold hover:bg-tiffany-600"
                    : "bg-card/50 text-muted-foreground cursor-not-allowed backdrop-blur-sm"
                }
              `}
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-muted-foreground text-xs mt-3">
            TIFFANY can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </>
  );
};
