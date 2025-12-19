/**
 * 分析 Supabase Storage 中图片大小的脚本
 * 
 * 运行方式：npx tsx scripts/analyze-image-sizes.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 缺少环境变量 VITE_SUPABASE_URL 或 VITE_SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FileInfo {
  name: string;
  sizeBytes: number;
  sizeKB: number;
  sizeMB: number;
}

interface BucketStats {
  bucket: string;
  fileCount: number;
  totalSizeKB: number;
  totalSizeMB: number;
  avgSizeKB: number;
  avgSizeMB: number;
  maxSizeKB: number;
  minSizeKB: number;
  files: FileInfo[];
}

async function listAllFiles(bucket: string, path: string = ""): Promise<FileInfo[]> {
  const allFiles: FileInfo[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list(path, { limit, offset });

    if (error) {
      console.error(`❌ 获取 ${bucket} 文件列表失败:`, error.message);
      break;
    }

    if (!files || files.length === 0) break;

    for (const file of files) {
      // 如果是文件夹，递归获取
      if (file.id === null) {
        const subPath = path ? `${path}/${file.name}` : file.name;
        const subFiles = await listAllFiles(bucket, subPath);
        allFiles.push(...subFiles);
      } else if (file.metadata?.size) {
        allFiles.push({
          name: path ? `${path}/${file.name}` : file.name,
          sizeBytes: file.metadata.size,
          sizeKB: Math.round(file.metadata.size / 1024),
          sizeMB: Number((file.metadata.size / 1024 / 1024).toFixed(2)),
        });
      }
    }

    if (files.length < limit) break;
    offset += limit;
  }

  return allFiles;
}

async function analyzeBucket(bucket: string): Promise<BucketStats | null> {
  console.log(`\n📦 分析 ${bucket} bucket...`);
  
  const files = await listAllFiles(bucket);
  
  if (files.length === 0) {
    console.log(`   (空 bucket 或无法访问)`);
    return null;
  }

  const totalSizeKB = files.reduce((sum, f) => sum + f.sizeKB, 0);
  const sizes = files.map(f => f.sizeKB);

  return {
    bucket,
    fileCount: files.length,
    totalSizeKB,
    totalSizeMB: Number((totalSizeKB / 1024).toFixed(2)),
    avgSizeKB: Math.round(totalSizeKB / files.length),
    avgSizeMB: Number((totalSizeKB / files.length / 1024).toFixed(2)),
    maxSizeKB: Math.max(...sizes),
    minSizeKB: Math.min(...sizes),
    files,
  };
}

function printDistribution(files: FileInfo[], label: string) {
  const ranges = [
    { min: 0, max: 50, label: "0-50 KB" },
    { min: 50, max: 100, label: "50-100 KB" },
    { min: 100, max: 200, label: "100-200 KB" },
    { min: 200, max: 500, label: "200-500 KB" },
    { min: 500, max: 1000, label: "500KB-1MB" },
    { min: 1000, max: 2000, label: "1-2 MB" },
    { min: 2000, max: 4000, label: "2-4 MB" },
    { min: 4000, max: Infinity, label: "4+ MB" },
  ];

  console.log(`\n   📊 ${label} 大小分布:`);
  for (const range of ranges) {
    const count = files.filter(f => f.sizeKB >= range.min && f.sizeKB < range.max).length;
    const percent = ((count / files.length) * 100).toFixed(1);
    const bar = "█".repeat(Math.round(count / files.length * 30));
    if (count > 0) {
      console.log(`      ${range.label.padEnd(12)} ${String(count).padStart(4)} (${percent.padStart(5)}%) ${bar}`);
    }
  }
}

async function main() {
  console.log("🔍 Supabase Storage 图片大小分析\n");
  console.log("=".repeat(60));

  // 分析各个 bucket
  const buckets = ["post-images", "post-cards", "post-merges"];
  const results: BucketStats[] = [];

  for (const bucket of buckets) {
    const stats = await analyzeBucket(bucket);
    if (stats) {
      results.push(stats);
    }
  }

  // 打印详细统计
  console.log("\n" + "=".repeat(60));
  console.log("📊 统计汇总\n");

  for (const stats of results) {
    console.log(`\n📦 ${stats.bucket}`);
    console.log(`   文件数量: ${stats.fileCount}`);
    console.log(`   总大小:   ${stats.totalSizeMB} MB (${stats.totalSizeKB} KB)`);
    console.log(`   平均大小: ${stats.avgSizeMB} MB (${stats.avgSizeKB} KB)`);
    console.log(`   最大文件: ${(stats.maxSizeKB / 1024).toFixed(2)} MB (${stats.maxSizeKB} KB)`);
    console.log(`   最小文件: ${stats.minSizeKB} KB`);
    
    printDistribution(stats.files, stats.bucket);
  }

  // 打印前 10 个最大的文件
  const allFiles = results.flatMap(r => r.files.map(f => ({ ...f, bucket: r.bucket })));
  const topFiles = allFiles.sort((a, b) => b.sizeKB - a.sizeKB).slice(0, 10);

  console.log("\n" + "=".repeat(60));
  console.log("🔝 最大的 10 个文件:\n");
  topFiles.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.sizeMB} MB - ${f.bucket}/${f.name}`);
  });

  // 性能影响分析
  console.log("\n" + "=".repeat(60));
  console.log("⚡ 性能影响分析\n");

  const postImagesStats = results.find(r => r.bucket === "post-images");
  if (postImagesStats) {
    const avgMB = postImagesStats.avgSizeMB;
    const pageImages = 12; // 假设每页 12 张图片

    console.log(`   假设每页显示 ${pageImages} 张图片:`);
    console.log(`   ├─ 当前平均: ${avgMB} MB × ${pageImages} = ${(avgMB * pageImages).toFixed(1)} MB`);
    console.log(`   ├─ 10Mbps 网络: ~${((avgMB * pageImages * 8) / 10).toFixed(1)} 秒`);
    console.log(`   ├─ 50Mbps 网络: ~${((avgMB * pageImages * 8) / 50).toFixed(1)} 秒`);
    console.log(`   └─ 100Mbps 网络: ~${((avgMB * pageImages * 8) / 100).toFixed(1)} 秒`);

    console.log(`\n   如果优化到 100KB 平均:`);
    const optimizedMB = 0.1;
    console.log(`   ├─ 优化后: ${optimizedMB} MB × ${pageImages} = ${(optimizedMB * pageImages).toFixed(1)} MB`);
    console.log(`   ├─ 10Mbps 网络: ~${((optimizedMB * pageImages * 8) / 10).toFixed(1)} 秒`);
    console.log(`   ├─ 50Mbps 网络: ~${((optimizedMB * pageImages * 8) / 50).toFixed(1)} 秒`);
    console.log(`   └─ 100Mbps 网络: ~${((optimizedMB * pageImages * 8) / 100).toFixed(1)} 秒`);
    
    console.log(`\n   🎯 潜在加速: ${(avgMB / optimizedMB).toFixed(1)}x`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ 分析完成\n");
}

main().catch(console.error);

