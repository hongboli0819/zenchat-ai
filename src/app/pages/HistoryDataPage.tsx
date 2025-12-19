import React, { useState, useMemo } from "react";
import { SparklesIcon } from "@/shared/ui/Icon";
import { usePosts } from "@/shared/lib/queries";
import type { ImportSummary } from "@internal/xlsx-data-importer";

interface HistoryDataPageProps {
  onBack: () => void;
}

export const HistoryDataPage: React.FC<HistoryDataPageProps> = ({ onBack }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [noteTypeFilter, setNoteTypeFilter] = useState<string>("all");
  const pageSize = 20;

  // Excel 导入相关状态
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ message: "", percent: 0 });
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // 使用 TanStack Query hooks - 只获取图文笔记，与其他模块保持一致
  const { data: allPosts = [], isLoading, dataUpdatedAt, refetch } = usePosts({ 
    withImages: true,
    search: searchTerm || undefined,
    withFirstImage: true, // 获取本地化的第一张图片
  });

  // 处理 Excel 文件上传
  const handleUploadXlsx = async () => {
    // 创建隐藏的文件输入
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      setImportResult(null);
      setImportError(null);
      setImportProgress({ message: "准备导入...", percent: 0 });

      try {
        const { integrateXlsxImporter } = await import(
          "@/core/steps/integrateXlsxImporter"
        );

        const result = await integrateXlsxImporter(file, (message, percent) => {
          setImportProgress({ message, percent });
        });

        if (result.success) {
          setImportResult(result.summary);
          // 刷新数据
          refetch();
        } else {
          setImportError(result.errors?.join(", ") || "导入失败");
        }
      } catch (error) {
        console.error("导入失败:", error);
        setImportError((error as Error).message);
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  // 直接从帖子列表计算统计数据（避免缓存不一致）
  const stats = useMemo(() => ({
    totalLikes: allPosts.reduce((sum, p) => sum + (p.likes || 0), 0),
    totalFavorites: allPosts.reduce((sum, p) => sum + (p.favorites || 0), 0),
    totalComments: allPosts.reduce((sum, p) => sum + (p.comments || 0), 0),
    totalInteractions: allPosts.reduce((sum, p) => sum + (p.interactions || 0), 0),
  }), [allPosts]);

  // 应用类型过滤
  const filteredPosts = useMemo(() => {
    if (noteTypeFilter === "all") return allPosts;
    return allPosts.filter(p => p.note_type === noteTypeFilter);
  }, [allPosts, noteTypeFilter]);

  const totalCount = filteredPosts.length;

  // 本地分页
  const data = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // 笔记类型
  const noteTypes = ["图文"];

  const totalPages = Math.ceil(totalCount / pageSize);

  // 格式化时间
  const formatTime = (time: string | null) => {
    if (!time) return "";
    try {
      return new Date(time).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return time;
    }
  };

  // 格式化缓存更新时间
  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return "";
    const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前`;
    return new Date(dataUpdatedAt).toLocaleTimeString("zh-CN");
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-8 relative z-20 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 px-4 py-2 glass rounded-full">
            <SparklesIcon className="w-4 h-4 text-tiffany-600" />
            <span className="text-xs font-bold text-tiffany-600 tracking-wider uppercase">小红书历史数据</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* 上传表格按钮 */}
          <button
            onClick={handleUploadXlsx}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 bg-tiffany-600 text-primary-foreground rounded-xl hover:bg-tiffany-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{importProgress.percent}%</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>上传表格</span>
              </>
            )}
          </button>
          {/* 刷新按钮和缓存状态 */}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
            title="刷新数据"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{formatLastUpdated()}</span>
          </button>
          <div className="text-sm text-muted-foreground">
            共 <span className="font-semibold text-tiffany-600">{totalCount.toLocaleString()}</span> 条数据
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 md:px-8 py-4 border-b border-border/40 flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-tiffany-600">{allPosts.length.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">总作品</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{(stats?.totalLikes || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">总点赞</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{(stats?.totalFavorites || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">总收藏</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{(stats?.totalComments || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">总评论</div>
          </div>
          <div className="glass rounded-xl p-4 text-center col-span-2 md:col-span-1">
            <div className="text-2xl font-bold text-purple-500">{(stats?.totalInteractions || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">总互动</div>
          </div>
        </div>

        {/* 导入进度 */}
        {isImporting && (
          <div className="mt-4 p-4 bg-tiffany-500/10 border border-tiffany-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-tiffany-500/30 border-t-tiffany-500 rounded-full animate-spin" />
              <div className="flex-1">
                <div className="text-sm font-medium text-tiffany-600">{importProgress.message}</div>
                <div className="mt-2 h-2 bg-tiffany-500/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tiffany-500 transition-all duration-300"
                    style={{ width: `${importProgress.percent}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-tiffany-600">{importProgress.percent}%</span>
            </div>
          </div>
        )}

        {/* 导入成功结果 */}
        {importResult && !isImporting && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-green-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  导入完成
                </h3>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Excel 总行数: <span className="font-semibold">{importResult.totalRows.toLocaleString()}</span></li>
                  <li>• 已存在跳过: <span className="font-semibold">{importResult.existingCount.toLocaleString()}</span></li>
                  <li>• 新增帖子: <span className="font-semibold">{importResult.insertedPosts.toLocaleString()}</span></li>
                  <li>• 新增账号: <span className="font-semibold">{importResult.newAccounts.toLocaleString()}</span></li>
                  <li>• 处理耗时: <span className="font-semibold">{(importResult.processingTime / 1000).toFixed(1)}s</span></li>
                </ul>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 导入错误 */}
        {importError && !isImporting && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-red-600 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  导入失败
                </h3>
                <p className="text-sm text-red-700 mt-2">{importError}</p>
              </div>
              <button
                onClick={() => setImportError(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 md:px-8 py-3 border-b border-border/40 flex flex-wrap gap-3 items-center flex-shrink-0">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索标题、内容..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setNoteTypeFilter("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              noteTypeFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            全部
          </button>
          {noteTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setNoteTypeFilter(type);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                noteTypeFilter === type
                  ? "bg-primary text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-4 custom-scrollbar relative">
        {isLoading && data.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        <div className="space-y-3">
          {data.map((item) => {
            // 优先使用缩略图 -> 原图 -> 封面图
            const itemWithImage = item as typeof item & { 
              first_image_url?: string | null;
              first_image_thumbnail?: string | null;
            };
            const thumbnailUrl = itemWithImage.first_image_thumbnail;
            const originalUrl = itemWithImage.first_image_url || item.cover_url;
            const imageUrl = thumbnailUrl || originalUrl;
            
            return (
            <div
              key={item.id}
              className="glass rounded-xl p-4 hover:bg-card/60 transition-all group"
            >
              <div className="flex gap-4">
                {/* 封面图 - 优先使用缩略图，fallback 到原图 */}
                {imageUrl && (
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 如果缩略图加载失败，尝试 fallback 到原图
                        const img = e.target as HTMLImageElement;
                        if (thumbnailUrl && originalUrl && img.src !== originalUrl) {
                          img.src = originalUrl;
                        } else if (item.cover_url && img.src !== item.cover_url) {
                          img.src = item.cover_url;
                        } else {
                          img.style.display = "none";
                        }
                      }}
                    />
                  </div>
                )}

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground line-clamp-1">
                        {item.title || item.content?.slice(0, 50) || "无标题"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.content}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${
                        item.note_type === "视频"
                          ? "bg-purple-500/20 text-purple-600"
                          : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      {item.note_type || "未知"}
                    </span>
                  </div>

                  {/* 用户信息 */}
                  <div className="flex items-center gap-2 mt-2">
                    {item.xhs_accounts?.avatar && (
                      <img
                        src={item.xhs_accounts.avatar}
                        alt=""
                        className="w-5 h-5 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="text-sm text-tiffany-600 font-medium">
                      {item.xhs_accounts?.nickname || "未知用户"}
                    </span>
                    <span className="text-xs text-muted-foreground">· {formatTime(item.publish_time)}</span>
                  </div>

                  {/* 数据统计 */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                      {item.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      {item.favorites || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {item.comments || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {item.shares || 0}
                    </span>
                    {item.post_url && (
                      <a
                        href={item.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-tiffany-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        查看原文 →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
          })}
        </div>

        {data.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-16 h-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-muted-foreground">没有找到匹配的数据</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 md:px-8 py-3 border-t border-border/40 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 glass rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/60 transition-all"
          >
            上一页
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              第 <span className="font-semibold text-foreground">{currentPage}</span> / {totalPages} 页
            </span>
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 glass rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/60 transition-all"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};
