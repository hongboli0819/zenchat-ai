/**
 * 批量压缩 Supabase Storage 中超过 4MB 的图片
 * 
 * 运行方式：npx tsx scripts/compress-large-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import * as dotenv from "dotenv";

dotenv.config();

// Supabase 配置
const supabaseUrl = "https://qqlwechtvktkhuheoeja.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbHdlY2h0dmt0a2h1aGVvZWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE1OTY5OCwiZXhwIjoyMDc5NzM1Njk4fQ.gAGpfWJNQMx6G2kbQKiYGBt4wBVGnhmXmErMDOVGf4I";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 配置
const TARGET_SIZE = 4 * 1024 * 1024; // 4MB
const BUCKETS = ["post-images", "post-cards", "post-merges"];

interface LargeFile {
  bucket: string;
  path: string;
  sizeBytes: number;
  sizeMB: number;
}

interface CompressionResult {
  file: LargeFile;
  success: boolean;
  originalSize: number;
  newSize?: number;
  error?: string;
}

/**
 * 递归列出所有文件
 */
async function listAllFiles(bucket: string, path: string = ""): Promise<LargeFile[]> {
  const allFiles: LargeFile[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(path, { limit, offset });

    if (error) {
      console.error(`❌ 获取 ${bucket}/${path} 文件列表失败:`, error.message);
      break;
    }

    if (!files || files.length === 0) break;

    for (const file of files) {
      if (file.id === null) {
        // 是文件夹，递归获取
        const subPath = path ? `${path}/${file.name}` : file.name;
        const subFiles = await listAllFiles(bucket, subPath);
        allFiles.push(...subFiles);
      } else if (file.metadata?.size && file.metadata.size > TARGET_SIZE) {
        // 超过 4MB 的文件
        allFiles.push({
          bucket,
          path: path ? `${path}/${file.name}` : file.name,
          sizeBytes: file.metadata.size,
          sizeMB: Number((file.metadata.size / 1024 / 1024).toFixed(2)),
        });
      }
    }

    if (files.length < limit) break;
    offset += limit;
  }

  return allFiles;
}

/**
 * 带重试的下载文件
 */
async function downloadFile(bucket: string, path: string, retries = 3): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      
      if (error) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return null;
      }
      
      const arrayBuffer = await data.arrayBuffer();
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
 * 使用 sharp 压缩图片到目标大小以下
 */
async function compressImage(buffer: Buffer, targetSize: number): Promise<Buffer> {
  let quality = 90;
  let result = buffer;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50; // PNG magic bytes
  
  // 获取原始图片信息
  const metadata = await sharp(buffer).metadata();
  let width = metadata.width || 1920;
  let height = metadata.height || 1080;
  
  // 策略：先尝试只降低质量，如果不够再缩小尺寸
  for (let attempt = 0; attempt < 15; attempt++) {
    const sharpInstance = sharp(buffer);
    
    // 如果需要缩小尺寸
    if (attempt > 5) {
      const scale = 1 - (attempt - 5) * 0.1; // 每次减少 10%
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);
      sharpInstance.resize(newWidth, newHeight, { fit: "inside" });
    }
    
    // 转为 JPEG 并压缩
    result = await sharpInstance
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    
    if (result.length <= targetSize) {
      return result;
    }
    
    // 降低质量
    quality = Math.max(quality - 5, 50);
  }
  
  // 最后一次尝试：强制缩小到较小尺寸
  const finalWidth = Math.min(width, 1200);
  const finalHeight = Math.min(height, 1200);
  
  result = await sharp(buffer)
    .resize(finalWidth, finalHeight, { fit: "inside" })
    .jpeg({ quality: 70, mozjpeg: true })
    .toBuffer();
  
  return result;
}

/**
 * 带重试的上传压缩后的文件替换原文件
 */
async function uploadFile(bucket: string, path: string, buffer: Buffer, retries = 3): Promise<boolean> {
  // 确保路径以 .jpg 或 .jpeg 结尾（因为我们转换为 JPEG）
  let uploadPath = path;
  if (path.toLowerCase().endsWith(".png")) {
    uploadPath = path.replace(/\.png$/i, ".jpg");
  } else if (!path.toLowerCase().endsWith(".jpg") && !path.toLowerCase().endsWith(".jpeg")) {
    uploadPath = path + ".jpg";
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 如果路径变了，先删除原文件
      if (uploadPath !== path && attempt === 1) {
        await supabase.storage.from(bucket).remove([path]);
      }
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(uploadPath, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });
      
      if (error) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        return false;
      }
      
      return true;
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      return false;
    }
  }
  return false;
}

