import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message, Role } from "@/core/types/io";
import { SparklesIcon, UserIcon } from "./Icon";

interface ChatMessageProps {
  message: Message;
}

// Markdown 渲染组件
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 标题样式
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold text-foreground mb-2 mt-4 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-foreground mb-2 mt-3 first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-semibold text-foreground mb-1 mt-2">
            {children}
          </h4>
        ),
        // 段落
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        ),
        // 粗体
        strong: ({ children }) => (
          <strong className="font-bold text-foreground">{children}</strong>
        ),
        // 斜体
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // 列表
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-3 space-y-1 pl-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1 pl-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        // 表格
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-lg border border-border/50">
            <table className="min-w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border/30">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
            {children}
          </td>
        ),
        // 代码块
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-muted/70 text-sm font-mono text-foreground">
                {children}
              </code>
            );
          }
          return (
            <code className="block p-3 rounded-lg bg-muted/50 text-sm font-mono overflow-x-auto my-2">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-2">{children}</pre>
        ),
        // 分隔线
        hr: () => (
          <hr className="my-4 border-border/50" />
        ),
        // 引用块
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-tiffany-500 pl-4 my-3 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        // 链接
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tiffany-600 hover:underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6 animate-slide-up group`}
    >
      <div className={`flex max-w-[90%] md:max-w-[85%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar - Glass style */}
        <div
          className={`
          flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1 backdrop-blur-md
          ${
            isUser
              ? "bg-primary/90 text-primary-foreground shadow-md shadow-primary/30 border border-card/30"
              : "bg-card/70 text-tiffany-600 border border-border/60 shadow-sm"
          }
        `}
        >
          {isUser ? <UserIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
        </div>

        {/* Message Content - Glassmorphism */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`
            px-5 py-4 rounded-2xl text-[15px] leading-relaxed relative overflow-hidden transition-all duration-300
            ${
              isUser
                ? "bg-primary/85 backdrop-blur-xl text-primary-foreground rounded-tr-sm shadow-lg shadow-primary/25 border border-card/30"
                : "glass-strong text-foreground rounded-tl-sm shadow-lg shadow-primary/10"
            }
          `}
          >
            {/* Glass highlight overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-transparent pointer-events-none rounded-2xl"></div>
            {/* Top highlight line */}
            <div
              className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-card/60 to-transparent`}
            ></div>

            <div className="relative font-medium tracking-wide">
              {isUser ? (
                // 用户消息：简单显示
                <span className="whitespace-pre-wrap">{message.content}</span>
              ) : (
                // AI 消息：渲染 Markdown
                <MarkdownContent content={message.content} />
              )}
              {message.isStreaming && (
                <span className="inline-block ml-1.5">
                  <span className="inline-flex gap-1 h-4 items-center">
                    <span className="w-1.5 h-1.5 bg-tiffany-600 rounded-full typing-dot"></span>
                    <span className="w-1.5 h-1.5 bg-tiffany-600 rounded-full typing-dot"></span>
                    <span className="w-1.5 h-1.5 bg-tiffany-600 rounded-full typing-dot"></span>
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
