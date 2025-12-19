'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardPosts } from '@/shared/lib/queries';
import {
  TimeRange,
  DateRange,
  DashboardData,
  TrendDataPoint,
  TimeSlotData,
} from './dashboard/types';
import { TimeRangeSelector } from './dashboard/TimeRangeSelector';
import { KPICards } from './dashboard/KPICards';
import { TrendChart } from './dashboard/TrendChart';
import { InteractionPie } from './dashboard/InteractionPie';
import { RankingTabs } from './dashboard/RankingTabs';
import { ContributionBar } from './dashboard/ContributionBar';
import { TimeHeatmap } from './dashboard/TimeHeatmap';
import type { XHSPostForAnalysis } from '@/components/AppShell';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  format,
  parseISO,
  getDay,
  getHours,
} from 'date-fns';

interface DashboardPageProps {
  onBack: () => void;
}

interface DashboardContextType {
  setActiveModule: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedPostForAnalysis: React.Dispatch<React.SetStateAction<XHSPostForAnalysis | null>>;
  setAnalysisBackPath: React.Dispatch<React.SetStateAction<string | null>>;
}

// 获取时间范围的日期
const getDateRange = (range: TimeRange, customDates: DateRange): { start: Date | null; end: Date | null } => {
  const now = new Date();
  
  switch (range) {
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfDay(now) };
    case 'year':
      return { start: startOfYear(now), end: endOfDay(now) };
    case 'custom':
      return customDates;
    default:
      return { start: null, end: null };
  }
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { setActiveModule, setSelectedPostForAnalysis, setAnalysisBackPath } = useOutletContext<DashboardContextType>();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  // 使用缓存获取所有帖子数据
  const { data: allPosts = [], isLoading: loading, dataUpdatedAt, refetch } = useDashboardPosts();

  const handleTimeRangeChange = (range: TimeRange, dates: DateRange) => {
    setTimeRange(range);
    setDateRange(dates);
  };

  // 点击账号跳转到账号详情页
  const handleAccountClick = useCallback((accountId: string) => {
    navigate(`/accounts/${accountId}`);
  }, [navigate]);

  // 点击帖子跳转到内容分析详情页
  const handlePostClick = useCallback((postId: string) => {
    // 找到帖子数据
    const post = allPosts.find(p => p.id === postId);
    if (post) {
      // 构造 XHSPostForAnalysis 对象
      const postForAnalysis: XHSPostForAnalysis = {
        id: post.id,
        post_id: post.post_id || '',
        account_id: post.account_id,
        platform: 'xiaohongshu',
        title: post.title,
        content: post.content,
        post_url: null,
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
        xhs_accounts: post.xhs_accounts ? {
          nickname: post.xhs_accounts.nickname,
          avatar: post.xhs_accounts.avatar,
          profile_url: null,
        } : null,
      };
      // 设置返回路径为数据看板（使用特殊标识 @module:dashboard）
      setAnalysisBackPath('@module:dashboard');
      // 设置选中的帖子并切换到内容分析模块
      setSelectedPostForAnalysis(postForAnalysis);
      setActiveModule('analysis');
    }
  }, [allPosts, setSelectedPostForAnalysis, setActiveModule, setAnalysisBackPath]);

  // 使用 useMemo 在内存中过滤和计算数据（避免重复请求）
  const data = useMemo((): DashboardData | null => {
    if (!allPosts || allPosts.length === 0) {
      return {
        kpi: { totalPosts: 0, totalInteractions: 0, avgInteractions: 0, activeAccounts: 0, postsTrend: 0, interactionsTrend: 0, avgTrend: 0, accountsTrend: 0 },
        trend: [],
        distribution: [
          { name: '点赞', value: 0, color: '#ef4444' },
          { name: '收藏', value: 0, color: '#f59e0b' },
          { name: '评论', value: 0, color: '#3b82f6' },
          { name: '分享', value: 0, color: '#22c55e' },
        ],
        publishRanking: [],
        performanceRanking: [],
        efficiencyRanking: [],
        accountContribution: [],
        timeSlots: [],
      };
    }

    const dates = getDateRange(timeRange, dateRange);

    // 在内存中过滤帖子
    const posts = allPosts.filter((post) => {
      if (!post.publish_time) return timeRange === 'all';
      const publishDate = parseISO(post.publish_time);
      if (dates.start && publishDate < dates.start) return false;
      if (dates.end && publishDate > dates.end) return false;
      return true;
    });

    if (posts.length === 0) {
      return {
        kpi: { totalPosts: 0, totalInteractions: 0, avgInteractions: 0, activeAccounts: 0, postsTrend: 0, interactionsTrend: 0, avgTrend: 0, accountsTrend: 0 },
        trend: [],
        distribution: [
          { name: '点赞', value: 0, color: '#ef4444' },
          { name: '收藏', value: 0, color: '#f59e0b' },
          { name: '评论', value: 0, color: '#3b82f6' },
          { name: '分享', value: 0, color: '#22c55e' },
        ],
        publishRanking: [],
        performanceRanking: [],
        efficiencyRanking: [],
        accountContribution: [],
        timeSlots: [],
      };
    }

    // 计算 KPI
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalFavorites = posts.reduce((sum, p) => sum + (p.favorites || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const totalShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0);
    const totalInteractions = posts.reduce((sum, p) => sum + (p.interactions || 0), 0);
    const avgInteractions = totalPosts > 0 ? Math.round(totalInteractions / totalPosts) : 0;
    
    // 活跃账号数
    const activeAccountIds = new Set(posts.map(p => p.account_id).filter(Boolean));
    const activeAccounts = activeAccountIds.size;

    // 计算环比（在内存中过滤上一个周期的数据）
    let postsTrend = 0;
    let interactionsTrend = 0;
    let avgTrend = 0;
    let accountsTrend = 0;

    if (dates.start && dates.end) {
      const duration = dates.end.getTime() - dates.start.getTime();
      const prevStart = new Date(dates.start.getTime() - duration);
      const prevEnd = new Date(dates.start.getTime() - 1);

      const prevPosts = allPosts.filter((post) => {
        if (!post.publish_time) return false;
        const publishDate = parseISO(post.publish_time);
        return publishDate >= prevStart && publishDate <= prevEnd;
      });

      if (prevPosts.length > 0) {
        const prevTotal = prevPosts.length;
        const prevInteractions = prevPosts.reduce((sum, p) => sum + (p.interactions || 0), 0);
        const prevAvg = prevTotal > 0 ? prevInteractions / prevTotal : 0;
        const prevAccounts = new Set(prevPosts.map(p => p.account_id).filter(Boolean)).size;

        postsTrend = prevTotal > 0 ? ((totalPosts - prevTotal) / prevTotal) * 100 : 0;
        interactionsTrend = prevInteractions > 0 ? ((totalInteractions - prevInteractions) / prevInteractions) * 100 : 0;
        avgTrend = prevAvg > 0 ? ((avgInteractions - prevAvg) / prevAvg) * 100 : 0;
        accountsTrend = prevAccounts > 0 ? ((activeAccounts - prevAccounts) / prevAccounts) * 100 : 0;
      }
    }

    // 互动分布
    const distribution = [
      { name: '点赞', value: totalLikes, color: '#ef4444' },
      { name: '收藏', value: totalFavorites, color: '#f59e0b' },
      { name: '评论', value: totalComments, color: '#3b82f6' },
      { name: '分享', value: totalShares, color: '#22c55e' },
    ];

    // 趋势数据（按日期分组）
    const trendMap = new Map<string, TrendDataPoint & { sortKey: string }>();
    posts.forEach((post) => {
      if (!post.publish_time) return;
      const parsedDate = parseISO(post.publish_time);
      const sortKey = format(parsedDate, 'yyyy-MM-dd');
      const displayDate = format(parsedDate, 'yy/MM/dd');
      const existing = trendMap.get(sortKey) || { date: displayDate, sortKey, likes: 0, favorites: 0, comments: 0, shares: 0, total: 0 };
      existing.likes += post.likes || 0;
      existing.favorites += post.favorites || 0;
      existing.comments += post.comments || 0;
      existing.shares += post.shares || 0;
      existing.total += post.interactions || 0;
      trendMap.set(sortKey, existing);
    });
    const trend = Array.from(trendMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);

    // 账号排名数据
    const accountMap = new Map<string, {
      id: string;
      nickname: string;
      avatar: string | null;
      postCount: number;
      totalInteractions: number;
    }>();

    posts.forEach((post) => {
      const account = post.xhs_accounts;
      if (!account) return;
      const id = account.id;
      const existing = accountMap.get(id) || {
        id,
        nickname: account.nickname || '未知',
        avatar: account.avatar,
        postCount: 0,
        totalInteractions: 0,
      };
      existing.postCount += 1;
      existing.totalInteractions += post.interactions || 0;
      accountMap.set(id, existing);
    });

    const accountList = Array.from(accountMap.values()).map((a) => ({
      ...a,
      avgInteractions: a.postCount > 0 ? Math.round(a.totalInteractions / a.postCount) : 0,
    }));

    // 发布榜（按发布数量排序）
    const publishRanking = [...accountList].sort((a, b) => b.postCount - a.postCount);

    // 综合榜（按篇均互动排序）
    const efficiencyRanking = [...accountList].sort((a, b) => b.avgInteractions - a.avgInteractions);

    // 账号贡献（按总互动排序）
    const accountContribution = [...accountList].sort((a, b) => b.totalInteractions - a.totalInteractions);

    // 表现榜（按帖子互动量排序）
    // 优先使用缩略图 -> 原图 -> 封面图
    const performanceRanking = posts
      .map((post) => ({
        id: post.id,
        postId: post.post_id,
        title: post.title || '',
        coverUrl: post.first_image_thumbnail || post.first_image_url || post.cover_url,
        accountName: post.xhs_accounts?.nickname || '未知',
        interactions: post.interactions || 0,
        likes: post.likes || 0,
        favorites: post.favorites || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        publishTime: post.publish_time || '',
      }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 20);

    // 发布时间热力图数据
    const timeSlotMap = new Map<string, { count: number; totalInteractions: number }>();
    posts.forEach((post) => {
      if (!post.publish_time) return;
      const date = parseISO(post.publish_time);
      const hour = Math.floor(getHours(date) / 3) * 3;
      const dayOfWeek = (getDay(date) + 6) % 7;
      const key = `${hour}-${dayOfWeek}`;
      const existing = timeSlotMap.get(key) || { count: 0, totalInteractions: 0 };
      existing.count += 1;
      existing.totalInteractions += post.interactions || 0;
      timeSlotMap.set(key, existing);
    });

    const timeSlots: TimeSlotData[] = [];
    timeSlotMap.forEach((value, key) => {
      const [hour, dayOfWeek] = key.split('-').map(Number);
      timeSlots.push({
        hour,
        dayOfWeek,
        count: value.count,
        avgInteractions: value.count > 0 ? value.totalInteractions / value.count : 0,
      });
    });

    return {
      kpi: {
        totalPosts,
        totalInteractions,
        avgInteractions,
        activeAccounts,
        postsTrend,
        interactionsTrend,
        avgTrend,
        accountsTrend,
      },
      trend,
      distribution,
      publishRanking,
      performanceRanking,
      efficiencyRanking,
      accountContribution,
      timeSlots,
    };
  }, [allPosts, timeRange, dateRange]);

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
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-tiffany-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
            <span className="text-xs font-bold text-tiffany-600 tracking-wider uppercase">数据看板</span>
          </div>
          {/* 缓存状态和刷新按钮 */}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all"
            title="刷新数据"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>
              {dataUpdatedAt 
                ? `${Math.floor((Date.now() - dataUpdatedAt) / 1000)}秒前`
                : '加载中...'
              }
            </span>
          </button>
        </div>
        <div className="hidden md:block">
          <TimeRangeSelector
            value={timeRange}
            dateRange={dateRange}
            onChange={handleTimeRangeChange}
          />
        </div>
      </header>

      {/* Mobile Time Selector */}
      <div className="md:hidden px-4 py-3 border-b border-border/40 flex-shrink-0">
        <TimeRangeSelector
          value={timeRange}
          dateRange={dateRange}
          onChange={handleTimeRangeChange}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-6 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* KPI Cards */}
          <KPICards data={data?.kpi || { totalPosts: 0, totalInteractions: 0, avgInteractions: 0, activeAccounts: 0, postsTrend: 0, interactionsTrend: 0, avgTrend: 0, accountsTrend: 0 }} loading={loading} />

          {/* 趋势图和互动分布 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TrendChart data={data?.trend || []} loading={loading} />
            </div>
            <div>
              <InteractionPie data={data?.distribution || []} loading={loading} />
            </div>
          </div>

          {/* 三大排行榜 */}
          <RankingTabs
            publishRanking={data?.publishRanking || []}
            performanceRanking={data?.performanceRanking || []}
            efficiencyRanking={data?.efficiencyRanking || []}
            loading={loading}
            onAccountClick={handleAccountClick}
            onPostClick={handlePostClick}
          />

          {/* 账号贡献和发布时间 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContributionBar data={data?.accountContribution || []} loading={loading} />
            <TimeHeatmap data={data?.timeSlots || []} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

