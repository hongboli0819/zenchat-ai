/**
 * 解析单元数据
 * 从文件夹单元中提取 xhs_user_id, title, content 和图片
 */

import type {
  FolderUnit,
  ParsedUnitData,
  ParsedImage,
  FileNameParseResult,
} from "../types/io";
import { convertToPngBase64 } from "./convertImageToPng";

/**
 * 解析文件名，提取 xhs_user_id 和 title
 * 文件名格式: "xxx+xhs_user_id+title - n.ext"
 * 注意：忽略空格的影响
 */
export function parseFileName(fileName: string): FileNameParseResult | null {
  // 移除扩展名
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");

  // 按 + 分割（忽略空格）
  const parts = nameWithoutExt.split("+").map((p) => p.trim());

  if (parts.length < 3) {
    console.warn(`文件名格式不正确，无法解析: ${fileName}`);
    return null;
  }

  // 第二段是 post_id（忽略空格）
  const post_id = parts[1].trim();

  // 第三段及之后合并（可能包含+）
  const lastPart = parts.slice(2).join("+").trim();

  // 从最后一部分提取 title 和 order
  // 格式: "title - n" 或 "title-n" 或 "title -n"
  // 使用更宽松的正则，忽略空格
  const orderMatch = lastPart.match(/(.+?)\s*-\s*(\d+)\s*$/);

  if (orderMatch) {
    return {
      post_id,
      title: orderMatch[1].trim(),
      order: parseInt(orderMatch[2], 10),
    };
  }

  // 如果没有 - n 格式，返回整个作为 title，order 为 0
  return {
    post_id,
    title: lastPart.trim(),
    order: 0,
  };
}

/**
 * 判断文件是否是图片
 */
function isImageFile(fileName: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"];
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  return imageExtensions.includes(ext);
}

/**
 * 解析单个单元的数据
 */
export async function parseUnitData(
  unit: FolderUnit,
  index: number,
  onProgress?: (message: string) => void
): Promise<ParsedUnitData | null> {
  // 1. 查找 "图片" 子文件夹（支持多种命名）
  const imageFolder = unit.subfolders.find(
    (sf) =>
      sf.name === "图片" ||
      sf.name.toLowerCase() === "images" ||
      sf.name.toLowerCase() === "image" ||
      sf.name.toLowerCase() === "pics" ||
      sf.name.toLowerCase() === "pictures"
  );

  if (!imageFolder) {
    console.warn(`单元 ${unit.name} 中未找到"图片"文件夹`);
    return null;
  }

  // 过滤出图片文件
  const imageFiles = imageFolder.files.filter((f) => isImageFile(f.name));

  if (imageFiles.length === 0) {
    console.warn(`单元 ${unit.name} 的图片文件夹中没有图片`);
    return null;
  }

  // 2. 解析第一个文件名获取 xhs_user_id 和 title
  const firstFile = imageFiles[0];
  const parsed = parseFileName(firstFile.name);

  if (!parsed) {
    console.warn(`无法解析文件名: ${firstFile.name}`);
    return null;
  }

  // 3. 查找 "文本" 子文件夹，读取内容
  const textFolder = unit.subfolders.find(
    (sf) =>
      sf.name === "文本" ||
      sf.name.toLowerCase() === "text" ||
      sf.name.toLowerCase() === "texts"
  );

  let content = "";
  if (textFolder) {
    const txtFile = textFolder.files.find((f) =>
      f.name.toLowerCase().endsWith(".txt")
    );
    if (txtFile) {
      try {
        content = new TextDecoder("utf-8").decode(txtFile.data);
      } catch (err) {
        console.warn(`读取文本文件失败: ${txtFile.name}`, err);
      }
    }
  }

  // 4. 收集并处理图片
  const images: ParsedImage[] = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    onProgress?.(`处理图片 ${i + 1}/${imageFiles.length}: ${file.name}`);

    // 解析文件名获取排序数字
    const fileParsed = parseFileName(file.name);
    const order = fileParsed?.order ?? i;

    try {
      // 转换为 PNG Base64
      const base64 = await convertToPngBase64(file.data, file.name);

      images.push({
        originalName: file.name,
        order,
        base64,
      });
    } catch (err) {
      console.error(`转换图片失败: ${file.name}`, err);
      // 继续处理其他图片
    }
  }

  if (images.length === 0) {
    console.warn(`单元 ${unit.name} 没有成功处理任何图片`);
    return null;
  }

  // 按 order 排序
  images.sort((a, b) => a.order - b.order);

  return {
    index,
    post_id: parsed.post_id,
    title: parsed.title,
    content,
    images,
    sourceUnit: unit.name,
  };
}

/**
 * 批量解析所有单元
 */
export async function parseAllUnits(
  units: FolderUnit[],
  onProgress?: (message: string, percent: number) => void
): Promise<ParsedUnitData[]> {
  const results: ParsedUnitData[] = [];
  let successIndex = 1;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const basePercent = (i / units.length) * 100;

    onProgress?.(`解析单元 ${i + 1}/${units.length}: ${unit.name}`, basePercent);

    const parsed = await parseUnitData(unit, successIndex, (msg) => {
      onProgress?.(msg, basePercent);
    });

    if (parsed) {
      results.push(parsed);
      successIndex++;
    }
  }

  return results;
}

