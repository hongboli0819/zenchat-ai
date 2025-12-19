/**
 * FilePreviewModal - 文件预览弹窗
 * 
 * 支持图片和文本文件的预览
 */

import React, { useEffect, useState } from "react";
import type { FileTreeNode } from "@/core/types/database";

interface FilePreviewModalProps {
  file: FileTreeNode | null;
  isOpen: boolean;
  onClose: () => void;
}

// 关闭图标
const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
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

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 按 ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) {
    return null;
  }

  const isImage = file.mimeType?.startsWith("image/");
  const isText = file.mimeType === "text/plain";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />

      {/* 弹窗内容 */}
      <div
        className="relative bg-card rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            {isImage && (
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
            {isText && (
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {file.name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {file.path}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1">加载失败</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && isImage && file.previewUrl && (
            <div className="flex items-center justify-center">
              <img
                src={file.previewUrl}
                alt={file.name}
                className="max-w-full max-h-[70vh] rounded-xl shadow-lg object-contain"
                onError={() => setError("图片加载失败")}
              />
            </div>
          )}

          {!loading && !error && isText && (
            <div className="bg-muted rounded-xl p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {file.previewUrl || "(无内容)"}
              </pre>
            </div>
          )}

          {!loading && !error && !isImage && !isText && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                不支持预览
              </h3>
              <p className="text-sm text-muted-foreground">
                该文件类型暂不支持在线预览
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


