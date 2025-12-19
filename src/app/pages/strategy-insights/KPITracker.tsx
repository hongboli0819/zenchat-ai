/**
 * KPI 追踪与预警组件
 * 
 * 展示核心指标健康度监控
 */

import React from "react";
import type { KPIMetric, WeekIdentifier } from "./types";
import { formatNumber, formatPercent } from "./utils";

interface KPITrackerProps {
  metrics: KPIMetric[];
  week: WeekIdentifier;
  isLoading?: boolean;
}

// 状态配置
const statusConfig = {
  healthy: {
    label: "健康",
    icon: "✅",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-500/30",
  },
  attention: {
    label: "关注",
    icon: "🟡",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600",
    borderColor: "border-amber-500/30",
  },
  warning: {
    label: "预警",
    icon: "⚠️",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600",
    borderColor: "border-red-500/30",
  },
};

// 指标图标
const metricIcons: Record<string, React.ReactNode> = {
  "总互动量": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  "平均互动量": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  "内容产出": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "KOS活跃度": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

export const KPITracker: React.FC<KPITrackerProps> = ({
  metrics,
  week,
  isLoading = false,
}) => {
  // 计算整体健康度
  const overallHealth = (() => {
    if (metrics.length === 0) return "healthy";
    const warningCount = metrics.filter((m) => m.status === "warning").length;
    const attentionCount = metrics.filter((m) => m.status === "attention").length;
    if (warningCount >= 2) return "warning";
    if (warningCount >= 1 || attentionCount >= 2) return "attention";
    return "healthy";
  })();

  const overallConfig = statusConfig[overallHealth];

  return (
    <div className="glass rounded-2xl p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-tiffany-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          KPI 追踪与预警
        </h2>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">本周: {week.label}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${overallConfig.bgColor} ${overallConfig.textColor}`}>
            {overallConfig.icon} {overallConfig.label}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-tiffany-500/30 border-t-tiffany-500 rounded-full animate-spin" />
        </div>
      ) : metrics.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">暂无数据</div>
      ) : (
        <>
          {/* 指标卡片网格 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => {
              const config = statusConfig[metric.status];
              const icon = metricIcons[metric.name] || metricIcons["总互动量"];

              return (
                <div
                  key={metric.id}
                  className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all hover:shadow-sm`}
                >
                  {/* 指标头部 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${config.textColor}`}>{icon}</div>
                    <span className={`text-xs font-medium ${config.textColor}`}>
                      {config.icon} {config.label}
                    </span>
                  </div>

                  {/* 指标名称 */}
                  <div className="text-xs text-muted-foreground mb-1">{metric.name}</div>

                  {/* 当前值 */}
                  <div className="text-xl font-bold text-foreground mb-2">
                    {formatNumber(metric.currentValue)}
                    {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
                  </div>

                  {/* 对比平均值 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">vs 平均</span>
                    <span className={metric.changePercent >= 0 ? "text-emerald-500" : "text-red-500"}>
                      {formatPercent(metric.changePercent)}
                    </span>
                  </div>

                  {/* 进度条 */}
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        metric.status === "healthy"
                          ? "bg-emerald-500"
                          : metric.status === "attention"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, 50 + metric.changePercent))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 状态说明 */}
          <div className="mt-4 p-3 rounded-xl bg-card/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>状态判定：</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                健康 (≥-10%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                关注 (-10%~-25%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                预警 (&lt;-25%)
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KPITracker;

