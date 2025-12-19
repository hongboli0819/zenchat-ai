/**
 * TaskCard - 任务卡片组件
 * 
 * 显示单个 ZIP 上传任务的状态和基本信息
 */

import React from "react";
import type { ZipUploadTask } from "@/core/types/database";

interface TaskCardProps {
  task: ZipUploadTask;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (taskId: string) => void;
}

// 加载动画图标
const LoadingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// 完成图标
const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// 错误图标
const ErrorIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// 文件夹图标
const FolderIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

// 删除图标
const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  onClick,
  onDelete,
}) => {
  // 处理删除按钮点击
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止冒泡到卡片的点击事件
    if (onDelete && window.confirm(`确定要删除任务 "${task.name}" 吗？\n这将同时删除所有关联的图片文件。`)) {
      onDelete(task.id);
    }
  };
  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取状态图标和颜色
  const getStatusInfo = () => {
    switch (task.status) {
      case "processing":
        return {
          icon: <LoadingIcon className="w-5 h-5 text-primary" />,
          text: "处理中",
          bgColor: "bg-primary/10",
          textColor: "text-primary",
        };
      case "completed":
        return {
          icon: <CheckIcon className="w-5 h-5 text-green-500" />,
          text: "已完成",
          bgColor: "bg-green-500/10",
          textColor: "text-green-600",
        };
      case "failed":
        return {
          icon: <ErrorIcon className="w-5 h-5 text-red-500" />,
          text: "失败",
          bgColor: "bg-red-500/10",
          textColor: "text-red-600",
        };
      default:
        return {
          icon: <FolderIcon className="w-5 h-5 text-muted-foreground" />,
          text: "未知",
          bgColor: "bg-muted",
          textColor: "text-muted-foreground",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-2xl transition-all duration-200
        border border-transparent
        ${
          isSelected
            ? "bg-card shadow-lg shadow-primary/10 border-primary/30"
            : "bg-card/60 hover:bg-card hover:shadow-md"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* 状态图标 */}
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${statusInfo.bgColor}
          `}
        >
          {statusInfo.icon}
        </div>

        {/* 任务信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate text-sm">
              {task.name}
            </h3>
            
            {/* 删除按钮 */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 
                         hover:bg-red-500/10 transition-colors flex-shrink-0"
                title="删除任务"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {formatTime(task.created_at)}
          </p>

          {/* 状态和统计 */}
          <div className="flex items-center gap-3 text-xs">
            <span
              className={`
                px-2 py-0.5 rounded-full font-medium
                ${statusInfo.bgColor} ${statusInfo.textColor}
              `}
            >
              {statusInfo.text}
            </span>

            {task.status === "completed" && (
              <>
                <span className="text-muted-foreground">
                  {task.total_units} 个单元
                </span>
                <span className="text-green-600">
                  {task.matched_posts} 匹配
                </span>
              </>
            )}

            {task.status === "processing" && (
              <span className="text-muted-foreground">
                {task.processed_units}/{task.total_units}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

