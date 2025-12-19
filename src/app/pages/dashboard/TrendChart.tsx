import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendDataPoint } from './types';

interface TrendChartProps {
  data: TrendDataPoint[];
  loading?: boolean;
}

const COLORS = {
  likes: '#ef4444',
  favorites: '#f59e0b',
  comments: '#3b82f6',
  shares: '#22c55e',
  total: '#0d9488',
};

const LABELS = {
  likes: '点赞',
  favorites: '收藏',
  comments: '评论',
  shares: '分享',
  total: '总互动',
};

export const TrendChart: React.FC<TrendChartProps> = ({ data, loading }) => {
  const [activeLines, setActiveLines] = useState<Set<string>>(new Set(['total']));

  const toggleLine = (key: string) => {
    const newActive = new Set(activeLines);
    if (newActive.has(key)) {
      if (newActive.size > 1) {
        newActive.delete(key);
      }
    } else {
      newActive.add(key);
    }
    setActiveLines(newActive);
  };

  const lineKeys = ['likes', 'favorites', 'comments', 'shares', 'total'] as const;

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse"></div>
        <div className="h-[300px] bg-muted/30 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-tiffany-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
          互动趋势
        </h3>
        <div className="flex gap-2 flex-wrap">
          {lineKeys.map((key) => (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeLines.has(key)
                  ? 'bg-card shadow-sm'
                  : 'bg-muted/30 text-muted-foreground'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeLines.has(key) ? COLORS[key] : '#d1d5db' }}
              />
              {LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                return value;
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
              }}
              labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: 8 }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                LABELS[name as keyof typeof LABELS] || name,
              ]}
            />
            {lineKeys.map((key) => (
              activeLines.has(key) && (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[key]}
                  strokeWidth={key === 'total' ? 3 : 2}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


