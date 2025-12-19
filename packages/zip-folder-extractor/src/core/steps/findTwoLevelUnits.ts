/**
 * 查找两层结构的最小单元文件夹
 * 
 * 两层结构的定义：
 * - 该文件夹下只有子文件夹（没有直接的文件）
 * - 这些子文件夹下只有文件（没有更深的文件夹）
 */

import type JSZip from "jszip";
import type { DirNode, FolderUnit, SubfolderData, FileData } from "../types/io";
import { buildDirectoryTree } from "./buildDirectoryTree";

/**
 * 判断一个目录节点是否是"两层结构"的最小单元
 */
function isTwoLevelUnit(node: DirNode): boolean {
  // 条件1：没有直接的文件（只有子文件夹）
  if (node.files.length > 0) {
    return false;
  }

  // 条件2：必须有子文件夹
  if (node.subdirs.size === 0) {
    return false;
  }

  // 条件3：所有子文件夹下只有文件（没有更深的文件夹）
  for (const [, subdir] of node.subdirs) {
    // 如果子文件夹下还有文件夹，不符合
    if (subdir.subdirs.size > 0) {
      return false;
    }
    // 如果子文件夹是空的（没有文件），也不符合
    if (subdir.files.length === 0) {
      return false;
    }
  }

  return true;
}

/**
 * 提取一个单元的完整数据
 */
async function extractUnitData(
  node: DirNode,
  path: string,
  zip: JSZip,
  sourceZipName: string
): Promise<FolderUnit> {
  const name = path.split("/").pop() || "unknown";
  const subfolders: SubfolderData[] = [];

  for (const [subdirName, subdir] of node.subdirs) {
    const files: FileData[] = [];
    
    for (const fileName of subdir.files) {
      const filePath = path ? `${path}/${subdirName}/${fileName}` : `${subdirName}/${fileName}`;
      const zipFile = zip.file(filePath);
      
      if (zipFile) {
        try {
          const fileData = await zipFile.async("uint8array");
          files.push({ name: fileName, data: fileData });
        } catch (err) {
          console.warn(`Failed to extract file: ${filePath}`, err);
        }
      }
    }
    
    if (files.length > 0) {
      subfolders.push({ name: subdirName, files });
    }
  }

  return {
    name,
    sourceZip: sourceZipName,
    originalPath: path,
    subfolders,
  };
}

/**
 * 递归查找所有符合条件的两层单元
 */
async function findUnitsRecursive(
  node: DirNode,
  currentPath: string,
  zip: JSZip,
  sourceZipName: string,
  results: FolderUnit[]
): Promise<void> {
  // 检查当前节点是否是两层单元
  if (isTwoLevelUnit(node)) {
    const unit = await extractUnitData(node, currentPath, zip, sourceZipName);
    if (unit.subfolders.length > 0) {
      results.push(unit);
    }
    return; // 找到了就不再向下递归
  }

  // 继续向下查找
  for (const [dirName, subdir] of node.subdirs) {
    const newPath = currentPath ? `${currentPath}/${dirName}` : dirName;
    await findUnitsRecursive(subdir, newPath, zip, sourceZipName, results);
  }
}

/**
 * 主函数：从 ZIP 中查找所有两层结构的最小单元
 */
export async function findTwoLevelUnits(
  zip: JSZip,
  sourceZipName: string
): Promise<FolderUnit[]> {
  const units: FolderUnit[] = [];

  // 1. 构建目录树
  const tree = buildDirectoryTree(zip);

  // 2. 递归查找符合条件的文件夹
  await findUnitsRecursive(tree, "", zip, sourceZipName, units);

  return units;
}


