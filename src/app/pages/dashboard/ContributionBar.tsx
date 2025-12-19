import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AccountRanking } from './types';

interface ContributionBarProps {
  data: AccountRanking[];
  loading?: boolean;
}

const COLORS = [
  '#0d9488', // tiffany
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#22c55e', // green
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // cyan
];

export const ContributionBar: React.FC<ContributionBarProps> = ({ data, loading }) => {
  // 计算总互动和百分比
  const totalInteractions = data.reduce((sum, item) => sum + item.totalInteractions, 0);
  const chartData = data.slice(0, 8).map((item, index) => ({
    ...item,
    percentage: ((item.totalInteractions / totalInteractions) * 100).toFixed(1),
    color: COLORS[index % COLORS.length],
  }));

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="h-6 w-40 bg-muted rounded mb-4 animate-pulse"></div>
        <div className="h-[280px] bg-muted/30 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        账号贡献度
      </h3>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatNumber(value)}
            />
            <YAxis
              type="category"
              dataKey="nickname"
              tick={{ fontSize: 12, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
              }}
              formatter={(value: number) => [value.toLocaleString(), '互动量']}
              labelFormatter={(label) => `账号: ${label}`}
            />
            <Bar dataKey="totalInteractions" radius={[0, 6, 6, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 百分比标签 */}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {chartData.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.nickname}</span>
            <span className="font-medium text-foreground">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};


