/**
 * 策略洞察模块工具函数
 */

import type { 
  WeekIdentifier, 
  MonthIdentifier, 
  PerformanceGrade, 
  SingleGrade,
  KPIStatus,
  InfluencerQuadrant,
  ContentInsight,
} from "./types";

/**
 * 获取 ISO 周数
 */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * 获取周的开始和结束日期
 */
export function getWeekDates(year: number, week: number): { start: Date; end: Date } {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const start = new Date(simple);
  if (dow <= 4) {
    start.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    start.setDate(simple.getDate() + 8 - simple.getDay());
  }
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/**
 * 创建周标识符
 */
export function createWeekIdentifier(date: Date = new Date()): WeekIdentifier {
  const year = date.getFullYear();
  const week = getISOWeek(date);
  const { start, end } = getWeekDates(year, week);
  return {
    year,
    week,
    label: `W${week.toString().padStart(2, "0")}`,
    startDate: start,
    endDate: end,
  };
}

/**
 * 获取过去 N 周的标识符列表
 */
export function getPastWeeks(count: number, fromDate: Date = new Date()): WeekIdentifier[] {
  const weeks: WeekIdentifier[] = [];
  const current = new Date(fromDate);
  
  for (let i = 0; i < count; i++) {
    weeks.unshift(createWeekIdentifier(current));
    current.setDate(current.getDate() - 7);
  }
  
  return weeks;
}

/**
 * 创建月标识符
 */
export function createMonthIdentifier(date: Date = new Date()): MonthIdentifier {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return {
    year,
    month,
    label: `${year}-${month.toString().padStart(2, "0")}`,
  };
}

/**
 * 获取过去 N 月的标识符列表
 */
export function getPastMonths(count: number, fromDate: Date = new Date()): MonthIdentifier[] {
  const months: MonthIdentifier[] = [];
  const current = new Date(fromDate);
  
  for (let i = 0; i < count; i++) {
    months.unshift(createMonthIdentifier(current));
    current.setMonth(current.getMonth() - 1);
  }
  
  return months;
}

/**
 * 计算综合评分
 */
export function calculateOverallGrade(scores: SingleGrade[]): PerformanceGrade {
  const scoreValues: Record<SingleGrade, number> = { A: 3, B: 2, C: 1 };
  const avgScore = scores.reduce((sum, s) => sum + scoreValues[s], 0) / scores.length;
  
  if (avgScore >= 2.75) return "AAA";
  if (avgScore >= 2.5) return "AAB";
  if (avgScore >= 2.25) return "ABB";
  if (avgScore >= 2) return "BBB";
  if (avgScore >= 1.75) return "BBC";
  if (avgScore >= 1.5) return "BCC";
  return "CCC";
}

/**
 * 根据互动数据计算单项评分
 */
export function calculateSingleGrade(value: number, thresholds: [number, number]): SingleGrade {
  if (value > thresholds[0]) return "A";
  if (value > thresholds[1]) return "B";
  return "C";
}

/**
 * 计算 KPI 状态
 */
export function calculateKPIStatus(changePercent: number): KPIStatus {
  if (changePercent >= -10) return "healthy";
  if (changePercent >= -25) return "attention";
  return "warning";
}

/**
 * 计算KOS象限
 */
export function calculateInfluencerQuadrant(
  interactionRate: number,
  output: number,
  avgInteractionRate: number,
  avgOutput: number
): InfluencerQuadrant {
  const highInteraction = interactionRate >= avgInteractionRate;
  const highOutput = output >= avgOutput;
  
  if (highInteraction && !highOutput) return "star"; // 明星型：高互动低产出
  if (highInteraction && highOutput) return "potential"; // 潜力型：高互动高产出
  if (!highInteraction && !highOutput) return "costEffective"; // 性价比型：低互动低产出
  return "lowEfficiency"; // 低效型：低互动高产出
}

/**
 * 格式化数字（添加千分位）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("zh-CN");
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * 格式化日期范围
 */
export function formatDateRange(start: Date, end: Date): string {
  const formatDate = (d: Date) => 
    `${d.getMonth() + 1}/${d.getDate()}`;
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * 生成爆款内容洞察（基于分析数据）
 * 这是深度洞察生成的核心函数
 */
export function generateContentInsights(
  topPosts: Array<{
    id: string;
    likes: number;
    favorites: number;
    comments: number;
    interactions: number;
    image_count: number;
    content: string | null;
    title: string | null;
  }>,
  allPosts: Array<{
    likes: number;
    favorites: number;
    comments: number;
    image_count: number;
  }>
): ContentInsight[] {
  if (topPosts.length === 0) {
    return [{
      id: "no-data",
      insight: "本周暂无爆款内容，建议参考历史爆款特征进行内容优化。",
      category: "综合特征",
      importance: "medium",
    }];
  }

  const insights: ContentInsight[] = [];
  
  // 1. 分析图片数量特征
  const avgTopImages = topPosts.reduce((sum, p) => sum + p.image_count, 0) / topPosts.length;
  const avgAllImages = allPosts.length > 0 
    ? allPosts.reduce((sum, p) => sum + p.image_count, 0) / allPosts.length 
    : avgTopImages;
  
  if (avgTopImages > avgAllImages * 1.2) {
    insights.push({
      id: "img-count-high",
      insight: `爆款内容平均使用 ${avgTopImages.toFixed(1)} 张图片，高于整体均值 ${((avgTopImages / avgAllImages - 1) * 100).toFixed(0)}%。多图组合能更完整地展示内容价值，提升用户停留时间。`,
      category: "封面设计",
      importance: "high",
    });
  }

  // 2. 分析互动结构
  const totalInteractions = topPosts.reduce((sum, p) => sum + p.interactions, 0);
  const totalLikes = topPosts.reduce((sum, p) => sum + p.likes, 0);
  const totalFavorites = topPosts.reduce((sum, p) => sum + p.favorites, 0);
  const totalComments = topPosts.reduce((sum, p) => sum + p.comments, 0);
  
  const likeRatio = totalLikes / totalInteractions;
  const favoriteRatio = totalFavorites / totalInteractions;
  const commentRatio = totalComments / totalInteractions;

  if (favoriteRatio > 0.3) {
    insights.push({
      id: "high-favorite",
      insight: `爆款内容收藏率达 ${(favoriteRatio * 100).toFixed(1)}%，说明内容具有较高的实用价值和参考意义，用户愿意保存以备后用。建议继续产出教程类、干货类内容。`,
      category: "正文结构",
      importance: "high",
    });
  } else if (likeRatio > 0.6) {
    insights.push({
      id: "high-like",
      insight: `爆款内容点赞占比 ${(likeRatio * 100).toFixed(1)}%，表明内容能快速引发用户共鸣。这类内容适合快速传播，但可适当增加实用性以提升收藏转化。`,
      category: "互动特征",
      importance: "medium",
    });
  }

  if (commentRatio > 0.15) {
    insights.push({
      id: "high-comment",
      insight: `评论互动占比达 ${(commentRatio * 100).toFixed(1)}%，说明内容成功激发了用户讨论欲望。这类内容往往设置了开放式话题或争议点，建议在内容中保持这一策略。`,
      category: "正文结构",
      importance: "high",
    });
  }

  // 3. 分析标题特征
  const titlesWithNumbers = topPosts.filter(p => p.title && /\d+/.test(p.title)).length;
  if (titlesWithNumbers / topPosts.length > 0.5) {
    insights.push({
      id: "title-numbers",
      insight: `超过 ${((titlesWithNumbers / topPosts.length) * 100).toFixed(0)}% 的爆款标题包含数字（如"3个技巧"、"5分钟学会"），数字能快速传递内容价值预期，提升点击率。`,
      category: "封面设计",
      importance: "medium",
    });
  }

  // 4. 分析内容长度
  const contentLengths = topPosts
    .filter(p => p.content)
    .map(p => p.content!.length);
  if (contentLengths.length > 0) {
    const avgLength = contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length;
    if (avgLength > 200 && avgLength < 400) {
      insights.push({
        id: "content-length-optimal",
        insight: `爆款正文平均 ${Math.round(avgLength)} 字，处于阅读舒适区间（200-400字）。这个长度既能充分表达观点，又不会造成阅读疲劳，是理想的内容长度。`,
        category: "正文结构",
        importance: "medium",
      });
    } else if (avgLength > 400) {
      insights.push({
        id: "content-length-long",
        insight: `爆款正文平均 ${Math.round(avgLength)} 字，属于深度长文。长文需要更强的内容价值支撑，建议配合清晰的段落结构和视觉分隔，保持可读性。`,
        category: "正文结构",
        importance: "medium",
      });
    }
  }

  // 5. 综合评价
  if (topPosts.length >= 3) {
    const avgInteraction = totalInteractions / topPosts.length;
    insights.push({
      id: "overall-performance",
      insight: `本周 ${topPosts.length} 篇爆款内容平均获得 ${formatNumber(Math.round(avgInteraction))} 次互动，整体表现优异。核心成功要素：视觉吸引力强、内容价值明确、互动引导自然。`,
      category: "综合特征",
      importance: "high",
    });
  }

  // 如果没有生成任何洞察，添加默认洞察
  if (insights.length === 0) {
    insights.push({
      id: "default",
      insight: "本周爆款内容特征较为分散，未呈现明显共性。建议分析单篇内容表现，寻找可复制的成功要素。",
      category: "综合特征",
      importance: "medium",
    });
  }

  return insights.sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 };
    return priority[a.importance] - priority[b.importance];
  });
}

