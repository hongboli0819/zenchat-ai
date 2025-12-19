/**
 * 策略洞察模块类型定义
 */

// 周数据标识
export interface WeekIdentifier {
  year: number;
  week: number;
  label: string; // 例如 "W01", "W52"
  startDate: Date;
  endDate: Date;
}

// 月数据标识
export interface MonthIdentifier {
  year: number;
  month: number;
  label: string; // 例如 "2024-01", "12月"
}

// 内容表现等级
export type PerformanceGrade = "AAA" | "AAB" | "ABB" | "BBB" | "BBC" | "BCC" | "CCC";
export type SingleGrade = "A" | "B" | "C";

// 爆款内容特征洞察
export interface ContentInsight {
  id: string;
  insight: string; // 洞察内容
  category: "封面设计" | "正文结构" | "视觉美感" | "合规表现" | "互动特征" | "综合特征";
  importance: "high" | "medium" | "low";
}

// 周度特征分析数据
export interface WeeklyContentAnalysis {
  week: WeekIdentifier;
  totalPosts: number;
  topPerformingPosts: number; // AAA 评分的帖子数
  topPerformingRatio: number; // AAA 比例
  insights: ContentInsight[];
}

// 内容表现分布数据点
export interface PerformanceDistributionPoint {
  week: WeekIdentifier;
  aaaRatio: number; // AAA 比例
  nonCompliantRatio: number; // 不合规比例
  totalPosts: number;
}

// KOS象限类型
export type InfluencerQuadrant = "star" | "potential" | "costEffective" | "lowEfficiency";

// KOS效果矩阵数据
export interface InfluencerMatrixData {
  id: string;
  accountId: string;
  nickname: string;
  avatar: string | null;
  monthlyOutput: number; // 月产出量
  avgInteraction: number; // 平均互动量
  interactionRate: number; // 互动率 (用于 Y 轴)
  quadrant: InfluencerQuadrant;
  // 变化数据
  outputChange?: number; // 产出变化百分比
  interactionChange?: number; // 互动变化百分比
}

// KOS异常预警
export interface InfluencerAlert {
  id: string;
  accountId: string;
  nickname: string;
  avatar: string | null;
  type: "positive" | "negative" | "warning";
  message: string;
  metric: "interaction" | "output" | "activity";
  changeValue: number; // 变化百分比
}

// 话题趋势
export interface TopicTrend {
  id: string;
  topic: string;
  heatChange: number; // 热度变化百分比
  relatedPosts: number;
  trend: "up" | "down" | "stable";
}

// KPI 健康状态
export type KPIStatus = "healthy" | "attention" | "warning";

// KPI 指标数据
export interface KPIMetric {
  id: string;
  name: string;
  currentValue: number;
  averageValue: number;
  changePercent: number;
  status: KPIStatus;
  unit?: string;
}

// 行动建议
export interface ActionItem {
  id: string;
  category: "content" | "influencer" | "urgent" | "publishing";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  relatedData?: {
    type: "account" | "post" | "metric";
    id: string;
    name: string;
  };
}

// 策略洞察页面整体数据
export interface StrategyInsightsData {
  currentWeek: WeekIdentifier;
  currentMonth: MonthIdentifier;
  contentAnalysis: WeeklyContentAnalysis;
  performanceDistribution: PerformanceDistributionPoint[];
  influencerMatrix: InfluencerMatrixData[];
  influencerAlerts: InfluencerAlert[];
  topicTrends: TopicTrend[];
  kpiMetrics: KPIMetric[];
  actionItems: ActionItem[];
}

