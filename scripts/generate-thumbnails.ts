/**
 * 批量生成缩略图脚本
 * 
 * 功能：
 * 1. 为 post_images 表中的图片生成缩略图
 * 2. 为 xhs_posts 表中的 card_image 生成缩略图
 * 3. 为 xhs_posts 表中的 merge_image 生成缩略图
 * 
 * 运行方式：npx tsx scripts/generate-thumbnails.ts
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Supabase 配置
const supabaseUrl = "https://qqlwechtvktkhuheoeja.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 配置
const CONCURRENCY = 5;
const TARGET_SIZE = 100 * 1024; // 100KB
const MAX_WIDTH = 400;
const MAX_HEIGHT = 400;
const JPEG_QUALITY = 80;

interface ThumbnailTask {
  type: "post_image" | "card_image" | "merge_image";
  id: string;
  sourceUrl: string;
  storagePath: string;
}

interface ProcessResult {
  task: ThumbnailTask;
  success: boolean;
  thumbnailUrl?: string;
  newSize?: number;
  error?: string;
}

/**
 * 从 URL 下载图片
 */
async function downloadImage(url: string, retries = 3): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * 从 Storage 下载图片（支持自动尝试 .jpg 后缀）
 */
async function downloadFromStorage(bucket: string, path: string, retries = 3): Promise<{ buffer: Buffer; actualPath: string } | null> {
  // 尝试的路径列表：原路径 + 可能的 jpg 变体
  const pathsToTry = [path];
  
  // 如果是 .png 后缀，也尝试 .jpg
  if (path.toLowerCase().endsWith(".png")) {
    pathsToTry.push(path.replace(/\.png$/i, ".jpg"));
  }
  
  for (const tryPath of pathsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase.storage.from(bucket).download(tryPath);
        if (error || !data) {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 500 * attempt));
            continue;
          }
          break; // 尝试下一个路径
        }
        const arrayBuffer = await data.arrayBuffer();
        return { buffer: Buffer.from(arrayBuffer), actualPath: tryPath };
      } catch (err) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
        break; // 尝试下一个路径
      }
    }
  }
  return null;
}

/**
 * 生成缩略图 (目标 <100KB)
 */
async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  // 获取原图尺寸
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 800;
  
  // 计算缩放后的尺寸
  let newWidth = width;
  let newHeight = height;
  
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
    newWidth = Math.round(width * ratio);
    newHeight = Math.round(height * ratio);
  }
  
  // 先尝试标准压缩
  let result = await sharp(buffer)
    .resize(newWidth, newHeight, { fit: "inside" })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  
  // 如果仍然太大，逐步降低质量和尺寸
  let quality = JPEG_QUALITY;
  let scale = 1.0;
  
  while (result.length > TARGET_SIZE && (quality > 40 || scale > 0.3)) {
    if (quality > 40) {
      quality -= 10;
    } else {
      scale -= 0.1;
    }
    
    const scaledWidth = Math.round(newWidth * scale);
    const scaledHeight = Math.round(newHeight * scale);
    
    result = await sharp(buffer)
      .resize(scaledWidth, scaledHeight, { fit: "inside" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
  
  return result;
}

/**
 * 上传缩略图到 Storage
 */
async function uploadThumbnail(
  bucket: string,
  path: string,
  buffer: Buffer,
  retries = 3
): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });
      
      if (error) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return null;
      }
      
      // 获取公开 URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * 处理单个缩略图任务
 */
