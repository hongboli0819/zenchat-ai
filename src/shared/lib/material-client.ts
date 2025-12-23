/**
 * Material Library Client-Side Utilities
 * 素材库客户端工具函数
 *
 * 这些函数在浏览器环境中运行，处理需要浏览器 API 的操作：
 * - ZIP 文件解压和处理
 * - 卡片和拼图生成（使用 DOM/Canvas）
 * - 图片压缩
 *
 * 数据库操作通过 Server Actions 完成
 */

import { runProject } from "@org/zip-folder-extractor";
import { generateCollageFromBase64 } from "@/shared/lib/collage-browser";
import { compressImage } from "@muse/image-compressor";
import { supabase } from "@/shared/lib/supabase"; // 客户端 Supabase
import { toPng } from "html-to-image";
import type {
  ZipUploadTask,
  FileTreeNode,
  TaskResultSummary,
} from "@/core/types/database";

// ===== 类型定义 =====

interface UploadTask {
  taskId: string;
  postId: string;
  postUuid: string;
  imageOrder: number;
  originalName: string;
  base64: string;
}

interface UploadResult {
  task: UploadTask;
  storagePath: string;
  storageUrl: string;
}

interface CardData {
  postId: string;
  postUuid: string;
  coverImageUrl: string;
  title: string;
  avatar: string;
  username: string;
  likes: number;
}

// ===== 辅助函数 =====

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

const UPLOAD_TARGET_SIZE = 4 * 1024 * 1024; // 4MB

async function compressImageForUpload(
  input: string | Blob,
  options?: { targetSize?: number }
): Promise<Blob> {
  const targetSize = options?.targetSize || UPLOAD_TARGET_SIZE;
  const blob = typeof input === 'string' ? base64ToBlob(input) : input;

  if (blob.size < targetSize) {
    const result = await compressImage({
      image: blob,
      targetSize: blob.size + 1,
      options: {
        quality: 0.92,
        outputFormat: 'image/jpeg',
        minScale: 1.0,
        maxIterations: 1,
      },
    });
    return result.blob;
  }

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

// ===== 上传函数 =====

async function uploadSingleImageWithRetry(
  task: UploadTask,
  maxRetries = 3,
  baseDelay = 1000
): Promise<UploadResult> {
  const storagePath = `${task.taskId}/${task.postId}/pic${task.imageOrder}.jpg`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
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

      if (attempt < maxRetries - 1) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.warn(`上传失败，${waitTime}ms 后重试 (${attempt + 1}/${maxRetries}):`, storagePath);
        await delay(waitTime);
      }
    }
  }

  throw lastError || new Error(`上传失败: ${storagePath}`);
}

async function uploadWithConcurrency(
  tasks: UploadTask[],
  concurrency = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: UploadResult[]; failed: UploadTask[] }> {
  const success: UploadResult[] = [];
  const failed: UploadTask[] = [];
  let completed = 0;

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

async function batchInsertImageRecords(
  results: UploadResult[],
  taskId: string
): Promise<{ inserted: number; skipped: number }> {
  if (results.length === 0) return { inserted: 0, skipped: 0 };

  const uniquePostIds = [...new Set(results.map((r) => r.task.postId))];

  const { data: existingRecords } = await supabase
    .from("post_images")
    .select("xhs_post_id")
    .in("xhs_post_id", uniquePostIds);

  const existingPostIds = new Set<string>();
  (existingRecords || []).forEach((r) => {
    if (typeof r === "object" && r !== null && "xhs_post_id" in r) {
      existingPostIds.add((r as { xhs_post_id: string }).xhs_post_id);
    }
  });

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

async function batchUpdatePostImageCounts(
  postImageCounts: Map<string, number>
): Promise<void> {
  const updates = Array.from(postImageCounts.entries());

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

// ===== 卡片生成函数 =====

function formatLikes(likes: number): string {
  if (!likes || likes === 0) return "0";
  if (likes >= 10000) return (likes / 10000).toFixed(1) + "万";
  if (likes >= 1000) return (likes / 1000).toFixed(1) + "千";
  return likes.toString();
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

async function generateCardBlob(
  data: CardData,
  maxRetries = 3
): Promise<{ success: true; blob: Blob } | { success: false; error: string }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let container: HTMLDivElement | null = null;

    try {
      container = createCardElement(data);
      const cardElement = container.firstElementChild as HTMLElement;

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

        setTimeout(resolve, 2000);
      });

      const dataUrl = await toPng(cardElement, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        skipFonts: true,
      });

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
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }

  return { success: false, error: "重试次数用尽" };
}

// ===== 主处理函数 =====

/**
 * 处理 ZIP 文件上传（客户端版本）
 *
 * 在浏览器中运行，处理：
 * 1. ZIP 解压
 * 2. 卡片和拼图生成（需要 DOM/Canvas）
 * 3. 图片上传到 Supabase Storage
 * 4. 数据库记录插入
 */
