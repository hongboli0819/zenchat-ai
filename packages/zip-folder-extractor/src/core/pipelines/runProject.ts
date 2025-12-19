/**
 * runProject - ZIP 文件夹提取器的主能力函数
 *
 * 功能：
 * 1. 接收多个 ZIP 文件
 * 2. 异步解压并查找两层结构的最小单元
 * 3. 解析单元数据（xhs_user_id, title, content, 图片）
 * 4. 将图片转换为 PNG 格式
 * 5. 生成 Excel 文件（包含 Base64 图片）
 * 6. 同时提供 ZIP 打包下载
 */

import JSZip from "jszip";
// 使用相对路径，避免被父项目引用时路径别名冲突
import type { CoreFn } from "../types/functional";
import type {
  RunProjectInput,
  RunProjectOutput,
  FolderUnit,
  FolderUnitInfo,
  ParsedUnitData,
} from "../types/io";
import { findTwoLevelUnits } from "../steps/findTwoLevelUnits";
import { packUnitsToZip } from "../steps/packToZip";
import { parseAllUnits } from "../steps/parseUnitData";
import { generateExcel } from "../steps/generateExcel";
import { generateDataPackage } from "../steps/generateDataPackage";

export const runProject: CoreFn<RunProjectInput, RunProjectOutput> = async (
  input,
  ctx
) => {
  const logger = ctx?.adapters?.logger;
  const onProgress = ctx?.adapters?.onProgress;

  logger?.info?.("runProject:start", { fileCount: input.zipFiles.length });

  try {
    // 验证输入
    if (!input.zipFiles || input.zipFiles.length === 0) {
      return {
        success: false,
        resultZip: null,
        resultExcel: null,
        resultJson: null,
        summary: { totalZipsProcessed: 0, totalUnitsFound: 0, units: [] },
        parsedData: [],
        error: "没有提供 ZIP 文件",
      };
    }

    const allUnits: FolderUnit[] = [];
    const totalFiles = input.zipFiles.length;

    // ========== 阶段 1：解压 ZIP 并提取单元 ==========
    onProgress?.("阶段 1/3：解压 ZIP 文件...", 0);

    const processResults = await Promise.allSettled(
      input.zipFiles.map(async (file, index) => {
        const progressPercent = ((index + 0.5) / totalFiles) * 30;
        onProgress?.(`正在解压 ${file.name}...`, progressPercent);

        try {
          // 读取文件内容
          const arrayBuffer = await file.arrayBuffer();

          // 解压 ZIP
          const zip = await JSZip.loadAsync(arrayBuffer);

          // 查找两层单元
          const units = await findTwoLevelUnits(zip, file.name);

          logger?.info?.(`从 ${file.name} 提取了 ${units.length} 个单元`);

          return { fileName: file.name, units, success: true };
        } catch (err) {
          logger?.error?.(`处理 ${file.name} 失败:`, err);
          return {
            fileName: file.name,
            units: [],
            success: false,
            error: err instanceof Error ? err.message : "未知错误",
          };
        }
      })
    );

    // 收集所有成功提取的单元
    let processedCount = 0;
    for (const result of processResults) {
      if (result.status === "fulfilled" && result.value.success) {
        allUnits.push(...result.value.units);
        processedCount++;
      }
    }

    onProgress?.(
      `已从 ${processedCount} 个文件中提取 ${allUnits.length} 个单元`,
      30
    );

    // 如果没有找到任何单元
    if (allUnits.length === 0) {
      return {
        success: true,
        resultZip: null,
        resultExcel: null,
        resultJson: null,
        summary: {
          totalZipsProcessed: processedCount,
          totalUnitsFound: 0,
          units: [],
        },
        parsedData: [],
        error: "未找到符合条件的两层结构文件夹",
      };
    }

    // ========== 阶段 2：解析单元数据并转换图片 ==========
    onProgress?.("阶段 2/3：解析数据并转换图片...", 35);

    const parsedData: ParsedUnitData[] = await parseAllUnits(
      allUnits,
      (message, percent) => {
        // 映射到 35% - 75% 区间
        const mappedPercent = 35 + (percent / 100) * 40;
        onProgress?.(message, mappedPercent);
      }
    );

    logger?.info?.(`成功解析 ${parsedData.length} 个单元的数据`);

    // ========== 阶段 3：生成输出文件 ==========
    onProgress?.("阶段 3/3：生成输出文件...", 80);

    // 3.1 打包成 ZIP（保留原有功能）
    onProgress?.("正在打包 ZIP...", 82);
    const resultZip = await packUnitsToZip(allUnits);

    // 3.2 生成 Excel 和 JSON
    let resultExcel: Blob | null = null;
    let resultJson: Blob | null = null;
    
    if (parsedData.length > 0) {
      // 生成 Excel（文本数据 + 图片文件名）
      onProgress?.("正在生成 Excel...", 88);
      try {
        resultExcel = generateExcel(parsedData);
        logger?.info?.("Excel 生成成功");
      } catch (err) {
        logger?.error?.("生成 Excel 失败:", err);
      }

      // 生成数据包 ZIP（JSON 文本数据 + 独立图片文件）
      onProgress?.("正在生成数据包...", 95);
      try {
        resultJson = await generateDataPackage(parsedData);
        logger?.info?.("数据包生成成功");
      } catch (err) {
        logger?.error?.("生成数据包失败:", err);
      }
    }

    onProgress?.("完成！", 100);

    // 构建摘要信息
    const unitInfos: FolderUnitInfo[] = allUnits.map((unit) => ({
      name: unit.name,
      sourceZip: unit.sourceZip,
      originalPath: unit.originalPath,
      subfolderCount: unit.subfolders.length,
      totalFileCount: unit.subfolders.reduce(
        (sum, sf) => sum + sf.files.length,
        0
      ),
    }));

    const output: RunProjectOutput = {
      success: true,
      resultZip,
      resultExcel,
      resultJson,
      summary: {
        totalZipsProcessed: processedCount,
        totalUnitsFound: allUnits.length,
        units: unitInfos,
      },
      parsedData,
    };

    logger?.info?.("runProject:success", {
      totalZipsProcessed: output.summary.totalZipsProcessed,
      totalUnitsFound: output.summary.totalUnitsFound,
      parsedCount: parsedData.length,
      hasExcel: !!resultExcel,
      hasJson: !!resultJson,
    });

    return output;
  } catch (error) {
    logger?.error?.("runProject:error", error);

    return {
      success: false,
      resultZip: null,
      resultExcel: null,
      resultJson: null,
      summary: { totalZipsProcessed: 0, totalUnitsFound: 0, units: [] },
      parsedData: [],
      error: error instanceof Error ? error.message : "处理过程中发生未知错误",
    };
  }
};
