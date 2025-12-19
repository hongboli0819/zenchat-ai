/**
 * 内容趋势发现组件
 * 
 * 展示爆款话题和竞品分析追踪
 */

import React from "react";
import type { TopicTrend } from "./types";
import { formatPercent } from "./utils";

interface TrendDiscoveryProps {
  topics: TopicTrend[];
  isLoading?: boolean;
}

export const TrendDiscovery: React.FC<TrendDiscoveryProps> = ({
  topics,
  isLoading = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 爆款话题 */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-tiffany-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
          爆款话题
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-tiffany-500/30 border-t-tiffany-500 rounded-full animate-spin" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            <p className="text-sm">暂无话题数据</p>
            <p className="text-xs mt-1">话题分析功能即将上线</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div
                key={topic.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/30 hover:bg-card/50 transition-all cursor-pointer"
              >
                {/* 排名 */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? "bg-amber-500 text-background" :
                  index === 1 ? "bg-muted-foreground text-background" :
                  index === 2 ? "bg-amber-700 text-background" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {index + 1}
                </div>

                {/* 话题信息 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{topic.topic}</div>
                  <div className="text-xs text-muted-foreground">{topic.relatedPosts} 篇相关内容</div>
                </div>

                {/* 热度变化 */}
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  topic.trend === "up" ? "text-emerald-500" :
                  topic.trend === "down" ? "text-red-500" :
                  "text-muted-foreground"
                }`}>
                  {topic.trend === "up" ? "↑" : topic.trend === "down" ? "↓" : "→"}
                  {formatPercent(Math.abs(topic.heatChange), false)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 竞品分析追踪 */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-tiffany-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          竞品分析追踪
        </h2>

        <div className="text-center py-8 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="text-sm">竞品追踪功能开发中</p>
          <p className="text-xs mt-1">敬请期待</p>
          
          {/* 占位功能说明 */}
          <div className="mt-6 text-left p-4 rounded-xl bg-card/30">
            <h4 className="text-xs font-semibold text-foreground mb-2">即将支持的功能：</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tiffany-500" />
                添加竞品账号进行追踪
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tiffany-500" />
                竞品内容动态监控
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tiffany-500" />
                表现对比分析
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-tiffany-500" />
                策略差异洞察
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendDiscovery;

