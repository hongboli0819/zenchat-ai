/**
 * materialService - 素材库业务逻辑服务
 * 
 * 处理 ZIP 文件上传、解析、匹配和图片存储
 */

import { supabase } from "../../shared/lib/supabase";
import { runProject } from "@org/zip-folder-extractor";
import { toPng } from "html-to-image";
import { generateCollageFromUrls, generateCollageFromBase64 } from "../../shared/lib/collage-browser";
import { compressImage } from "@muse/image-compressor";
import type {
  ZipUploadTask,
  ZipUploadTaskInsert,
  FileTreeNode,
  TaskResultSummary,
} from "../types/database";

// ===== 去重辅助函数 =====

/**
 * 从已完成任务的 file_structure 中提取所有图片文件名
 * 用于第一道防护：快速过滤重复单元
 */
export function extractImageNamesFromTasks(
  completedTasks: ZipUploadTask[]
): Set<string> {
  const imageNames = new Set<string>();

  for (const task of completedTasks) {
    if (task.status !== "completed" || !task.file_structure) continue;

    // 递归遍历文件树，提取所有图片文件名
    const extractFromNode = (node: FileTreeNode) => {
      if (node.type === "file" && node.mimeType?.startsWith("image/")) {
        imageNames.add(node.name);
      }
      if (node.children) {
        node.children.forEach(extractFromNode);
      }
    };

    extractFromNode(task.file_structure);
  }

  return imageNames;
}

/**
 * 过滤重复单元
 * 如果单元的所有图片文件名都已存在于已处理集合中，则跳过该单元
 */
export function filterDuplicateUnits<T extends { images: Array<{ originalName: string }> }>(
  units: T[],
  existingImageNames: Set<string>
): { newUnits: T[]; skippedCount: number } {
  const newUnits: T[] = [];
  let skippedCount = 0;

  for (const unit of units) {
    // 检查该单元的图片是否全部已存在
    const allExist = unit.images.every((img) =>
      existingImageNames.has(img.originalName)
    );

    if (allExist && unit.images.length > 0) {
      // 所有图片都已存在，跳过该单元
      skippedCount++;
    } else {
      // 有新图片，保留该单元
      newUnits.push(unit);
    }
  }

  return { newUnits, skippedCount };
}

// ===== 任务去重 =====

/**
 * 检查是否已存在同名且成功完成的任务
 * 用于上传前去重，避免创建重复任务
 */
export async function checkDuplicateTask(
  fileName: string
): Promise<{ isDuplicate: boolean; existingTask: ZipUploadTask | null }> {
  const { data, error } = await supabase
    .from("zip_upload_tasks")
    .select("*")
    .eq("name", fileName)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("检查重复任务失败:", error);
    return { isDuplicate: false, existingTask: null };
  }

  if (data && data.length > 0) {
    return { isDuplicate: true, existingTask: data[0] as ZipUploadTask };
  }

  return { isDuplicate: false, existingTask: null };
}

/**
 * 清理重复的任务记录
 * 保留最早成功的任务，删除后续重复的任务
 */
export async function cleanupDuplicateTasks(): Promise<{
  cleaned: number;
  details: Array<{ name: string; kept: string; deleted: string[] }>;
}> {
  // 定义查询结果类型
  type TaskRecord = { id: string; name: string; created_at: string; status: string };

  // 1. 获取所有成功完成的任务
  const { data: allTasks, error } = await supabase
    .from("zip_upload_tasks")
    .select("id, name, created_at, status")
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  if (error || !allTasks) {
    console.error("获取任务列表失败:", error);
    return { cleaned: 0, details: [] };
  }

  // 类型断言
  const typedTasks = allTasks as TaskRecord[];

  // 2. 按文件名分组
  const tasksByName = new Map<string, TaskRecord[]>();
  for (const task of typedTasks) {
    const existing = tasksByName.get(task.name) || [];
    existing.push(task);
    tasksByName.set(task.name, existing);
  }

  // 3. 找出重复的任务（保留最早的，删除其余的）
  const toDelete: string[] = [];
  const details: Array<{ name: string; kept: string; deleted: string[] }> = [];

  for (const [name, tasks] of tasksByName) {
    if (tasks.length > 1) {
      // 第一个是最早的，保留它
      const [kept, ...duplicates] = tasks;
      const duplicateIds = duplicates.map((t) => t.id);
      toDelete.push(...duplicateIds);
      details.push({
        name,
        kept: kept.id,
        deleted: duplicateIds,
      });
    }
  }

  // 4. 批量删除重复任务
  if (toDelete.length > 0) {
    console.log(`[去重] 发现 ${toDelete.length} 个重复任务，正在清理...`);

    for (const taskId of toDelete) {
      await deleteTask(taskId);
    }

    console.log(`[去重] 已清理 ${toDelete.length} 个重复任务`);
  }

  return { cleaned: toDelete.length, details };
}

// ===== 任务相关 =====

/**
 * 获取所有上传任务
 */
export async function getTasks(): Promise<ZipUploadTask[]> {
  const { data, error } = await supabase
    .from("zip_upload_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取任务列表失败:", error);
    return [];
  }

  return (data as ZipUploadTask[]) || [];
}

/**
 * 获取单个任务
 */
export async function getTask(taskId: string): Promise<ZipUploadTask | null> {
  const { data, error } = await supabase
    .from("zip_upload_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("获取任务失败:", error);
    return null;
  }

  return data as ZipUploadTask;
}

/**
 * 创建上传任务返回类型
 */
export type CreateTaskResult = 
  | { success: true; task: ZipUploadTask; isDuplicate: false }
  | { success: false; task: null; isDuplicate: true; existingTask: ZipUploadTask }
  | { success: false; task: null; isDuplicate: false; error: string };

/**
 * 创建上传任务（带去重检查）
 * 
 * @param name 任务名称（通常是文件名）
 * @param skipDuplicateCheck 是否跳过重复检查（默认 false）
 */
export async function createTask(
  name: string,
  skipDuplicateCheck: boolean = false
): Promise<CreateTaskResult> {
  // 1. 检查是否已存在同名的成功任务
  if (!skipDuplicateCheck) {
    const { isDuplicate, existingTask } = await checkDuplicateTask(name);
    if (isDuplicate && existingTask) {
      console.log(`[去重] 任务 "${name}" 已存在成功记录，跳过创建`);
      return { success: false, task: null, isDuplicate: true, existingTask };
    }
  }

  // 2. 创建新任务
  const taskData: ZipUploadTaskInsert = {
    name,
    status: "processing",
    total_units: 0,
    processed_units: 0,
    matched_posts: 0,
    unmatched_count: 0,
  };

  const { data, error } = await supabase
    .from("zip_upload_tasks")
    .insert(taskData)
    .select()
    .single();

  if (error) {
    console.error("创建任务失败:", error);
    return { success: false, task: null, isDuplicate: false, error: error.message };
  }

  return { success: true, task: data as ZipUploadTask, isDuplicate: false };
}

