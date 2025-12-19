/**
 * 内容表现分布图组件
 * 
 * 双折线图展示 AAA 比例和不合规比例的周度趋势
 */

import React, { useMemo, useState } from "react";
import type { PerformanceDistributionPoint } from "./types";

interface PerformanceDistributionProps {
  data: PerformanceDistributionPoint[];
  isLoading?: boolean;
}

export const PerformanceDistribution: React.FC<PerformanceDistributionProps> = ({
  data,
  isLoading = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const CHART_HEIGHT = 180;

  // 计算图表参数
  const chartConfig = useMemo(() => {
    if (data.length === 0) {
      return {
        maxValue: 50,
        yAxisLabels: [50, 40, 30, 20, 10, 0],
        aaaPoints: [],
        nonCompliantPoints: [],
      };
    }

    const maxAAA = Math.max(...data.map((d) => d.aaaRatio));
    const maxNonCompliant = Math.max(...data.map((d) => d.nonCompliantRatio));
    const rawMax = Math.max(maxAAA, maxNonCompliant, 10);
    const maxValue = Math.ceil(rawMax / 10) * 10 + 10;

    // Y 轴标签从上到下（大到小）
    const yAxisLabels = [];
    const step = Math.ceil(maxValue / 5);
    for (let i = maxValue; i >= 0; i -= step) {
      yAxisLabels.push(i);
    }

    // 使用百分比坐标
    const getXPercent = (index: number) => {
      if (data.length === 1) return 50;
      return (index / (data.length - 1)) * 100;
    };

    const getYPercent = (value: number) => {
      return (1 - value / maxValue) * 100;
    };

    const aaaPoints = data.map((d, i) => ({
      xPercent: getXPercent(i),
      yPercent: getYPercent(d.aaaRatio),
      value: d.aaaRatio,
    }));

    const nonCompliantPoints = data.map((d, i) => ({
      xPercent: getXPercent(i),
      yPercent: getYPercent(d.nonCompliantRatio),
      value: d.nonCompliantRatio,
    }));

    return {
      maxValue,
      yAxisLabels,
      aaaPoints,
      nonCompliantPoints,
    };
  }, [data]);

  // 生成 SVG 路径（使用百分比）
  const createPath = (points: { xPercent: number; yPercent: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].xPercent} ${points[0].yPercent}`;
    
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.xPercent} ${p.yPercent}`)
      .join(" ");
  };

  // 获取当前数据和上周数据的对比
  const currentWeekData = data.length > 0 ? data[data.length - 1] : null;
  const prevWeekData = data.length > 1 ? data[data.length - 2] : null;

  const aaaChange = currentWeekData && prevWeekData
    ? currentWeekData.aaaRatio - prevWeekData.aaaRatio
    : 0;
  const nonCompliantChange = currentWeekData && prevWeekData
    ? currentWeekData.nonCompliantRatio - prevWeekData.nonCompliantRatio
    : 0;

  return (
    <div className="glass rounded-2xl p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <svg className="w-4 h-4 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          内容表现分布
        </h2>
        
        {/* 图例 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">AAA</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-[10px] text-muted-foreground">不合规</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-foreground/10 border-t-foreground/40 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          暂无数据
        </div>
      ) : (
        <div className="relative">
          {/* 图表容器 */}
          <div className="flex">
            {/* Y 轴标签 */}
            <div className="flex flex-col justify-between pr-2 text-[10px] text-muted-foreground" style={{ height: CHART_HEIGHT }}>
              {chartConfig.yAxisLabels.map((v, i) => (
                <span key={i} className="text-right w-7">{v}%</span>
              ))}
            </div>

            {/* 图表区域 */}
            <div className="flex-1 relative" style={{ height: CHART_HEIGHT }}>
              {/* 网格线和折线 (SVG) */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
              >
                {/* 水平网格线 */}
                {chartConfig.yAxisLabels.map((_, i) => {
                  const y = (i / (chartConfig.yAxisLabels.length - 1)) * 100;
                  return (
                    <line
                      key={i}
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}

                {/* AAA 折线 */}
                <path
                  d={createPath(chartConfig.aaaPoints)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />

                {/* 不合规折线 */}
                <path
                  d={createPath(chartConfig.nonCompliantPoints)}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* 数据点 (HTML 绝对定位，保持圆形) */}
              {chartConfig.aaaPoints.map((p, i) => (
                <div
                  key={`aaa-${i}`}
                  className={`absolute w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm cursor-pointer transition-transform ${hoveredIndex === i ? "scale-125" : ""}`}
                  style={{
                    left: `${p.xPercent}%`,
                    top: `${p.yPercent}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
              {chartConfig.nonCompliantPoints.map((p, i) => (
                <div
                  key={`nc-${i}`}
                  className={`absolute w-3 h-3 rounded-full bg-rose-400 border-2 border-white shadow-sm cursor-pointer transition-transform ${hoveredIndex === i ? "scale-125" : ""}`}
                  style={{
                    left: `${p.xPercent}%`,
                    top: `${p.yPercent}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}

              {/* Tooltip */}
              {hoveredIndex !== null && data[hoveredIndex] && (
                <div
                  className="absolute z-10 p-2 rounded-lg bg-card/95 backdrop-blur-sm shadow-lg border border-border/30 text-xs pointer-events-none"
                  style={{
                    left: `${chartConfig.aaaPoints[hoveredIndex].xPercent}%`,
                    top: `${Math.min(chartConfig.aaaPoints[hoveredIndex].yPercent, chartConfig.nonCompliantPoints[hoveredIndex].yPercent)}%`,
                    transform: "translate(-50%, -110%)",
                  }}
                >
                  <div className="font-medium text-foreground mb-1">{data[hoveredIndex].week.label}</div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">AAA:</span>
                    <span className="text-emerald-500 font-medium">{data[hoveredIndex].aaaRatio.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span className="text-muted-foreground">不合规:</span>
                    <span className="text-rose-400 font-medium">{data[hoveredIndex].nonCompliantRatio.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* X 轴标签 */}
          <div className="flex justify-between mt-2 ml-9 text-[10px] text-muted-foreground">
            {data.map((d) => (
              <span key={`${d.week.year}-${d.week.week}`}>{d.week.label}</span>
            ))}
          </div>

          {/* 数据摘要 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground">表现优异</span>
              </div>
              <div className="text-lg font-semibold text-foreground">
                {currentWeekData ? `${currentWeekData.aaaRatio.toFixed(1)}%` : "-"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                本周 AAA
                {prevWeekData && (
                  <span className={aaaChange >= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {" "}{aaaChange >= 0 ? "↑" : "↓"}{Math.abs(aaaChange).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="text-[10px] text-muted-foreground">不合规</span>
              </div>
              <div className="text-lg font-semibold text-foreground">
                {currentWeekData ? `${currentWeekData.nonCompliantRatio.toFixed(1)}%` : "-"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                本周比例
                {prevWeekData && (
                  <span className={nonCompliantChange <= 0 ? "text-emerald-500" : "text-rose-500"}>
                    {" "}{nonCompliantChange <= 0 ? "↓" : "↑"}{Math.abs(nonCompliantChange).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDistribution;
