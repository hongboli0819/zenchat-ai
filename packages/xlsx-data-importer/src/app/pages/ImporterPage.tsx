import React, { useState } from "react";
import { runProject } from "@/core";
import type { ImportSummary, CoreContext } from "@/core";

/**
 * 独立测试页面
 *
 * 用于在子项目独立运行时测试导入功能
 */
export const ImporterPage: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ message: "", percent: 0 });
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setResult(null);
    setError(null);
    setProgress({ message: "准备导入...", percent: 0 });

    // 注意：独立运行时需要配置 Supabase client
    // 这里仅作为演示，实际使用需要注入真实的 db adapter
    const mockCtx: CoreContext = {
      adapters: {
        logger: {
          info: (...args) => console.log("[Info]", ...args),
          warn: (...args) => console.warn("[Warn]", ...args),
          error: (...args) => console.error("[Error]", ...args),
        },
        // db: supabaseClient, // 需要注入真实的 Supabase client
      },
    };

    try {
      const output = await runProject(
        {
          file,
          mode: "incremental",
          onProgress: (message, percent) => {
            setProgress({ message, percent });
          },
        },
        mockCtx
      );

      if (output.success) {
        setResult(output.summary);
      } else {
        setError(output.errors?.join(", ") || "导入失败");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">XLSX Data Importer</h1>
        <p className="text-muted-foreground">
          增量导入小红书数据 Excel 文件到 Supabase
        </p>
      </div>

      {/* 上传区域 */}
      <div className="border-2 border-dashed border-border rounded-xl p-12 text-center mb-8 hover:border-primary/50 transition-colors">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          disabled={isImporting}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className={`cursor-pointer ${isImporting ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-foreground mb-1">
            {isImporting ? "正在导入..." : "点击选择 Excel 文件"}
          </p>
          <p className="text-sm text-muted-foreground">支持 .xlsx 和 .xls 格式</p>
        </label>
      </div>

      {/* 进度 */}
      {isImporting && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="font-medium">{progress.message}</span>
          </div>
          <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            导入完成
          </h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Excel 总行数: {result.totalRows.toLocaleString()}</li>
            <li>• 已存在跳过: {result.existingCount.toLocaleString()}</li>
            <li>• 新增帖子: {result.insertedPosts.toLocaleString()}</li>
            <li>• 新增账号: {result.newAccounts.toLocaleString()}</li>
            <li>• 处理耗时: {(result.processingTime / 1000).toFixed(1)}s</li>
          </ul>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            导入失败
          </h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 说明 */}
      <div className="bg-muted/50 rounded-xl p-6">
        <h3 className="font-bold mb-3">使用说明</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>1. 选择包含小红书数据的 Excel 文件</li>
          <li>2. 系统会自动解析并映射字段</li>
          <li>3. 已存在的数据会自动跳过（增量导入）</li>
          <li>4. 新数据将被导入到 Supabase 数据库</li>
        </ul>
      </div>
    </div>
  );
};

