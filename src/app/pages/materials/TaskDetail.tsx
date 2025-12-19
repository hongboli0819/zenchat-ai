/**
 * TaskDetail - 任务详情组件
 * 
 * 显示选中任务的详细信息和文件结构
 */

import React from "react";
import { FileTreeView } from "./FileTreeView";
import type { ZipUploadTask, FileTreeNode } from "@/core/types/database";

interface TaskDetailProps {
  task: ZipUploadTask | null;
  onFileClick: (node: FileTreeNode) => void;
}

// 统计卡片组件
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-card/60 rounded-xl p-3">
    <div className="flex items-center gap-2 mb-1">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className="text-xl font-bold text-foreground pl-10">{value}</p>
  </div>
);

export const TaskDetail: React.FC<TaskDetailProps> = ({ task, onFileClick }) => {
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          选择一个任务
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          从左侧列表中选择一个任务，查看详细信息和文件结构
        </p>
      </div>
    );
  }

  // 格式化时间
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 获取状态样式
  const getStatusStyle = () => {
    switch (task.status) {
      case "processing":
        return {
          bg: "bg-primary/10",
          text: "text-primary",
          label: "处理中",
        };
      case "completed":
        return {
          bg: "bg-green-500/10",
          text: "text-green-600",
          label: "已完成",
        };
      case "failed":
        return {
          bg: "bg-red-500/10",
          text: "text-red-600",
          label: "失败",
        };
      default:
        return {
          bg: "bg-muted",
          text: "text-muted-foreground",
          label: "未知",
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div className="h-full flex flex-col">
      {/* 头部信息 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              {task.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              创建于 {formatTime(task.created_at)}
            </p>
          </div>
          <span
            className={`
              px-3 py-1 rounded-full text-xs font-semibold
              ${statusStyle.bg} ${statusStyle.text}
            `}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* 统计卡片 */}
        {task.status === "completed" && (
          <div className="grid grid-cols-3 gap-2">
            <StatCard
              label="总单元"
              value={task.total_units}
              color="bg-primary/10"
              icon={
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              }
            />
            <StatCard
              label="已匹配"
              value={task.matched_posts}
              color="bg-green-500/10"
              icon={
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="未匹配"
              value={task.unmatched_count}
              color="bg-amber-500/10"
              icon={
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>
        )}

        {/* 处理中进度 */}
        {task.status === "processing" && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">处理进度</span>
              <span className="text-primary font-medium">
                {task.processed_units}/{task.total_units}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{
                  width: task.total_units > 0
                    ? `${(task.processed_units / task.total_units) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {task.status === "failed" && task.error_message && (
          <div className="mt-3 p-3 bg-red-500/10 rounded-xl">
            <p className="text-sm text-red-600">{task.error_message}</p>
          </div>
        )}
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          文件结构
        </h3>
        
        <div className="bg-muted/30 rounded-xl overflow-hidden">
          <FileTreeView
            tree={task.file_structure}
            onFileClick={onFileClick}
          />
        </div>
      </div>
    </div>
  );
};


