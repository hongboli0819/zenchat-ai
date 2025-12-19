/**
 * 将提取的单元打包成新的 ZIP
 */

import JSZip from "jszip";
import type { FolderUnit } from "../types/io";

/**
 * 将所有单元打包成一个 ZIP
 * 使用 "来源ZIP_单元名" 作为顶层文件夹名，避免冲突
 */
export async function packUnitsToZip(units: FolderUnit[]): Promise<Blob> {
  const resultZip = new JSZip();

  // 用于跟踪文件夹名，避免重复
  const usedNames = new Set<string>();

  for (const unit of units) {
    // 生成唯一的文件夹名
    const baseZipName = unit.sourceZip.replace(/\.zip$/i, "");
    let unitFolderName = `${baseZipName}_${unit.name}`;
    
    // 如果名称重复，添加后缀
    let counter = 1;
    while (usedNames.has(unitFolderName)) {
      unitFolderName = `${baseZipName}_${unit.name}_${counter}`;
      counter++;
    }
    usedNames.add(unitFolderName);

    // 添加所有子文件夹和文件
    for (const subfolder of unit.subfolders) {
      for (const file of subfolder.files) {
        const filePath = `${unitFolderName}/${subfolder.name}/${file.name}`;
        resultZip.file(filePath, file.data);
      }
    }
  }

  // 生成 Blob
  const blob = await resultZip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return blob;
}


