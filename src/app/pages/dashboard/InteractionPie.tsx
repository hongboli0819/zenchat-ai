import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { InteractionDistribution } from './types';

interface InteractionPieProps {
  data: InteractionDistribution[];
  loading?: boolean;
}

export const InteractionPie: React.FC<InteractionPieProps> = ({ data, loading }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {(percent * 100).toFixed(0)}%
      </text>
    );
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 h-full">
        <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse"></div>
        <div className="h-[250px] flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-muted animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 h-full">
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
        互动构成
      </h3>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                padding: '12px 16px',
              }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">{item.name}</span>
            <span className="text-sm font-medium text-foreground">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};


