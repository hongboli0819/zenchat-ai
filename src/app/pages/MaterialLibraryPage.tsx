'use client'

/**
 * MaterialLibraryPage - 素材库页面
 * 
 * 集成 zip-folder-extractor 子项目功能，支持：
 * - 上传 ZIP 文件（使用任务队列，限制并发数）
 * - 查看历史任务
 * - 浏览文件结构
 * - 预览文件内容
 */

import React, { useState, useEffect, useCallback } from "react";
import { TaskList } from "./materials/TaskList";
import { TaskDetail } from "./materials/TaskDetail";
import { FilePreviewModal } from "./materials/FilePreviewModal";
import { UploadZipDialog } from "./materials/UploadZipDialog";
import {
  createTask,
  processZipFile,
  deleteTask,
  deleteFailedTasks,
  markStuckTasksAsFailed,
  extractImageNamesFromTasks,
  cleanupDuplicateTasks,
} from "@/core/services/materialService";
import { taskQueue, useTaskQueue } from "@/core/services/taskQueue";
import { useTasks, invalidateAllData } from "@/shared/lib/queries";
import type { FileTreeNode } from "@/core/types/database";

interface MaterialLibraryPageProps {
  onBack: () => void;
}

// 返回图标
const BackIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

// 上传图标
const UploadIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
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
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

// 刷新图标
const RefreshIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
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
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

