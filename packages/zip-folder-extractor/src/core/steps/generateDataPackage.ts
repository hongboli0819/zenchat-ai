/**
 * 生成数据包 ZIP
 * 
 * 结构：
 * data_package.zip
 * ├── data.json          # 文本数据 + 图片路径引用
 * └── images/
 *     ├── 1/             # 按序号分组
 *     │   ├── pic1.png
 *     │   └── pic2.png
 *     └── 2/
 *         └── pic1.png
 */

import JSZip from "jszip";
import type { ParsedUnitData } from "../types/io";

/**
 * 将 Base64 转换为 Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // 移除 data:image/png;base64, 前缀
  const base64Data = base64.split(",")[1] || base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * 生成数据包 ZIP
 * 包含 JSON 文本数据和独立的图片文件
 */
export async function generateDataPackage(data: ParsedUnitData[]): Promise<Blob> {
  const zip = new JSZip();
  const imagesFolder = zip.folder("images");

  // 构建 JSON 数据（不包含 Base64，只包含图片路径引用）
  const jsonData = data.map((item) => {
    // 为每个单元创建图片文件夹
    const unitFolder = imagesFolder?.folder(String(item.index));
    
    // 保存图片并记录路径
    const imagePaths: string[] = [];
    item.images.forEach((img, idx) => {
      const fileName = `pic${idx + 1}.png`;
      const filePath = `images/${item.index}/${fileName}`;
      
      // 将 Base64 转换为二进制并保存
      try {
        const imageData = base64ToUint8Array(img.base64);
        unitFolder?.file(fileName, imageData);
        imagePaths.push(filePath);
      } catch (err) {
        console.error(`保存图片失败: ${filePath}`, err);
      }
    });

    return {
      序号: item.index,
      post_id: item.post_id,
      title: item.title,
      content: item.content,
      sourceUnit: item.sourceUnit,
      imageCount: item.images.length,
      imagePaths: imagePaths,
    };
  });

  // 保存 JSON 数据文件
  const jsonString = JSON.stringify(jsonData, null, 2);
  zip.file("data.json", jsonString);

  // 生成 ZIP Blob
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return blob;
}

/**
 * 生成只包含文本数据的 JSON（不含图片）
 * 用于快速查看数据结构
 */
export function generateTextOnlyJSON(data: ParsedUnitData[]): Blob {
  const jsonData = data.map((item) => ({
    序号: item.index,
    post_id: item.post_id,
    title: item.title,
    content: item.content,
    sourceUnit: item.sourceUnit,
    imageCount: item.images.length,
    imageNames: item.images.map((img, idx) => ({
      name: `pic${idx + 1}`,
      originalName: img.originalName,
      order: img.order,
    })),
  }));

  const jsonString = JSON.stringify(jsonData, null, 2);

  return new Blob([jsonString], {
    type: "application/json;charset=utf-8",
  });
}

