/**
 * FileTreeView - 文件树浏览组件
 * 
 * 展示合并后的文件层级结构，支持展开/折叠和点击预览
 */

import React, { useState } from "react";
import type { FileTreeNode } from "@/core/types/database";

interface FileTreeViewProps {
  tree: FileTreeNode | null;
  onFileClick: (node: FileTreeNode) => void;
}

// 文件夹图标
const FolderIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-5 h-5 transition-colors ${isOpen ? "text-primary" : "text-amber-500"}`}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    {isOpen ? (
      <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2z" />
    ) : (
      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    )}
  </svg>
);

// 文件图标（根据类型）
const FileIcon = ({ mimeType }: { mimeType?: string }) => {
  if (mimeType?.startsWith("image/")) {
    return (
      <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  
  if (mimeType === "text/plain") {
    return (
      <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }

  return (
    <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
};

// 展开/折叠图标
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// 单个树节点组件
interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
  onFileClick: (node: FileTreeNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onFileClick }) => {
  const [isOpen, setIsOpen] = useState(level < 2); // 默认展开前两层
  const isFolder = node.type === "folder";
  const hasChildren = isFolder && node.children && node.children.length > 0;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onFileClick(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-2 py-1.5 px-2 rounded-lg
          text-left text-sm transition-colors
          hover:bg-muted/50
          ${!isFolder ? "cursor-pointer hover:bg-primary/10" : ""}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* 展开图标（仅文件夹） */}
        <span className="w-4 flex-shrink-0">
          {hasChildren && <ChevronIcon isOpen={isOpen} />}
        </span>

        {/* 文件/文件夹图标 */}
        {isFolder ? (
          <FolderIcon isOpen={isOpen} />
        ) : (
          <FileIcon mimeType={node.mimeType} />
        )}

        {/* 名称 */}
        <span
          className={`
            truncate
            ${isFolder ? "font-medium text-foreground" : "text-muted-foreground"}
          `}
        >
          {node.name}
        </span>

        {/* 子项数量（仅文件夹） */}
        {hasChildren && (
          <span className="text-xs text-muted-foreground/60 ml-auto">
            {node.children!.length}
          </span>
        )}
      </button>

      {/* 子节点 */}
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  tree,
  onFileClick,
}) => {
  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-foreground mb-1">无文件结构</h3>
        <p className="text-sm text-muted-foreground">
          选择一个已完成的任务查看文件
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <TreeNode node={tree} level={0} onFileClick={onFileClick} />
    </div>
  );
};


