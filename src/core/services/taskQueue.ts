/**
 * 任务队列管理器
 *
 * 功能：
 * 1. 限制并发任务数，避免资源耗尽
 * 2. 按顺序执行排队中的任务
 * 3. 支持任务状态追踪
 * 4. 支持取消任务
 */

export interface QueuedTask {
  id: string;
  name: string;
  file: File;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  message: string;
  error?: string;
}

type TaskProcessor = (
  taskId: string,
  file: File,
  onProgress: (message: string, percent: number) => void
) => Promise<void>;

type OnTaskUpdate = (tasks: QueuedTask[]) => void;

class TaskQueueManager {
  private queue: QueuedTask[] = [];
  private running = 0;
  private maxConcurrent = 5; // 最多同时处理 5 个任务
  private processor: TaskProcessor | null = null;
  private onUpdate: OnTaskUpdate | null = null;

  /**
   * 设置任务处理器
   */
  setProcessor(processor: TaskProcessor) {
    this.processor = processor;
  }

  /**
   * 设置任务更新回调
   */
  setOnUpdate(callback: OnTaskUpdate) {
    this.onUpdate = callback;
  }

  /**
   * 设置最大并发数
   */
  setMaxConcurrent(max: number) {
    this.maxConcurrent = Math.max(1, max);
  }

  /**
   * 获取队列状态
   */
  getQueue(): QueuedTask[] {
    return [...this.queue];
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const queued = this.queue.filter((t) => t.status === "queued").length;
    const running = this.queue.filter((t) => t.status === "running").length;
    const completed = this.queue.filter((t) => t.status === "completed").length;
    const failed = this.queue.filter((t) => t.status === "failed").length;
    return { queued, running, completed, failed, total: this.queue.length };
  }

  /**
   * 添加任务到队列
   */
  add(taskId: string, name: string, file: File): void {
    const task: QueuedTask = {
      id: taskId,
      name,
      file,
      status: "queued",
      progress: 0,
      message: "排队中...",
    };

    this.queue.push(task);
    this.notifyUpdate();
    this.processNext();
  }

  /**
   * 批量添加任务
   */
  addBatch(
    tasks: Array<{ taskId: string; name: string; file: File }>
  ): void {
    tasks.forEach(({ taskId, name, file }) => {
      const task: QueuedTask = {
        id: taskId,
        name,
        file,
        status: "queued",
        progress: 0,
        message: "排队中...",
      };
      this.queue.push(task);
    });

    this.notifyUpdate();
    
    // 启动多个并发任务（根据 maxConcurrent）
    for (let i = 0; i < this.maxConcurrent; i++) {
      this.processNext();
    }
  }

  /**
   * 取消排队中的任务
   */
  cancel(taskId: string): boolean {
    const task = this.queue.find((t) => t.id === taskId);
    if (task && task.status === "queued") {
      task.status = "cancelled";
      task.message = "已取消";
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  /**
   * 清除已完成/失败/取消的任务
   */
  clearFinished(): void {
    this.queue = this.queue.filter(
      (t) => t.status === "queued" || t.status === "running"
    );
    this.notifyUpdate();
  }

  /**
   * 处理下一个任务（非阻塞，支持真正的并发）
   */
  private processNext(): void {
    // 检查是否可以启动新任务
    if (this.running >= this.maxConcurrent) {
      return;
    }

    // 找到下一个排队中的任务
    const nextTask = this.queue.find((t) => t.status === "queued");
    if (!nextTask) {
      return;
    }

    if (!this.processor) {
      console.error("[TaskQueue] 未设置任务处理器");
      return;
    }

    // 开始处理
    this.running++;
    nextTask.status = "running";
    nextTask.message = "准备处理...";
    this.notifyUpdate();

    // 使用 Promise 链式调用，不 await，让函数立即返回以支持并发
    this.processor(nextTask.id, nextTask.file, (message, percent) => {
      nextTask.progress = percent;
      nextTask.message = message;
      this.notifyUpdate();
    })
      .then(() => {
        nextTask.status = "completed";
        nextTask.progress = 100;
        nextTask.message = "处理完成";
      })
      .catch((error) => {
        nextTask.status = "failed";
        nextTask.error =
          error instanceof Error ? error.message : String(error);
        nextTask.message = "处理失败";
        console.error(`[TaskQueue] 任务失败: ${nextTask.name}`, error);
      })
      .finally(() => {
        this.running--;
        this.notifyUpdate();

        // 处理下一个任务
        this.processNext();
      });
  }

  /**
   * 通知更新
   */
  private notifyUpdate(): void {
    this.onUpdate?.(this.getQueue());
  }
}

// 单例导出
export const taskQueue = new TaskQueueManager();

// React Hook: 订阅队列状态
import { useState, useEffect, useCallback } from "react";

export function useTaskQueue() {
  const [queue, setQueue] = useState<QueuedTask[]>([]);
  const [stats, setStats] = useState(taskQueue.getStats());

  useEffect(() => {
    // 初始化
    setQueue(taskQueue.getQueue());
    setStats(taskQueue.getStats());

    // 订阅更新
    const handleUpdate = (tasks: QueuedTask[]) => {
      setQueue(tasks);
      setStats(taskQueue.getStats());
    };

    taskQueue.setOnUpdate(handleUpdate);

    return () => {
      taskQueue.setOnUpdate(() => {});
    };
  }, []);

  const addTask = useCallback(
    (taskId: string, name: string, file: File) => {
      taskQueue.add(taskId, name, file);
    },
    []
  );

  const addBatch = useCallback(
    (tasks: Array<{ taskId: string; name: string; file: File }>) => {
      taskQueue.addBatch(tasks);
    },
    []
  );

  const cancelTask = useCallback((taskId: string) => {
    return taskQueue.cancel(taskId);
  }, []);

  const clearFinished = useCallback(() => {
    taskQueue.clearFinished();
  }, []);

  return {
    queue,
    stats,
    addTask,
    addBatch,
    cancelTask,
    clearFinished,
  };
}

