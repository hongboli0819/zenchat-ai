/**
 * KOS效果矩阵组件
 * 
 * 四象限散点图展示KOS的互动率和产出量分布
 * 设计：淡灰色背景 + x/y坐标轴 + 不同象限不同颜色点
 */

import React, { useState, useMemo } from "react";
import type { InfluencerMatrixData, InfluencerAlert, MonthIdentifier } from "./types";
import { formatNumber } from "./utils";

interface InfluencerMatrixProps {
  data: InfluencerMatrixData[];
  alerts: InfluencerAlert[];
  month: MonthIdentifier;
  months: MonthIdentifier[];
  onMonthChange: (month: MonthIdentifier) => void;
  showAllTime?: boolean;
  onToggleAllTime: () => void;
  isLoading?: boolean;
  inactiveInfluencers?: { id: string; nickname: string; avatar: string | null }[];
}

// 象限配置 - 不同象限不同颜色
const quadrantConfig = {
  star: { label: "明星型", color: "#f59e0b", bgColor: "bg-amber-500" },        // 黄色
  potential: { label: "潜力型", color: "#10b981", bgColor: "bg-emerald-500" }, // 绿色
  costEffective: { label: "性价比型", color: "#3b82f6", bgColor: "bg-blue-500" }, // 蓝色
  lowEfficiency: { label: "低效型", color: "#6b7280", bgColor: "bg-muted-foreground" },   // 灰色
};

type QuadrantType = keyof typeof quadrantConfig;

