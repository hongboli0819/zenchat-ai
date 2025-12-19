/**
 * 批量生成拼图脚本
 *
 * 为符合条件的帖子生成拼图并上传到 Supabase Storage
 *
 * 条件：
 * - image_count > 0（有图片）
 * - note_type != '视频'（图文类型）
 * - merge_image IS NULL（尚未生成拼图）
 *
 * 使用方法：
 *   npx tsx scripts/generate-merge-images.ts
 *
 * 环境变量：
 *   VITE_SUPABASE_URL - Supabase URL
 *   VITE_SUPABASE_ANON_KEY - Supabase Anon Key
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { createClient } from "@supabase/supabase-js";
import { generateCollageFromBuffers, CollageOptions } from "../src/shared/lib/collage";
import * as dotenv from "dotenv";

// 创建带 Keep-Alive 的 Agent，复用 TCP 连接
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,  // 允许 20 个并发连接
  timeout: 30000,
});

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 20,
  timeout: 30000,
});

// 加载环境变量
dotenv.config();

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 错误: 请设置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_KEY 环境变量");
  process.exit(1);
}

// 使用 service role key 绕过 RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 拼图配置
const COLLAGE_OPTIONS: CollageOptions = {
  gap: 12,
  labelFontSize: 32,
  labelPadding: 10,
  labelMargin: 15,
  maxCellSize: 600,
};

// ===== 工具函数 =====

/**
 * 下载图片为 Buffer（使用 Keep-Alive 连接复用）
 */
