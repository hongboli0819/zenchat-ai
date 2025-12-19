/**
 * 高效内容特征分析组件
 * 
 * 展示爆款内容的深度洞察，基于内容分析的各维度分析提炼共性特征
 * 设计风格：现代简约，减少颜色使用
 */

import React from "react";
import type { WeekIdentifier, ContentInsight } from "./types";
import { formatDateRange } from "./utils";

interface ContentFeatureAnalysisProps {
  week: WeekIdentifier;
  weeks: WeekIdentifier[];
  onWeekChange: (week: WeekIdentifier) => void;
  totalPosts: number;
  topPerformingPosts: number;
  insights: ContentInsight[];
  isLoading?: boolean;
}

// 类别图标映射
const categoryIcons: Record<ContentInsight["category"], React.ReactNode> = {
  "话题策略": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
    </svg>
  ),
  "封面设计": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  "正文结构": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "内容类型": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  "视觉美感": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  "合规表现": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  "互动特征": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
    </svg>
  ),
  "发布策略": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  "趋势警示": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "KOS洞察": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  "综合特征": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

export const ContentFeatureAnalysis: React.FC<ContentFeatureAnalysisProps> = ({
  week,
  weeks,
  onWeekChange,
  totalPosts,
  topPerformingPosts,
  insights,
  isLoading = false,
}) => {
  const topRatio = totalPosts > 0 ? ((topPerformingPosts / totalPosts) * 100).toFixed(1) : "0";

  return (
    <div className="glass rounded-2xl p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          高效内容特征分析
        </h2>
        
        {/* 周选择器 */}
        <select
          value={`${week.year}-${week.week}`}
          onChange={(e) => {
            const [y, w] = e.target.value.split("-").map(Number);
            const selected = weeks.find((wk) => wk.year === y && wk.week === w);
            if (selected) onWeekChange(selected);
          }}
          className="px-3 py-1.5 text-xs rounded-lg border border-border/30 bg-muted/30 text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
        >
          {weeks.map((w) => (
            <option key={`${w.year}-${w.week}`} value={`${w.year}-${w.week}`}>
              {w.label} ({formatDateRange(w.startDate, w.endDate)})
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-foreground/10 border-t-foreground/40 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* 统计概览 - 简约风格 */}
          <div className="flex items-center gap-8 mb-6 pb-6 border-b border-border/30">
            <div>
              <div className="text-3xl font-light text-foreground tracking-tight">{topPerformingPosts}</div>
              <div className="text-xs text-muted-foreground mt-0.5">本周爆款</div>
            </div>
            <div>
              <div className="text-lg font-medium text-foreground/80">
                {topRatio}<span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
              </div>
              <div className="text-xs text-muted-foreground">AAA 比例</div>
            </div>
            <div>
              <div className="text-lg font-medium text-foreground/80">{totalPosts}</div>
              <div className="text-xs text-muted-foreground">本周总内容</div>
            </div>
          </div>

          {/* 洞察列表 - 简约风格 */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
              爆款共性洞察
            </h3>
            
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={insight.id}
                  className="group"
                >
                  <div className="flex items-start gap-4">
                    {/* 序号 - 简约圆形 */}
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground/5 text-foreground/40 text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      {/* 分类和重要程度 */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-foreground/40">
                          {categoryIcons[insight.category] || categoryIcons["综合特征"]}
                        </span>
                        <span className="text-xs text-foreground/60">{insight.category}</span>
                        {insight.importance === "high" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        )}
                      </div>
                      
                      {/* 洞察内容 */}
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {insight.insight}
                      </p>
                    </div>
                  </div>
                  
                  {/* 分隔线 */}
                  {index < insights.length - 1 && (
                    <div className="ml-10 mt-4 border-b border-border/20" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentFeatureAnalysis;