export const MaterialLibraryPage: React.FC<MaterialLibraryPageProps> = ({
  onBack,
}) => {
  // 使用缓存 hook 获取任务列表
  const { data: tasks = [], isLoading: loading, refetch } = useTasks();
  
  // 任务队列状态
  const { queue: queuedTasks, stats: queueStats, addBatch } = useTaskQueue();
  
  // 状态
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileTreeNode | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingFailed, setDeletingFailed] = useState(false);

  // 统计失败任务数量
  const failedTaskCount = tasks.filter((t) => t.status === "failed").length;

  // 获取选中的任务
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  // 刷新任务列表（使用缓存 hook）
  const loadTasks = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // 页面加载时自动清理卡住的任务（processing 状态但实际没有在处理）
  useEffect(() => {
    // 检查是否有 processing 状态的任务，但队列中没有正在运行的任务
    const processingTasks = tasks.filter((t) => t.status === "processing");
    const hasNoRunningTasks = queueStats.running === 0 && queueStats.queued === 0;

    if (processingTasks.length > 0 && hasNoRunningTasks && !loading) {
      console.log(
        `[自动清理] 发现 ${processingTasks.length} 个卡住的任务，正在标记为失败...`
      );

      markStuckTasksAsFailed().then((count) => {
        if (count > 0) {
          console.log(`[自动清理] 已将 ${count} 个卡住的任务标记为失败`);
          loadTasks();
        }
      });
    }
  }, [tasks, queueStats, loading, loadTasks]);

  // 初始化任务队列处理器（带去重保护）
  useEffect(() => {
    taskQueue.setProcessor(async (taskId, file, onProgress) => {
      // 第一道防护：从已完成任务中提取图片文件名集合
      const existingImageNames = extractImageNamesFromTasks(tasks);
      console.log(
        `[去重] 已有 ${existingImageNames.size} 个图片文件名在缓存中`
      );

      // 处理 ZIP 文件，传入已存在的图片文件名用于去重
      await processZipFile(taskId, file, onProgress, existingImageNames);
      
      // 处理完成后刷新列表
      await loadTasks();
    });
    
    // 设置最大并发数为 5
    taskQueue.setMaxConcurrent(5);
  }, [tasks, loadTasks]);

  // 定时刷新处理中的任务（包括队列中的任务）
  useEffect(() => {
    const hasProcessingTask = tasks.some((t) => t.status === "processing");
    const hasQueuedTask = queueStats.running > 0 || queueStats.queued > 0;

    if (hasProcessingTask || hasQueuedTask) {
      const interval = setInterval(() => {
        loadTasks();
      }, 3000); // 每 3 秒刷新一次

      return () => clearInterval(interval);
    }
  }, [tasks, queueStats, loadTasks]);

  // 手动刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  // 处理上传（使用任务队列，限制并发数，带去重检查）
  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setShowUploadDialog(false);

    try {
      // 1. 为每个文件创建任务记录（带去重检查）
      const createdTasks: Array<{ taskId: string; name: string; file: File }> = [];
      const skippedFiles: Array<{ name: string; reason: string }> = [];
      
      for (const file of files) {
        const result = await createTask(file.name);
        
        if (result.success && result.task) {
          // 创建成功
          createdTasks.push({ taskId: result.task.id, name: file.name, file });
        } else if (result.isDuplicate && 'existingTask' in result) {
          // 重复文件，跳过
          console.log(`[去重] 跳过重复文件: ${file.name}`);
          skippedFiles.push({ name: file.name, reason: "已存在成功处理的记录" });
        } else if ('error' in result) {
          // 创建失败
          console.error(`创建任务失败: ${file.name}`, result.error);
          skippedFiles.push({ name: file.name, reason: result.error || "创建失败" });
        }
      }

      // 提示用户跳过的文件
      if (skippedFiles.length > 0) {
        const skippedNames = skippedFiles.map(f => `• ${f.name}: ${f.reason}`).join('\n');
        console.log(`[去重] 跳过 ${skippedFiles.length} 个文件:\n${skippedNames}`);
        
        // 如果全部都被跳过
        if (createdTasks.length === 0) {
          alert(`所有文件都已存在成功处理的记录，无需重复上传。\n\n跳过的文件：\n${skippedNames}`);
          return;
        }
      }

      if (createdTasks.length === 0) {
        throw new Error("所有任务创建失败");
      }

      // 2. 更新列表并选中第一个任务
      await loadTasks();
      setSelectedTaskId(createdTasks[0].taskId);

      // 3. 将任务添加到队列（队列会自动按并发数处理）
      addBatch(createdTasks);

      const message = skippedFiles.length > 0
        ? `已添加 ${createdTasks.length} 个任务到队列（跳过 ${skippedFiles.length} 个重复文件）`
        : `已添加 ${createdTasks.length} 个任务到队列`;
      console.log(message);
    } catch (error) {
      console.error("上传失败:", error);
      alert("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  // 处理文件点击
  const handleFileClick = (node: FileTreeNode) => {
    if (node.type === "file") {
      setPreviewFile(node);
    }
  };

  // 处理删除任务
  const handleDeleteTask = async (taskId: string) => {
    const success = await deleteTask(taskId);
    
    if (success) {
      // 刷新所有缓存（任务、帖子、账号、统计）
      await invalidateAllData();
      
      // 如果删除的是当前选中的任务，清空选中状态
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    } else {
      alert("删除任务失败，请重试");
    }
  };

  // 批量删除失败任务
  const handleDeleteFailedTasks = async () => {
    if (!confirm(`确定要删除全部 ${failedTaskCount} 个失败的任务吗？`)) {
      return;
    }

    setDeletingFailed(true);
    try {
      const { deleted, failed } = await deleteFailedTasks();
      await invalidateAllData();
      
      if (failed > 0) {
        alert(`删除完成：成功 ${deleted} 个，失败 ${failed} 个`);
      } else {
        console.log(`已删除 ${deleted} 个失败的任务`);
      }
    } catch (error) {
      console.error("批量删除失败:", error);
      alert("批量删除失败，请重试");
    } finally {
      setDeletingFailed(false);
    }
  };

  // 清理重复任务
  const handleCleanupDuplicates = async () => {
    if (!confirm("确定要清理重复的任务吗？\n\n将保留最早成功的记录，删除后续重复的记录。")) {
      return;
    }

    try {
      const { cleaned, details } = await cleanupDuplicateTasks();
      await invalidateAllData();
      
      if (cleaned > 0) {
        const summary = details.map(d => `• ${d.name}: 删除 ${d.deleted.length} 个重复`).join('\n');
        alert(`已清理 ${cleaned} 个重复任务：\n\n${summary}`);
      } else {
        alert("没有发现重复的任务");
      }
    } catch (error) {
      console.error("清理重复任务失败:", error);
      alert("清理失败，请重试");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <BackIcon className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">素材库</h1>
            <p className="text-xs text-muted-foreground">
              上传 ZIP 文件，自动匹配并保存图片
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 队列状态指示器 */}
          {(queueStats.running > 0 || queueStats.queued > 0) && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-xs text-amber-600 font-medium">
                队列: {queueStats.running} 处理中, {queueStats.queued} 等待
              </span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`
              p-2 rounded-xl transition-all
              ${refreshing ? "bg-primary/10" : "hover:bg-muted"}
            `}
          >
            <RefreshIcon
              className={`w-5 h-5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-[1.02]"
          >
            <UploadIcon className="w-4 h-4" />
            上传 ZIP
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧任务列表 */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                上传任务
                {tasks.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    ({tasks.length})
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {/* 清理重复任务按钮 */}
                <button
                  onClick={handleCleanupDuplicates}
                  className="text-xs px-2 py-1 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="清理重复的成功任务（保留最早的记录）"
                >
                  去重
                </button>
                {/* 清除失败任务按钮 */}
                {failedTaskCount > 0 && (
                  <button
                    onClick={handleDeleteFailedTasks}
                    disabled={deletingFailed}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingFailed ? "删除中..." : `清除失败 (${failedTaskCount})`}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <TaskList
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onDeleteTask={handleDeleteTask}
              loading={loading}
            />
          </div>
        </div>

        {/* 右侧任务详情 */}
        <div className="flex-1 overflow-hidden">
          <TaskDetail task={selectedTask} onFileClick={handleFileClick} />
        </div>
      </div>

      {/* 上传对话框 */}
      <UploadZipDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleUpload}
        uploading={uploading}
      />

      {/* 文件预览弹窗 */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};

