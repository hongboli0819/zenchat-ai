import React, { useState, useCallback, useRef } from "react";
import { runProject } from "@/core";
import type { RunProjectOutput, FolderUnitInfo, ParsedUnitData } from "@/core/types/io";

// 图标组件
const UploadIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  </svg>
);

const FolderIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
    />
  </svg>
);

const DownloadIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

const TableIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
    />
  </svg>
);

const CheckIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12.75l6 6 9-13.5"
    />
  </svg>
);

const TrashIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const SparklesIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
    />
  </svg>
);

const ImageIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);

export const ExtractorPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ message: "", percent: 0 });
  const [result, setResult] = useState<RunProjectOutput | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showParsedData, setShowParsedData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const zipFiles = Array.from(e.target.files).filter((f) =>
          f.name.toLowerCase().endsWith(".zip")
        );
        setFiles((prev) => [...prev, ...zipFiles]);
        setResult(null);
      }
    },
    []
  );

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.name.toLowerCase().endsWith(".zip")
    );

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
      setResult(null);
    }
  }, []);

  // 移除文件
  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 清空所有文件
  const handleClearFiles = useCallback(() => {
    setFiles([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // 开始处理
  const handleProcess = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setResult(null);
    setProgress({ message: "初始化...", percent: 0 });

    try {
      const output = await runProject(
        { zipFiles: files },
        {
          adapters: {
            onProgress: (message, percent) => {
              setProgress({ message, percent });
            },
            logger: {
              info: (...args) => console.log("[INFO]", ...args),
              warn: (...args) => console.warn("[WARN]", ...args),
              error: (...args) => console.error("[ERROR]", ...args),
            },
          },
        }
      );

      setResult(output);
    } catch (err) {
      console.error("Processing error:", err);
      setResult({
        success: false,
        resultZip: null,
        resultExcel: null,
        resultJson: null,
        summary: { totalZipsProcessed: 0, totalUnitsFound: 0, units: [] },
        parsedData: [],
        error: err instanceof Error ? err.message : "处理过程中发生错误",
      });
    } finally {
      setProcessing(false);
    }
  };

  // 下载 ZIP
  const handleDownloadZip = useCallback(() => {
    if (result?.resultZip) {
      const url = URL.createObjectURL(result.resultZip);
      const a = document.createElement("a");
      a.href = url;
      a.download = `extracted_units_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [result]);

  // 下载 Excel
  const handleDownloadExcel = useCallback(() => {
    if (result?.resultExcel) {
      const url = URL.createObjectURL(result.resultExcel);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xiaohongshu_data_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [result]);

  // 下载数据包（ZIP 包含 JSON + 图片文件）
  const handleDownloadDataPackage = useCallback(() => {
    if (result?.resultJson) {
      const url = URL.createObjectURL(result.resultJson);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xiaohongshu_data_package_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [result]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 计算总图片数
  const getTotalImages = (parsedData: ParsedUnitData[]): number => {
    return parsedData.reduce((sum, item) => sum + item.images.length, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-100 via-tiffany-50 to-tiffany-200 p-4 md:p-8">
      {/* 动态背景 */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] bg-primary/30 rounded-full blur-[80px] animate-blob"></div>
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] bg-tiffany-400/25 rounded-full blur-[70px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-15%] left-[25%] w-[50vw] h-[50vw] bg-tiffany-200/40 rounded-full blur-[80px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 glass-strong rounded-full mb-4">
            <SparklesIcon className="w-6 h-6 text-tiffany-600" />
            <h1 className="text-xl font-bold text-foreground tracking-wide">
              ZIP Folder Extractor
            </h1>
          </div>
          <p className="text-muted-foreground">
            上传 ZIP 文件，自动提取小红书数据并生成 Excel 表格
          </p>
        </div>

        {/* 上传区域 */}
        <div
          className={`glass-strong rounded-3xl p-8 mb-6 drop-zone cursor-pointer transition-all ${
            dragOver ? "drag-over ring-4 ring-primary/50" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <UploadIcon className="w-10 h-10 text-tiffany-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              拖拽 ZIP 文件到这里
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              或点击选择文件（支持多选）
            </p>
            <div className="px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-sm text-tiffany-600 font-medium">
                仅支持 .zip 格式
              </span>
            </div>
          </div>
        </div>

        {/* 已选文件列表 */}
        {files.length > 0 && (
          <div className="glass-strong rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                已选择 {files.length} 个文件
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFiles();
                }}
                className="px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                清空全部
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl group"
                >
                  <div className="flex items-center gap-3">
                    <FolderIcon className="w-5 h-5 text-tiffany-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 处理按钮 */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleProcess}
            disabled={files.length === 0 || processing}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-lg
                     shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                     transition-all duration-300 hover:scale-105 disabled:hover:scale-100
                     flex items-center gap-3"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                开始提取
              </>
            )}
          </button>
        </div>

        {/* 进度显示 */}
        {processing && (
          <div className="glass-strong rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                {progress.message}
              </span>
              <span className="text-sm font-bold text-tiffany-600">
                {Math.round(progress.percent)}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tiffany-500 to-tiffany-400 rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* 结果展示 */}
        {result && (
          <div className="glass-strong rounded-3xl p-6">
            {/* 结果头部 */}
            <div className="flex items-center gap-3 mb-6">
              {result.success && result.summary.totalUnitsFound > 0 ? (
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckIcon className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <FolderIcon className="w-6 h-6 text-amber-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {result.success ? "处理完成" : "处理失败"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {result.error ||
                    `从 ${result.summary.totalZipsProcessed} 个 ZIP 中提取了 ${result.summary.totalUnitsFound} 个单元`}
                </p>
              </div>
            </div>

            {/* 统计卡片 */}
            {result.success && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-tiffany-600">
                    {result.summary.totalZipsProcessed}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    处理文件
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-tiffany-600">
                    {result.summary.totalUnitsFound}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    提取单元
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-tiffany-600">
                    {result.parsedData.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    解析成功
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-tiffany-600">
                    {getTotalImages(result.parsedData)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    总图片数
                  </div>
                </div>
              </div>
            )}

            {/* 解析数据预览 */}
            {result.parsedData.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setShowParsedData(!showParsedData)}
                  className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3 hover:text-tiffany-600 transition-colors"
                >
                  <span>{showParsedData ? "▼" : "▶"}</span>
                  <span>解析数据预览 ({result.parsedData.length} 条)</span>
                </button>
                
                {showParsedData && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {result.parsedData.map((item: ParsedUnitData) => (
                      <div
                        key={item.index}
                        className="p-4 bg-muted/30 rounded-xl"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-tiffany-600/20 text-tiffany-600 text-xs font-medium rounded">
                                #{item.index}
                              </span>
                              <span className="text-sm font-medium text-foreground truncate">
                                {item.title}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>
                                <span className="font-medium">帖子ID:</span> {item.post_id}
                              </p>
                              <p className="line-clamp-2">
                                <span className="font-medium">内容:</span> {item.content || "(无)"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <ImageIcon className="w-4 h-4 text-tiffany-600" />
                            <span className="text-sm font-medium text-tiffany-600">
                              {item.images.length}
                            </span>
                          </div>
                        </div>
                        
                        {/* 图片预览 */}
                        {item.images.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                            {item.images.slice(0, 5).map((img, idx) => (
                              <img
                                key={idx}
                                src={img.base64}
                                alt={`pic${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-border"
                              />
                            ))}
                            {item.images.length > 5 && (
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sm text-muted-foreground">
                                  +{item.images.length - 5}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 单元列表（折叠） */}
            {result.summary.units.length > 0 && !showParsedData && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  提取的单元详情
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.summary.units.slice(0, 5).map((unit: FolderUnitInfo, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-muted/30 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FolderIcon className="w-5 h-5 text-tiffany-600" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {unit.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            来源: {unit.sourceZip}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-tiffany-600">
                          {unit.subfolderCount} 个子文件夹
                        </p>
                      </div>
                    </div>
                  ))}
                  {result.summary.units.length > 5 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      还有 {result.summary.units.length - 5} 个单元...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 下载按钮 */}
            {result.success && (
              <div className="space-y-3">
                {/* 数据包下载按钮 - 主要（ZIP 包含 JSON + PNG 图片文件） */}
                {result.resultJson && (
                  <button
                    onClick={handleDownloadDataPackage}
                    className="w-full px-6 py-4 bg-purple-600 text-white rounded-2xl font-semibold
                             shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40
                             transition-all duration-300 hover:scale-[1.02]
                             flex items-center justify-center gap-3"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    下载数据包（JSON + PNG 图片）
                  </button>
                )}

                {/* Excel 下载按钮 */}
                {result.resultExcel && (
                  <button
                    onClick={handleDownloadExcel}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-2xl font-semibold
                             shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40
                             transition-all duration-300 hover:scale-[1.02]
                             flex items-center justify-center gap-3"
                  >
                    <TableIcon className="w-5 h-5" />
                    下载 Excel 表格（文本 + 图片名）
                  </button>
                )}
                
                {/* ZIP 下载按钮 - 次要 */}
                {result.resultZip && (
                  <button
                    onClick={handleDownloadZip}
                    className="w-full px-6 py-4 bg-tiffany-600 text-white rounded-2xl font-semibold
                             shadow-lg shadow-tiffany-600/30 hover:shadow-xl hover:shadow-tiffany-600/40
                             transition-all duration-300 hover:scale-[1.02]
                             flex items-center justify-center gap-3"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    下载原始文件 ZIP
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            ZIP Folder Extractor v0.2.0 · 基于{" "}
            <span className="text-tiffany-600 font-medium">
              Unified L-Project
            </span>{" "}
            规范构建
          </p>
        </div>
      </div>
    </div>
  );
};
