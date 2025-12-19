/**
 * Step 1: 解析 xlsx 文件
 */

import * as XLSX from "xlsx";
import type { ExcelRow } from "../types/io";

/**
 * 解析 xlsx 文件，返回原始数据行
 *
 * @param file - xlsx 文件
 * @returns Excel 行数据数组
 */
export async function parseXlsx(file: File): Promise<ExcelRow[]> {
  // 1. 读取文件为 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // 2. 解析 Excel
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // 3. 获取第一个 sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // 4. 转换为 JSON（第一行作为表头）
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
    defval: null, // 空值默认为 null
  });

  return rows;
}



