import React, { useState } from 'react';
import { endOfDay, startOfDay } from 'date-fns';
import { TimeRange, DateRange } from './types';

interface TimeRangeSelectorProps {
  value: TimeRange;
  dateRange: DateRange;
  onChange: (range: TimeRange, dates: DateRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  dateRange,
  onChange,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const options: { label: string; value: TimeRange }[] = [
    { label: '全部', value: 'all' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' },
    { label: '本年', value: 'year' },
    { label: '自定义', value: 'custom' },
  ];

  const handleSelect = (range: TimeRange) => {
    if (range === 'custom') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange(range, { start: null, end: null });
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      // 开始日期使用当天 00:00:00，结束日期使用当天 23:59:59
      onChange('custom', {
        start: startOfDay(new Date(customStart)),
        end: endOfDay(new Date(customEnd)),
      });
      setShowCustom(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex gap-1 glass rounded-xl p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              value === opt.value
                ? 'bg-tiffany-500 text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 自定义日期选择器 */}
      {showCustom && (
        <div className="flex items-center gap-2 glass rounded-xl p-2 animate-in slide-in-from-left-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-card/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500/50"
          />
          <span className="text-muted-foreground">至</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-card/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-tiffany-500/50"
          />
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            className="px-4 py-1.5 bg-tiffany-500 text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tiffany-600 transition-colors"
          >
            应用
          </button>
          <button
            onClick={() => setShowCustom(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-card/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 显示当前选择的时间范围 */}
      {value === 'custom' && dateRange.start && dateRange.end && !showCustom && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground glass rounded-lg px-3 py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>
            {dateRange.start.toLocaleDateString('zh-CN')} - {dateRange.end.toLocaleDateString('zh-CN')}
          </span>
          <button
            onClick={() => setShowCustom(true)}
            className="text-tiffany-600 hover:underline"
          >
            修改
          </button>
        </div>
      )}
    </div>
  );
};

