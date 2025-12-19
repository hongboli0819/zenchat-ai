/**
 * 策略洞察页面
 * 
 * 提供内容策略分析、KOS效果评估、KPI 追踪等功能
 */

import React, { useState, useMemo } from "react";
import { usePosts, useAccountsWithStats } from "@/shared/lib/queries";
import { PanelLeftIcon } from "@/shared/ui/Icon";
import {
  ContentFeatureAnalysis,
  PerformanceDistribution,
  InfluencerMatrix,
  TrendDiscovery,
  KPITracker,
  WeeklyActions,
  getPastWeeks,
  getPastMonths,
  createWeekIdentifier,
  createMonthIdentifier,
  generateContentInsights,
  calculateKPIStatus,
  calculateInfluencerQuadrant,
  formatNumber,
} from "./strategy-insights";
import type {
  WeekIdentifier,
  MonthIdentifier,
  PerformanceDistributionPoint,
  InfluencerMatrixData,
  InfluencerAlert,
  TopicTrend,
  KPIMetric,
  ActionItem,
  ContentInsight,
} from "./strategy-insights/types";
import {
  mockContentInsights,
  mockWeeklyStats,
  generateMockPerformanceDistribution,
  mockInfluencerData,
  mockInfluencerAlerts,
  mockInactiveInfluencers,
  mockTopicTrends,
  mockKPIMetrics,
  mockActionItems,
  shouldUseMockData,
} from "./strategy-insights/mockData";

