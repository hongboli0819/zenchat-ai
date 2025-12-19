/**
 * 数据看板类型定义
 */

export type TimeRange = 'all' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface KPIData {
  totalPosts: number;
  totalInteractions: number;
  avgInteractions: number;
  activeAccounts: number;
  // 环比数据
  postsTrend: number;
  interactionsTrend: number;
  avgTrend: number;
  accountsTrend: number;
}

export interface TrendDataPoint {
  date: string;
  likes: number;
  favorites: number;
  comments: number;
  shares: number;
  total: number;
}

export interface InteractionDistribution {
  name: string;
  value: number;
  color: string;
}

export interface AccountRanking {
  id: string;
  nickname: string;
  avatar: string | null;
  postCount: number;
  totalInteractions: number;
  avgInteractions: number;
  trend?: number;
}

export interface PostRanking {
  id: string;
  postId: string;
  title: string;
  coverUrl: string | null;
  accountName: string;
  interactions: number;
  likes: number;
  favorites: number;
  comments: number;
  shares: number;
  publishTime: string;
}

export interface TimeSlotData {
  hour: number;
  dayOfWeek: number;
  count: number;
  avgInteractions: number;
}

export interface DashboardData {
  kpi: KPIData;
  trend: TrendDataPoint[];
  distribution: InteractionDistribution[];
  publishRanking: AccountRanking[];
  performanceRanking: PostRanking[];
  efficiencyRanking: AccountRanking[];
  accountContribution: AccountRanking[];
  timeSlots: TimeSlotData[];
}