function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const agent = isHttps ? httpsAgent : httpAgent;
    const protocol = isHttps ? https : http;

    const options = {
      agent,
      timeout: 30000,
    };

    const req = protocol.get(url, options, (response) => {
      // 处理重定向
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout: ${url}`));
    });
  });
}

/**
 * 延迟函数
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ===== 主逻辑 =====

interface PostData {
  id: string;
  post_id: string;
}

interface ImageData {
  post_id: string;
  storage_url: string | null;
  image_order: number;
}

/**
 * 生成单个帖子的拼图（5 次重试）
 */
async function generateMergeImageForPost(
  post: PostData,
  imageUrls: string[],
  retries = 5
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // 1. 下载所有图片
      const imageBuffers = await Promise.all(
        imageUrls.map((url) => downloadImage(url))
      );

      // 2. 生成拼图
      const collageBuffer = await generateCollageFromBuffers(
        imageBuffers,
        COLLAGE_OPTIONS
      );

      // 3. 上传到 Storage
      const fileName = `${post.post_id}.png`;
      const { error: uploadError } = await supabase.storage
        .from("post-merges")
        .upload(fileName, collageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`上传失败: ${uploadError.message}`);
      }

      // 4. 获取公开 URL
      const { data: urlData } = supabase.storage
        .from("post-merges")
        .getPublicUrl(fileName);

      // 5. 更新数据库
      const { error: updateError } = await supabase
        .from("xhs_posts")
        .update({ merge_image: urlData.publicUrl })
        .eq("id", post.id);

      if (updateError) {
        throw new Error(`更新数据库失败: ${updateError.message}`);
      }

      return { success: true };
    } catch (error) {
      console.warn(
        `  ⚠️ 尝试 ${attempt + 1}/${retries} 失败:`,
        (error as Error).message
      );

      if (attempt < retries - 1) {
        await delay(1000 * (attempt + 1)); // 递增延迟
      } else {
        return { success: false, error: (error as Error).message };
      }
    }
  }

  return { success: false, error: "重试次数用尽" };
}

/**
 * 主函数
 */
async function main() {
  console.log("🖼️  批量生成拼图脚本\n");
  console.log("=".repeat(60));

  // 1. 查询符合条件的帖子
  console.log("\n📋 查询符合条件的帖子...");

  const { data: postsData, error: postsError } = await supabase
    .from("xhs_posts")
    .select("id, post_id")
    .gt("image_count", 0)
    .neq("note_type", "视频")
    .is("merge_image", null);

  if (postsError) {
    console.error("❌ 查询帖子失败:", postsError);
    process.exit(1);
  }

  const posts = postsData as PostData[] | null;

  if (!posts || posts.length === 0) {
    console.log("✅ 没有符合条件的帖子需要处理");
    return;
  }

  console.log(`   找到 ${posts.length} 个帖子需要生成拼图`);

  // 2. 获取所有帖子的图片
  console.log("\n📷 获取帖子图片...");

  const postIds = posts.map((p) => p.id);
  const { data: imagesData, error: imagesError } = await supabase
    .from("post_images")
    .select("post_id, storage_url, image_order")
    .in("post_id", postIds)
    .order("image_order", { ascending: true });

  if (imagesError) {
    console.error("❌ 查询图片失败:", imagesError);
    process.exit(1);
  }

  const allImages = imagesData as ImageData[] | null;

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

  console.log(`   共 ${imagesByPost.size} 个帖子有可用图片`);

  // 4. 准备处理数据
  const toProcess: { post: PostData; imageUrls: string[] }[] = [];
  let skippedCount = 0;

  for (const post of posts) {
    const imageUrls = imagesByPost.get(post.id);
    if (!imageUrls || imageUrls.length === 0) {
      skippedCount++;
      continue;
    }
    toProcess.push({ post, imageUrls });
  }

  console.log(`\n📊 统计:`);
  console.log(`   待处理: ${toProcess.length}`);
  console.log(`   跳过（无图片URL）: ${skippedCount}`);

  if (toProcess.length === 0) {
    console.log("\n✅ 没有需要处理的帖子");
    return;
  }

  // 5. 批量处理（5 并发 + 5 重试）- 滑动窗口实现
  console.log("\n" + "=".repeat(60));
  console.log("🔄 开始生成拼图（5 并发 + 5 重试）...\n");

  let successCount = 0;
  let failedCount = 0;
  let completed = 0;
  const startTime = Date.now();
  const concurrency = 5;

  // 滑动窗口并发：始终保持 N 个任务在运行
  let currentIndex = 0;
  const running = new Set<Promise<void>>();

  const processOne = async (item: { post: PostData; imageUrls: string[] }) => {
    const { post, imageUrls } = item;
    const result = await generateMergeImageForPost(post, imageUrls, 5);
    
    completed++;
    const progress = `[${completed}/${toProcess.length}]`;

    if (result.success) {
      successCount++;
      console.log(`${progress} ${post.post_id} (${imageUrls.length}张图) ... ✅`);
    } else {
      failedCount++;
      console.log(`${progress} ${post.post_id} (${imageUrls.length}张图) ... ❌ ${result.error}`);
    }
  };

  // 初始化：启动前 N 个任务
  while (currentIndex < toProcess.length && running.size < concurrency) {
    const item = toProcess[currentIndex++];
    const promise = processOne(item).then(() => {
      running.delete(promise);
    });
    running.add(promise);
  }

  // 持续处理：一个完成就补充一个
  while (running.size > 0) {
    await Promise.race(running);
    
    // 补充新任务
    while (currentIndex < toProcess.length && running.size < concurrency) {
      const item = toProcess[currentIndex++];
      const promise = processOne(item).then(() => {
        running.delete(promise);
      });
      running.add(promise);
    }
  }

  // 6. 输出结果
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log("✨ 处理完成！\n");
  console.log(`📊 结果统计:`);
  console.log(`   成功: ${successCount}`);
  console.log(`   失败: ${failedCount}`);
  console.log(`   跳过: ${skippedCount}`);
  console.log(`   耗时: ${duration}s`);

  if (failedCount > 0) {
    console.log("\n⚠️  有失败的帖子，可以重新运行脚本继续处理");
  }
}

// 运行
main().catch((err) => {
  console.error("❌ 脚本执行失败:", err);
  process.exit(1);
});





