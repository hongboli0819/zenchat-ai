import React from 'react';
import { TimeSlotData } from './types';

interface TimeHeatmapProps {
  data: TimeSlotData[];
  loading?: boolean;
}

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const HOURS = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

export const TimeHeatmap: React.FC<TimeHeatmapProps> = ({ data, loading }) => {
  // 将数据转换为矩阵形式
  const matrix: number[][] = Array(8).fill(null).map(() => Array(7).fill(0));
  
  // 找到最大值用于归一化
  let maxValue = 0;
  data.forEach((item) => {
    const hourIndex = Math.floor(item.hour / 3);
    if (item.avgInteractions > maxValue) {
      maxValue = item.avgInteractions;
    }
    if (hourIndex >= 0 && hourIndex < 8 && item.dayOfWeek >= 0 && item.dayOfWeek < 7) {
      matrix[hourIndex][item.dayOfWeek] = item.avgInteractions;
    }
  });

  // 获取颜色强度
  const getColor = (value: number) => {
    if (maxValue === 0) return 'bg-muted/30';
    const intensity = value / maxValue;
    if (intensity === 0) return 'bg-muted/30';
    if (intensity < 0.2) return 'bg-tiffany-100';
    if (intensity < 0.4) return 'bg-tiffany-200';
    if (intensity < 0.6) return 'bg-tiffany-300';
    if (intensity < 0.8) return 'bg-tiffany-400';
    return 'bg-tiffany-500';
  };

  const getTextColor = (value: number) => {
    if (maxValue === 0) return 'text-muted-foreground';
    const intensity = value / maxValue;
    if (intensity >= 0.6) return 'text-primary-foreground';
    return 'text-foreground';
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        最佳发布时间
        <span className="text-xs font-normal text-muted-foreground ml-2">
          颜色越深 = 互动越高
        </span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr>
              <th className="p-2 text-xs text-muted-foreground font-normal"></th>
              {DAYS.map((day) => (
                <th key={day} className="p-2 text-xs text-muted-foreground font-medium text-center">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, hourIndex) => (
              <tr key={hour}>
                <td className="p-2 text-xs text-muted-foreground font-normal text-right pr-3">
                  {hour}
                </td>
                {DAYS.map((_, dayIndex) => {
                  const value = matrix[hourIndex][dayIndex];
                  return (
                    <td key={`${hourIndex}-${dayIndex}`} className="p-1">
                      <div
                        className={`
                          w-full h-8 rounded-md flex items-center justify-center
                          ${getColor(value)}
                          transition-all hover:scale-105 cursor-default
                          group relative
                        `}
                        title={`${DAYS[dayIndex]} ${hour}: ${value.toFixed(0)} 互动`}
                      >
                        {value > 0 && (
                          <span className={`text-[10px] font-medium ${getTextColor(value)}`}>
                            {value >= 1000 ? Math.round(value / 1000) + 'k' : Math.round(value)}
                          </span>
                        )}
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {DAYS[dayIndex]} {hour}
                          <br />
                          平均互动: {value.toFixed(0)}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-xs text-muted-foreground">低</span>
        <div className="flex gap-1">
          <div className="w-6 h-4 rounded bg-muted/30"></div>
          <div className="w-6 h-4 rounded bg-tiffany-100"></div>
          <div className="w-6 h-4 rounded bg-tiffany-200"></div>
          <div className="w-6 h-4 rounded bg-tiffany-300"></div>
          <div className="w-6 h-4 rounded bg-tiffany-400"></div>
          <div className="w-6 h-4 rounded bg-tiffany-500"></div>
        </div>
        <span className="text-xs text-muted-foreground">高</span>
      </div>
    </div>
  );
};


