/**
 * 构建目录树
 * 将 ZIP 文件的扁平路径结构转换为树形结构
 */

import type JSZip from "jszip";
import type { DirNode } from "../types/io";

/**
 * 从 JSZip 对象构建目录树
 */
export function buildDirectoryTree(zip: JSZip): DirNode {
  const root: DirNode = { files: [], subdirs: new Map() };

  zip.forEach((relativePath, file) => {
    // 跳过目录条目本身
    if (file.dir) return;

    const parts = relativePath.split("/").filter(Boolean);
    let current = root;

    // 遍历路径的每一层（除了最后一个，那是文件名）
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      if (!current.subdirs.has(dirName)) {
        current.subdirs.set(dirName, { files: [], subdirs: new Map() });
      }
      current = current.subdirs.get(dirName)!;
    }

    // 最后一个是文件名，添加到当前目录的文件列表
    if (parts.length > 0) {
      current.files.push(parts[parts.length - 1]);
    }
  });

  return root;
}

/**
 * 打印目录树（调试用）
 */
export function printDirectoryTree(node: DirNode, indent: string = ""): void {
  for (const file of node.files) {
    console.log(`${indent}📄 ${file}`);
  }
  for (const [dirName, subdir] of node.subdirs) {
    console.log(`${indent}📁 ${dirName}/`);
    printDirectoryTree(subdir, indent + "  ");
  }
}