// KOS列表弹窗组件 - 向上弹出
const InfluencerListPopover: React.FC<{
  influencers: { id: string; nickname: string; avatar: string | null; avgInteraction?: number; monthlyOutput?: number }[];
  isOpen: boolean;
  title: string;
  color?: string;
}> = ({ influencers, isOpen, title, color }) => {
  if (!isOpen || influencers.length === 0) return null;
  
  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-xl bg-card shadow-xl border border-border/30 min-w-[220px] max-h-[280px] overflow-hidden">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/20">
        {color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
        <span className="text-xs font-medium text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{influencers.length} 人</span>
      </div>
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {influencers.map((inf) => (
          <div key={inf.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
            {inf.avatar ? (
              <img src={inf.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-foreground/60 flex-shrink-0">
                {inf.nickname.slice(0, 1)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground/80 truncate">{inf.nickname}</div>
              {(inf.avgInteraction !== undefined || inf.monthlyOutput !== undefined) && (
                <div className="text-[10px] text-muted-foreground">
                  {inf.monthlyOutput !== undefined && `${inf.monthlyOutput}篇`}
                  {inf.avgInteraction !== undefined && ` · ${formatNumber(inf.avgInteraction)}互动`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InfluencerMatrix: React.FC<InfluencerMatrixProps> = ({
  data,
  alerts,
  month,
  months,
  onMonthChange,
  showAllTime = false,
  onToggleAllTime,
  isLoading = false,
  inactiveInfluencers = [],
}) => {
  const [hoveredInfluencer, setHoveredInfluencer] = useState<InfluencerMatrixData | null>(null);
  const [hoveredQuadrant, setHoveredQuadrant] = useState<QuadrantType | "inactive" | null>(null);

  // 计算图表坐标 - 根据象限分布点，严格限制在象限边界内
  // 象限边界（留出2%的间隙避免压线）：
  // 左上(5-48%) = 明星型(star)
  // 右上(52-95%) = 潜力型(potential)  
  // 左下(5-48%) = 性价比型(costEffective)
  // 右下(52-95%) = 低效型(lowEfficiency)
  const chartData = useMemo(() => {
    if (data.length === 0) return { points: [] };

    // 象限边界定义
    const QUADRANT_BOUNDS = {
      star:          { xMin: 6,  xMax: 47, yMin: 6,  yMax: 47 }, // 左上
      potential:     { xMin: 53, xMax: 94, yMin: 6,  yMax: 47 }, // 右上
      costEffective: { xMin: 6,  xMax: 47, yMin: 53, yMax: 94 }, // 左下
      lowEfficiency: { xMin: 53, xMax: 94, yMin: 53, yMax: 94 }, // 右下
    };

    // 按象限分组
    const byQuadrant: Record<string, InfluencerMatrixData[]> = {
      star: [], potential: [], costEffective: [], lowEfficiency: [],
    };
    data.forEach((d) => byQuadrant[d.quadrant]?.push(d));

    // 为每个象限的点计算位置
    const points = data.map((d) => {
      const bounds = QUADRANT_BOUNDS[d.quadrant as keyof typeof QUADRANT_BOUNDS];
      if (!bounds) return { ...d, xPercent: 50, yPercent: 50 };

      const quadrantData = byQuadrant[d.quadrant] || [];
      const count = quadrantData.length;
      
      // 在象限内根据互动量和产出量排序
      const sortedByInteraction = [...quadrantData].sort((a, b) => b.avgInteraction - a.avgInteraction);
      const sortedByOutput = [...quadrantData].sort((a, b) => b.monthlyOutput - a.monthlyOutput);
      const interactionRank = sortedByInteraction.findIndex((item) => item.id === d.id);
      const outputRank = sortedByOutput.findIndex((item) => item.id === d.id);

      // 计算在象限内的相对位置 (0~1)
      const relativeX = count > 1 ? outputRank / (count - 1) : 0.5;
      const relativeY = count > 1 ? interactionRank / (count - 1) : 0.5;

      // 添加小幅随机偏移避免完全重叠（限制在象限宽度的5%以内）
      const rangeX = bounds.xMax - bounds.xMin;
      const rangeY = bounds.yMax - bounds.yMin;
      const jitterX = (Math.random() - 0.5) * rangeX * 0.08;
      const jitterY = (Math.random() - 0.5) * rangeY * 0.08;

      // 计算最终位置并严格限制在象限边界内
      let xPercent = bounds.xMin + relativeX * rangeX + jitterX;
      let yPercent = bounds.yMin + relativeY * rangeY + jitterY;

      // 严格 clamp 到象限边界
      xPercent = Math.min(bounds.xMax, Math.max(bounds.xMin, xPercent));
      yPercent = Math.min(bounds.yMax, Math.max(bounds.yMin, yPercent));

      return { ...d, xPercent, yPercent };
    });

    return { points };
  }, [data]);

  // 象限统计
  const quadrantStats = useMemo(() => {
    const stats = { star: 0, potential: 0, costEffective: 0, lowEfficiency: 0 };
    data.forEach((d) => stats[d.quadrant]++);
    return stats;
  }, [data]);

  // 按象限分组的KOS列表
  const groupedInfluencers = useMemo(() => {
    const groups: Record<QuadrantType, InfluencerMatrixData[]> = {
      star: [],
      potential: [],
      costEffective: [],
      lowEfficiency: [],
    };
    data.forEach((d) => groups[d.quadrant].push(d));
    return groups;
  }, [data]);

  // 异常KOS（取前2个）
  const topAlerts = alerts.slice(0, 2);

  return (
    <div className="glass rounded-2xl p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          KOS效果矩阵
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleAllTime}
            className={`px-2 py-1 text-[10px] rounded transition-all ${
              showAllTime ? "bg-foreground/10 text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            总榜
          </button>
          <select
            value={`${month.year}-${month.month}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              const selected = months.find((mon) => mon.year === y && mon.month === m);
              if (selected) onMonthChange(selected);
            }}
            disabled={showAllTime}
            className="px-2 py-1 text-xs rounded-lg border border-border/30 bg-muted/30 text-foreground/80 focus:outline-none disabled:opacity-50"
          >
            {months.map((m) => (
              <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-foreground/10 border-t-foreground/40 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">暂无数据</div>
      ) : (
        <>
          {/* 四象限图表 */}
          <div
            className="relative aspect-square max-h-52 mx-auto mb-4 bg-muted/50 rounded-xl"
          >
            {/* X/Y 坐标轴 */}
            <div className="absolute left-1/2 top-[5%] bottom-[5%] w-px bg-border" />
            <div className="absolute top-1/2 left-[5%] right-[5%] h-px bg-border" />
            
            {/* 象限标签（小字） */}
            <div className="absolute top-2 left-2 text-[9px] font-medium" style={{ color: quadrantConfig.star.color }}>明星</div>
            <div className="absolute top-2 right-2 text-[9px] font-medium" style={{ color: quadrantConfig.potential.color }}>潜力</div>
            <div className="absolute bottom-2 left-2 text-[9px] font-medium" style={{ color: quadrantConfig.costEffective.color }}>性价比</div>
            <div className="absolute bottom-2 right-2 text-[9px] font-medium" style={{ color: quadrantConfig.lowEfficiency.color }}>低效</div>

            {/* 坐标轴标签 */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground/70">产出量 →</div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -rotate-90 origin-center text-[8px] text-muted-foreground/70 ml-0.5">互动 →</div>

            {/* 数据点 - 按象限颜色区分 */}
            {chartData.points.map((point) => {
              const config = quadrantConfig[point.quadrant];
              const isHovered = hoveredInfluencer?.id === point.id;
              return (
                <div
                  key={point.id}
                  className="absolute rounded-full border-2 border-white shadow-sm transition-transform"
                  style={{
                    width: isHovered ? 14 : 10,
                    height: isHovered ? 14 : 10,
                    left: `${point.xPercent}%`,
                    top: `${point.yPercent}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: config.color,
                    zIndex: isHovered ? 20 : 10,
                  }}
                  onMouseEnter={(e) => { e.stopPropagation(); setHoveredInfluencer(point); }}
                  onMouseLeave={() => setHoveredInfluencer(null)}
                />
              );
            })}

            {/* Hover Tooltip */}
            {hoveredInfluencer && (
              <div 
                className="absolute z-30 p-2 bg-card rounded-lg shadow-lg border border-border pointer-events-none min-w-[140px]"
                style={{
                  left: `${Math.min(75, Math.max(25, hoveredInfluencer.xPercent || 50))}%`,
                  top: `${Math.max(20, (hoveredInfluencer.yPercent || 50) - 5)}%`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="flex items-center gap-2">
                  {hoveredInfluencer.avatar ? (
                    <img src={hoveredInfluencer.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
                      {hoveredInfluencer.nickname.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-medium text-foreground truncate max-w-[100px]">{hoveredInfluencer.nickname}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {hoveredInfluencer.monthlyOutput}篇 · {formatNumber(hoveredInfluencer.avgInteraction)}互动
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* 统计 + 未发布 - 所有都支持 hover */}
          <div className="grid grid-cols-5 gap-1 mb-4">
            {(Object.entries(quadrantConfig) as [QuadrantType, typeof quadrantConfig[QuadrantType]][]).map(([key, config]) => (
              <div 
                key={key} 
                className="relative text-center py-1.5 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors"
                onMouseEnter={() => setHoveredQuadrant(key)}
                onMouseLeave={() => setHoveredQuadrant(null)}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-sm font-semibold text-foreground">{quadrantStats[key]}</span>
                </div>
                <div className="text-[9px] text-muted-foreground">{config.label}</div>
                
                {/* Hover 列表 */}
                <InfluencerListPopover
                  influencers={groupedInfluencers[key].map(inf => ({
                    id: inf.id,
                    nickname: inf.nickname,
                    avatar: inf.avatar,
                    avgInteraction: inf.avgInteraction,
                    monthlyOutput: inf.monthlyOutput,
                  }))}
                  isOpen={hoveredQuadrant === key}
                  title={config.label}
                  color={config.color}
                />
              </div>
            ))}
            
            {/* 未发布 */}
            <div 
              className="relative text-center py-1.5 cursor-pointer hover:bg-muted/30 rounded-lg transition-colors"
              onMouseEnter={() => setHoveredQuadrant("inactive")}
              onMouseLeave={() => setHoveredQuadrant(null)}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-foreground/20" />
                <span className="text-sm font-semibold text-foreground/50">{inactiveInfluencers.length}</span>
              </div>
              <div className="text-[9px] text-muted-foreground">未发布</div>
              
              <InfluencerListPopover
                influencers={inactiveInfluencers}
                isOpen={hoveredQuadrant === "inactive"}
                title="本月未发布"
              />
            </div>
          </div>

          {/* 异常快速总结 */}
          {topAlerts.length > 0 && (
            <div className="space-y-1.5">
              {topAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/20"
                >
                  <span className={`text-sm ${
                    alert.type === "positive" ? "text-emerald-500" : 
                    alert.type === "warning" ? "text-amber-500" : "text-rose-500"
                  }`}>
                    {alert.type === "positive" ? "↑" : alert.type === "warning" ? "!" : "↓"}
                  </span>
                  {alert.avatar ? (
                    <img src={alert.avatar} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px]">
                      {alert.nickname.slice(0, 1)}
                    </div>
                  )}
                  <span className="text-xs text-foreground/80 flex-1 truncate">{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default InfluencerMatrix;