export async function processZipFile(
  taskId: string,
  file: File,
  onProgress?: (message: string, percent: number) => void,
  existingImageNames?: Set<string>
): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. 解压 ZIP
    onProgress?.("正在解压 ZIP 文件...", 5);

    const result = await runProject(
      { zipFiles: [file] },
      {
        adapters: {
          onProgress: (msg, pct) => {
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

    // 2. 过滤重复单元（如果提供了已存在的图片名称集合）
    let unitsToProcess = result.parsedData;
    let skippedUnitsCount = 0;

    if (existingImageNames && existingImageNames.size > 0) {
      const newUnits: typeof result.parsedData = [];
      for (const unit of result.parsedData) {
        const allExist = unit.images.every((img) =>
          existingImageNames.has(img.originalName)
        );
        if (allExist && unit.images.length > 0) {
          skippedUnitsCount++;
        } else {
          newUnits.push(unit);
        }
      }
      unitsToProcess = newUnits;

      if (skippedUnitsCount > 0) {
        console.log(`[去重] 跳过 ${skippedUnitsCount} 个重复单元`);
        onProgress?.(`跳过 ${skippedUnitsCount} 个重复单元...`, 46);
      }

      if (unitsToProcess.length === 0) {
        console.log("[去重] 所有单元都已处理过");
        onProgress?.("所有内容都已处理过，无需重复处理", 100);

        // 更新任务状态
        await supabase
          .from("zip_upload_tasks")
          .update({
            status: "completed",
            total_units: result.parsedData.length,
            processed_units: result.parsedData.length,
            matched_posts: 0,
            unmatched_count: 0,
            completed_at: new Date().toISOString(),
          } as never)
          .eq("id", taskId);

        return;
      }
    }

    const totalUnits = result.parsedData.length;

    // 更新任务
    await supabase
      .from("zip_upload_tasks")
      .update({ total_units: totalUnits } as never)
      .eq("id", taskId);

    // 3. 构建文件树
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
        ],
      })),
    };

    await supabase
      .from("zip_upload_tasks")
      .update({ file_structure: fileTree } as never)
      .eq("id", taskId);

    // 4. 批量查询帖子
    onProgress?.("批量匹配帖子...", 50);

    const allPostIds = unitsToProcess.map(u => u.post_id);
    const { data: matchedPosts } = await supabase
      .from("xhs_posts")
      .select("id, post_id")
      .in("post_id", allPostIds);

    const postIdToUuid = new Map<string, string>();
    (matchedPosts || []).forEach(p => {
      postIdToUuid.set(p.post_id, p.id);
    });

    // 5. 准备上传任务
    onProgress?.("准备处理任务...", 52);

    const uploadTasks: UploadTask[] = [];
    const unmatchedPostIds: string[] = [];
    const postImageCounts = new Map<string, number>();
    const postImagesBase64 = new Map<string, { postId: string; postUuid: string; base64Array: string[] }>();

    for (const unit of unitsToProcess) {
      const postUuid = postIdToUuid.get(unit.post_id);

      if (postUuid) {
        postImageCounts.set(postUuid, unit.images.length);
        postImagesBase64.set(postUuid, {
          postId: unit.post_id,
          postUuid,
          base64Array: unit.images.map(img => img.base64),
        });

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

    await supabase
      .from("zip_upload_tasks")
      .update({
        processed_units: totalUnits,
        matched_posts: matchedCount,
        unmatched_count: unmatchedCount,
      } as never)
      .eq("id", taskId);

    // 6. 查询帖子信息（用于生成卡片）
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

    // 7. 在内存中生成拼图和卡片
    onProgress?.("生成拼图和卡片（本地处理）...", 55);

    const mergeBlobs = new Map<string, Blob>();
    const cardBlobs = new Map<string, Blob>();
    let mergeSuccessCount = 0;
    let cardLocalSuccessCount = 0;
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
      }

      // 生成卡片
      const postInfo = postInfoMap.get(postUuid);
      if (postInfo && data.base64Array.length > 0) {
        const cardData: CardData = {
          postId: data.postId,
          postUuid,
          coverImageUrl: data.base64Array[0],
          title: postInfo.title,
          avatar: postInfo.avatar,
          username: postInfo.nickname,
          likes: postInfo.likes,
        };

        const cardResult = await generateCardBlob(cardData, 3);
        if (cardResult.success) {
          cardBlobs.set(postUuid, cardResult.blob);
          cardLocalSuccessCount++;
        }
      }

      if (processIdx % 5 === 0) {
        const pct = 55 + (processIdx / processTotal) * 15;
        onProgress?.(`生成图片: ${processIdx}/${processTotal}`, pct);
      }
    }

    console.log(`[本地生成] 拼图: ${mergeSuccessCount}, 卡片: ${cardLocalSuccessCount}`);

    // 8. 上传原图
    onProgress?.(`上传原图 ${totalImages} 张...`, 70);

    const { success: uploadedImages, failed: firstFailedTasks } = await uploadWithConcurrency(
      uploadTasks,
      10,
      (completed, total) => {
        const pct = 70 + (completed / total) * 10;
        onProgress?.(`上传原图: ${completed}/${total}`, pct);
      }
    );

    console.log(`[原图上传] 成功: ${uploadedImages.length}, 失败: ${firstFailedTasks.length}`);

    // 9. 重试失败的
    let finalFailedCount = 0;
    if (firstFailedTasks.length > 0) {
      onProgress?.(`重试失败图片...`, 80);
      const { success: rescuedImages, failed: finalFailed } = await uploadWithConcurrency(
        firstFailedTasks,
        1,
      );
      uploadedImages.push(...rescuedImages);
      finalFailedCount = finalFailed.length;
    }

    // 10. 批量插入记录
    onProgress?.("保存图片记录...", 82);
    await batchInsertImageRecords(uploadedImages, taskId);

    // 11. 更新帖子图片计数
    await batchUpdatePostImageCounts(postImageCounts);

    // 12. 上传拼图和卡片
    onProgress?.("上传拼图和卡片...", 85);

    let mergeUploadSuccess = 0;
    let cardUploadSuccess = 0;
    const postImagesData = Array.from(postImagesBase64.entries());

    // 上传拼图
    for (const [postUuid, data] of postImagesData) {
      const blob = mergeBlobs.get(postUuid);
      if (!blob) continue;

      try {
        const fileName = `${data.postId}.jpg`;
        const compressedBlob = await compressImageForUpload(blob);

        await supabase.storage.from("post-merges").remove([fileName, `${data.postId}.png`]);

        const { error: uploadError } = await supabase.storage
          .from("post-merges")
          .upload(fileName, compressedBlob, {
            contentType: "image/jpeg",
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("post-merges")
            .getPublicUrl(fileName);

          await supabase
            .from("xhs_posts")
            .update({ merge_image: urlData.publicUrl } as never)
            .eq("id", postUuid);

          mergeUploadSuccess++;
        }
      } catch (err) {
        console.error(`拼图上传失败: ${data.postId}`, err);
      }
    }

    // 上传卡片
    onProgress?.("上传卡片...", 92);

    for (const [postUuid, data] of postImagesData) {
      const cardBlob = cardBlobs.get(postUuid);
      if (!cardBlob) continue;

      try {
        const fileName = `${data.postId}.jpg`;
        const compressedBlob = await compressImageForUpload(cardBlob);

        await supabase.storage.from("post-cards").remove([fileName, `${data.postId}.png`]);

        const { error: uploadError } = await supabase.storage
          .from("post-cards")
          .upload(fileName, compressedBlob, {
            contentType: "image/jpeg",
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("post-cards")
            .getPublicUrl(fileName);

          await supabase
            .from("xhs_posts")
            .update({ card_image: urlData.publicUrl } as never)
            .eq("id", postUuid);

          cardUploadSuccess++;
        }
      } catch (err) {
        console.error(`卡片上传失败: ${data.postId}`, err);
      }
    }

    console.log(`[上传完成] 拼图: ${mergeUploadSuccess}, 卡片: ${cardUploadSuccess}`);

    // 13. 完成任务
    const processingTime = Date.now() - startTime;

    const resultSummary: TaskResultSummary = {
      totalUnits,
      matchedPosts: matchedCount,
      unmatchedPosts: unmatchedCount,
      totalImages,
      processingTime,
      unmatchedPostIds: unmatchedPostIds.slice(0, 10),
      uploadedImages: uploadedImages.length,
      failedImages: finalFailedCount,
      generatedCards: cardUploadSuccess,
      failedCards: cardBlobs.size - cardUploadSuccess,
      generatedMerges: mergeUploadSuccess,
      failedMerges: mergeBlobs.size - mergeUploadSuccess,
    };

    await supabase
      .from("zip_upload_tasks")
      .update({
        status: "completed",
        result_summary: resultSummary,
        completed_at: new Date().toISOString(),
      } as never)
      .eq("id", taskId);

    const successRate = ((uploadedImages.length / totalImages) * 100).toFixed(1);
    onProgress?.(`处理完成！成功率: ${successRate}%`, 100);

    console.log(`[完成] 耗时: ${processingTime}ms, 成功: ${uploadedImages.length}/${totalImages}`);

  } catch (error) {
    console.error("处理 ZIP 失败:", error);

    await supabase
      .from("zip_upload_tasks")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "处理失败",
      } as never)
      .eq("id", taskId);

    throw error;
  }
}