async function processTask(task: ThumbnailTask, index: number, total: number): Promise<ProcessResult> {
  const prefix = `[${index}/${total}]`;
  
  try {
    // 1. 下载原图
    let buffer: Buffer | null = null;
    
    if (task.sourceUrl.includes("supabase.co/storage")) {
      // 从 Storage URL 提取 bucket 和 path
      const match = task.sourceUrl.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
      if (match) {
        const [, bucket, path] = match;
        const result = await downloadFromStorage(bucket, decodeURIComponent(path));
        if (result) {
          buffer = result.buffer;
        }
      }
    }
    
    if (!buffer) {
      // 直接下载 URL（也尝试 .jpg 变体）
      buffer = await downloadImage(task.sourceUrl);
      if (!buffer && task.sourceUrl.toLowerCase().endsWith(".png")) {
        buffer = await downloadImage(task.sourceUrl.replace(/\.png$/i, ".jpg"));
      }
    }
    
    if (!buffer) {
      console.log(`${prefix} ❌ 下载失败: ${task.type} ${task.id}`);
      return { task, success: false, error: "下载失败" };
    }
    
    // 2. 生成缩略图
    const thumbnail = await generateThumbnail(buffer);
    const thumbSizeKB = (thumbnail.length / 1024).toFixed(1);
    
    // 3. 上传缩略图
    const thumbnailUrl = await uploadThumbnail("thumbnails", task.storagePath, thumbnail);
    
    if (!thumbnailUrl) {
      console.log(`${prefix} ❌ 上传失败: ${task.type} ${task.id}`);
      return { task, success: false, error: "上传失败" };
    }
    
    // 4. 更新数据库
    let updateError: Error | null = null;
    
    if (task.type === "post_image") {
      const { error } = await supabase
        .from("post_images")
        .update({ thumbnail_url: thumbnailUrl })
        .eq("id", task.id);
      if (error) updateError = error;
    } else if (task.type === "card_image") {
      const { error } = await supabase
        .from("xhs_posts")
        .update({ card_image_thumbnail: thumbnailUrl })
        .eq("id", task.id);
      if (error) updateError = error;
    } else if (task.type === "merge_image") {
      const { error } = await supabase
        .from("xhs_posts")
        .update({ merge_image_thumbnail: thumbnailUrl })
        .eq("id", task.id);
      if (error) updateError = error;
    }
    
    if (updateError) {
      console.log(`${prefix} ❌ 数据库更新失败: ${task.type} ${task.id}`);
      return { task, success: false, error: "数据库更新失败" };
    }
    
    console.log(`${prefix} ✅ ${thumbSizeKB}KB ${task.type} ${task.id.slice(0, 8)}...`);
    return { task, success: true, thumbnailUrl, newSize: thumbnail.length };
    
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.log(`${prefix} ❌ ${task.type} ${task.id}: ${errorMsg}`);
    return { task, success: false, error: errorMsg };
  }
}

/**
 * 并发处理任务
 */
