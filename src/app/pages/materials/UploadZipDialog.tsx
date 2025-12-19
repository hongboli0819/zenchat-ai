/**
 * UploadZipDialog - 上传 ZIP 对话框
 * 
 * 支持拖拽和点击上传多个 ZIP 文件，异步处理
 */

import React, { useState, useRef, useCallback } from "react";

interface UploadZipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  uploading: boolean;
}

// 上传图标
const UploadIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

// 关闭图标
const CloseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ZIP 图标
const ZipIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-3 8h2v2h-2v-2zm0 4h2v2h-2v-2zm0-8h2v2h-2V8z" />
  </svg>
);

export const UploadZipDialog: React.FC<UploadZipDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
  uploading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理拖拽进入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 处理文件放置（支持多文件）
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const zipFiles = files.filter(f => f.name.endsWith(".zip"));
    
    if (zipFiles.length === 0) {
      alert("请上传 ZIP 格式文件");
      return;
    }
    
    if (zipFiles.length < files.length) {
      alert(`已过滤 ${files.length - zipFiles.length} 个非 ZIP 文件`);
    }
    
    setSelectedFiles(prev => [...prev, ...zipFiles]);
  }, []);

  // 处理文件选择（支持多文件）
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setSelectedFiles(prev => [...prev, ...Array.from(files)]);
      }
      // 重置 input 以便可以再次选择相同文件
      e.target.value = '';
    },
    []
  );

  // 移除单个文件
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 处理上传
  const handleUpload = useCallback(() => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
    }
  }, [selectedFiles, onUpload]);

  // 处理关闭
  const handleClose = useCallback(() => {
    if (!uploading) {
      setSelectedFiles([]);
      onClose();
    }
  }, [uploading, onClose]);

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />

      {/* 弹窗内容 */}
      <div
        className="relative bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            上传 ZIP 文件
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
          >
            <CloseIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 拖拽区域 */}
          <div
            className={`
              relative border-2 border-dashed rounded-2xl p-8 text-center
              transition-all duration-200 cursor-pointer
              ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }
              ${uploading ? "pointer-events-none opacity-50" : ""}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />

            <div className="flex flex-col items-center">
              <div
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                  ${isDragging ? "bg-primary/20" : "bg-muted"}
                `}
              >
                <UploadIcon
                  className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>

              <p className="font-semibold text-foreground mb-1">
                {isDragging ? "释放以上传" : "拖拽文件到这里"}
              </p>
              <p className="text-sm text-muted-foreground">
                或点击选择文件
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                支持 .zip 格式，可选择多个文件
              </p>
            </div>
          </div>

          {/* 已选择的文件列表 */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  已选择 {selectedFiles.length} 个文件
                </span>
                {!uploading && selectedFiles.length > 1 && (
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    清空全部
                  </button>
                )}
              </div>
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ZipIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate text-sm">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(file.size)}
                      </p>
                    </div>
                    {!uploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="p-1 hover:bg-muted rounded-lg flex-shrink-0"
                      >
                        <CloseIcon className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className={`
              px-6 py-2 text-sm font-semibold rounded-xl transition-all
              ${
                selectedFiles.length > 0 && !uploading
                  ? "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/30"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }
            `}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                处理中...
              </span>
            ) : selectedFiles.length > 1 ? (
              `上传 ${selectedFiles.length} 个文件`
            ) : (
              "开始上传"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

