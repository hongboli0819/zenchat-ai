import React, { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { SparklesIcon } from "@/shared/ui/Icon";
import { useAccount, usePostsByAccount } from "@/shared/lib/queries";
import { TimeRangeSelector } from "./dashboard/TimeRangeSelector";
import { TimeRange, DateRange } from "./dashboard/types";
import type { XHSPostForAnalysis } from "@/app/AppShell";
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  isWithinInterval,
} from "date-fns";

type SortOrder = "desc" | "asc";

interface AccountDetailContextType {
  setActiveModule: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedPostForAnalysis: React.Dispatch<React.SetStateAction<XHSPostForAnalysis | null>>;
  setAnalysisBackPath: React.Dispatch<React.SetStateAction<string | null>>;
}

export const AccountDetailPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { setActiveModule, setSelectedPostForAnalysis, setAnalysisBackPath } = useOutletContext<AccountDetailContextType>();

  // 筛选状态
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // 数据查询
  const { data: account, isLoading: accountLoading } = useAccount(accountId);
  const { data: posts = [], isLoading: postsLoading, refetch } = usePostsByAccount(accountId, {
    withImages: true, // 只获取图文笔记，与账号管理统计保持一致
    withFirstImage: true, // 获取本地化的第一张图片
  });

  const isLoading = accountLoading || postsLoading;

  // 点击帖子跳转到内容分析详情页
  const handlePostClick = useCallback((post: typeof posts[0]) => {
    // 构造 XHSPostForAnalysis 对象
    const postForAnalysis: XHSPostForAnalysis = {
      id: post.id,
      post_id: post.post_id || '',
      account_id: post.account_id,
      platform: 'xiaohongshu',
      title: post.title,
      content: post.content,
      post_url: post.post_url,
      cover_url: post.cover_url,
      note_type: post.note_type,
      publish_time: post.publish_time,
      status: null,
      interactions: post.interactions || 0,
      likes: post.likes || 0,
      favorites: post.favorites || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      image_count: 0,
      card_image: null,
      xhs_accounts: account ? {
        nickname: account.nickname,
        avatar: account.avatar,
        profile_url: account.profile_url,
      } : null,
    };
    // 设置返回路径为当前账号详情页
    setAnalysisBackPath(`/accounts/${accountId}`);
    // 设置选中的帖子并切换到内容分析模块
    setSelectedPostForAnalysis(postForAnalysis);
    // 导航回主页面并激活内容分析模块
    navigate('/');
    setActiveModule('analysis');
  }, [account, accountId, navigate, setActiveModule, setSelectedPostForAnalysis, setAnalysisBackPath]);

  // 根据时间范围获取日期区间
  const getDateBounds = (range: TimeRange, custom: DateRange): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (range) {
      case "week":
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfDay(now) };
      case "year":
        return { start: startOfYear(now), end: endOfDay(now) };
      case "custom":
        if (custom.start && custom.end) {
          return { start: custom.start, end: custom.end };
        }
        return null;
      default:
        return null;
    }
  };

  // 筛选和排序帖子
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // 1. 时间范围筛选
    const bounds = getDateBounds(timeRange, dateRange);
    if (bounds) {
      result = result.filter((post) => {
        if (!post.publish_time) return false;
        const publishDate = new Date(post.publish_time);
        return isWithinInterval(publishDate, { start: bounds.start, end: bounds.end });
      });
    }

    // 2. 搜索筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(term) ||
          post.content?.toLowerCase().includes(term)
      );
    }

    // 3. 按互动量排序
    result.sort((a, b) =>
      sortOrder === "desc"
        ? (b.interactions || 0) - (a.interactions || 0)
        : (a.interactions || 0) - (b.interactions || 0)
    );

    return result;
  }, [posts, timeRange, dateRange, searchTerm, sortOrder]);

  // 分页
  const totalCount = filteredPosts.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // 统计数据
  const stats = useMemo(() => {
    return {
      totalPosts: filteredPosts.length,
      totalInteractions: filteredPosts.reduce((sum, p) => sum + (p.interactions || 0), 0),
      totalLikes: filteredPosts.reduce((sum, p) => sum + (p.likes || 0), 0),
      totalFavorites: filteredPosts.reduce((sum, p) => sum + (p.favorites || 0), 0),
      totalComments: filteredPosts.reduce((sum, p) => sum + (p.comments || 0), 0),
      avgInteractions: filteredPosts.length > 0
        ? Math.round(filteredPosts.reduce((sum, p) => sum + (p.interactions || 0), 0) / filteredPosts.length)
        : 0,
    };
  }, [filteredPosts]);

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万";
    }
    return num.toLocaleString();
  };

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

  // 处理时间范围变化
  const handleTimeRangeChange = (range: TimeRange, dates: DateRange) => {
    setTimeRange(range);
    setDateRange(dates);
    setCurrentPage(1);
  };

  // 返回账号列表
  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading && !account) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">加载账号数据...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-16 h-16 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-muted-foreground">账号不存在</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header - 账号信息 */}
      <header className="px-4 md:px-8 py-4 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>

          {/* 账号头像和基本信息 */}
          <div className="flex items-center gap-4 flex-1">
            {account.avatar ? (
              <img
                src={account.avatar}
                alt=""
                className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${account.nickname}`;
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-tiffany-400 to-tiffany-600 flex items-center justify-center text-primary-foreground font-bold text-xl ring-2 ring-primary/20">
                {account.nickname?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                {account.nickname}
                <div className="flex items-center gap-1.5 px-2 py-0.5 glass rounded-full">
                  <SparklesIcon className="w-3 h-3 text-tiffany-600" />
                  <span className="text-[10px] font-bold text-tiffany-600 tracking-wider uppercase">KOS</span>
                </div>
              </h1>
              {account.xhs_id && (
                <p className="text-sm text-muted-foreground">小红书号: {account.xhs_id}</p>
              )}
            </div>
            {account.profile_url && (
              <a
                href={account.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-tiffany-600 hover:bg-card/60 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                查看主页
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 统计卡片 */}
      <div className="px-4 md:px-8 py-4 border-b border-border/40 flex-shrink-0">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-blue-500">{stats.totalPosts}</div>
            <div className="text-xs text-muted-foreground mt-0.5">筛选结果</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-purple-500">{formatNumber(stats.totalInteractions)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">总互动</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-tiffany-500">{formatNumber(stats.avgInteractions)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">平均互动</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-red-500">{formatNumber(stats.totalLikes)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">总点赞</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-amber-500">{formatNumber(stats.totalFavorites)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">总收藏</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-500">{formatNumber(stats.totalComments)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">总评论</div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="px-4 md:px-8 py-3 border-b border-border/40 flex-shrink-0 space-y-3">
        {/* 时间范围选择器 */}
        <TimeRangeSelector
          value={timeRange}
          dateRange={dateRange}
          onChange={handleTimeRangeChange}
        />

        {/* 排序和搜索 */}
        <div className="flex flex-wrap gap-3 items-center">
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
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value as SortOrder);
              setCurrentPage(1);
            }}
            className="px-3 py-2 glass rounded-xl text-sm bg-transparent cursor-pointer"
          >
            <option value="desc">互动量从高到低</option>
            <option value="asc">互动量从低到高</option>
          </select>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-sm text-muted-foreground hover:text-foreground transition-all"
            title="刷新数据"
          >
            <svg className={`w-4 h-4 ${postsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 帖子列表 */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-4 custom-scrollbar relative">
        {postsLoading && paginatedPosts.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedPosts.map((post) => {
            // 优先使用缩略图 -> 原图 -> 封面图
            const postWithImage = post as typeof post & { 
              first_image_url?: string | null;
              first_image_thumbnail?: string | null;
            };
            const thumbnailUrl = postWithImage.first_image_thumbnail;
            const originalUrl = postWithImage.first_image_url || post.cover_url;
            const imageUrl = thumbnailUrl || originalUrl;
            
            return (
            <div
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="glass rounded-xl overflow-hidden hover:bg-card/60 transition-all group cursor-pointer"
            >
              {/* 封面图 - 优先使用缩略图，fallback 到原图 */}
              {imageUrl && (
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // 如果缩略图加载失败，尝试 fallback 到原图
                      const img = e.target as HTMLImageElement;
                      if (thumbnailUrl && originalUrl && img.src !== originalUrl) {
                        img.src = originalUrl;
                      } else if (post.cover_url && img.src !== post.cover_url) {
                        img.src = post.cover_url;
                      } else {
                        img.style.display = "none";
                      }
                    }}
                  />
                </div>
              )}

              <div className="p-4">
                {/* 标题和类型 */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-foreground line-clamp-2 flex-1">
                    {post.title || post.content?.slice(0, 30) || "无标题"}
                  </h3>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                      post.note_type === "视频"
                        ? "bg-purple-500/20 text-purple-600"
                        : "bg-blue-500/20 text-blue-600"
                    }`}
                  >
                    {post.note_type || "图文"}
                  </span>
                </div>

                {/* 发布时间 */}
                <p className="text-xs text-muted-foreground mb-3">
                  {formatTime(post.publish_time)}
                </p>

                {/* 互动数据 */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    {formatNumber(post.likes || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {formatNumber(post.favorites || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {formatNumber(post.comments || 0)}
                  </span>
                </div>

                {/* 总互动量高亮 */}
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">总互动</span>
                  <span className="text-sm font-bold text-purple-500">
                    {formatNumber(post.interactions || 0)}
                  </span>
                </div>

                {/* 查看原文 */}
                {post.post_url && (
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 flex items-center justify-center gap-1 px-3 py-2 bg-primary/10 text-tiffany-600 rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    查看原文
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          );
          })}
        </div>

        {/* 空状态 */}
        {paginatedPosts.length === 0 && !postsLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-16 h-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-muted-foreground">
              {searchTerm || timeRange !== "all"
                ? "没有找到匹配的内容"
                : "该账号暂无发布内容"}
            </p>
          </div>
        )}
      </div>

      {/* 分页 */}
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
              <span className="ml-2 text-xs">
                (共 {totalCount} 条)
              </span>
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