async function processTasksInBatches(
  tasks: ThumbnailTask[],
  concurrency: number
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];
  const total = tasks.length;
  
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchPromises = batch.map((task, batchIndex) =>
      processTask(task, i + batchIndex + 1, total)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 批次之间短暂暂停
    if (i + concurrency < tasks.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return results;
}

/**
 * 分页查询所有记录（解决 Supabase 1000 条限制）
 */
async function fetchAllRecords<T>(
  tableName: string,
  selectFields: string,
  filters: { column: string; operator: string; value: unknown }[]
): Promise<T[]> {
  const allRecords: T[] = [];
  const pageSize = 1000;
  let offset = 0;
  
  while (true) {
    let query = supabase
      .from(tableName)
      .select(selectFields)
      .range(offset, offset + pageSize - 1);
    
    // 应用过滤条件
    for (const filter of filters) {
      if (filter.operator === "is" && filter.value === null) {
        query = query.is(filter.column, null);
      } else if (filter.operator === "not.is" && filter.value === null) {
        query = query.not(filter.column, "is", null);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`   查询 ${tableName} 失败:`, error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allRecords.push(...(data as T[]));
    
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  
  return allRecords;
}

/**
 * 收集所有需要生成缩略图的任务（支持分页）
 */
async function collectTasks(): Promise<ThumbnailTask[]> {
  const tasks: ThumbnailTask[] = [];
  
  console.log("\n📋 收集需要生成缩略图的图片（分页查询）...\n");
  
  // 1. 收集 post_images 中缺少缩略图的记录（分页）
  console.log("   扫描 post_images...");
  const postImages = await fetchAllRecords<{
    id: string;
    storage_url: string | null;
    storage_path: string;
  }>(
    "post_images",
    "id, storage_url, storage_path",
    [
      { column: "thumbnail_url", operator: "is", value: null },
      { column: "storage_url", operator: "not.is", value: null },
    ]
  );
  
  for (const img of postImages) {
    if (img.storage_url) {
      // 构建缩略图存储路径
      const thumbPath = img.storage_path.replace(/\.(png|jpg|jpeg)$/i, "_thumb.jpg");
      tasks.push({
        type: "post_image",
        id: img.id,
        sourceUrl: img.storage_url,
        storagePath: `post-images/${thumbPath}`,
      });
    }
  }
  console.log(`   找到 ${postImages.length} 张需要生成缩略图的单图`);
  
  // 2. 收集 card_image 中缺少缩略图的记录
  console.log("   扫描 card_image...");
  const cardImages = await fetchAllRecords<{
    id: string;
    card_image: string | null;
  }>(
    "xhs_posts",
    "id, card_image",
    [
      { column: "card_image_thumbnail", operator: "is", value: null },
      { column: "card_image", operator: "not.is", value: null },
    ]
  );
  
  for (const post of cardImages) {
    if (post.card_image) {
      tasks.push({
        type: "card_image",
        id: post.id,
        sourceUrl: post.card_image,
        storagePath: `post-cards/${post.id}_thumb.jpg`,
      });
    }
  }
  console.log(`   找到 ${cardImages.length} 张需要生成缩略图的卡片图`);
  
  // 3. 收集 merge_image 中缺少缩略图的记录
  console.log("   扫描 merge_image...");
  const mergeImages = await fetchAllRecords<{
    id: string;
    merge_image: string | null;
  }>(
    "xhs_posts",
    "id, merge_image",
    [
      { column: "merge_image_thumbnail", operator: "is", value: null },
      { column: "merge_image", operator: "not.is", value: null },
    ]
  );
  
  for (const post of mergeImages) {
    if (post.merge_image) {
      tasks.push({
        type: "merge_image",
        id: post.id,
        sourceUrl: post.merge_image,
        storagePath: `post-merges/${post.id}_thumb.jpg`,
      });
    }
  }
  console.log(`   找到 ${mergeImages.length} 张需要生成缩略图的拼图`);
  
  return tasks;
}

/**
 * 确保 thumbnails bucket 存在
 */
async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === "thumbnails");
  
  if (!exists) {
    console.log("📦 创建 thumbnails bucket...");
    const { error } = await supabase.storage.createBucket("thumbnails", {
      public: true,
    });
    if (error) {
      console.error("   ❌ 创建 bucket 失败:", error.message);
      // 如果已存在，忽略错误
      if (!error.message.includes("already exists")) {
        throw error;
      }
    } else {
      console.log("   ✅ thumbnails bucket 已创建");
    }
  } else {
    console.log("📦 thumbnails bucket 已存在");
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🖼️  缩略图批量生成工具\n");
  console.log("=".repeat(60));
  console.log(`目标: 为所有图片生成 <100KB 的缩略图`);
  console.log(`并发数: ${CONCURRENCY}`);
  console.log(`最大尺寸: ${MAX_WIDTH}x${MAX_HEIGHT}`);
  console.log("=".repeat(60));
  
  // 1. 确保 bucket 存在
  await ensureBucketExists();
  
  // 2. 收集任务
  const tasks = await collectTasks();
  
  console.log(`\n📊 共需处理 ${tasks.length} 张图片`);
  
  if (tasks.length === 0) {
    console.log("\n✅ 所有图片都已有缩略图，无需处理！");
    return;
  }
  
  // 统计各类型数量
  const postImageCount = tasks.filter(t => t.type === "post_image").length;
  const cardImageCount = tasks.filter(t => t.type === "card_image").length;
  const mergeImageCount = tasks.filter(t => t.type === "merge_image").length;
  
  console.log(`   - post_images: ${postImageCount}`);
  console.log(`   - card_images: ${cardImageCount}`);
  console.log(`   - merge_images: ${mergeImageCount}`);
  
  // 3. 并发处理
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 开始生成缩略图 (${CONCURRENCY} 并发)...`);
  console.log("=".repeat(60) + "\n");
  
  const startTime = Date.now();
  const results = await processTasksInBatches(tasks, CONCURRENCY);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // 4. 汇总报告
  console.log("\n" + "=".repeat(60));
  console.log("📊 处理完成汇总");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalNewSize = successful.reduce((sum, r) => sum + (r.newSize || 0), 0);
  
  console.log(`\n⏱️  耗时: ${duration} 秒`);
  console.log(`✅ 成功: ${successful.length}/${results.length}`);
  console.log(`❌ 失败: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log(`\n💾 缩略图总大小: ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   平均每张: ${(totalNewSize / successful.length / 1024).toFixed(1)} KB`);
  }
  
  if (failed.length > 0) {
    console.log("\n❌ 失败的任务:");
    failed.slice(0, 20).forEach(r => {
      console.log(`   - ${r.task.type} ${r.task.id}: ${r.error}`);
    });
    if (failed.length > 20) {
      console.log(`   ... 还有 ${failed.length - 20} 个失败`);
    }
  }
  
  console.log("\n✅ 完成!\n");
}

main().catch(console.error);