/**
 * 更新任务状态
 */
export async function updateTask(
  taskId: string,
  updates: Partial<ZipUploadTask>
): Promise<boolean> {
  const { error } = await supabase
    .from("zip_upload_tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) {
    console.error("更新任务失败:", error);
    return false;
  }

  return true;
}

// ===== 文件处理 =====

/**
 * 构建文件树结构
 */
function buildFileTree(
  units: Array<{
    name: string;
    subfolders: Array<{
      name: string;
      files: Array<{ name: string; data: Uint8Array }>;
    }>;
  }>
): FileTreeNode {
  const root: FileTreeNode = {
    name: "合并文件",
    type: "folder",
    path: "/",
    children: [],
  };

  for (const unit of units) {
    const unitNode: FileTreeNode = {
      name: unit.name,
      type: "folder",
      path: `/${unit.name}`,
      children: [],
    };

    for (const subfolder of unit.subfolders) {
      const subfolderNode: FileTreeNode = {
        name: subfolder.name,
        type: "folder",
        path: `/${unit.name}/${subfolder.name}`,
        children: [],
      };

      for (const file of subfolder.files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        let mimeType = "application/octet-stream";
        
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
          mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
        } else if (ext === "txt") {
          mimeType = "text/plain";
        }

        subfolderNode.children!.push({
          name: file.name,
          type: "file",
          path: `/${unit.name}/${subfolder.name}/${file.name}`,
          mimeType,
          size: file.data.length,
        });
      }

      unitNode.children!.push(subfolderNode);
    }

    root.children!.push(unitNode);
  }

  return root;
}

/**
 * 上传图片到 Supabase Storage
 */
async function uploadImageToStorage(
  taskId: string,
  postId: string,
  imageOrder: number,
  imageData: Uint8Array,
  originalName: string
): Promise<string | null> {
  const storagePath = `${taskId}/${postId}/pic${imageOrder}.png`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(storagePath, imageData, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error("上传图片失败:", error);
    return null;
  }

  // 获取公开 URL
  const { data } = supabase.storage
    .from("post-images")
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

/**
 * 保存图片记录到数据库
 */
async function saveImageRecord(
  postUuid: string | null,
  xhsPostId: string,
  taskId: string,
  imageOrder: number,
  originalName: string,
  storagePath: string,
  storageUrl: string
): Promise<boolean> {
  const { error } = await supabase.from("post_images").insert({
    post_id: postUuid,
    xhs_post_id: xhsPostId,
    task_id: taskId,
    image_order: imageOrder,
    original_name: originalName,
    storage_path: storagePath,
    storage_url: storageUrl,
  });

  if (error) {
    console.error("保存图片记录失败:", error);
    return false;
  }

  return true;
}

/**
 * 更新帖子的图片计数
 */
async function updatePostImageCount(
  postUuid: string,
  imageCount: number
): Promise<void> {
  await supabase
    .from("xhs_posts")
    .update({ image_count: imageCount })
    .eq("id", postUuid);
}

// ===== 高性能上传工具函数 =====

/**
 * 上传任务接口
 */
interface UploadTask {
  taskId: string;
  postId: string;
  postUuid: string;
  imageOrder: number;
  originalName: string;
  base64: string;
}

/**
 * 上传结果接口
 */
interface UploadResult {
  task: UploadTask;
  storagePath: string;
  storageUrl: string;
}

/**
 * 延迟函数
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 将 Base64 转换为 Blob
 */
function base64ToBlob(base64: string): Blob {
  const base64Data = base64.split(",")[1] || base64;
  const normalizedBase64 = base64Data.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(normalizedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: "image/png" });
}

// ===== 图片压缩配置 =====
const UPLOAD_TARGET_SIZE = 4 * 1024 * 1024; // 4MB 目标大小

/**
 * 压缩图片到目标大小
 * 支持 Base64 字符串或 Blob 输入
 * 
 * @param input Base64 字符串或 Blob
 * @param options 可选配置
 * @returns 压缩后的 Blob（JPEG 格式）
 */
async function compressImageForUpload(
  input: string | Blob,
  options?: { targetSize?: number }
): Promise<Blob> {
  const targetSize = options?.targetSize || UPLOAD_TARGET_SIZE;
  
  // 如果是 Base64 字符串，先转为 Blob
  const blob = typeof input === 'string' ? base64ToBlob(input) : input;
  
  // 如果已经小于目标大小，转换为 JPEG 但不缩放
  if (blob.size < targetSize) {
    // 仍然转换格式以统一输出
    const result = await compressImage({
      image: blob,
      targetSize: blob.size + 1, // 确保不会触发缩放
      options: {
        quality: 0.92,
        outputFormat: 'image/jpeg',
        minScale: 1.0, // 不缩放
        maxIterations: 1,
      },
    });
    return result.blob;
  }
  
  // 压缩到目标大小
  const result = await compressImage({
    image: blob,
    targetSize,
    options: {
      quality: 0.92,
      outputFormat: 'image/jpeg',
    },
  });
  
  console.log(
    `[压缩] ${(blob.size / 1024 / 1024).toFixed(2)}MB → ${(result.finalSize / 1024 / 1024).toFixed(2)}MB` +
    (result.wasCompressed ? ` (scale: ${(result.finalScale * 100).toFixed(0)}%)` : ' (无需压缩)')
  );
  
  return result.blob;
}

/**
 * 带重试的单图片上传
 * 
 * @param task 上传任务
 * @param maxRetries 最大重试次数（默认3次）
 * @param baseDelay 基础延迟毫秒数（默认1000ms）
 */
async function uploadSingleImageWithRetry(
  task: UploadTask,
  maxRetries = 3,
  baseDelay = 1000
): Promise<UploadResult> {
  // 使用 .jpg 后缀，因为压缩后是 JPEG 格式
  const storagePath = `${task.taskId}/${task.postId}/pic${task.imageOrder}.jpg`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 压缩图片到目标大小（4MB 以下）
      const compressedBlob = await compressImageForUpload(task.base64);

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(storagePath, compressedBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(storagePath);

      return {
        task,
        storagePath,
        storageUrl: urlData.publicUrl,
      };
    } catch (err) {
      lastError = err as Error;
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries - 1) {
        const waitTime = baseDelay * Math.pow(2, attempt); // 指数退避: 1s, 2s, 4s
        console.warn(`上传失败，${waitTime}ms 后重试 (${attempt + 1}/${maxRetries}):`, storagePath);
        await delay(waitTime);
      }
    }
  }

  throw lastError || new Error(`上传失败: ${storagePath}`);
}

