/**
 * 诊断脚本 - 测量每个步骤的耗时
 */

import * as https from "https";
import * as http from "http";
import { createClient } from "@supabase/supabase-js";
import { generateCollageFromBuffers } from "../src/shared/lib/collage";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Keep-Alive Agent
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20 });

// 下载图片（带 Keep-Alive）
function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const options = url.startsWith("https") ? { agent: httpsAgent } : {};
    
    protocol.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  console.log("🔍 诊断脚本 - 测量每个步骤耗时\n");
  console.log("=".repeat(60));

  // 1. 获取一个测试帖子
  const { data: posts } = await supabase
    .from("xhs_posts")
    .select("id, post_id")
    .gt("image_count", 0)
    .neq("note_type", "视频")
    .limit(1);

  if (!posts || posts.length === 0) {
    console.log("没有找到测试帖子");
    return;
  }

  const post = posts[0];
  console.log(`\n📌 测试帖子: ${post.post_id}`);

  // 2. 获取图片 URL
  const { data: images } = await supabase
    .from("post_images")
    .select("storage_url")
    .eq("post_id", post.id)
    .order("image_order")
    .limit(4);

  const imageUrls = (images || []).map(i => i.storage_url).filter(Boolean) as string[];
  console.log(`   图片数量: ${imageUrls.length}`);

  if (imageUrls.length === 0) {
    console.log("没有找到图片");
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 开始测量...\n");

  // ===== 测量下载 =====
  console.log("1️⃣  下载图片...");
  const downloadStart = Date.now();
  const imageBuffers = await Promise.all(imageUrls.map(url => downloadImage(url)));
  const downloadTime = Date.now() - downloadStart;
  const totalSize = imageBuffers.reduce((sum, buf) => sum + buf.length, 0);
  console.log(`   ✅ 耗时: ${downloadTime}ms`);
  console.log(`   📦 总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  // ===== 测量拼图生成 =====
  console.log("\n2️⃣  生成拼图...");
  const collageStart = Date.now();
  const collageBuffer = await generateCollageFromBuffers(imageBuffers, {
    gap: 12,
    labelFontSize: 32,
    maxCellSize: 600,
  });
  const collageTime = Date.now() - collageStart;
  console.log(`   ✅ 耗时: ${collageTime}ms`);
  console.log(`   📦 拼图大小: ${(collageBuffer.length / 1024).toFixed(2)} KB`);

  // ===== 测量上传 =====
  console.log("\n3️⃣  上传到 Storage...");
  const uploadStart = Date.now();
  const fileName = `test-${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from("post-merges")
    .upload(fileName, collageBuffer, {
      contentType: "image/png",
      upsert: true,
    });
  const uploadTime = Date.now() - uploadStart;
  
  if (uploadError) {
    console.log(`   ❌ 上传失败: ${uploadError.message}`);
  } else {
    console.log(`   ✅ 耗时: ${uploadTime}ms`);
  }

  // 清理测试文件
  await supabase.storage.from("post-merges").remove([fileName]);

  // ===== 总结 =====
  console.log("\n" + "=".repeat(60));
  console.log("📊 耗时总结:\n");
  console.log(`   下载图片:    ${downloadTime}ms (${(downloadTime / (downloadTime + collageTime + uploadTime) * 100).toFixed(1)}%)`);
  console.log(`   生成拼图:    ${collageTime}ms (${(collageTime / (downloadTime + collageTime + uploadTime) * 100).toFixed(1)}%)`);
  console.log(`   上传 Storage: ${uploadTime}ms (${(uploadTime / (downloadTime + collageTime + uploadTime) * 100).toFixed(1)}%)`);
  console.log(`   ─────────────────────`);
  console.log(`   单个任务总计: ${downloadTime + collageTime + uploadTime}ms`);
  console.log(`\n   88 个帖子预估 (串行): ${((downloadTime + collageTime + uploadTime) * 88 / 1000).toFixed(1)}s`);
  console.log(`   88 个帖子预估 (5并发): ${((downloadTime + collageTime + uploadTime) * 88 / 5 / 1000).toFixed(1)}s`);

  // ===== 测试并发效果 =====
  console.log("\n" + "=".repeat(60));
  console.log("🚀 测试真正的 5 并发...\n");

  // 重置 5 个帖子
  await supabase.rpc("", {}).then(() => {});
  
  const { data: testPosts } = await supabase
    .from("xhs_posts")
    .select("id, post_id")
    .gt("image_count", 0)
    .neq("note_type", "视频")
    .limit(5);

  if (!testPosts) return;

  // 获取这 5 个帖子的图片
  const postIds = testPosts.map(p => p.id);
  const { data: allImages } = await supabase
    .from("post_images")
    .select("post_id, storage_url")
    .in("post_id", postIds)
    .order("image_order");

  const imagesByPost = new Map<string, string[]>();
  (allImages || []).forEach(img => {
    if (!img.storage_url) return;
    const urls = imagesByPost.get(img.post_id) || [];
    if (urls.length < 4) urls.push(img.storage_url);
    imagesByPost.set(img.post_id, urls);
  });

  // 串行执行 5 个
  console.log("   串行执行 5 个任务...");
  const serialStart = Date.now();
  for (const p of testPosts) {
    const urls = imagesByPost.get(p.id) || [];
    if (urls.length === 0) continue;
    const buffers = await Promise.all(urls.map(u => downloadImage(u)));
    await generateCollageFromBuffers(buffers, { maxCellSize: 600 });
  }
  const serialTime = Date.now() - serialStart;
  console.log(`   ✅ 串行耗时: ${serialTime}ms`);

  // 并发执行 5 个
  console.log("\n   并发执行 5 个任务...");
  const parallelStart = Date.now();
  await Promise.all(testPosts.map(async (p) => {
    const urls = imagesByPost.get(p.id) || [];
    if (urls.length === 0) return;
    const buffers = await Promise.all(urls.map(u => downloadImage(u)));
    await generateCollageFromBuffers(buffers, { maxCellSize: 600 });
  }));
  const parallelTime = Date.now() - parallelStart;
  console.log(`   ✅ 并发耗时: ${parallelTime}ms`);

  console.log(`\n   🎯 加速比: ${(serialTime / parallelTime).toFixed(2)}x`);
}

main().catch(console.error);





