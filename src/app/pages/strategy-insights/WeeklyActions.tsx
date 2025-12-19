/**
 * 本周重点行动组件
 * 
 * 基于数据和洞察自动生成可执行建议
 */

import React from "react";
import type { ActionItem } from "./types";

interface WeeklyActionsProps {
  actions: ActionItem[];
  isLoading?: boolean;
}

// 类别配置
const categoryConfig = {
  content: {
    label: "内容优化",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
    borderColor: "border-l-blue-500",
  },
  influencer: {
    label: "KOS合作",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-500",
    borderColor: "border-l-purple-500",
  },
  urgent: {
    label: "紧急关注",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bgColor: "bg-red-500/10",
    iconColor: "text-red-500",
    borderColor: "border-l-red-500",
  },
  publishing: {
    label: "发布建议",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    borderColor: "border-l-emerald-500",
  },
};

// 优先级标签
const priorityBadge = {
  high: { label: "高优先", className: "bg-red-500/10 text-red-600" },
  medium: { label: "中优先", className: "bg-amber-500/10 text-amber-600" },
  low: { label: "低优先", className: "bg-muted text-muted-foreground" },
};

export const WeeklyActions: React.FC<WeeklyActionsProps> = ({
  actions,
  isLoading = false,
}) => {
  // 按优先级排序
  const sortedActions = [...actions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="glass rounded-2xl p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <svg className="w-5 h-5 text-tiffany-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          本周重点行动
        </h2>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {actions.filter((a) => a.priority === "high").length} 高优先
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {actions.filter((a) => a.priority === "medium").length} 中优先
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-tiffany-500/30 border-t-tiffany-500 rounded-full animate-spin" />
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">本周暂无需要特别关注的行动项</p>
          <p className="text-xs mt-1 text-emerald-500">各项指标表现良好 👍</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedActions.map((action, index) => {
            const config = categoryConfig[action.category];
            const badge = priorityBadge[action.priority];

            return (
              <div
                key={action.id}
                className={`p-4 rounded-xl border-l-4 ${config.borderColor} ${config.bgColor} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  {/* 序号 */}
                  <div className="w-6 h-6 rounded-full bg-card/80 flex items-center justify-center text-xs font-bold text-tiffany-600 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 标题行 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={config.iconColor}>{config.icon}</span>
                      <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* 标题 */}
                    <h4 className="font-semibold text-foreground mb-1">{action.title}</h4>

                    {/* 描述 */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>

                    {/* 关联数据 */}
                    {action.relatedData && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-card/50 text-xs text-muted-foreground">
                        {action.relatedData.type === "account" && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        {action.relatedData.type === "post" && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {action.relatedData.type === "metric" && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        )}
                        <span>{action.relatedData.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklyActions;