/**
 * 并发上传控制器
 * 
 * @param tasks 上传任务列表
 * @param concurrency 并发数（默认5）
 * @param onProgress 进度回调
 */
async function uploadWithConcurrency(
  tasks: UploadTask[],
  concurrency = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: UploadResult[]; failed: UploadTask[] }> {
  const success: UploadResult[] = [];
  const failed: UploadTask[] = [];
  let completed = 0;

  // 分批处理
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    
    const results = await Promise.allSettled(
      batch.map(task => uploadSingleImageWithRetry(task))
    );

    results.forEach((result, idx) => {
      completed++;
      if (result.status === 'fulfilled') {
        success.push(result.value);
      } else {
        failed.push(batch[idx]);
        console.error(`图片上传最终失败:`, batch[idx].postId, result.reason);
      }
    });

    onProgress?.(completed, tasks.length);
  }

  return { success, failed };
}

/**
 * 批量插入图片记录（带去重保护）
 * 
 * 第二道防护：
 * 1. 批量查询哪些 post_id 已有 post_images 记录（1次查询）
 * 2. 过滤掉已有记录的帖子
 * 3. 只插入没有记录的帖子的图片数据
 */
async function batchInsertImageRecords(
  results: UploadResult[],
  taskId: string
): Promise<{ inserted: number; skipped: number }> {
  if (results.length === 0) return { inserted: 0, skipped: 0 };

  // 第二道防护：批量查询已有图片记录的帖子
  const uniquePostIds = [...new Set(results.map((r) => r.task.postId))];
  
  const { data: existingRecords } = await supabase
    .from("post_images")
    .select("xhs_post_id")
    .in("xhs_post_id", uniquePostIds);

  // 构建已有记录的 post_id 集合
  const existingPostIds = new Set<string>();
  (existingRecords || []).forEach((r) => {
    if (typeof r === "object" && r !== null && "xhs_post_id" in r) {
      existingPostIds.add((r as { xhs_post_id: string }).xhs_post_id);
    }
  });

  // 过滤掉已有记录的帖子的图片
  const newResults = results.filter((r) => !existingPostIds.has(r.task.postId));
  const skippedCount = results.length - newResults.length;

  if (skippedCount > 0) {
    console.log(
      `[第二道防护] 跳过 ${existingPostIds.size} 个已有记录的帖子，共 ${skippedCount} 张图片`
    );
  }

  if (newResults.length === 0) {
    return { inserted: 0, skipped: skippedCount };
  }

  // 分批插入，每批 100 条
  const batchSize = 100;
  let insertedCount = 0;

  for (let i = 0; i < newResults.length; i += batchSize) {
    const batch = newResults.slice(i, i + batchSize);
    
    const records = batch.map(r => ({
      post_id: r.task.postUuid,
      xhs_post_id: r.task.postId,
      task_id: taskId,
      image_order: r.task.imageOrder,
      original_name: r.task.originalName,
      storage_path: r.storagePath,
      storage_url: r.storageUrl,
    }));

    const { error } = await supabase.from("post_images").insert(records);
    
    if (error) {
      console.error(`批量插入图片记录失败 (${i}-${i + batch.length}):`, error);
    } else {
      insertedCount += batch.length;
    }
  }

  return { inserted: insertedCount, skipped: skippedCount };
}

/**
 * 批量更新帖子图片计数
 */
async function batchUpdatePostImageCounts(
  postImageCounts: Map<string, number>
): Promise<void> {
  const updates = Array.from(postImageCounts.entries());
  
  // 并行更新，每批 10 个
  const batchSize = 10;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await Promise.all(
      batch.map(([postUuid, count]) => 
        supabase
          .from("xhs_posts")
          .update({ image_count: count })
          .eq("id", postUuid)
      )
    );
  }
}

// ===== 卡片图片生成 =====

/**
 * 卡片数据接口
 */
interface CardData {
  postId: string;
  postUuid: string;
  coverImageUrl: string;
  title: string;
  avatar: string;
  username: string;
  likes: number;
}

/**
 * 格式化点赞数
 */
