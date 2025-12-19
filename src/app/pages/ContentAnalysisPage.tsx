'use client'

import React, { useState, useMemo, useEffect } from "react";
import { SparklesIcon } from "@/shared/ui/Icon";
import { LazyImage, preloadImage } from "@/shared/ui/LazyImage";
import { usePosts, usePrefetchPostImages, type XHSPost } from "@/shared/lib/queries";

interface ContentAnalysisPageProps {
  onBack: () => void;
  onSelectPost: (post: XHSPost) => void;
}

export default function ContentAnalysisPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 20;

  // 使用 TanStack Query hooks
  const { data: allPosts = [], isLoading, dataUpdatedAt, refetch } = usePosts({ 
    withImages: true,
    search: searchTerm || undefined,
    withFirstImage: true, // 获取每个帖子的第一张图片
  });
  
  // 预取图片数据的函数（用户悬停时触发）
  const prefetchPostImages = usePrefetchPostImages();

  // 直接从帖子列表计算统计数据（避免缓存不一致）
  const stats = useMemo(() => ({
    postsWithImages: allPosts.length,
    totalLikes: allPosts.reduce((sum, p) => sum + (p.likes || 0), 0),
    totalFavorites: allPosts.reduce((sum, p) => sum + (p.favorites || 0), 0),
    totalComments: allPosts.reduce((sum, p) => sum + (p.comments || 0), 0),
    totalInteractions: allPosts.reduce((sum, p) => sum + (p.interactions || 0), 0),
  }), [allPosts]);

  // 本地分页
  const data = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allPosts.slice(start, start + pageSize);
  }, [allPosts, currentPage, pageSize]);

  const totalCount = allPosts.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  // 预加载下一页图片
  useEffect(() => {
    if (currentPage >= totalPages) return;
    
    const nextPageStart = currentPage * pageSize;
    const nextPagePosts = allPosts.slice(nextPageStart, nextPageStart + pageSize);
    
    // 延迟预加载，避免影响当前页面渲染
    const timer = setTimeout(() => {
      nextPagePosts.forEach((post) => {
        const postWithThumbnail = post as XHSPost & { 
          first_image_url?: string | null;
          first_image_thumbnail?: string | null;
        };
        // 优先预加载缩略图
        const imgUrl = postWithThumbnail.first_image_thumbnail || postWithThumbnail.first_image_url;
        if (imgUrl) {
          preloadImage(imgUrl);
        }
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [allPosts, currentPage, pageSize, totalPages]);

  // 格式化时间
  const formatTime = (time: string | null) => {
    if (!time) return "";
    try {
      return new Date(time).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
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
          <p className="text-muted-foreground">加载内容数据...</p>
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
            <span className="text-xs font-bold text-tiffany-600 tracking-wider uppercase">内容分析</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
            共 <span className="font-semibold text-tiffany-600">{totalCount.toLocaleString()}</span> 条内容
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 md:px-8 py-4 border-b border-border/40 flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-tiffany-600">{(stats?.postsWithImages || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">待分析内容</div>
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
      </div>

      {/* Search */}
      <div className="px-4 md:px-8 py-3 border-b border-border/40 flex-shrink-0">
        <input
          type="text"
          placeholder="搜索标题、内容..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full max-w-md px-4 py-2 glass rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent"
        />
      </div>

      {/* Content Cards Grid */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-4 custom-scrollbar relative">
        {isLoading && data.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => onSelectPost(item)}
                onMouseEnter={() => prefetchPostImages(item.id)}
                className="glass rounded-xl overflow-hidden hover:bg-card/60 transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-lg"
              >
                {/* 帖子第一张图 - 优先使用缩略图 */}
                <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                  {(() => {
                    const itemWithThumbnail = item as XHSPost & { 
                      first_image_url?: string | null;
                      first_image_thumbnail?: string | null;
                    };
                    const thumbnailUrl = itemWithThumbnail.first_image_thumbnail;
                    const originalUrl = itemWithThumbnail.first_image_url || item.cover_url;
                    const imageUrl = thumbnailUrl || originalUrl;
                    
                    return imageUrl ? (
                      <LazyImage
                        src={imageUrl}
                        alt={item.title || ""}
                        containerClassName="w-full h-full"
                        className="group-hover:scale-105 transition-transform duration-300"
                        fallbackSrc={originalUrl || undefined}
                      />
                    ) : null;
                  })() || (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* 图片数量 */}
                  {item.image_count > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-foreground/60 text-background rounded text-xs">
                      {item.image_count} 张
                    </div>
                  )}
                </div>

                {/* 卡片信息 */}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 min-h-[40px]">
                    {item.title || item.content?.slice(0, 50) || "无标题"}
                  </h3>
                  
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
                    <span className="text-xs text-muted-foreground truncate">
                      {item.xhs_accounts?.nickname || "未知用户"}
                    </span>
                    <span className="text-xs text-muted-foreground">· {formatTime(item.publish_time)}</span>
                  </div>

                  {/* 数据统计 */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                      {item.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      {item.favorites || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {item.comments || 0}
                    </span>
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
            <p className="text-muted-foreground">没有找到匹配的内容</p>
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

