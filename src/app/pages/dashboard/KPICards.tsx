import React from 'react';
import { KPIData } from './types';

interface KPICardsProps {
  data: KPIData;
  loading?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ data, loading }) => {
  const cards = [
    {
      label: '总帖子数',
      value: data.totalPosts,
      trend: data.postsTrend,
      color: 'tiffany',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      label: '总互动量',
      value: data.totalInteractions,
      trend: data.interactionsTrend,
      color: 'purple',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
      ),
    },
    {
      label: '篇均互动',
      value: data.avgInteractions,
      trend: data.avgTrend,
      color: 'amber',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
    },
    {
      label: '活跃账号',
      value: data.activeAccounts,
      trend: data.accountsTrend,
      color: 'blue',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    tiffany: { bg: 'bg-tiffany-50', text: 'text-tiffany-600', icon: 'text-tiffany-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
  };

  const formatValue = (value: number) => {
    if (value >= 10000) {
      return (value / 10000).toFixed(1) + '万';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value.toLocaleString();
  };

  const formatTrend = (trend: number) => {
    if (trend === 0) return null;
    const isPositive = trend > 0;
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {isPositive ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        )}
        {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-2xl p-5 animate-pulse">
            <div className="h-10 w-10 bg-muted rounded-xl mb-3"></div>
            <div className="h-8 w-24 bg-muted rounded mb-2"></div>
            <div className="h-4 w-16 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const colors = colorClasses[card.color];
        return (
          <div
            key={card.label}
            className="glass rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group"
          >
            <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <div className={colors.icon}>{card.icon}</div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className={`text-3xl font-bold ${colors.text}`}>
                  {formatValue(card.value)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
              </div>
              {formatTrend(card.trend)}
            </div>
          </div>
        );
      })}
    </div>
  );
};


