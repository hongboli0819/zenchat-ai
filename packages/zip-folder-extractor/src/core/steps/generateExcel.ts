/**
 * 生成 Excel 文件和 JSON 数据文件
 * 
 * Excel 文件：包含文本数据和图片文件名（因为 Base64 太长会超过单元格限制）
 * JSON 文件：包含完整的 Base64 图片数据，供代码解析使用
 */

import * as XLSX from "xlsx";
import type { ParsedUnitData } from "../types/io";

/**
 * 生成 Excel 文件（文本数据 + 图片文件名）
 * @param data 解析后的单元数据
 * @returns Excel 文件 Blob
 */
export function generateExcel(data: ParsedUnitData[]): Blob {
  if (data.length === 0) {
    throw new Error("没有数据可生成 Excel");
  }

  // 1. 计算最大图片数量（决定列数）
  const maxImages = Math.max(...data.map((d) => d.images.length), 0);

  // 2. 构建表头
  const headers: string[] = ["序号", "post_id", "title", "content"];
  for (let i = 1; i <= maxImages; i++) {
    headers.push(`pic${i}_name`);  // 图片文件名
  }

  // 3. 构建数据行
  const rows: (string | number)[][] = data.map((item) => {
    const row: (string | number)[] = [
      item.index,
      item.post_id,
      item.title,
      // 截断 content 避免超长（Excel 单元格限制 32767 字符）
      item.content.length > 30000 ? item.content.slice(0, 30000) + "..." : item.content,
    ];

    // 添加图片文件名
    for (let i = 0; i < maxImages; i++) {
      if (i < item.images.length) {
        row.push(item.images[i].originalName);
      } else {
        row.push(""); // 空单元格
      }
    }

    return row;
  });

  // 4. 创建工作表
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // 5. 设置列宽
  const colWidths: XLSX.ColInfo[] = [
    { wch: 6 }, // 序号
    { wch: 20 }, // xhs_user_id
    { wch: 40 }, // title
    { wch: 60 }, // content
  ];
  
  // 图片文件名列
  for (let i = 0; i < maxImages; i++) {
    colWidths.push({ wch: 30 });
  }
  worksheet["!cols"] = colWidths;

  // 6. 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "小红书数据");

  // 7. 生成二进制数据
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // 8. 创建 Blob
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * 生成包含完整 Base64 图片数据的 JSON 文件
 * 这个文件可以被代码解析，没有长度限制
 */
export function generateJSON(data: ParsedUnitData[]): Blob {
  const jsonData = data.map((item) => ({
    序号: item.index,
    xhs_user_id: item.xhs_user_id,
    title: item.title,
    content: item.content,
    sourceUnit: item.sourceUnit,
    images: item.images.map((img, idx) => ({
      name: `pic${idx + 1}`,
      originalName: img.originalName,
      order: img.order,
      base64: img.base64,
    })),
  }));

  const jsonString = JSON.stringify(jsonData, null, 2);

  return new Blob([jsonString], {
    type: "application/json;charset=utf-8",
  });
}

/**
 * 生成 CSV 文件（备选方案，更轻量）
 * 注意：CSV 中不包含图片 Base64，只包含文本数据
 */
export function generateCSV(data: ParsedUnitData[]): Blob {
  if (data.length === 0) {
    throw new Error("没有数据可生成 CSV");
  }

  // 计算最大图片数量
  const maxImages = Math.max(...data.map((d) => d.images.length), 0);

  // 构建表头
  const headers = ["序号", "post_id", "title", "content", "图片数量"];
  for (let i = 1; i <= maxImages; i++) {
    headers.push(`pic${i}_name`);
  }

  // CSV 转义函数
  const escapeCSV = (value: string | number): string => {
    const str = String(value);
    // 如果包含逗号、引号或换行，需要用引号包裹
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // 构建 CSV 内容
  const csvRows: string[] = [headers.map(escapeCSV).join(",")];

  for (const item of data) {
    const row: string[] = [
      escapeCSV(item.index),
      escapeCSV(item.post_id),
      escapeCSV(item.title),
      escapeCSV(item.content),
      escapeCSV(item.images.length),
    ];

    for (let i = 0; i < maxImages; i++) {
      if (i < item.images.length) {
        row.push(escapeCSV(item.images[i].originalName));
      } else {
        row.push("");
      }
    }

    csvRows.push(row.join(","));
  }

  const csvContent = csvRows.join("\n");

  // 添加 BOM 以支持 Excel 正确识别 UTF-8
  const BOM = "\uFEFF";
  return new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8",
  });
}