/**
 * 处理单个文件（静默模式，用于并发）
 */
async function processFile(file: LargeFile, index: number, total: number): Promise<CompressionResult> {
  const prefix = `[${index}/${total}]`;
  
  // 1. 下载
  const buffer = await downloadFile(file.bucket, file.path);
  if (!buffer) {
    console.log(`${prefix} ❌ ${file.path} - 下载失败`);
    return { file, success: false, originalSize: file.sizeBytes, error: "下载失败" };
  }
  
  // 2. 压缩
  try {
    const compressed = await compressImage(buffer, TARGET_SIZE);
    const newSizeMB = (compressed.length / 1024 / 1024).toFixed(2);
    const reduction = ((1 - compressed.length / buffer.length) * 100).toFixed(1);
    
    // 3. 上传替换
    const uploaded = await uploadFile(file.bucket, file.path, compressed);
    
    if (uploaded) {
      console.log(`${prefix} ✅ ${file.sizeMB}MB → ${newSizeMB}MB (-${reduction}%) ${file.path}`);
      return {
        file,
        success: true,
        originalSize: file.sizeBytes,
        newSize: compressed.length,
      };
    } else {
      console.log(`${prefix} ❌ ${file.path} - 上传失败`);
      return { file, success: false, originalSize: file.sizeBytes, error: "上传失败" };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.log(`${prefix} ❌ ${file.path} - ${errorMessage}`);
    return { file, success: false, originalSize: file.sizeBytes, error: errorMessage };
  }
}

/**
 * 并发处理多个文件
 */
async function processFilesInBatches(
  files: LargeFile[],
  concurrency: number
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchPromises = batch.map((file, batchIndex) =>
      processFile(file, i + batchIndex + 1, total)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 批次之间短暂暂停
    if (i + concurrency < files.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * 主函数
 */
async function main() {
  const CONCURRENCY = 5; // 并发数（降低以避免连接中断）
  
  console.log("🔍 Supabase 大图片压缩工具 (并发版)\n");
  console.log("=".repeat(60));
  console.log(`目标: 将所有超过 4MB 的图片压缩到 4MB 以下`);
  console.log(`并发数: ${CONCURRENCY}`);
  console.log("=".repeat(60));
  
  // 1. 收集所有超过 4MB 的文件
  console.log("\n📋 扫描超过 4MB 的图片...\n");
  
  const largeFiles: LargeFile[] = [];
  
  for (const bucket of BUCKETS) {
    console.log(`   扫描 ${bucket}...`);
    const files = await listAllFiles(bucket);
    largeFiles.push(...files);
    console.log(`   找到 ${files.length} 个超大文件`);
  }
  
  console.log(`\n📊 共找到 ${largeFiles.length} 个超过 4MB 的文件`);
  
  if (largeFiles.length === 0) {
    console.log("\n✅ 没有需要压缩的文件!");
    return;
  }
  
  // 按大小排序（先处理最大的）
  largeFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);
  
  // 打印前 20 个待处理文件
  console.log("\n📝 前 20 个最大文件:");
  largeFiles.slice(0, 20).forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.sizeMB} MB - ${f.bucket}/${f.path}`);
  });
  if (largeFiles.length > 20) {
    console.log(`   ... 还有 ${largeFiles.length - 20} 个文件`);
  }
  
  // 2. 并发处理
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 开始并发压缩处理 (${CONCURRENCY} 并发)...`);
  console.log("=".repeat(60) + "\n");
  
  const startTime = Date.now();
  const results = await processFilesInBatches(largeFiles, CONCURRENCY);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // 3. 汇总报告
  console.log("\n" + "=".repeat(60));
  console.log("📊 处理完成汇总");
  console.log("=".repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const totalOriginal = successful.reduce((sum, r) => sum + r.originalSize, 0);
  const totalNew = successful.reduce((sum, r) => sum + (r.newSize || 0), 0);
  const totalSaved = totalOriginal - totalNew;
  
  console.log(`\n⏱️  耗时: ${duration} 秒`);
  console.log(`✅ 成功: ${successful.length}/${results.length}`);
  console.log(`❌ 失败: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log(`\n💾 节省空间: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   原始总大小: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   压缩后总大小: ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   压缩率: ${((1 - totalNew / totalOriginal) * 100).toFixed(1)}%`);
  }
  
  if (failed.length > 0) {
    console.log("\n❌ 失败的文件:");
    failed.forEach(r => {
      console.log(`   - ${r.file.bucket}/${r.file.path}: ${r.error}`);
    });
  }
  
  console.log("\n✅ 完成!\n");
}

main().catch(console.error);

