'use server'

/**
 * Material Service Server Actions
 * 素材库业务逻辑的 Server Actions
 */

import { supabaseServer as supabase } from "@/shared/lib/supabase-server";
import { runProject } from "@org/zip-folder-extractor";
import { generateCollageFromBase64 } from "@/shared/lib/collage-browser";
import { compressImage } from "@muse/image-compressor";
import type {
  ZipUploadTask,
  ZipUploadTaskInsert,
  FileTreeNode,
  TaskResultSummary,
} from "@/core/types/database";

// ===== 辅助函数 =====

export function extractImageNamesFromTasks(
  completedTasks: ZipUploadTask[]
): Set<string> {
  const imageNames = new Set<string>();

  for (const task of completedTasks) {
    if (task.status !== "completed" || !task.file_structure) continue;

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

export function filterDuplicateUnits<T extends { images: Array<{ originalName: string }> }>(
  units: T[],
  existingImageNames: Set<string>
): { newUnits: T[]; skippedCount: number } {
  const newUnits: T[] = [];
  let skippedCount = 0;

  for (const unit of units) {
    const allExist = unit.images.every((img) =>
      existingImageNames.has(img.originalName)
    );

    if (allExist && unit.images.length > 0) {
      skippedCount++;
    } else {
      newUnits.push(unit);
    }
  }

  return { newUnits, skippedCount };
}

// ===== Server Actions =====

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

export async function cleanupDuplicateTasks(): Promise<{
  cleaned: number;
  details: Array<{ name: string; kept: string; deleted: string[] }>;
}> {
  type TaskRecord = { id: string; name: string; created_at: string; status: string };

  const { data: allTasks, error } = await supabase
    .from("zip_upload_tasks")
    .select("id, name, created_at, status")
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  if (error || !allTasks) {
    console.error("获取任务列表失败:", error);
    return { cleaned: 0, details: [] };
  }

  const typedTasks = allTasks as TaskRecord[];

  const tasksByName = new Map<string, TaskRecord[]>();
  for (const task of typedTasks) {
    const existing = tasksByName.get(task.name) || [];
    existing.push(task);
    tasksByName.set(task.name, existing);
  }

  const toDelete: string[] = [];
  const details: Array<{ name: string; kept: string; deleted: string[] }> = [];

  for (const [name, tasks] of tasksByName) {
    if (tasks.length > 1) {
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

  if (toDelete.length > 0) {
    console.log(`[去重] 发现 ${toDelete.length} 个重复任务，正在清理...`);

    for (const taskId of toDelete) {
      await deleteTask(taskId);
    }

    console.log(`[去重] 已清理 ${toDelete.length} 个重复任务`);
  }

  return { cleaned: toDelete.length, details };
}

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

export type CreateTaskResult = 
  | { success: true; task: ZipUploadTask; isDuplicate: false }
  | { success: false; task: null; isDuplicate: true; existingTask: ZipUploadTask }
  | { success: false; task: null; isDuplicate: false; error: string };

export async function createTask(
  name: string,
  skipDuplicateCheck: boolean = false
): Promise<CreateTaskResult> {
  if (!skipDuplicateCheck) {
    const { isDuplicate, existingTask } = await checkDuplicateTask(name);
    if (isDuplicate && existingTask) {
      console.log(`[去重] 任务 "${name}" 已存在成功记录，跳过创建`);
      return { success: false, task: null, isDuplicate: true, existingTask };
    }
  }

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

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const { data: images } = await supabase
      .from("post_images")
      .select("storage_path, post_id, xhs_post_id")
      .eq("task_id", taskId);

    const postUuids = new Set<string>();
    const xhsPostIds = new Set<string>();
    
    const imageRecords = images as { storage_path: string; post_id: string | null; xhs_post_id: string }[] | null;
    (imageRecords || []).forEach((img) => {
      if (img.post_id) postUuids.add(img.post_id);
      if (img.xhs_post_id) xhsPostIds.add(img.xhs_post_id);
    });

    console.log(`[删除任务] 关联帖子数: ${postUuids.size}, 图片记录数: ${images?.length || 0}`);

    if (imageRecords && imageRecords.length > 0) {
      const storagePaths = imageRecords.map((img) => img.storage_path);
      
      const { error: storageError } = await supabase.storage
        .from("post-images")
        .remove(storagePaths);

      if (storageError) {
        console.error("删除 Storage 原图失败:", storageError);
      }
    }

    const { data: folderList } = await supabase.storage
      .from("post-images")
      .list(taskId);

    if (folderList && folderList.length > 0) {
      await deleteStorageFolder(taskId);
    }

    if (xhsPostIds.size > 0) {
      const cardPaths = Array.from(xhsPostIds).flatMap(id => [`${id}.png`, `${id}.jpg`]);
      
      await supabase.storage
        .from("post-cards")
        .remove(cardPaths);

      const mergePaths = Array.from(xhsPostIds).flatMap(id => [`${id}.png`, `${id}.jpg`]);
      
      await supabase.storage
        .from("post-merges")
        .remove(mergePaths);
    }

    if (postUuids.size > 0) {
      await supabase
        .from("xhs_posts")
        .update({ 
          card_image: null, 
          merge_image: null,
          image_count: 0 
        } as never)
        .in("id", Array.from(postUuids));
    }

    await supabase
      .from("post_images")
      .delete()
      .eq("task_id", taskId);

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

async function deleteStorageFolder(folderPath: string): Promise<void> {
  const { data: items } = await supabase.storage
    .from("post-images")
    .list(folderPath);

  if (!items || items.length === 0) return;

  const filesToDelete: string[] = [];

  for (const item of items) {
    const itemPath = `${folderPath}/${item.name}`;
    
    if (item.id === null) {
      await deleteStorageFolder(itemPath);
    } else {
      filesToDelete.push(itemPath);
    }
  }

  if (filesToDelete.length > 0) {
    await supabase.storage
      .from("post-images")
      .remove(filesToDelete);
  }
}

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

export async function deleteFailedTasks(): Promise<{ deleted: number; failed: number }> {
  try {
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