interface StrategyInsightsPageProps {
  onBack: () => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export const StrategyInsightsPage: React.FC<StrategyInsightsPageProps> = ({
  onBack,
  sidebarOpen = true,
  setSidebarOpen,
}) => {
  // 时间状态
  const [selectedWeek, setSelectedWeek] = useState<WeekIdentifier>(() => createWeekIdentifier());
  const [selectedMonth, setSelectedMonth] = useState<MonthIdentifier>(() => createMonthIdentifier());
  const [showAllTime, setShowAllTime] = useState(false);

  // 获取过去的周和月列表
  const pastWeeks = useMemo(() => getPastWeeks(8), []);
  const pastMonths = useMemo(() => getPastMonths(6), []);

  // 数据查询
  const { data: posts = [], isLoading: postsLoading } = usePosts({ withImages: true });
  const { data: accountsWithStats = [], isLoading: accountsLoading } = useAccountsWithStats();

  const isLoading = postsLoading || accountsLoading;

  // 判断是否使用 Mock 数据
  // 暂时始终使用 Mock 数据来展示效果，后续接入真实数据时可以修改这里
  const useMockData = true; // shouldUseMockData(posts.length, accountsWithStats.length);

  // 计算周度数据（真实数据）
  const realWeeklyData = useMemo(() => {
    if (useMockData) return [];
    
    return pastWeeks.map((week) => {
      const weekPosts = posts.filter((post) => {
        if (!post.publish_time) return false;
        const postDate = new Date(post.publish_time);
        return postDate >= week.startDate && postDate <= week.endDate;
      });

      const sortedByInteraction = [...weekPosts].sort((a, b) => (b.interactions || 0) - (a.interactions || 0));
      const topCount = Math.ceil(weekPosts.length * 0.2);
      const topPosts = sortedByInteraction.slice(0, topCount);
      
      const aaaRatio = weekPosts.length > 0 ? (topCount / weekPosts.length) * 100 : 0;
      const nonCompliantRatio = Math.random() * 5 + 2;

      return {
        week,
        totalPosts: weekPosts.length,
        topPosts,
        aaaRatio,
        nonCompliantRatio,
      };
    });
  }, [posts, pastWeeks, useMockData]);

  // 当前周的统计数据（使用 Mock 或真实数据）
  const currentWeekStats = useMemo(() => {
    if (useMockData) {
      return mockWeeklyStats;
    }
    
    const currentData = realWeeklyData.find(
      (w) => w.week.year === selectedWeek.year && w.week.week === selectedWeek.week
    ) || realWeeklyData[realWeeklyData.length - 1];
    
    return {
      totalPosts: currentData?.totalPosts || 0,
      topPerformingPosts: currentData?.topPosts.length || 0,
      topPerformingRatio: currentData?.totalPosts 
        ? ((currentData?.topPosts.length || 0) / currentData.totalPosts) * 100 
        : 0,
    };
  }, [useMockData, realWeeklyData, selectedWeek]);

  // 生成内容洞察（使用 Mock 或真实数据）
  const contentInsights = useMemo<ContentInsight[]>(() => {
    // 使用 Mock 数据
    if (useMockData) {
      return mockContentInsights;
    }

    // 使用真实数据
    const currentData = realWeeklyData.find(
      (w) => w.week.year === selectedWeek.year && w.week.week === selectedWeek.week
    ) || realWeeklyData[realWeeklyData.length - 1];

    if (!currentData || currentData.topPosts.length === 0) {
      return mockContentInsights; // 回退到 Mock 数据
    }

    return generateContentInsights(
      currentData.topPosts.map((p) => ({
        id: p.id,
        likes: p.likes || 0,
        favorites: p.favorites || 0,
        comments: p.comments || 0,
        interactions: p.interactions || 0,
        image_count: p.image_count || 0,
        content: p.content,
        title: p.title,
      })),
      posts.map((p) => ({
        likes: p.likes || 0,
        favorites: p.favorites || 0,
        comments: p.comments || 0,
        image_count: p.image_count || 0,
      }))
    );
  }, [useMockData, realWeeklyData, selectedWeek, posts]);

  // 内容表现分布数据（使用 Mock 或真实数据）
  const performanceDistribution = useMemo<PerformanceDistributionPoint[]>(() => {
    if (useMockData) {
      return generateMockPerformanceDistribution();
    }
    
    return realWeeklyData.map((w) => ({
      week: w.week,
      aaaRatio: w.aaaRatio,
      nonCompliantRatio: w.nonCompliantRatio,
      totalPosts: w.totalPosts,
    }));
  }, [useMockData, realWeeklyData]);

  // KOS矩阵数据（使用 Mock 或真实数据）
  const influencerMatrixData = useMemo<InfluencerMatrixData[]>(() => {
    if (useMockData) {
      return mockInfluencerData;
    }

    if (accountsWithStats.length === 0) return mockInfluencerData;

    const avgInteraction = accountsWithStats.reduce((sum, a) => sum + (a.total_interactions || 0), 0) / accountsWithStats.length;
    const avgOutput = accountsWithStats.reduce((sum, a) => sum + (a.total_posts || 0), 0) / accountsWithStats.length;

    return accountsWithStats.map((account) => {
      const interactionRate = account.total_posts ? (account.total_interactions || 0) / account.total_posts : 0;
      const avgOutputPerMonth = (account.total_posts || 0) / 3;

      return {
        id: account.id,
        accountId: account.id,
        nickname: account.nickname,
        avatar: account.avatar,
        monthlyOutput: Math.round(avgOutputPerMonth),
        avgInteraction: Math.round((account.total_interactions || 0) / Math.max(1, account.total_posts || 1)),
        interactionRate,
        quadrant: calculateInfluencerQuadrant(
          interactionRate,
          account.total_posts || 0,
          avgInteraction / Math.max(1, avgOutput),
          avgOutput
        ),
        outputChange: (Math.random() - 0.5) * 40,
        interactionChange: (Math.random() - 0.5) * 60,
      };
    });
  }, [useMockData, accountsWithStats]);

  // KOS预警（使用 Mock 或真实数据）
  const influencerAlerts = useMemo<InfluencerAlert[]>(() => {
    if (useMockData) {
      return mockInfluencerAlerts;
    }

    return influencerMatrixData
      .filter((d) => Math.abs(d.interactionChange || 0) > 30 || Math.abs(d.outputChange || 0) > 40)
      .map((d) => ({
        id: d.id,
        accountId: d.accountId,
        nickname: d.nickname,
        avatar: d.avatar,
        type: (d.interactionChange || 0) > 30 ? "positive" : (d.interactionChange || 0) < -30 ? "negative" : "warning",
        message: (d.interactionChange || 0) > 30
          ? `互动率上涨 ${Math.abs(d.interactionChange || 0).toFixed(0)}%，建议加强合作`
          : (d.outputChange || 0) < -40
          ? `产出下降 ${Math.abs(d.outputChange || 0).toFixed(0)}%，需要关注原因`
          : `数据波动较大，建议跟进`,
        metric: "interaction" as const,
        changeValue: d.interactionChange || 0,
      }))
      .slice(0, 5);
  }, [useMockData, influencerMatrixData]);

  // 本月未发布的KOS
  const inactiveInfluencers = useMemo(() => {
    if (useMockData) {
      // 使用真实数据生成的 Mock 数据（14位未发布KOS）
      return mockInactiveInfluencers;
    }
    
    // 真实数据：找出没有发布内容的KOS
    const activeAccountIds = new Set(influencerMatrixData.filter(d => d.monthlyOutput > 0).map(d => d.accountId));
    
    return accountsWithStats
      .filter(account => !activeAccountIds.has(account.id))
      .map(account => ({
        id: account.id,
        nickname: account.nickname,
        avatar: account.avatar,
      }));
  }, [useMockData, influencerMatrixData, accountsWithStats]);

  // 话题趋势（使用 Mock 数据）
  const topicTrends = useMemo<TopicTrend[]>(() => {
    return mockTopicTrends;
  }, []);

  // KPI 指标（使用 Mock 或真实数据）
  const kpiMetrics = useMemo<KPIMetric[]>(() => {
    if (useMockData) {
      return mockKPIMetrics;
    }

    const currentWeek = realWeeklyData[realWeeklyData.length - 1];
    const avgWeekData = {
      posts: realWeeklyData.reduce((sum, w) => sum + w.totalPosts, 0) / Math.max(1, realWeeklyData.length),
      interactions: posts.reduce((sum, p) => sum + (p.interactions || 0), 0) / Math.max(1, realWeeklyData.length),
    };

    const currentPosts = currentWeek?.totalPosts || 0;
    const currentInteractions = currentWeek?.topPosts.reduce((sum, p) => sum + (p.interactions || 0), 0) || 0;
    const avgInteractionPerPost = currentPosts > 0 ? currentInteractions / currentPosts : 0;

    const postChange = avgWeekData.posts > 0 ? ((currentPosts - avgWeekData.posts) / avgWeekData.posts) * 100 : 0;
    const interactionChange = avgWeekData.interactions > 0 
      ? ((currentInteractions - avgWeekData.interactions) / avgWeekData.interactions) * 100 
      : 0;

    const activeAccounts = accountsWithStats.filter((a) => (a.total_posts || 0) > 0).length;
    const totalAccounts = accountsWithStats.length;
    const activityRate = totalAccounts > 0 ? (activeAccounts / totalAccounts) * 100 : 0;

    return [
      {
        id: "total-interactions",
        name: "总互动量",
        currentValue: currentInteractions || mockKPIMetrics[0].currentValue,
        averageValue: Math.round(avgWeekData.interactions) || mockKPIMetrics[0].averageValue,
        changePercent: interactionChange || mockKPIMetrics[0].changePercent,
        status: calculateKPIStatus(interactionChange || mockKPIMetrics[0].changePercent),
      },
      {
        id: "avg-interactions",
        name: "平均互动量",
        currentValue: Math.round(avgInteractionPerPost) || mockKPIMetrics[1].currentValue,
        averageValue: Math.round(avgWeekData.interactions / Math.max(1, avgWeekData.posts)) || mockKPIMetrics[1].averageValue,
        changePercent: interactionChange || mockKPIMetrics[1].changePercent,
        status: calculateKPIStatus(interactionChange || mockKPIMetrics[1].changePercent),
      },
      {
        id: "content-output",
        name: "内容产出",
        currentValue: currentPosts || mockKPIMetrics[2].currentValue,
        averageValue: Math.round(avgWeekData.posts) || mockKPIMetrics[2].averageValue,
        changePercent: postChange || mockKPIMetrics[2].changePercent,
        status: calculateKPIStatus(postChange || mockKPIMetrics[2].changePercent),
        unit: "篇",
      },
      {
        id: "influencer-activity",
        name: "KOS活跃度",
        currentValue: Math.round(activityRate) || mockKPIMetrics[3].currentValue,
        averageValue: 75,
        changePercent: (activityRate - 75) || mockKPIMetrics[3].changePercent,
        status: calculateKPIStatus((activityRate - 75) || mockKPIMetrics[3].changePercent),
        unit: "%",
      },
    ];
  }, [useMockData, realWeeklyData, posts, accountsWithStats]);

  // 生成行动建议（使用 Mock 或真实数据）
  const actionItems = useMemo<ActionItem[]>(() => {
    // 使用 Mock 数据时直接返回
    if (useMockData) {
      return mockActionItems;
    }

    const actions: ActionItem[] = [];

    // 基于内容洞察生成建议
    const highImportanceInsights = contentInsights.filter((i) => i.importance === "high");
    if (highImportanceInsights.length > 0) {
      actions.push({
        id: "content-1",
        category: "content",
        title: "内容优化建议",
        description: highImportanceInsights[0].insight,
        priority: "high",
      });
    }

    // 基于KOS预警生成建议
    const positiveAlerts = influencerAlerts.filter((a) => a.type === "positive");
    const negativeAlerts = influencerAlerts.filter((a) => a.type === "negative");

    if (positiveAlerts.length > 0) {
      actions.push({
        id: "influencer-1",
        category: "influencer",
        title: `重点维护 @${positiveAlerts[0].nickname}`,
        description: `${positiveAlerts[0].message}。建议增加合作频次，扩大合作范围。`,
        priority: "medium",
        relatedData: {
          type: "account",
          id: positiveAlerts[0].accountId,
          name: positiveAlerts[0].nickname,
        },
      });
    }

    if (negativeAlerts.length > 0) {
      actions.push({
        id: "influencer-2",
        category: "urgent",
        title: `关注 @${negativeAlerts[0].nickname} 状态`,
        description: `${negativeAlerts[0].message}。建议主动沟通了解情况。`,
        priority: "high",
        relatedData: {
          type: "account",
          id: negativeAlerts[0].accountId,
          name: negativeAlerts[0].nickname,
        },
      });
    }

    // 基于 KPI 预警生成建议
    const warningKPIs = kpiMetrics.filter((m) => m.status === "warning");
    if (warningKPIs.length > 0) {
      actions.push({
        id: "kpi-1",
        category: "urgent",
        title: `${warningKPIs[0].name}预警`,
        description: `${warningKPIs[0].name}下降 ${Math.abs(warningKPIs[0].changePercent).toFixed(0)}%，需要紧急排查原因并采取措施。`,
        priority: "high",
        relatedData: {
          type: "metric",
          id: warningKPIs[0].id,
          name: warningKPIs[0].name,
        },
      });
    }

    // 内容产出建议
    const outputKPI = kpiMetrics.find((m) => m.id === "content-output");
    if (outputKPI && outputKPI.changePercent < -15) {
      actions.push({
        id: "publishing-1",
        category: "publishing",
        title: "增加内容产出",
        description: `本周内容产出低于平均 ${Math.abs(outputKPI.changePercent).toFixed(0)}%，建议增加至少 ${Math.ceil(Math.abs(outputKPI.changePercent) / 10)} 篇内容。`,
        priority: "medium",
      });
    }

    // 如果没有生成任何建议，返回 Mock 数据
    return actions.length > 0 ? actions : mockActionItems;
  }, [useMockData, contentInsights, influencerAlerts, kpiMetrics]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-8 relative z-20 border-b border-border/40 flex-shrink-0">
        <div className="flex items-center gap-3">
          {setSidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all ${
                sidebarOpen ? "md:opacity-0 md:pointer-events-none" : "opacity-100"
              }`}
              aria-label="Toggle Menu"
            >
              <PanelLeftIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-muted-foreground hover:text-tiffany-600 hover:bg-card/50 rounded-xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 px-4 py-2 glass rounded-full">
            <svg className="w-4 h-4 text-tiffany-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-bold text-tiffany-600 tracking-wider uppercase">策略洞察</span>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
          {/* 第一行：高效内容特征分析 + 内容表现分布图 */}
          {/* 第一行：高效内容特征分析 + (内容表现分布 + KOS效果矩阵) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：高效内容特征分析 */}
            <ContentFeatureAnalysis
              week={selectedWeek}
              weeks={pastWeeks}
              onWeekChange={setSelectedWeek}
              totalPosts={currentWeekStats.totalPosts}
              topPerformingPosts={currentWeekStats.topPerformingPosts}
              insights={contentInsights}
              isLoading={isLoading}
            />
            
            {/* 右侧：两个模块堆叠 */}
            <div className="space-y-6">
              <PerformanceDistribution
                data={performanceDistribution}
                isLoading={isLoading}
              />
              <InfluencerMatrix
                data={influencerMatrixData}
                alerts={influencerAlerts}
                month={selectedMonth}
                months={pastMonths}
                onMonthChange={setSelectedMonth}
                showAllTime={showAllTime}
                onToggleAllTime={() => setShowAllTime(!showAllTime)}
                isLoading={isLoading}
                inactiveInfluencers={inactiveInfluencers}
              />
            </div>
          </div>

          {/* 第三行：内容趋势发现 */}
          <TrendDiscovery
            topics={topicTrends}
            isLoading={isLoading}
          />

          {/* 第四行：KPI 追踪与预警 */}
          <KPITracker
            metrics={kpiMetrics}
            week={selectedWeek}
            isLoading={isLoading}
          />

          {/* 第五行：本周重点行动 */}
          <WeeklyActions
            actions={actionItems}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default StrategyInsightsPage;

