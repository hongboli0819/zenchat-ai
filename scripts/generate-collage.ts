/**
 * 图片拼图生成器 - 测试脚本
 *
 * 使用方法：
 *   npx tsx scripts/generate-collage.ts [图片路径1] [图片路径2] ...
 *
 * 示例：
 *   npx tsx scripts/generate-collage.ts image1.png image2.png
 *
 * 如果不传入图片路径，将生成测试图片并运行测试
 */

import * as fs from "fs";
import * as path from "path";
import { createCanvas } from "canvas";
import {
  generateCollageFromPaths,
  generateCollageFromBuffers,
  CollageOptions,
} from "../src/shared/lib/collage";

// ===== 生成测试图片 =====
function createTestImage(index: number, outputPath: string): void {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];
  const canvas = createCanvas(400, 300);
  const ctx = canvas.getContext("2d");

  // 填充背景色
  ctx.fillStyle = colors[index - 1];
  ctx.fillRect(0, 0, 400, 300);

  // 添加文字
  ctx.fillStyle = "white";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`图片 ${index}`, 200, 150);

  // 保存
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
}

// ===== 运行自动测试 =====
async function runAutoTest(): Promise<void> {
  console.log("🖼️  图片拼图生成器测试\n");
  console.log("=".repeat(50));

  // 创建测试目录
  const testDir = path.join(process.cwd(), "test-collage");
  const outputDir = path.join(testDir, "output");

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 生成测试图片
  console.log("\n📝 生成测试图片...");
  const testImages: string[] = [];

  for (let i = 1; i <= 4; i++) {
    const imgPath = path.join(testDir, `test-${i}.png`);
    createTestImage(i, imgPath);
    testImages.push(imgPath);
    console.log(`  ✓ 已创建: test-${i}.png`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🔄 开始生成拼图...\n");

  // 配置选项
  const options: CollageOptions = {
    gap: 12,
    labelFontSize: 32,
    labelPadding: 10,
    labelMargin: 15,
  };

  // 测试不同数量的图片
  const testCases = [
    { count: 1, desc: "单张图" },
    { count: 2, desc: "两张图（左右拼接）" },
    { count: 3, desc: "三张图（四宫格，右下留白）" },
    { count: 4, desc: "四张图（完整四宫格）" },
  ];

  for (const testCase of testCases) {
    console.log(`\n📌 测试 ${testCase.count} 张图 - ${testCase.desc}`);
    console.log("-".repeat(40));

    const images = testImages.slice(0, testCase.count);
    const outputPath = path.join(outputDir, `collage-${testCase.count}.png`);

    const buffer = await generateCollageFromPaths(images, options);

    // 保存文件
    fs.writeFileSync(outputPath, buffer);
    const stats = fs.statSync(outputPath);
    console.log(`✅ 已保存: ${outputPath}`);
    console.log(`   大小: ${(stats.size / 1024).toFixed(1)} KB`);
  }

  // 测试 Buffer 模式
  console.log("\n" + "=".repeat(50));
  console.log("🔄 测试 Buffer 模式...\n");

  const buffers = testImages.slice(0, 2).map((p) => fs.readFileSync(p));
  const bufferResult = await generateCollageFromBuffers(buffers, options);
  const bufferOutputPath = path.join(outputDir, "collage-from-buffer.png");
  fs.writeFileSync(bufferOutputPath, bufferResult);
  console.log(`✅ Buffer 模式测试成功: ${bufferOutputPath}`);

  console.log("\n" + "=".repeat(50));
  console.log("✨ 测试完成！");
  console.log(`\n📁 输出目录: ${outputDir}`);
  console.log("\n生成的文件：");
  fs.readdirSync(outputDir).forEach((file) => {
    const filePath = path.join(outputDir, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  });
}

// ===== 处理命令行参数 =====
async function runWithArgs(imagePaths: string[]): Promise<void> {
  console.log("🖼️  图片拼图生成器\n");
  console.log(`输入 ${imagePaths.length} 张图片:`);
  imagePaths.forEach((p, i) => console.log(`  [${i + 1}] ${p}`));

  // 验证文件存在
  for (const p of imagePaths) {
    if (!fs.existsSync(p)) {
      console.error(`\n❌ 错误: 文件不存在 - ${p}`);
      process.exit(1);
    }
  }

  // 生成拼图
  const outputPath = `collage-${Date.now()}.png`;
  const buffer = await generateCollageFromPaths(imagePaths, {
    gap: 12,
    labelFontSize: 32,
    labelPadding: 10,
    labelMargin: 15,
  });

  fs.writeFileSync(outputPath, buffer);
  const stats = fs.statSync(outputPath);
  console.log(`\n✅ 拼图已保存: ${outputPath}`);
  console.log(`   大小: ${(stats.size / 1024).toFixed(1)} KB`);
}

// ===== 主入口 =====
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // 有命令行参数，使用指定的图片
    await runWithArgs(args);
  } else {
    // 无参数，运行自动测试
    await runAutoTest();
  }
}

main().catch((err) => {
  console.error("❌ 错误:", err);
  process.exit(1);
});