function formatLikes(likes: number): string {
  if (!likes || likes === 0) return "0";
  if (likes >= 10000) return (likes / 10000).toFixed(1) + "万";
  if (likes >= 1000) return (likes / 1000).toFixed(1) + "千";
  return likes.toString();
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 创建卡片 DOM 元素（用于渲染）
 */
function createCardElement(data: CardData): HTMLDivElement {
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    z-index: -1;
  `;

  container.innerHTML = `
    <div style="
      width: 280px;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    ">
      <div style="width: 100%; overflow: hidden; background: #f5f5f5;">
        <img src="${data.coverImageUrl}" style="width: 100%; height: auto; display: block;" crossorigin="anonymous" />
      </div>
      <div style="padding: 12px;">
        <h3 style="
          font-size: 14px;
          font-weight: 600;
          color: #333;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0 0 10px 0;
          min-height: 40px;
        ">${escapeHtml(data.title)}</h3>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;">
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              overflow: hidden;
              flex-shrink: 0;
              background: #f0f0f0;
            ">
              <img src="${data.avatar}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
            </div>
            <span style="font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHtml(data.username)}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; color: #666; font-size: 12px; flex-shrink: 0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>${formatLikes(data.likes)}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  return container;
}

/**
 * 生成单个卡片图片（返回 Blob，不上传）
 */
async function generateCardBlob(
  data: CardData,
  maxRetries = 3
): Promise<{ success: true; blob: Blob } | { success: false; error: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let container: HTMLDivElement | null = null;
    
    try {
      // 1. 创建卡片元素
      container = createCardElement(data);
      const cardElement = container.firstElementChild as HTMLElement;
      
      // 等待图片加载（对于 base64 图片几乎是即时的）
      await new Promise<void>((resolve) => {
        const images = container!.querySelectorAll("img");
        let loaded = 0;
        const total = images.length;
        
        if (total === 0) {
          resolve();
          return;
        }
        
        const onLoad = () => {
          loaded++;
          if (loaded >= total) resolve();
        };
        
        images.forEach((img) => {
          if (img.complete) {
            onLoad();
          } else {
            img.onload = onLoad;
            img.onerror = onLoad;
          }
        });
        
        // 超时保护（base64 不需要那么长）
        setTimeout(resolve, 2000);
      });

      // 2. 渲染为 PNG
      const dataUrl = await toPng(cardElement, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true, // 跳过字体内嵌，避免跨域问题
      });

      // 3. 转换为 Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      return { success: true, blob };

    } catch (error) {
      console.warn(`卡片生成失败 (${attempt + 1}/${maxRetries}):`, data.postId, error);
      
      if (attempt < maxRetries - 1) {
        await delay(500);
      } else {
        return { success: false, error: (error as Error).message };
      }
    } finally {
      // 清理 DOM
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  return { success: false, error: "重试次数用尽" };
}

/**
 * 生成单个卡片图片（带重试和上传 - 兼容旧接口）
 */
async function generateCardImage(
  data: CardData,
  maxRetries = 5
): Promise<{ success: boolean; error?: string }> {
  // 先生成 Blob
  const result = await generateCardBlob(data, maxRetries);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 然后上传
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const fileName = `${data.postId}.png`;
      const { error: uploadError } = await supabase.storage
        .from("post-cards")
        .upload(fileName, result.blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`上传失败: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("post-cards")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("xhs_posts")
        .update({ card_image: urlData.publicUrl })
        .eq("id", data.postUuid);

      if (updateError) {
        throw new Error(`更新数据库失败: ${updateError.message}`);
      }

      return { success: true };
    } catch (error) {
      console.warn(`卡片上传失败 (${attempt + 1}/${maxRetries}):`, data.postId, error);
      if (attempt < maxRetries - 1) {
        await delay(1000);
      } else {
        return { success: false, error: (error as Error).message };
      }
    }
  }

  return { success: false, error: "上传重试次数用尽" };
}

/**
 * 批量生成卡片图片（5 并发 + 5 次重试）- 滑动窗口实现
 */
async function batchGenerateCardImages(
  cardDataList: CardData[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;
  let completed = 0;
  const concurrency = 5;

  // 滑动窗口并发
  let currentIndex = 0;
  const running = new Set<Promise<void>>();

  const processOne = async (data: CardData): Promise<void> => {
    const result = await generateCardImage(data, 5);
    completed++;
    
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
      console.error(`卡片生成最终失败: ${data.postId}`, result.error);
    }
    
    onProgress?.(completed, cardDataList.length);
  };

  // 初始化：启动前 N 个任务
  while (currentIndex < cardDataList.length && running.size < concurrency) {
    const data = cardDataList[currentIndex++];
    const promise: Promise<void> = processOne(data).then(() => { running.delete(promise); });
    running.add(promise);
  }

  // 持续处理：一个完成就补充一个
  while (running.size > 0) {
    await Promise.race(running);
    
    while (currentIndex < cardDataList.length && running.size < concurrency) {
      const data = cardDataList[currentIndex++];
      const promise: Promise<void> = processOne(data).then(() => { running.delete(promise); });
      running.add(promise);
    }
  }

  return { success: successCount, failed: failedCount };
}

// ===== 主处理函数 =====

/**
 * 处理上传的 ZIP 文件（高性能版本 + 去重保护）
 * 
 * 优化点：
 * 1. 批量查询帖子（1次查询代替N次）
 * 2. 并发上传图片（10并发）
 * 3. 指数退避重试（3次重试）
 * 4. 批量插入图片记录
 * 5. 失败队列 + 最终重试
 * 
 * 去重保护：
 * - 第一道：基于前端缓存，过滤已处理的单元
 * - 第二道：插入前批量查询，过滤已有记录的帖子
 * 
 * @param existingImageNames 可选，已存在的图片文件名集合（用于第一道防护）
 */
export async function processZipFile(
  taskId: string,
  file: File,
  onProgress?: (message: string, percent: number) => void,
  existingImageNames?: Set<string>
): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. 调用 runProject 处理 ZIP
    onProgress?.("正在解压 ZIP 文件...", 5);

    const result = await runProject(
      { zipFiles: [file] },
      {
        adapters: {
          onProgress: (msg, pct) => {
            // 映射到 5-45% 区间
            const mappedPct = 5 + (pct / 100) * 40;
            onProgress?.(msg, mappedPct);
          },
          logger: console,
        },
      }
    );

    if (!result.success) {
      throw new Error(result.error || "ZIP 处理失败");
    }

    // 第一道防护：过滤重复单元（基于前端缓存的图片文件名）
    let unitsToProcess = result.parsedData;
    let skippedUnitsCount = 0;

    if (existingImageNames && existingImageNames.size > 0) {
      const filterResult = filterDuplicateUnits(result.parsedData, existingImageNames);
      unitsToProcess = filterResult.newUnits;
      skippedUnitsCount = filterResult.skippedCount;

      if (skippedUnitsCount > 0) {
        console.log(
          `[第一道防护] 跳过 ${skippedUnitsCount} 个重复单元，保留 ${unitsToProcess.length} 个新单元`
        );
        onProgress?.(
          `跳过 ${skippedUnitsCount} 个重复单元...`,
          46
        );
      }

      // 如果所有单元都被跳过，直接完成任务
      if (unitsToProcess.length === 0) {
        console.log("[第一道防护] 所有单元都已处理过，任务完成");
        onProgress?.("所有内容都已处理过，无需重复处理", 100);

        await updateTask(taskId, {
          status: "completed",
          total_units: result.parsedData.length,
          processed_units: result.parsedData.length,
          matched_posts: 0,
          unmatched_count: 0,
          result_summary: {
            totalUnits: result.parsedData.length,
            matchedPosts: 0,
            unmatchedPosts: 0,
            totalImages: 0,
            processingTime: Date.now() - startTime,
            skippedUnits: skippedUnitsCount,
          } as TaskResultSummary,
          completed_at: new Date().toISOString(),
        });

        return;
      }
    }

    const totalUnits = result.parsedData.length;

    // 更新任务总数
    await updateTask(taskId, {
      total_units: totalUnits,
    });

    // 2. 构建文件树结构（使用原始数据，保持完整性）
    onProgress?.("构建文件结构...", 47);

    const fileTree: FileTreeNode = {
      name: file.name.replace(".zip", ""),
      type: "folder",
      path: "/",
      children: result.parsedData.map((unit, idx) => ({
        name: unit.sourceUnit || `单元 ${idx + 1}`,
        type: "folder" as const,
        path: `/${unit.sourceUnit || `单元 ${idx + 1}`}`,
        children: [
          {
            name: "图片",
            type: "folder" as const,
            path: `/${unit.sourceUnit}/图片`,
            children: unit.images.map((img, imgIdx) => ({
              name: img.originalName || `pic${imgIdx + 1}.png`,
              type: "file" as const,
              path: `/${unit.sourceUnit}/图片/${img.originalName || `pic${imgIdx + 1}.png`}`,
              mimeType: "image/png",
            })),
          },
          {
            name: "文本",
            type: "folder" as const,
            path: `/${unit.sourceUnit}/文本`,
            children: [
              {
                name: "content.txt",
                type: "file" as const,
                path: `/${unit.sourceUnit}/文本/content.txt`,
                mimeType: "text/plain",
                previewUrl: unit.content,
              },
            ],
          },
        ],
      })),
    };

    await updateTask(taskId, {
      file_structure: fileTree,
    });

    // 3. 批量查询所有 post_id（优化：1次查询代替N次）
    // 注意：使用过滤后的 unitsToProcess，只处理新单元
    onProgress?.("批量匹配帖子...", 50);

    const allPostIds = unitsToProcess.map(u => u.post_id);
    const { data: matchedPosts } = await supabase
      .from("xhs_posts")
      .select("id, post_id")
      .in("post_id", allPostIds);

    // 构建 post_id -> uuid 映射
    const postIdToUuid = new Map<string, string>();
    (matchedPosts || []).forEach(p => {
      postIdToUuid.set(p.post_id, p.id);
    });

    // 4. 准备数据结构
    onProgress?.("准备处理任务...", 52);

    const uploadTasks: UploadTask[] = [];
    const unmatchedPostIds: string[] = [];
    const postImageCounts = new Map<string, number>();
    
    // 🚀 新增：保存每个帖子的 base64 图片（用于生成卡片和拼图，无需网络下载！）
    const postImagesBase64 = new Map<string, { postId: string; postUuid: string; base64Array: string[] }>();

    // 遍历过滤后的单元（只处理新单元）
    for (const unit of unitsToProcess) {
      const postUuid = postIdToUuid.get(unit.post_id);
      
      if (postUuid) {
        // 记录每个帖子的图片数量
        postImageCounts.set(postUuid, unit.images.length);
        
        // 🚀 保存 base64 用于后续生成卡片和拼图
        postImagesBase64.set(postUuid, {
          postId: unit.post_id,
          postUuid,
          base64Array: unit.images.map(img => img.base64),
        });
        
        // 为每张图片创建上传任务
        unit.images.forEach((img, imgIdx) => {
          uploadTasks.push({
            taskId,
            postId: unit.post_id,
            postUuid,
            imageOrder: imgIdx + 1,
            originalName: img.originalName,
            base64: img.base64,
          });
        });
      } else {
        unmatchedPostIds.push(unit.post_id);
      }
    }

    const matchedCount = postIdToUuid.size;
    const unmatchedCount = unmatchedPostIds.length;
    const totalImages = uploadTasks.length;

    console.log(`[优化] 匹配: ${matchedCount}, 未匹配: ${unmatchedCount}, 待上传图片: ${totalImages}`);

    // 更新进度
    await updateTask(taskId, {
      processed_units: totalUnits,
      matched_posts: matchedCount,
      unmatched_count: unmatchedCount,
    });

    // 5. 🚀 查询帖子账号信息（用于生成卡片）
    onProgress?.("查询帖子信息...", 53);
    
    const postUuidsList = Array.from(postImageCounts.keys());
    const { data: postsWithAccounts } = await supabase
      .from("xhs_posts")
      .select(`
        id,
        post_id,
        title,
        likes,
        xhs_accounts (
          nickname,
          avatar
        )
      `)
      .in("id", postUuidsList);

    // 构建 postUuid -> 帖子信息映射
    const postInfoMap = new Map<string, {
      postId: string;
      title: string;
      likes: number;
      nickname: string;
      avatar: string;
    }>();
    (postsWithAccounts || []).forEach((post) => {
      const account = post.xhs_accounts as { nickname: string; avatar: string | null } | null;
      postInfoMap.set(post.id, {
        postId: post.post_id,
        title: post.title || "无标题",
        likes: post.likes || 0,
        nickname: account?.nickname || "未知用户",
        avatar: account?.avatar || "https://picsum.photos/100/100",
      });
    });

    // 6. 🚀 在内存中生成拼图和卡片（无需网络下载！超快！）
    onProgress?.("生成拼图和卡片（本地处理）...", 55);
    
    const mergeBlobs = new Map<string, Blob>();
    const cardBlobs = new Map<string, Blob>();
    let mergeSuccessCount = 0;
    let mergeFailedCount = 0;
    let cardLocalSuccessCount = 0;
    let cardLocalFailedCount = 0;
    let processIdx = 0;
    const processTotal = postImagesBase64.size;

    for (const [postUuid, data] of postImagesBase64) {
      processIdx++;
      
      // 生成拼图
      try {
        const blob = await generateCollageFromBase64(data.base64Array.slice(0, 4), {
          gap: 12,
          labelFontSize: 32,
          labelPadding: 10,
          labelMargin: 15,
          maxCellSize: 600,
        });
        mergeBlobs.set(postUuid, blob);
        mergeSuccessCount++;
      } catch (err) {
        console.error(`拼图生成失败: ${data.postId}`, err);
        mergeFailedCount++;
      }

      // 生成卡片（使用第一张图的 base64 作为封面）
      const postInfo = postInfoMap.get(postUuid);
      if (postInfo && data.base64Array.length > 0) {
        const cardData: CardData = {
          postId: data.postId,
          postUuid,
          coverImageUrl: data.base64Array[0], // 直接使用 base64！
          title: postInfo.title,
          avatar: postInfo.avatar,
          username: postInfo.nickname,
          likes: postInfo.likes,
        };
        
        const cardResult = await generateCardBlob(cardData, 3);
        if (cardResult.success) {
          cardBlobs.set(postUuid, cardResult.blob);
          cardLocalSuccessCount++;
        } else {
          console.error(`卡片生成失败: ${data.postId}`, cardResult.error);
          cardLocalFailedCount++;
        }
      }
      
      if (processIdx % 5 === 0) {
        const pct = 55 + (processIdx / processTotal) * 15; // 55% - 70%
        onProgress?.(`生成图片: ${processIdx}/${processTotal}`, pct);
      }
    }
    console.log(`[本地生成] 拼图成功: ${mergeSuccessCount}, 拼图失败: ${mergeFailedCount}`);
    console.log(`[本地生成] 卡片成功: ${cardLocalSuccessCount}, 卡片失败: ${cardLocalFailedCount}`);

    // 7. 并发上传原图（10并发 + 3次重试）
    onProgress?.(`上传原图 ${totalImages} 张...`, 70);

    const { success: uploadedImages, failed: firstFailedTasks } = await uploadWithConcurrency(
      uploadTasks,
      10, // 10并发
      (completed, total) => {
        const pct = 70 + (completed / total) * 10; // 70% - 80%
        onProgress?.(`上传原图: ${completed}/${total}`, pct);
      }
    );

    console.log(`[原图上传] 成功: ${uploadedImages.length}, 失败: ${firstFailedTasks.length}`);

    // 8. 对失败的进行最终重试
    let finalFailedCount = 0;
    if (firstFailedTasks.length > 0) {
      onProgress?.(`重试失败图片...`, 80);
      
      const { success: rescuedImages, failed: finalFailed } = await uploadWithConcurrency(
        firstFailedTasks,
        1,
      );
      
      uploadedImages.push(...rescuedImages);
      finalFailedCount = finalFailed.length;
      
      console.log(`[最终重试] 成功: ${rescuedImages.length}, 最终失败: ${finalFailedCount}`);
    }

    // 9. 批量插入图片记录
    onProgress?.("保存图片记录...", 82);
    await batchInsertImageRecords(uploadedImages, taskId);

    // 10. 批量更新帖子图片计数
    await batchUpdatePostImageCounts(postImageCounts);

    // 11. 并发上传拼图和卡片到 Storage（5并发）
    onProgress?.("上传拼图和卡片...", 85);
    
    let mergeUploadSuccess = 0;
    let cardUploadSuccess = 0;
    let uploadIdx = 0;
    const postImagesData = Array.from(postImagesBase64.entries());
    const totalUploads = mergeBlobs.size + cardBlobs.size;
    
    // 上传拼图
    for (const [postUuid, data] of postImagesData) {
      uploadIdx++;
      const blob = mergeBlobs.get(postUuid);
      if (!blob) continue;

      try {
        // 使用 .jpg 后缀，因为压缩后是 JPEG 格式
        const fileName = `${data.postId}.jpg`;
        
        // 压缩拼图到目标大小（4MB 以下）
        const compressedBlob = await compressImageForUpload(blob);
        
        // 先尝试删除已存在的文件（兼容旧的 .png 文件）
        await supabase.storage.from("post-merges").remove([fileName, `${data.postId}.png`]);
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("post-merges")
          .upload(fileName, compressedBlob, {
            contentType: "image/jpeg",
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("post-merges")
            .getPublicUrl(fileName);

          await supabase
            .from("xhs_posts")
            .update({ merge_image: urlData.publicUrl } as never)
            .eq("id", postUuid);
          
          mergeUploadSuccess++;
        } else {
          console.error(`拼图上传失败: ${data.postId}`, uploadError?.message);
        }
      } catch (err) {
        console.error(`拼图上传失败: ${data.postId}`, err);
      }

      if (uploadIdx % 5 === 0) {
        const pct = 85 + (uploadIdx / totalUploads) * 10; // 85% - 95%
        onProgress?.(`上传拼图: ${uploadIdx}/${mergeBlobs.size}`, pct);
      }
    }
    console.log(`[拼图上传] 成功: ${mergeUploadSuccess}`);

    // 上传卡片
    onProgress?.("上传卡片...", 92);
    
    for (const [postUuid, data] of postImagesData) {
      const cardBlob = cardBlobs.get(postUuid);
      if (!cardBlob) continue;

      try {
        // 使用 .jpg 后缀，因为压缩后是 JPEG 格式
        const fileName = `${data.postId}.jpg`;
        
        // 压缩卡片到目标大小（4MB 以下）
        const compressedBlob = await compressImageForUpload(cardBlob);
        
        // 先尝试删除已存在的文件（兼容旧的 .png 文件）
        await supabase.storage.from("post-cards").remove([fileName, `${data.postId}.png`]);
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("post-cards")
          .upload(fileName, compressedBlob, {
            contentType: "image/jpeg",
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("post-cards")
            .getPublicUrl(fileName);

          await supabase
            .from("xhs_posts")
            .update({ card_image: urlData.publicUrl })
            .eq("id", postUuid);
          
          cardUploadSuccess++;
        } else {
          console.error(`卡片上传失败: ${data.postId}`, uploadError?.message);
        }
      } catch (err) {
        console.error(`卡片上传失败: ${data.postId}`, err);
      }
    }
    console.log(`[卡片上传] 成功: ${cardUploadSuccess}`);

    // 统计
    const cardSuccessCount = cardUploadSuccess;
    const cardFailedCount = cardLocalFailedCount + (cardBlobs.size - cardUploadSuccess);

    // 12. 完成处理
    const processingTime = Date.now() - startTime;

    const resultSummary: TaskResultSummary = {
      totalUnits,
      matchedPosts: matchedCount,
      unmatchedPosts: unmatchedCount,
      totalImages,
      processingTime,
      unmatchedPostIds: unmatchedPostIds.slice(0, 10),
      // 扩展字段
      uploadedImages: uploadedImages.length,
      failedImages: finalFailedCount,
      // 卡片生成统计
      generatedCards: cardSuccessCount,
      failedCards: cardFailedCount + (cardBlobs.size - cardUploadSuccess),
      // 拼图生成统计
      generatedMerges: mergeUploadSuccess,
      failedMerges: mergeFailedCount + (mergeBlobs.size - mergeUploadSuccess),
    };

    // 根据是否有失败图片决定状态
    const finalStatus = finalFailedCount > 0 ? "completed" : "completed"; // 可改为 "partial"

    await updateTask(taskId, {
      status: finalStatus,
      result_summary: resultSummary,
      completed_at: new Date().toISOString(),
    });

    const successRate = ((uploadedImages.length / totalImages) * 100).toFixed(1);
    onProgress?.(`处理完成！成功率: ${successRate}%`, 100);
    
    console.log(`[完成] 耗时: ${processingTime}ms, 成功: ${uploadedImages.length}/${totalImages}`);
    
    // 触发缓存刷新，确保 UI 即时更新
    try {
      const { invalidateAllData } = await import("@/shared/lib/queries");
      await invalidateAllData();
    } catch (e) {
      console.warn("[Cache] 缓存刷新失败:", e);
    }
  } catch (error) {
    console.error("处理 ZIP 失败:", error);

    await updateTask(taskId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "处理失败",
    });

    throw error;
  }
}

// ===== 图片查询 =====

/**
 * 获取帖子的所有图片
 */
export async function getPostImages(postId: string) {
  const { data, error } = await supabase
    .from("post_images")
    .select("*")
    .eq("post_id", postId)
    .order("image_order", { ascending: true });

  if (error) {
    console.error("获取帖子图片失败:", error);
    return [];
  }

  return data || [];
}

/**
 * 获取任务的所有图片
 */
export async function getTaskImages(taskId: string) {
  const { data, error } = await supabase
    .from("post_images")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("获取任务图片失败:", error);
    return [];
  }

  return data || [];
}

// ===== 删除任务 =====

/**
 * 删除任务及其关联的所有数据
 * 
 * 1. 获取该任务关联的所有帖子
 * 2. 删除 Storage 中的原图文件（post-images）
 * 3. 删除 Storage 中的卡片图片（post-cards）
 * 4. 删除 Storage 中的拼图（post-merges）
 * 5. 清除 xhs_posts 表中的 card_image 和 merge_image 字段
 * 6. 删除 post_images 表中的记录
 * 7. 删除 zip_upload_tasks 表中的任务
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    // 1. 获取该任务的所有图片记录（包含 post_id 用于删除卡片和拼图）
    const { data: images } = await supabase
      .from("post_images")
      .select("storage_path, post_id, xhs_post_id")
      .eq("task_id", taskId);

    // 收集所有相关的 post_id 和 xhs_post_id
    const postUuids = new Set<string>();
    const xhsPostIds = new Set<string>();
    
    const imageRecords = images as { storage_path: string; post_id: string | null; xhs_post_id: string }[] | null;
    (imageRecords || []).forEach((img) => {
      if (img.post_id) postUuids.add(img.post_id);
      if (img.xhs_post_id) xhsPostIds.add(img.xhs_post_id);
    });

    console.log(`[删除任务] 关联帖子数: ${postUuids.size}, 图片记录数: ${images?.length || 0}`);

    // 2. 删除 Storage 中的原图文件
    if (imageRecords && imageRecords.length > 0) {
      const storagePaths = imageRecords.map((img) => img.storage_path);
      
      const { error: storageError } = await supabase.storage
        .from("post-images")
        .remove(storagePaths);

      if (storageError) {
        console.error("删除 Storage 原图失败:", storageError);
      }
    }

    // 也尝试删除整个任务文件夹
    const { data: folderList } = await supabase.storage
      .from("post-images")
      .list(taskId);

    if (folderList && folderList.length > 0) {
      await deleteStorageFolder(taskId);
    }

    // 3. 删除 Storage 中的卡片图片（post-cards）
    if (xhsPostIds.size > 0) {
      const cardPaths = Array.from(xhsPostIds).map(id => `${id}.png`);
      
      const { error: cardError } = await supabase.storage
        .from("post-cards")
        .remove(cardPaths);

      if (cardError) {
        console.error("删除卡片图片失败:", cardError);
      } else {
        console.log(`[删除任务] 删除卡片图片: ${cardPaths.length} 个`);
      }
    }

    // 4. 删除 Storage 中的拼图（post-merges）
    if (xhsPostIds.size > 0) {
      const mergePaths = Array.from(xhsPostIds).map(id => `${id}.png`);
      
      const { error: mergeError } = await supabase.storage
        .from("post-merges")
        .remove(mergePaths);

      if (mergeError) {
        console.error("删除拼图失败:", mergeError);
      } else {
        console.log(`[删除任务] 删除拼图: ${mergePaths.length} 个`);
      }
    }

    // 5. 清除 xhs_posts 表中的 card_image 和 merge_image 字段
    if (postUuids.size > 0) {
      const { error: clearError } = await supabase
        .from("xhs_posts")
        .update({ 
          card_image: null, 
          merge_image: null,
          image_count: 0 
        } as never)
        .in("id", Array.from(postUuids));

      if (clearError) {
        console.error("清除帖子图片字段失败:", clearError);
      } else {
        console.log(`[删除任务] 清除帖子图片字段: ${postUuids.size} 个`);
      }
    }

    // 6. 删除 post_images 表中的记录
    const { error: imagesError } = await supabase
      .from("post_images")
      .delete()
      .eq("task_id", taskId);

    if (imagesError) {
      console.error("删除图片记录失败:", imagesError);
    }

    // 7. 删除任务记录
    const { error: taskError } = await supabase
      .from("zip_upload_tasks")
      .delete()
      .eq("id", taskId);

    if (taskError) {
      console.error("删除任务失败:", taskError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("删除任务出错:", error);
    return false;
  }
}

/**
 * 将卡住的 processing 任务标记为失败
 * 
 * 用于处理因页面刷新/崩溃导致的僵尸任务
 */
export async function markStuckTasksAsFailed(): Promise<number> {
  const { data: stuckTasks, error } = await supabase
    .from("zip_upload_tasks")
    .select("id, name")
    .eq("status", "processing");

  if (error || !stuckTasks || stuckTasks.length === 0) {
    return 0;
  }

  console.log(`[清理] 发现 ${stuckTasks.length} 个卡住的任务，标记为失败...`);

  const { error: updateError } = await supabase
    .from("zip_upload_tasks")
    .update({
      status: "failed",
      error_message: "任务中断：页面刷新导致处理中断，需要重新上传",
    } as never)
    .eq("status", "processing");

  if (updateError) {
    console.error("标记失败任务出错:", updateError);
    return 0;
  }

  return stuckTasks.length;
}

/**
 * 批量删除失败的任务
 * 
 * 用于清理因页面崩溃/刷新导致中断的任务
 */
export async function deleteFailedTasks(): Promise<{ deleted: number; failed: number }> {
  try {
    // 1. 获取所有失败的任务
    const { data: failedTasks, error: fetchError } = await supabase
      .from("zip_upload_tasks")
      .select("id, name")
      .eq("status", "failed");

    if (fetchError) {
      console.error("获取失败任务列表出错:", fetchError);
      return { deleted: 0, failed: 0 };
    }

    if (!failedTasks || failedTasks.length === 0) {
      console.log("没有失败的任务需要删除");
      return { deleted: 0, failed: 0 };
    }

    console.log(`[批量删除] 找到 ${failedTasks.length} 个失败的任务`);

    let deleted = 0;
    let failed = 0;

    // 2. 逐个删除（使用现有的 deleteTask 函数确保清理干净）
    for (const task of failedTasks) {
      const success = await deleteTask(task.id);
      if (success) {
        deleted++;
        console.log(`[批量删除] ✅ 已删除: ${task.name}`);
      } else {
        failed++;
        console.log(`[批量删除] ❌ 删除失败: ${task.name}`);
      }
    }

    console.log(`[批量删除] 完成: 成功 ${deleted}, 失败 ${failed}`);
    return { deleted, failed };
  } catch (error) {
    console.error("批量删除失败任务出错:", error);
    return { deleted: 0, failed: 0 };
  }
}

/**
 * 递归删除 Storage 文件夹中的所有文件
 */
async function deleteStorageFolder(folderPath: string): Promise<void> {
  const { data: items } = await supabase.storage
    .from("post-images")
    .list(folderPath);

  if (!items || items.length === 0) return;

  const filesToDelete: string[] = [];

  for (const item of items) {
    const itemPath = `${folderPath}/${item.name}`;
    
    if (item.id === null) {
      // 这是一个文件夹，递归处理
      await deleteStorageFolder(itemPath);
    } else {
      // 这是一个文件
      filesToDelete.push(itemPath);
    }
  }

  // 批量删除文件
  if (filesToDelete.length > 0) {
    await supabase.storage
      .from("post-images")
      .remove(filesToDelete);
  }
}

// ===== 拼图生成 =====

/**
 * 拼图数据接口
 */
interface MergeImageData {
  postId: string;        // post_id (小红书帖子 ID)
  postUuid: string;      // xhs_posts 表的 UUID
  imageUrls: string[];   // 图片 URL 列表（最多4张）
}

/**
 * 生成单个帖子的拼图（带重试）
 */
async function generateMergeImage(
  data: MergeImageData,
  maxRetries = 5
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 1. 生成拼图
      const collageBlob = await generateCollageFromUrls(data.imageUrls, {
        gap: 12,
        labelFontSize: 32,
        labelPadding: 10,
        labelMargin: 15,
        maxCellSize: 600,
      });

      // 2. 上传到 Storage
      const fileName = `${data.postId}.png`;
      const { error: uploadError } = await supabase.storage
        .from("post-merges")
        .upload(fileName, collageBlob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`上传失败: ${uploadError.message}`);
      }

      // 3. 获取公开 URL
      const { data: urlData } = supabase.storage
        .from("post-merges")
        .getPublicUrl(fileName);

      // 4. 更新数据库
      const { error: updateError } = await supabase
        .from("xhs_posts")
        .update({ merge_image: urlData.publicUrl } as never)
        .eq("id", data.postUuid);

      if (updateError) {
        throw new Error(`更新数据库失败: ${updateError.message}`);
      }

      return { success: true };

    } catch (error) {
      console.warn(`拼图生成失败 (${attempt + 1}/${maxRetries}):`, data.postId, error);
      
      if (attempt < maxRetries - 1) {
        await delay(1000);
      } else {
        return { success: false, error: (error as Error).message };
      }
    }
  }

  return { success: false, error: "重试次数用尽" };
}

/**
 * 批量生成拼图（5 并发 + 5 次重试）- 滑动窗口实现
 */
async function batchGenerateMergeImages(
  dataList: MergeImageData[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;
  let completed = 0;
  const concurrency = 5;

  // 滑动窗口并发
  let currentIndex = 0;
  const running = new Set<Promise<void>>();

  const processOne = async (data: MergeImageData): Promise<void> => {
    const result = await generateMergeImage(data, 5);
    completed++;
    
    if (result.success) {
      successCount++;
    } else {
      failedCount++;
      console.error(`拼图生成最终失败: ${data.postId}`, result.error);
    }
    
    onProgress?.(completed, dataList.length);
  };

  // 初始化：启动前 N 个任务
  while (currentIndex < dataList.length && running.size < concurrency) {
    const data = dataList[currentIndex++];
    const promise: Promise<void> = processOne(data).then(() => { running.delete(promise); });
    running.add(promise);
  }

  // 持续处理：一个完成就补充一个
  while (running.size > 0) {
    await Promise.race(running);
    
    while (currentIndex < dataList.length && running.size < concurrency) {
      const data = dataList[currentIndex++];
      const promise: Promise<void> = processOne(data).then(() => { running.delete(promise); });
      running.add(promise);
    }
  }

  return { success: successCount, failed: failedCount };
}

/**
 * 为符合条件的帖子生成拼图
 * 
 * 条件：
 * - image_count > 0（有图片）
 * - note_type != '视频'（图文类型）
 * - merge_image IS NULL（尚未生成拼图）
 * 
 * @param postUuids - 可选，指定要处理的帖子 UUID 列表
 * @param onProgress - 进度回调
 */
export async function generateMergeImagesForPosts(
  postUuids?: string[],
  onProgress?: (message: string, completed: number, total: number) => void
): Promise<{ success: number; failed: number; skipped: number }> {
  // 1. 查询符合条件的帖子
  let query = supabase
    .from("xhs_posts")
    .select("id, post_id")
    .gt("image_count", 0)
    .neq("note_type", "视频")
    .is("merge_image", null);

  if (postUuids && postUuids.length > 0) {
    query = query.in("id", postUuids);
  }

  const { data: posts, error: postsError } = await query;

  if (postsError) {
    console.error("查询帖子失败:", postsError);
    return { success: 0, failed: 0, skipped: 0 };
  }

  if (!posts || posts.length === 0) {
    console.log("没有符合条件的帖子需要生成拼图");
    return { success: 0, failed: 0, skipped: 0 };
  }

  console.log(`找到 ${posts.length} 个帖子需要生成拼图`);

  // 2. 获取每个帖子的图片（最多4张）
  const postIds = posts.map(p => p.id);
  const { data: allImages, error: imagesError } = await supabase
    .from("post_images")
    .select("post_id, storage_url, image_order")
    .in("post_id", postIds)
    .order("image_order", { ascending: true });

  if (imagesError) {
    console.error("查询图片失败:", imagesError);
    return { success: 0, failed: 0, skipped: 0 };
  }

  // 3. 按帖子分组图片
  const imagesByPost = new Map<string, string[]>();
  (allImages || []).forEach((img) => {
    if (!img.storage_url) return;
    const urls = imagesByPost.get(img.post_id) || [];
    if (urls.length < 4) {
      urls.push(img.storage_url);
    }
    imagesByPost.set(img.post_id, urls);
  });

  // 4. 准备拼图数据
  const mergeDataList: MergeImageData[] = [];
  let skippedCount = 0;

  for (const post of posts) {
    const imageUrls = imagesByPost.get(post.id);
    if (!imageUrls || imageUrls.length === 0) {
      skippedCount++;
      continue;
    }

    mergeDataList.push({
      postId: post.post_id,
      postUuid: post.id,
      imageUrls,
    });
  }

  console.log(`准备生成 ${mergeDataList.length} 个拼图，跳过 ${skippedCount} 个（无图片URL）`);

  if (mergeDataList.length === 0) {
    return { success: 0, failed: 0, skipped: skippedCount };
  }

  // 5. 批量生成拼图
  const result = await batchGenerateMergeImages(mergeDataList, (completed, total) => {
    onProgress?.(`生成拼图: ${completed}/${total}`, completed, total);
  });

  console.log(`[拼图生成完成] 成功: ${result.success}, 失败: ${result.failed}, 跳过: ${skippedCount}`);

  return { ...result, skipped: skippedCount };
}

