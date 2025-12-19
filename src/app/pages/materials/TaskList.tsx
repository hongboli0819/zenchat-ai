/**
 * TaskList - 任务列表组件
 * 
 * 显示所有 ZIP 上传任务
 */

import React from "react";
import { TaskCard } from "./TaskCard";
import type { ZipUploadTask } from "@/core/types/database";

interface TaskListProps {
  tasks: ZipUploadTask[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  loading: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onDeleteTask,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-foreground mb-1">暂无上传任务</h3>
        <p className="text-sm text-muted-foreground">
          点击上方按钮上传 ZIP 文件
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isSelected={selectedTaskId === task.id}
          onClick={() => onSelectTask(task.id)}
          onDelete={onDeleteTask}
        />
      ))}
    </div>
  );
};

